import { FEEL } from '../assets/feel.js';
import { PlayerFx } from './PlayerFx.js';

export const PLAYER_CONFIG = {
    width: 32,
    height: 48,
    color: 0x00d1b2,
    wallGrabColor: 0x00ff88,
    speed: 340,
    accel: 1600,
    airAccel: 1200,
    decel: 1200,
    airDecel: 550,
    turnAccel: 3600,
    jumpVelocity: -500,
    jumpCutVelocity: -150,
    coyoteTime: 140,
    jumpBufferTime: 170,
    wallJumpXVelocity: 300,
    wallJumpYVelocity: -500,
    wallJumpCooldown: 220,
    wallCoyoteTime: 180,
    shieldDurationMs: 6000,
    shieldColor: 0x2dd4ff,
    invulnerableMs: 500,
    dashSpeed: 700,
    dashDurationMs: 170,
    dashGraceMs: 200,
    dashCooldownMs: 900,
    dashTrailIntervalMs: 45,
    dashTrailLifeMs: 220
};

const MULTIPLIER_COLORS = {
    1: PLAYER_CONFIG.color,
    2: 0xffdd44,
    3: 0xff8844,
    4: 0xff6622,
    5: 0xff4455
};

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        // Todo lo cosmético vive en PlayerFx; la sombra se crea antes que el cuerpo.
        this.fx = new PlayerFx(scene, this, PLAYER_CONFIG);
        this.rect = scene.add.rectangle(x, y, PLAYER_CONFIG.width, PLAYER_CONFIG.height, PLAYER_CONFIG.color);
        this.rect.setStrokeStyle(2, 0xffffff);

        scene.physics.add.existing(this.rect);
        this.body = this.rect.body;
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0);

        this.jumpPressed = false;
        this.platformVelocity = null;
        this.wallGrabbing = false;
        this.lastWallJumpTime = 0;
        this.multiplier = 1;
        this.onFloor = false;
        this.lastOnFloorTime = -Infinity;
        this.jumpBufferUntil = 0;
        this.lastWallTouchTime = -Infinity;
        this.wallSide = null;

        this.shieldUntil = 0;
        this.invulnerableUntil = 0;

        this.shieldRing = scene.add.circle(x, y, PLAYER_CONFIG.width * 0.9, 0x2dd4ff, 0.12);
        this.shieldRing.setStrokeStyle(3, PLAYER_CONFIG.shieldColor, 0.9);
        this.shieldRing.setVisible(false);

        // Impulsos de squash (se combinan con el estiramiento por velocidad).
        this.impX = 1;
        this.impY = 1;
        this.prevVy = 0;
        this.flinchUntil = 0;
        this.turning = false;
        this.dashBufferUntil = 0;

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,D,SPACE');
        this.dashKey = scene.input.keyboard.addKey('SHIFT');

        this.dashPressed = false;
        this.dashUntil = 0;
        this.dashCooldownUntil = 0;
        this.dashDir = 1;
        this.dashNextTrailAt = 0;
        this.facing = 1;

        this.fx.attach();
    }

    get hasShield() {
        return this.scene.time.now < this.shieldUntil;
    }

    get isInvulnerable() {
        return this.scene.time.now < this.invulnerableUntil;
    }

    get isDashing() {
        return this.scene.time.now < this.dashUntil;
    }

    get dashRemaining() {
        return Math.max(this.dashCooldownUntil - this.scene.time.now, 0);
    }

    activateShield(durationMs = PLAYER_CONFIG.shieldDurationMs) {
        this.shieldUntil = this.scene.time.now + durationMs;
    }

    // Absorbe el golpe: consume el escudo y deja una ventana de invulnerabilidad.
    // Daño sentido: carita >_< + squash rápido. Lo llama Game.onHit.
    flinch(durationMs = 240) {
        this.flinchUntil = this.scene.time.now + durationMs;
        this.squashBounce(1.25, 0.75);
    }

    absorbHit() {
        this.flinch();
        this.shieldUntil = 0;
        this.invulnerableUntil = this.scene.time.now + PLAYER_CONFIG.invulnerableMs;
        this.rect.setFillStyle(0xffffff);
        this.scene.time.delayedCall(350, () => {
            if (!this.wallGrabbing) {
                this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
            }
        });
    }

    update(deltaMs = 16.7) {
        this.shieldRing.setPosition(this.rect.x, this.rect.y);
        this.shieldRing.setVisible(this.hasShield);

        // El derrape lo marca la física más abajo; el fx lo lee al inicio del próximo frame.
        this.fx.update(deltaMs);
        this.turning = false;

        if (this.isInvulnerable) {
            // Parpadeo suave y lento (antes vibraba).
            this.rect.setAlpha(Math.floor(this.scene.time.now / 160) % 2 === 0 ? 0.65 : 1);
        } else {
            this.rect.setAlpha(1);
        }

        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const jumpNow = this.cursors.up.isDown || this.cursors.space.isDown || this.keys.W.isDown ||
            this.keys.SPACE.isDown;
        const justPressedJump = jumpNow && !this.jumpPressed;
        const justReleasedJump = !jumpNow && this.jumpPressed;
        this.jumpPressed = jumpNow;

        const now = this.scene.time.now;

        if (justPressedJump) {
            this.jumpBufferUntil = now + PLAYER_CONFIG.jumpBufferTime;
        }

        // Disparo del dash (Shift): cooled-down, empuje horizontal corto.
        const dashHeld = this.dashKey.isDown;
        const justPressedDash = dashHeld && !this.dashPressed;
        this.dashPressed = dashHeld;

        // Buffer: un Shift apretado un instante antes de estar listo se ejecuta al liberarse.
        if (justPressedDash) {
            this.dashBufferUntil = now + FEEL.dash.bufferMs;
        }

        if (now <= this.dashBufferUntil && now >= this.dashCooldownUntil) {
            this.dashBufferUntil = 0;
            const dir = left ? -1 : right ? 1 : this.facing;
            this.dashDir = dir;
            this.facing = dir;
            this.dashUntil = now + PLAYER_CONFIG.dashDurationMs;
            this.dashCooldownUntil = now + PLAYER_CONFIG.dashCooldownMs;
            this.dashNextTrailAt = 0;
            // El dash apaga la gravedad y corta la caída: vuelo en línea recta.
            // Los i-frames cubren todo el impulso más un margen al terminar (dashGraceMs).
            this.body.setAllowGravity(false);
            this.body.setVelocityY(0);
            this.invulnerableUntil = Math.max(this.invulnerableUntil, this.dashUntil + PLAYER_CONFIG.dashGraceMs);
            this.squashBounce(1.25, 0.75);
            this.scene.events.emit('player-dash', dir);
        }

        const wasOnFloor = this.onFloor;
        this.onFloor = this.body.blocked.down;

        if (this.onFloor) {
            this.lastOnFloorTime = now;
        }

        if (!wasOnFloor && this.onFloor) {
            // Aterrizaje con un toque de punch + impacto para el shake.
            if (this.prevVy > FEEL.player.landMinVy) {
                const k = Math.min(this.prevVy / 700, 1);
                this.squashBounce(1.05 + 0.2 * k, 0.95 - 0.2 * k);
            }
            this.scene.events.emit('player-land', this.prevVy);
        }

        const coyoteReady = now - this.lastOnFloorTime <= PLAYER_CONFIG.coyoteTime;
        const bufferReady = now <= this.jumpBufferUntil;
        const canGroundJump = this.onFloor || coyoteReady;

        if (justReleasedJump && this.body.velocity.y < PLAYER_CONFIG.jumpCutVelocity) {
            this.body.setVelocityY(PLAYER_CONFIG.jumpCutVelocity);
        }

        const touchingLeft = this.body.blocked.left;
        const touchingRight = this.body.blocked.right;
        const touchingWall = !this.onFloor && (touchingLeft || touchingRight);

        if (touchingWall) {
            this.lastWallTouchTime = now;
            this.wallSide = touchingLeft ? 'left' : 'right';
        }

        const side = this.wallSide;
        const holdingToward = side === 'left' ? (touchingLeft && left) : (touchingRight && right);
        const wallCoyoteReady = now - this.lastWallTouchTime <= PLAYER_CONFIG.wallCoyoteTime;
        const wallJumpReady = !this.onFloor && !this.isDashing && (touchingWall || wallCoyoteReady) && side
            && (justPressedJump || bufferReady)
            && now - this.lastWallJumpTime >= PLAYER_CONFIG.wallJumpCooldown;

        if (touchingWall && holdingToward && !this.isDashing) {
            this.wallGrabbing = true;
            this.rect.setFillStyle(PLAYER_CONFIG.wallGrabColor);
            this.body.setAllowGravity(false);
            this.body.setVelocity(0, 0);
        } else if (this.wallGrabbing) {
            this.wallGrabbing = false;
            this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
            this.body.setAllowGravity(true);
        }

        // La gravedad queda apagada solo mientras dura el dash; al terminar se
        // restaura salvo que el jugador esté colgado de una pared.
        if (this.isDashing) {
            this.body.setAllowGravity(false);

            if (now >= this.dashNextTrailAt) {
                this.dashNextTrailAt = now + PLAYER_CONFIG.dashTrailIntervalMs;
                this.spawnDashTrail();
            }
        } else if (!this.wallGrabbing) {
            this.body.setAllowGravity(true);
        }

        if (wallJumpReady) {
            const dir = side === 'left' ? 1 : -1;

            this.wallGrabbing = false;
            this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
            this.body.setAllowGravity(true);
            this.body.setVelocityX(dir * PLAYER_CONFIG.wallJumpXVelocity);
            this.body.setVelocityY(PLAYER_CONFIG.wallJumpYVelocity);
            this.lastWallJumpTime = now;
            this.jumpBufferUntil = 0;
            this.squashBounce(1.15, 0.85);
            this.scene.events.emit('player-jump', 'wall');
            this.applyMotionScale();
            return;
        }

        if (touchingWall && holdingToward) {
            this.applyMotionScale();
            return;
        }

        if (this.wallGrabbing) {
            this.wallGrabbing = false;
            this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
            this.body.setAllowGravity(true);
        }

        if (this.isDashing) {
            this.body.setVelocityX(this.dashDir * PLAYER_CONFIG.dashSpeed);
        } else {
            // Inercia: acelera hacia la dirección y desliza al soltar.
            const dt = Math.min(deltaMs, 50) / 1000;
            const max = PLAYER_CONFIG.speed;
            const vx = this.body.velocity.x;
            const approach = (v, target, rate) => {
                const diff = target - v;
                const step = rate * dt;
                return Math.abs(diff) <= step ? target : v + Math.sign(diff) * step;
            };

            if (left && !right) {
                this.facing = -1;
                this.turning = this.onFloor && vx > max * FEEL.player.skidMinK;
                const rate = vx > 0 ? PLAYER_CONFIG.turnAccel : (this.onFloor ? PLAYER_CONFIG.accel : PLAYER_CONFIG.airAccel);
                this.body.setVelocityX(approach(vx, -max, rate));
            } else if (right && !left) {
                this.facing = 1;
                this.turning = this.onFloor && vx < -max * FEEL.player.skidMinK;
                const rate = vx < 0 ? PLAYER_CONFIG.turnAccel : (this.onFloor ? PLAYER_CONFIG.accel : PLAYER_CONFIG.airAccel);
                this.body.setVelocityX(approach(vx, max, rate));
            } else {
                const rate = this.onFloor ? PLAYER_CONFIG.decel : PLAYER_CONFIG.airDecel;
                this.body.setVelocityX(approach(vx, 0, rate));
            }
        }

        // Durante el dash no se salta: el impulso se mantiene en línea recta.
        if (bufferReady && canGroundJump && !this.isDashing) {
            // Sobre una movil (N3) el salto hereda su velocidad: ferry rapida = salto
            // mas largo, ascensor subiendo = mas alto (y bajando, mas bajo).
            const inherit = this.platformVelocity;
            this.body.setVelocityY(PLAYER_CONFIG.jumpVelocity + (inherit ? inherit.y : 0));
            if (inherit) this.body.setVelocityX(this.body.velocity.x + inherit.x);
            this.jumpBufferUntil = 0;
            this.lastOnFloorTime = -Infinity;
            this.squashBounce(1.2, 0.8);
            this.scene.events.emit('player-jump', 'ground');
        }

        // Gusano cortito: a más velocidad horizontal, más largo y más bajo.
        // Se combina con el impulso de salto/aterrizaje/dash/daño.
        this.applyMotionScale();

        this.prevVy = this.body.velocity.y;
    }

    applyMotionScale() {
        this.impX += (1 - this.impX) * 0.18;
        this.impY += (1 - this.impY) * 0.18;
        const runK = Math.min(Math.abs(this.body.velocity.x) / PLAYER_CONFIG.speed, 1);
        this.rect.setScale(this.impX * (1 + runK * 0.18), this.impY * (1 - runK * 0.12));
    }

    setMultiplier(multiplier) {
        this.multiplier = multiplier;

        if (!this.wallGrabbing) {
            this.rect.setFillStyle(MULTIPLIER_COLORS[multiplier] ?? PLAYER_CONFIG.color);
        }
    }

    squashBounce(scaleX, scaleY) {
        // Impulso que decae solo en update (convive con el stretch de movimiento).
        this.impX = scaleX;
        this.impY = scaleY;
    }

    // Estela del dash: copia del jugador que se desvanece tras el impulso.
    // Da lectura visual de la velocidad y de la ventana de i-frames.
    spawnDashTrail() {
        this.scene.fx.ghost(this.rect, { alpha: 0.5, ms: PLAYER_CONFIG.dashTrailLifeMs, stroke: 0.4 });
    }
}
