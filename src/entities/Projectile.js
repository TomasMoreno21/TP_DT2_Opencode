import { LEVEL } from '../assets/level';

export const PROJECTILE_CONFIG = {
    radius: 8,
    color: 0xff4455,
    homingColor: 0xff8822,
    homingDurationMs: 500,
    homingSpeed: 90,
    minStraightSpeed: 90,
    maxSpeed: 360,
    acceleration: 500
};

export class Projectile {
    constructor(scene, x, y, target, speedMultiplier = 1) {
        this.scene = scene;
        this.target = target;

        this.circle = scene.add.circle(x, y, PROJECTILE_CONFIG.radius, PROJECTILE_CONFIG.homingColor);
        this.circle.setStrokeStyle(2, 0xffc0c0);

        scene.physics.add.existing(this.circle);

        this.phase = 'homing';
        this.homingTimer = 0;
        this.homingSpeed = PROJECTILE_CONFIG.homingSpeed;
        this.maxSpeed = PROJECTILE_CONFIG.maxSpeed * speedMultiplier;
        this.acceleration = PROJECTILE_CONFIG.acceleration;
        this.speed = PROJECTILE_CONFIG.minStraightSpeed;
        this.direction = { x: 0, y: 0 };

        this.circle.body.setAngularVelocity(0);
    }

    update(deltaMs) {
        if (this.phase === 'homing') {
            this.homingTimer += deltaMs;

            const dx = this.target.x - this.circle.x;
            const dy = this.target.y - this.circle.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0) {
                this.circle.body.setVelocity(dx / dist * this.homingSpeed, dy / dist * this.homingSpeed);
            }

            if (this.homingTimer >= PROJECTILE_CONFIG.homingDurationMs) {
                this.phase = 'line';
                this.circle.setFillStyle(PROJECTILE_CONFIG.color);

                const v = this.circle.body.velocity;
                const length = Math.hypot(v.x, v.y) || 1;

                this.direction.x = v.x / length;
                this.direction.y = v.y / length;
                this.speed = this.homingSpeed;
            }
        } else {
            this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * (deltaMs / 1000));
            this.circle.body.setVelocity(this.direction.x * this.speed, this.direction.y * this.speed);
        }
    }

    isOutOfBounds(margin = 40) {
        return this.circle.x < -margin || this.circle.x > LEVEL.width + margin ||
            this.circle.y < -margin || this.circle.y > LEVEL.height + margin;
    }

    destroy() {
        this.circle.destroy();
    }
}