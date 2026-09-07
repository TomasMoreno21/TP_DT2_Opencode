export const PLAYER_CONFIG = {
    width: 32,
    height: 48,
    color: 0x00d1b2,
    wallGrabColor: 0x00ff88,
    speed: 260,
    jumpVelocity: -460,
    wallJumpXVelocity: 260,
    wallJumpYVelocity: -460,
    wallJumpCooldown: 200
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

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,D,SPACE');
    }

    update() {
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const jumpNow = this.cursors.up.isDown || this.cursors.space.isDown || this.keys.W.isDown ||
            this.keys.SPACE.isDown;
        const justJumped = jumpNow && !this.jumpPressed;
        this.jumpPressed = jumpNow;

        const wasOnFloor = this.onFloor;
        this.onFloor = this.body.blocked.down;

        if (!wasOnFloor && this.onFloor) {
            this.squashBounce(0.7, 1.4);
        }

        const againstLeftWall = this.body.blocked.left && left;
        const againstRightWall = this.body.blocked.right && right;

        if (!this.onFloor && (againstLeftWall || againstRightWall)) {
            const side = this.body.blocked.left ? 'left' : 'right';

            this.wallGrabbing = true;
            this.rect.setFillStyle(PLAYER_CONFIG.wallGrabColor);
            this.body.setAllowGravity(false);
            this.body.setVelocity(0, 0);

            if (justJumped && this.scene.time.now - this.lastWallJumpTime >= PLAYER_CONFIG.wallJumpCooldown) {
                const dir = side === 'left' ? 1 : -1;

                this.wallGrabbing = false;
                this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
                this.body.setAllowGravity(true);
                this.body.setVelocityX(dir * PLAYER_CONFIG.wallJumpXVelocity);
                this.body.setVelocityY(PLAYER_CONFIG.wallJumpYVelocity);
                this.lastWallJumpTime = this.scene.time.now;
                this.squashBounce(1.3, 0.7);
            }

            return;
        }

        if (this.wallGrabbing) {
            this.wallGrabbing = false;
            this.rect.setFillStyle(MULTIPLIER_COLORS[this.multiplier] ?? PLAYER_CONFIG.color);
            this.body.setAllowGravity(true);
        }

        if (left) {
            this.body.setVelocityX(-PLAYER_CONFIG.speed);
        } else if (right) {
            this.body.setVelocityX(PLAYER_CONFIG.speed);
        } else {
            this.body.setVelocityX(0);
        }

        if (justJumped && this.onFloor) {
            this.body.setVelocityY(PLAYER_CONFIG.jumpVelocity);
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