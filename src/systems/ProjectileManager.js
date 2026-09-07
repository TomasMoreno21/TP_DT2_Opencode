import { Math as PhaserMath } from 'phaser';
import { Projectile, PROJECTILE_CONFIG } from '../entities/Projectile';
import { LEVEL } from '../assets/level';

export const PROJECTILE_SPAWN_CONFIG = {
    initialInterval: 1400,
    minInterval: 450,
    maxSpeedMultiplier: 2
};

export class ProjectileManager {
    constructor(scene, totalDurationMs) {
        this.scene = scene;
        this.group = scene.physics.add.group();
        this.projectiles = [];
        this.totalDurationMs = totalDurationMs;
        this.startTime = scene.time.now;
        this.nextSpawnTime = 0;
    }

    get progress() {
        const elapsed = this.scene.time.now - this.startTime;
        return Math.min(elapsed / this.totalDurationMs, 1);
    }

    get intervalMs() {
        const base = PROJECTILE_SPAWN_CONFIG.initialInterval;
        const min = PROJECTILE_SPAWN_CONFIG.minInterval;

        return base - (base - min) * this.progress;
    }

    get speedMultiplier() {
        return 1 + (PROJECTILE_SPAWN_CONFIG.maxSpeedMultiplier - 1) * this.progress;
    }

    spawn() {
        const side = PhaserMath.RND.pick(['left', 'right', 'top']);
        const speed = PROJECTILE_CONFIG.speed * this.speedMultiplier;

        let x = 0;
        let y = 0;
        let vx = 0;
        let vy = 0;

        if (side === 'left') {
            x = -20;
            y = PhaserMath.Between(80, 650);
            vx = speed;
            vy = PhaserMath.Between(-60, 60);
        } else if (side === 'right') {
            x = LEVEL.width + 20;
            y = PhaserMath.Between(80, 650);
            vx = -speed;
            vy = PhaserMath.Between(-60, 60);
        } else {
            x = PhaserMath.Between(60, LEVEL.width - 60);
            y = -20;
            vx = PhaserMath.Between(-60, 60);
            vy = speed;
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

        if (this.scene.time.now >= this.nextSpawnTime) {
            this.spawn();
            this.nextSpawnTime = this.scene.time.now + this.intervalMs;
        }
    }
}