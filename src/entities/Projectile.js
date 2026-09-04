import { LEVEL } from '../assets/level';

export const PROJECTILE_CONFIG = {
    radius: 8,
    color: 0xff4455,
    speed: 320
};

export class Projectile {
    constructor(scene, x, y, vx, vy) {
        this.scene = scene;
        this.circle = scene.add.circle(x, y, PROJECTILE_CONFIG.radius, PROJECTILE_CONFIG.color);
        this.circle.setStrokeStyle(2, 0xffc0c0);

        scene.physics.add.existing(this.circle);
        this.circle.body.setVelocity(vx, vy);
    }

    isOutOfBounds(margin = 40) {
        return this.circle.x < -margin || this.circle.x > LEVEL.width + margin ||
            this.circle.y < -margin || this.circle.y > LEVEL.height + margin;
    }

    destroy() {
        this.circle.destroy();
    }
}