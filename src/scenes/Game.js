import { Scene } from 'phaser';
import { Level } from '../systems/Level';
import { Player } from '../entities/Player';
import { PointSpawner } from '../systems/PointSpawner';
import { ScoreManager } from '../systems/ScoreManager';
import { GameTimer } from '../systems/GameTimer';
import { Hud } from '../systems/Hud';
import { ProjectileManager } from '../systems/ProjectileManager';
import { FloatingText } from '../systems/FloatingText';
import { Audio } from '../systems/Audio';
import { LEVELS } from '../assets/levels';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    init (data)
    {
        this.levelIndex = data.levelIndex ?? 0;
        this.completedScore = data.completedScore ?? 0;
    }

    create ()
    {
        this.gameEnded = false;
        this.levelComplete = false;
        this.lastSecond = null;

        if (!this.textures.exists('particle')) {
            this.make.graphics({ x: 0, y: 0, add: false })
                .fillStyle(0xffffff, 1)
                .fillCircle(4, 4, 4)
                .generateTexture('particle', 8, 8);
        }

        this.cameras.main.setBackgroundColor(0x1a1a2e);

        const levelConfig = LEVELS[this.levelIndex] ?? LEVELS[0];

        this.level = new Level(this, levelConfig);
        this.player = new Player(this, levelConfig.spawn.x, levelConfig.spawn.y);

        this.physics.add.collider(this.player.rect, this.level.platforms);

        if (this.level.trampolineList.length) {
            this.physics.add.collider(this.player.rect, this.level.trampolines);
            this.physics.add.overlap(this.player.rect, this.level.trampolines, (player, rect) => {
                const trampoline = this.level.trampolineList.find((t) => t.rect === rect);

                if (trampoline && player.body.velocity.y > -30) {
                    const perfect = trampoline.bounce(this.player.rect);
                    Audio.play(perfect ? 'perfect' : 'bounce');
                }
            });
        }

        this.scoreManager = new ScoreManager();
        this.scoreManager.setQuota(levelConfig.quota);
        this.timer = new GameTimer(this, () => this.onTimeUp(), levelConfig.durationSeconds);
        this.hud = new Hud(this);
        this.floatingText = new FloatingText(this);

        this.hud.setScore(this.scoreManager.score);
        this.hud.setQuota(this.scoreManager.collected, this.scoreManager.quota);
        this.hud.setLevel(this.levelIndex + 1, LEVELS.length);
        this.hud.setTime(this.timer.remainingSeconds);

        this.floatingText.showBanner(512, 240, `Nivel ${this.levelIndex + 1} - ${levelConfig.name}`, '#00d1b2', 34);

        this.muteKey = this.input.keyboard.addKey('M');
        this.muteKey.on('down', () => {
            const isMuted = Audio.toggle();
            this.floatingText.show(512, 120, isMuted ? 'MUTE' : 'SONIDO', '#ffffff', 18);
        });

        this.pointSpawner = new PointSpawner(this, levelConfig.pointSpots);
        this.projectileManager = new ProjectileManager(this, this.timer.durationMs, levelConfig.projectiles);

        this.physics.add.overlap(this.player.rect, this.pointSpawner.points.map((point) => point.circle), (player, circle) => {
            const point = this.pointSpawner.getPointByCircle(circle);

            if (!point) {
                return;
            }

            const gained = this.scoreManager.scorePoint(point.value, this.time.now);
            this.hud.setScore(this.scoreManager.score);
            this.hud.setQuota(this.scoreManager.collected, this.scoreManager.quota);
            this.hud.setMultiplier(this.scoreManager.multiplier);
            this.player.setMultiplier(this.scoreManager.multiplier);
            Audio.play('point', { combo: this.scoreManager.multiplier });
            this.burstAt(point.circle.x, point.circle.y, point.color);
            this.floatingText.show(point.circle.x, point.circle.y - 20, `+${gained}`, this.scoreManager.multiplier > 1 ? '#ff6622' : '#ffdd44');
            point.deactivate();
            this.pointSpawner.activateAnother();

            if (this.scoreManager.quotaMet) {
                this.onQuotaMet();
            }
        });

        this.physics.add.overlap(this.player.rect, this.projectileManager.group, () => this.onHit());

        this.physics.add.overlap(this.player.rect, this.level.goal.frame, () => {
            if (this.level.goal.isOpen) {
                this.onGoalReached();
            }
        });
    }

    update (time, delta)
    {
        this.player.update();
        this.timer.update();
        this.projectileManager.update(delta);

        const seconds = this.timer.remainingSeconds;
        if (seconds !== this.lastSecond) {
            this.lastSecond = seconds;
            this.hud.setTime(seconds);
        }
    }

    // Puntaje total de la campaña: niveles completados + puntaje del nivel en curso.
    get totalScore()
    {
        return this.completedScore + this.scoreManager.score;
    }

    onQuotaMet ()
    {
        if (this.gameEnded || this.levelComplete) {
            return;
        }

        this.level.goal.open();
        Audio.play('goalOpen');

        this.floatingText.showBanner(512, 300, '¡META CUMPLIDA!', '#00ff88', 32);
        this.floatingText.showBanner(512, 348, 'Llegá a la salida', '#ffffff', 22, 700);
    }

    onGoalReached ()
    {
        if (this.gameEnded || this.levelComplete) {
            return;
        }

        this.levelComplete = true;
        this.gameEnded = true;
        Audio.play('goalReached');

        const bankedScore = this.totalScore;

        this.floatingText.showBanner(512, 300, `¡Nivel ${this.levelIndex + 1} superado!`, '#00ff88', 32);

        this.time.delayedCall(1200, () => {
            if (this.levelIndex + 1 < LEVELS.length) {
                this.scene.start('Game', {
                    levelIndex: this.levelIndex + 1,
                    completedScore: bankedScore
                });
            } else {
                this.scene.start('GameOver', {
                    score: bankedScore,
                    reason: 'victory',
                    levelIndex: this.levelIndex
                });
            }
        });
    }

    onTimeUp ()
    {
        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;
        this.scene.start('GameOver', {
            score: this.completedScore,
            lostScore: this.scoreManager.score,
            reason: 'timeout',
            levelIndex: this.levelIndex
        });
    }

    onHit ()
    {
        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;
        Audio.play('hit');
        this.player.rect.setFillStyle(0xff4455);

        this.cameras.main.shake(400, 0.02);
        this.cameras.main.flash(300, 255, 40, 40);

        this.floatingText.show(this.player.rect.x, this.player.rect.y - 40, '¡Impacto!', '#ff4455', 26);

        this.time.delayedCall(600, () => {
            this.scene.start('GameOver', {
                score: this.completedScore,
                lostScore: this.scoreManager.score,
                reason: 'hit',
                levelIndex: this.levelIndex
            });
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