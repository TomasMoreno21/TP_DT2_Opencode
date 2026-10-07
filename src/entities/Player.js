export const PLAYER_CONFIG = {
    width: 32,
    height: 48,
    color: 0x00d1b2,
    wallGrabColor: 0x00ff88,
    speed: 260,
    accel: 1100,
    airAccel: 800,
    decel: 800,
    airDecel: 350,
    turnAccel: 2600,
    jumpVelocity: -460,
    jumpCutVelocity: -150,
    coyoteTime: 100,
    jumpBufferTime: 130,
    wallJumpXVelocity: 300,
    wallJumpYVelocity: -500,
    wallJumpCooldown: 220,
    wallCoyoteTime: 180,
    shieldDurationMs: 6000,
    shieldColor: 0x2dd4ff,
    invulnerableMs: 500,
    dashSpeed: 420,
    dashDurationMs: 180,
    dashCooldownMs: 1200
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
        this.rect = scene.add.rectangle(x, y, PLAYER_CONFIG.width, PLAYER_CONFIG.height, PLAYER_CONFIG.color);
        this.rect.setStrokeStyle(2, 0xffffff);

        scene.physics.add.existing(this.rect);
        this.body = this.rect.body;
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(0);

        this.jumpPressed = false;
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

        // Glow neón detrás del cuerpo + ojos que miran según dirección.
        this.glow = scene.add.rectangle(x, y, PLAYER_CONFIG.width + 14, PLAYER_CONFIG.height + 14, PLAYER_CONFIG.color, 0.16);
        this.glow.setStrokeStyle(2, PLAYER_CONFIG.color, 0.35);
        this.glow.setDepth(-1);
        this.eyeL = scene.add.circle(x - 7, y - 8, 6, 0xffffff).setDepth(1);
        this.eyeR = scene.add.circle(x + 7, y - 8, 6, 0xffffff).setDepth(1);
        this.pupilL = scene.add.circle(x - 7, y - 8, 2.8, 0x111122).setDepth(2);
        this.pupilR = scene.add.circle(x + 7, y - 8, 2.8, 0x111122).setDepth(2);
        // Carita de daño >_<: texto que reemplaza a los ojos durante el flinch.
        this.hurtFace = scene.add.text(x, y - 8, '>_<', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#111122'
        }).setOrigin(0.5).setDepth(3).setVisible(false);
        // Mirada suavizada + impulsos de squash (reemplazan al tween).
        this.lookX = 0;
        this.lookY = 0;
        this.impX = 1;
        this.impY = 1;
        // Parpadeo cada 2-4.5s, cierra 120ms.
        this.nextBlink = 2000;
        this.blinkUntil = 0;
        this.prevVy = 0;
        this.flinchUntil = 0;

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,D,SPACE');
        this.dashKey = scene.input.keyboard.addKey('SHIFT');

        this.dashPressed = false;
        this.dashUntil = 0;
        this.dashCooldownUntil = 0;
        this.dashDir = 1;
        this.facing = 1;
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

        // El glow sigue al cuerpo y copia su color (combo / wall grab).
        // Se estira hacia adelante con la velocidad para vender la inercia.
        const speedK = Math.min(Math.abs(this.body.velocity.x) / PLAYER_CONFIG.speed, 1);
        this.glow.setPosition(this.rect.x + this.facing * speedK * 6, this.rect.y);
        this.glow.setScale(this.rect.scaleX * (1 + speedK * 0.3), this.rect.scaleY);
        if (this.rect.fillColor !== undefined) {
            this.glow.setFillStyle(this.rect.fillColor, this.isDashing ? 0.24 : 0.14);
            this.glow.setStrokeStyle(2, this.rect.fillColor, 0.3);
        }

        // Ojos: la cara entera se adelanta con el avance (no se queda atrás).
        const targetX = Math.max(-1, Math.min(1, this.body.velocity.x / PLAYER_CONFIG.speed)) * 2 + this.facing * 1.5;
        const targetY = Math.max(-1, Math.min(1, this.body.velocity.y / 460)) * 1.5;
        this.lookX += (targetX - this.lookX) * 0.18;
        this.lookY += (targetY - this.lookY) * 0.18;
        const lookX = this.lookX, lookY = this.lookY;
        const nowMs = this.scene.time.now;
        if (nowMs >= this.nextBlink) {
            this.blinkUntil = nowMs + 140;
            this.nextBlink = nowMs + 1200 + Math.random() * 1500;
        }
        const hurting = nowMs < this.flinchUntil;
        const eyeOpen = hurting ? 0.15 : (nowMs < this.blinkUntil ? 0.08 : 1);
        const faceFwd = this.facing * speedK * 6;
        const ex = this.rect.x + faceFwd, ey = this.rect.y - 8 * this.rect.scaleY;
        this.eyeL.setPosition(ex - 7 + lookX * 0.5, ey + lookY * 0.5).setScale(1, eyeOpen).setVisible(!hurting);
        this.eyeR.setPosition(ex + 7 + lookX * 0.5, ey + lookY * 0.5).setScale(1, eyeOpen).setVisible(!hurting);
        this.pupilL.setPosition(ex - 7 + lookX, ey + lookY).setScale(1, eyeOpen).setVisible(!hurting);
        this.pupilR.setPosition(ex + 7 + lookX, ey + lookY).setScale(1, eyeOpen).setVisible(!hurting);
        this.hurtFace.setPosition(ex, ey).setVisible(hurting);

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

        if (justPressedDash && now >= this.dashCooldownUntil) {
            const dir = left ? -1 : right ? 1 : this.facing;
            this.dashDir = dir;
            this.facing = dir;
            this.dashUntil = now + PLAYER_CONFIG.dashDurationMs;
            this.dashCooldownUntil = now + PLAYER_CONFIG.dashCooldownMs;
            this.squashBounce(1.15, 0.85);
            this.scene.events.emit('player-dash', dir);
        }

        const wasOnFloor = this.onFloor;
        this.onFloor = this.body.blocked.down;

        if (this.onFloor) {
            this.lastOnFloorTime = now;
            // El dash se resetea al tocar suelo.
            this.dashCooldownUntil = Math.min(this.dashCooldownUntil, now);
        }

        if (!wasOnFloor && this.onFloor) {
            // Aterrizaje con un toque de punch + impacto para el shake.
            this.squashBounce(1.18, 0.82);
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

        if (wallJumpReady) {
            const dir = side === 'left' ? 1 : -1;

            this.wallGrabbing = false;
            this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
            this.body.setAllowGravity(true);
            this.body.setVelocityX(dir * PLAYER_CONFIG.wallJumpXVelocity);
            this.body.setVelocityY(PLAYER_CONFIG.wallJumpYVelocity);
            this.lastWallJumpTime = now;
            this.jumpBufferUntil = 0;
            this.dashCooldownUntil = now;
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
                const rate = vx > 0 ? PLAYER_CONFIG.turnAccel : (this.onFloor ? PLAYER_CONFIG.accel : PLAYER_CONFIG.airAccel);
                this.body.setVelocityX(approach(vx, -max, rate));
            } else if (right && !left) {
                this.facing = 1;
                const rate = vx < 0 ? PLAYER_CONFIG.turnAccel : (this.onFloor ? PLAYER_CONFIG.accel : PLAYER_CONFIG.airAccel);
                this.body.setVelocityX(approach(vx, max, rate));
            } else {
                const rate = this.onFloor ? PLAYER_CONFIG.decel : PLAYER_CONFIG.airDecel;
                this.body.setVelocityX(approach(vx, 0, rate));
            }
        }

        if (bufferReady && canGroundJump) {
            this.body.setVelocityY(PLAYER_CONFIG.jumpVelocity);
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
}