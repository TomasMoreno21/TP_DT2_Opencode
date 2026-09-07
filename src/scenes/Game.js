import { Scene } from 'phaser';
import { Level } from '../systems/Level';
import { Player } from '../entities/Player';
import { PointSpawner } from '../systems/PointSpawner';
import { ScoreManager } from '../systems/ScoreManager';
import { GameTimer } from '../systems/GameTimer';
import { Hud } from '../systems/Hud';
import { ProjectileManager } from '../systems/ProjectileManager';

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

        this.cameras.main.setBackgroundColor(0x1a1a2e);

        this.level = new Level(this);
        this.player = new Player(this, 200, 650);

        this.physics.add.collider(this.player.rect, this.level.platforms);

        this.scoreManager = new ScoreManager();
        this.timer = new GameTimer(this, () => this.onTimeUp());
        this.hud = new Hud(this);

        this.hud.setScore(this.scoreManager.score);
        this.hud.setTime(this.timer.remainingSeconds);

        this.pointSpawner = new PointSpawner(this);
        this.projectileManager = new ProjectileManager(this);

        this.physics.add.overlap(this.player.rect, this.pointSpawner.points.map((point) => point.circle), (player, circle) => {
            const point = this.pointSpawner.getPointByCircle(circle);

            if (!point) {
                return;
            }

            this.scoreManager.add(point.value);
            this.hud.setScore(this.scoreManager.score);
            point.deactivate();
        });

        this.physics.add.overlap(this.player.rect, this.projectileManager.group, () => this.onHit());
    }

    update ()
    {
        this.player.update();
        this.timer.update();
        this.projectileManager.update();

        const seconds = this.timer.remainingSeconds;
        if (seconds !== this.lastSecond) {
            this.lastSecond = seconds;
            this.hud.setTime(seconds);
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
        this.scene.start('GameOver', { score: this.scoreManager.score, reason: 'hit' });
    }
}