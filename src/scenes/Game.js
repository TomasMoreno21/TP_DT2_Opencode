import { Scene } from 'phaser';
import { Level } from '../systems/Level';
import { Player, PLAYER_CONFIG } from '../entities/Player';
import { PORTAL_CONFIG } from '../entities/Portal';
import { PointSpawner } from '../systems/PointSpawner';
import { ScoreManager } from '../systems/ScoreManager';
import { GameTimer } from '../systems/GameTimer';
import { Hud } from '../systems/Hud';
import { ProjectileManager } from '../systems/ProjectileManager';
import { FloatingText } from '../systems/FloatingText';
import { GamePace } from '../systems/GamePace';
import { Audio } from '../systems/Audio';
import { LEVELS, WORLD } from '../assets/levels';

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

        this.pace = new GamePace(this);
        this.zoomLevel = 1;

        this.level = new Level(this, levelConfig);
        this.player = new Player(this, levelConfig.spawn.x, levelConfig.spawn.y);

        this.physics.add.collider(this.player.rect, this.level.platforms);

        this.cameras.main.setBounds(0, 0, 1024, 768);
        this.cameras.main.startFollow(this.player.rect, true, 0.12, 0.12);
        this.cameras.main.setDeadzone(80, 120);

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

        if (this.level.movingPlatformList.length) {
            this.physics.add.collider(this.player.rect, this.level.movingPlatforms);
        }

        if (this.level.powerUpList.length) {
            this.physics.add.overlap(this.player.rect, this.level.powerUps, (player, circle) => {
                const powerUp = this.level.powerUpList.find((p) => p.circle === circle);

                if (powerUp && powerUp.collect()) {
                    this.player.activateShield();
                    Audio.play('shield');
                    this.floatingText.show(powerUp.x, powerUp.y - 28, '¡ESCUDO!', '#2dd4ff', 20);
                    this.burstAt(powerUp.x, powerUp.y, 0x2dd4ff);
                }
            });
        }

        if (this.level.portalList.length) {
            this.physics.add.overlap(this.player.rect, this.level.portals, (player, sensor) => {
                const portal = this.level.portalList.find((p) => p.sensor === sensor);

                if (portal && portal.status === 'idle') {
                    portal.beginCharge();
                }
            });
        }

        this.shieldTotalMs = PLAYER_CONFIG.shieldDurationMs;

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

            const airborne = !this.player.body.blocked.down;
            const { gained, airBonus } = this.scoreManager.scorePoint(point.value, this.time.now, { airborne });
            this.hud.setScore(this.scoreManager.score);
            this.hud.setQuota(this.scoreManager.collected, this.scoreManager.quota);
            this.hud.setMultiplier(this.scoreManager.multiplier);
            this.hud.setAirStreak(this.scoreManager.airStreak);
            this.player.setMultiplier(this.scoreManager.multiplier);
            this.pace.hitstop(30);
            this.applyComboZoom();
            Audio.play('point', { combo: this.scoreManager.multiplier });
            this.burstAt(point.circle.x, point.circle.y, point.color);
            this.floatingText.show(point.circle.x, point.circle.y - 20, `+${gained}`, this.scoreManager.multiplier > 1 ? '#ff6622' : '#ffdd44');

            if (airBonus > 0) {
                this.floatingText.show(point.circle.x, point.circle.y - 44, `VOLEANDO +${airBonus}`, '#66ff88', 14);
            }

            point.deactivate();
            this.pointSpawner.activateAnother();

            if (this.scoreManager.quotaMet) {
                this.onQuotaMet();
            }
        });

        if (this.level.gemList.length) {
            this.physics.add.overlap(this.player.rect, this.level.gems, (player, circle) => {
                const gem = this.level.gemList.find((g) => g.circle === circle);

                if (!gem || !gem.active) {
                    return;
                }

                const airborne = !this.player.body.blocked.down;
                const { gained, airBonus } = this.scoreManager.scoreGem(gem.value, this.time.now, { airborne });
                this.timer.addSeconds(gem.bonusSeconds);
                this.hud.setScore(this.scoreManager.score);
                this.hud.setMultiplier(this.scoreManager.multiplier);
                this.hud.setAirStreak(this.scoreManager.airStreak);
                this.player.setMultiplier(this.scoreManager.multiplier);
                this.pace.hitstop(30);
                this.applyComboZoom();
                Audio.play('gem');
                this.burstAt(gem.x, gem.y, gem.color);
                this.floatingText.show(gem.x, gem.y - 24, `+${gained}`, '#66ff88', 20);

                if (this.scoreManager.quotaMet) {
                    this.onQuotaMet();
                }

                gem.deactivate();
            });
        }

        this.physics.add.overlap(this.player.rect, this.projectileManager.group, (player, circle) => this.onHit(circle));

        if (this.level.hazardList.length) {
            this.physics.add.overlap(this.player.rect, this.level.hazards, () => this.onHit());
        }

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
        this.updateMovingPlatforms();
        this.updateHazards();

        const seconds = this.timer.remainingSeconds;
        if (seconds !== this.lastSecond) {
            this.lastSecond = seconds;
            this.hud.setTime(seconds);
        }

        this.hud.setShield(this.player.shieldUntil - this.time.now, this.shieldTotalMs);

        this.updateAirStreak();
        this.updatePortals();
    }

    // M6: la cadena "sin pies en el suelo" se corta al aterrizar sobre el piso.
    updateAirStreak() {
        const onFloor = this.player.body.blocked.down && this.player.rect.y + this.player.rect.height / 2 >= WORLD.floorTop - 2;

        if (onFloor && this.scoreManager.airStreak > 0) {
            this.scoreManager.resetAirStreak();
            this.hud.setAirStreak(0);
        }
    }

    // Gestiona la carga de los portales: la cancela si el jugador se aleja y
    // ejecuta el salto cuando el aviso termina.
    updatePortals() {
        if (this.level.portalList.length === 0) {
            return;
        }

        const playerRect = this.player.rect;

        for (const portal of this.level.portalList) {
            if (portal.status !== 'charging') {
                continue;
            }

            const stillTouching = Math.abs(playerRect.x - portal.x) <= (playerRect.width + PORTAL_CONFIG.width) / 2 &&
                Math.abs(playerRect.y - portal.y) <= (playerRect.height + PORTAL_CONFIG.height) / 2;

            if (!stillTouching) {
                portal.cancelCharge();
                continue;
            }

            if (portal.isCharged) {
                portal.teleport(playerRect);
                Audio.play('portal');
                this.burstAt(portal.x, portal.y, 0x9d7bff);
                this.burstAt(this.player.rect.x, this.player.rect.y, 0x9d7bff);
                this.cameras.main.flash(120, 157, 123, 255);
            }
        }
    }

    // Arrastra al jugador parado sobre una plataforma móvil para que viaje con ella.
    updateMovingPlatforms() {
        if (this.level.movingPlatformList.length === 0) {
            return;
        }

        const playerRect = this.player.rect;

        for (const platform of this.level.movingPlatformList) {
            const delta = platform.update();

            if (delta === 0) {
                continue;
            }

            const platformTop = platform.rect.y - platform.rect.height / 2;
            const playerBottom = playerRect.y + playerRect.height / 2;
            const touchesTop = Math.abs(playerBottom - platformTop) < 10;
            const withinX = Math.abs(playerRect.x - platform.rect.x) <= (platform.rect.width + playerRect.width) / 2;
            const standing = this.player.body.blocked.down && touchesTop && withinX;

            if (standing) {
                if (platform.axis === 'x') {
                    this.player.body.x += delta;
                } else {
                    this.player.body.y += delta;
                }
            }
        }
    }

    // Actualiza el ciclo de los pinchos y detecta daño en su fase activa.
    updateHazards() {
        if (this.level.hazardList.length === 0) {
            return;
        }

        for (const hazard of this.level.hazardList) {
            hazard.update();
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

    onHit (projectileCircle = null)
    {
        if (this.gameEnded) {
            return;
        }

        if (this.player.isInvulnerable) {
            return;
        }

        if (this.player.hasShield) {
            if (projectileCircle) {
                this.projectileManager.absorbCircle(projectileCircle);
            }

            this.player.absorbHit();
            Audio.play('hit');
            this.cameras.main.flash(150, 90, 220, 255);
            this.burstAt(this.player.rect.x, this.player.rect.y, 0x2dd4ff);
            this.floatingText.show(this.player.rect.x, this.player.rect.y - 40, '¡ESCUDO!', '#2dd4ff', 20);
            return;
        }

        this.gameEnded = true;
        this.pace.hitstop(80);
        this.pace.slowmo(700, 0.35);
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

    applyComboZoom() {
        const target = this.scoreManager.multiplier >= 4 ? 1.03 : 1;

        if (target === this.zoomLevel) {
            return;
        }

        this.zoomLevel = target;
        this.cameras.main.zoomTo(target, 300, 'Sine.easeInOut');
    }
}