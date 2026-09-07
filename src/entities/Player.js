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

        const onFloor = this.body.blocked.down;
        const againstLeftWall = this.body.blocked.left && left;
        const againstRightWall = this.body.blocked.right && right;

        if (!onFloor && (againstLeftWall || againstRightWall)) {
            const side = this.body.blocked.left ? 'left' : 'right';

            this.wallGrabbing = true;
            this.rect.setFillStyle(PLAYER_CONFIG.wallGrabColor);
            this.body.setAllowGravity(false);
            this.body.setVelocity(0, 0);

            if (justJumped && this.scene.time.now - this.lastWallJumpTime >= PLAYER_CONFIG.wallJumpCooldown) {
                const dir = side === 'left' ? 1 : -1;

                this.wallGrabbing = false;
                this.rect.setFillStyle(PLAYER_CONFIG.color);
                this.body.setAllowGravity(true);
                this.body.setVelocityX(dir * PLAYER_CONFIG.wallJumpXVelocity);
                this.body.setVelocityY(PLAYER_CONFIG.wallJumpYVelocity);
                this.lastWallJumpTime = this.scene.time.now;
            }

            return;
        }

        if (this.wallGrabbing) {
            this.wallGrabbing = false;
            this.rect.setFillStyle(PLAYER_CONFIG.color);
            this.body.setAllowGravity(true);
        }

        if (left) {
            this.body.setVelocityX(-PLAYER_CONFIG.speed);
        } else if (right) {
            this.body.setVelocityX(PLAYER_CONFIG.speed);
        } else {
            this.body.setVelocityX(0);
        }

        if (justJumped && onFloor) {
            this.body.setVelocityY(PLAYER_CONFIG.jumpVelocity);
        }
    }
}