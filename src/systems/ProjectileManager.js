import { Math as PhaserMath } from 'phaser';
import { Projectile } from '../entities/Projectile';

export const PROJECTILE_SPAWN_CONFIG = {
    initialInterval: 1700,
    minInterval: 600,
    maxSpeedMultiplier: 2,
    wallGapX: 42
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
        const side = PhaserMath.RND.pick(['left', 'right']);
        const y = PhaserMath.Between(140, 700);
        const x = side === 'left'
            ? PROJECTILE_SPAWN_CONFIG.wallGapX
            : this.scene.scale.width - PROJECTILE_SPAWN_CONFIG.wallGapX;

        const projectile = new Projectile(this.scene, x, y, this.scene.player.rect, this.speedMultiplier);
        this.projectiles.push(projectile);
        this.group.add(projectile.circle);
    }

    update(deltaMs) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            projectile.update(deltaMs);

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