import { Math as PhaserMath } from 'phaser';
import { Projectile, PROJECTILE_CONFIG } from '../entities/Projectile';
import { LEVEL } from '../assets/level';

export const PROJECTILE_SPAWN_CONFIG = {
    interval: 1400
};

export class ProjectileManager {
    constructor(scene) {
        this.scene = scene;
        this.group = scene.physics.add.group();
        this.projectiles = [];

        this.spawnEvent = scene.time.addEvent({
            delay: PROJECTILE_SPAWN_CONFIG.interval,
            loop: true,
            callback: () => this.spawn()
        });

        this.spawn();
    }

    spawn() {
        const side = PhaserMath.RND.pick(['left', 'right', 'top']);
        let x = 0;
        let y = 0;
        let vx = 0;
        let vy = 0;

        if (side === 'left') {
            x = -20;
            y = PhaserMath.Between(80, 650);
            vx = PROJECTILE_CONFIG.speed;
            vy = PhaserMath.Between(-60, 60);
        } else if (side === 'right') {
            x = LEVEL.width + 20;
            y = PhaserMath.Between(80, 650);
            vx = -PROJECTILE_CONFIG.speed;
            vy = PhaserMath.Between(-60, 60);
        } else {
            x = PhaserMath.Between(60, LEVEL.width - 60);
            y = -20;
            vx = PhaserMath.Between(-60, 60);
            vy = PROJECTILE_CONFIG.speed;
        }

        const projectile = new Projectile(this.scene, x, y, vx, vy);
        this.projectiles.push(projectile);
        this.group.add(projectile.circle);
    }

    update() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            if (projectile.isOutOfBounds()) {
                projectile.destroy();
                this.projectiles.splice(i, 1);
            }
        }
    }
}