import { Scene } from 'phaser';
import { Level } from '../systems/Level';
import { Player } from '../entities/Player';
import { PointSpawner } from '../systems/PointSpawner';
import { ScoreManager } from '../systems/ScoreManager';
import { GameTimer, TIMER_CONFIG } from '../systems/GameTimer';
import { Hud } from '../systems/Hud';
import { ProjectileManager } from '../systems/ProjectileManager';
import { FloatingText } from '../systems/FloatingText';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.gameEnded = false;
        this.lastSecond = null;

        if (!this.textures.exists('particle')) {
            this.make.graphics({ x: 0, y: 0, add: false })
                .fillStyle(0xffffff, 1)
                .fillCircle(4, 4, 4)
                .generateTexture('particle', 8, 8);
        }

        this.cameras.main.setBackgroundColor(0x1a1a2e);

        this.level = new Level(this);
        this.player = new Player(this, 200, 650);

        this.physics.add.collider(this.player.rect, this.level.platforms);

        this.scoreManager = new ScoreManager();
        this.timer = new GameTimer(this, () => this.onTimeUp());
        this.hud = new Hud(this);
        this.floatingText = new FloatingText(this);

        this.hud.setScore(this.scoreManager.score);
        this.hud.setTime(this.timer.remainingSeconds, TIMER_CONFIG.duration);

        this.pointSpawner = new PointSpawner(this);
        this.projectileManager = new ProjectileManager(this, TIMER_CONFIG.duration * 1000);

        this.physics.add.overlap(this.player.rect, this.pointSpawner.points.map((point) => point.circle), (player, circle) => {
            const point = this.pointSpawner.getPointByCircle(circle);

            if (!point) {
                return;
            }

            const gained = this.scoreManager.scorePoint(point.value, this.time.now);
            this.hud.setScore(this.scoreManager.score);
            this.hud.setMultiplier(this.scoreManager.multiplier);
            this.player.setMultiplier(this.scoreManager.multiplier);
            this.burstAt(point.circle.x, point.circle.y, point.color);
            this.floatingText.show(point.circle.x, point.circle.y - 20, `+${gained}`, this.scoreManager.multiplier > 1 ? '#ff6622' : '#ffdd44');
            point.deactivate();
            this.pointSpawner.activateAnother();
        });

        this.physics.add.overlap(this.player.rect, this.projectileManager.group, () => this.onHit());
    }

    update (time, delta)
    {
        this.player.update();
        this.timer.update();
        this.projectileManager.update(delta);

        const seconds = this.timer.remainingSeconds;
        if (seconds !== this.lastSecond) {
            this.lastSecond = seconds;
            this.hud.setTime(seconds, TIMER_CONFIG.duration);
        }
    }

    onTimeUp ()
    {
        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;
        this.scene.start('GameOver', { score: this.scoreManager.score, reason: 'timeout' });
    }

    onHit ()
    {
        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;
        this.player.rect.setFillStyle(0xff4455);

        this.cameras.main.shake(400, 0.02);
        this.cameras.main.flash(300, 255, 40, 40);

        this.floatingText.show(this.player.rect.x, this.player.rect.y - 40, '¡Impacto!', '#ff4455', 26);

        this.time.delayedCall(600, () => {
            this.scene.start('GameOver', { score: this.scoreManager.score, reason: 'hit' });
        });
    }

    burstAt(x, y, color) {
        const hexColor = typeof color === 'number' ? color : 0xffdd44;

        this.add.particles(x, y, 'particle', {
            speed: { min: 60, max: 220 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            quantity: 10,
            emitting: false,
            tint: hexColor
        }).explode(10, x, y);
    }
}