import { Math as PhaserMath } from 'phaser';
import { EntityFactory } from '../patterns/EntityFactory';
import { Audio } from './Audio';

// Aviso previo al disparo: 400 ms da tiempo a reaccionar al jugador nuevo.
const WARN_MS = 400;

export const PROJECTILE_SPAWN_CONFIG = {
    initialInterval: 1700,
    minInterval: 600,
    maxSpeedMultiplier: 2,
    wallGapX: 52,
    variant: 'standard'
};

export class ProjectileManager {
    constructor(scene, totalDurationMs, config = PROJECTILE_SPAWN_CONFIG) {
        this.scene = scene;
        this.config = config;
        this.group = scene.physics.add.group();
        this.projectiles = [];
        this.totalDurationMs = totalDurationMs;
        // Se fija en el primer update: el reloj de la escena arranca con la edad
        // de la pestaña y desfasaría el progreso (mismo criterio que GameTimer).
        this.startTime = null;
        this.nextSpawnTime = 0;
    }

    get progress() {
        if (this.startTime === null) {
            return 0;
        }

        const elapsed = this.scene.time.now - this.startTime;
        return Math.min(elapsed / this.totalDurationMs, 1);
    }

    get intervalMs() {
        const base = this.config.initialInterval;
        const min = this.config.minInterval;

        return base - (base - min) * this.progress;
    }

    get speedMultiplier() {
        if (!this.config) {
            return 1;
        }

        return 1 + (this.config.maxSpeedMultiplier - 1) * this.progress;
    }

    spawn() {
        // Nivel sin proyectiles (p. ej. N1): no hay nada que spawnear.
        if (!this.config) {
            return;
        }

        const side = PhaserMath.RND.pick(['left', 'right']);
        const y = PhaserMath.Between(140, 700);
        const x = side === 'left'
            ? this.config.wallGapX
            : this.scene.scale.width - this.config.wallGapX;

        // Telegrafía: marca pulsante WARN_MS antes de que salga el proyectil.
        const warn = this.scene.add.circle(x, y, 14, 0xff4455, 0.35);
        warn.setStrokeStyle(3, 0xffffff, 0.9);
        this.scene.tweens.add({
            targets: warn,
            scale: 0.6,
            alpha: 0.7,
            duration: 120,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });
        // Flecha en el borde de la pantalla y tic de aviso, para quien mira otra cosa.
        this.scene.fx.arrow(side === 'left' ? 12 : this.scene.scale.width - 34, y - 11, side === 'left' ? 1 : -1);
        Audio.play('warn', { x });
        this.scene.time.delayedCall(WARN_MS, () => {
            warn.destroy();
            const projectile = EntityFactory.createProjectile(this.scene, x, y, this.scene.player.rect, this.speedMultiplier, this.config.variant ?? 'standard');
            this.projectiles.push(projectile);
            this.group.add(projectile.circle);
        });
    }

    update(deltaMs) {
        // Nivel sin proyectiles: el grupo queda vacío y el overlap no dispara.
        if (!this.config) {
            return;
        }

        if (this.startTime === null) {
            this.startTime = this.scene.time.now;
            this.nextSpawnTime = this.scene.time.now + this.config.initialInterval;
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];

            projectile.update(deltaMs);

            if (projectile.isOutOfBounds() || projectile.isAbsorbed) {
                // Chispa al salir de la pantalla (no si lo absorbió el escudo).
                if (!projectile.isAbsorbed && projectile.variant !== 'ricochet') {
                    const { x, y } = projectile.circle;
                    const { width, height } = this.scene.scale;

                    this.scene.fx.spark(Math.min(Math.max(x, 8), width - 8), Math.min(Math.max(y, 8), height - 8), 0xff4455, 4);
                }

                projectile.destroy();
                this.projectiles.splice(i, 1);
            }
        }

        if (this.scene.time.now >= this.nextSpawnTime) {
            this.spawn();
            this.nextSpawnTime = this.scene.time.now + this.intervalMs;
        }
    }

    // Marca el proyectil cuyo círculo coincide como absorbido (se elimina en el próximo update).
    absorbCircle(circle) {
        const projectile = this.projectiles.find((p) => p.circle === circle);

        if (projectile && !projectile.isAbsorbed) {
            projectile.isAbsorbed = true;
            projectile.circle.setActive(false);
            projectile.circle.setVisible(false);
        }
    }
}