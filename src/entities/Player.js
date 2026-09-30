export const PLAYER_CONFIG = {
    width: 32,
    height: 48,
    color: 0x00d1b2,
    wallGrabColor: 0x00ff88,
    speed: 260,
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
    absorbHit() {
        this.shieldUntil = 0;
        this.invulnerableUntil = this.scene.time.now + PLAYER_CONFIG.invulnerableMs;
        this.rect.setFillStyle(0xffffff);
        this.scene.time.delayedCall(350, () => {
            if (!this.wallGrabbing) {
                this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
            }
        });
    }

    update() {
        this.shieldRing.setPosition(this.rect.x, this.rect.y);
        this.shieldRing.setVisible(this.hasShield);

        if (this.isInvulnerable) {
            this.rect.setAlpha(this.rect.alpha > 0.5 ? 0.35 : 0.8);
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
            this.squashBounce(1.25, 0.75);
            this.scene.events.emit('player-dash', dir);
        }

        const wasOnFloor = this.onFloor;
        this.onFloor = this.body.blocked.down;

        if (this.onFloor) {
            this.lastOnFloorTime = now;
            // El dash se resetea al tocar suelo.
            this.dashCooldownUntil = Math.min(this.dashCooldownUntil, now);
        }

        if (!wasOnFloor && this.onFloor && this.rect.scaleX !== 1) {
            if (this.squashTween) {
                this.squashTween.stop();
            }

            this.rect.setScale(1, 1);
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
            this.squashBounce(1.3, 0.7);
            return;
        }

        if (touchingWall && holdingToward) {
            return;
        }

        if (this.wallGrabbing) {
            this.wallGrabbing = false;
            this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
            this.body.setAllowGravity(true);
        }

        if (this.isDashing) {
            this.body.setVelocityX(this.dashDir * PLAYER_CONFIG.dashSpeed);
        } else if (left) {
            this.facing = -1;
            this.body.setVelocityX(-PLAYER_CONFIG.speed);
        } else if (right) {
            this.facing = 1;
            this.body.setVelocityX(PLAYER_CONFIG.speed);
        } else {
            this.body.setVelocityX(0);
        }

        if (bufferReady && canGroundJump) {
            this.body.setVelocityY(PLAYER_CONFIG.jumpVelocity);
            this.jumpBufferUntil = 0;
            this.lastOnFloorTime = -Infinity;
            this.squashBounce(1.3, 0.7);
        }
    }

    setMultiplier(multiplier) {
        this.multiplier = multiplier;

        if (!this.wallGrabbing) {
            this.rect.setFillStyle(MULTIPLIER_COLORS[multiplier] ?? PLAYER_CONFIG.color);
        }
    }

    squashBounce(scaleX, scaleY) {
        if (this.squashTween) {
            this.squashTween.stop();
        }

        this.rect.setScale(scaleX, scaleY);
        this.squashTween = this.scene.tweens.add({
            targets: this.rect,
            scaleX: 1,
            scaleY: 1,
            duration: 180,
            ease: 'Quad.easeOut'
        });
    }
}