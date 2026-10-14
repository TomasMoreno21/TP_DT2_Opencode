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
import { LevelGenerator } from '../systems/LevelGenerator';

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
        this.campaignSeed = data.campaignSeed ?? (data.seed ?? Date.now() * 131542391 >>> 0);
        this.campaign = data.campaign ?? null;
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

        this.cameras.main.setBackgroundColor(0x141026);

        if (!this.textures.exists('neon-star')) {
            const sg = this.make.graphics({ x: 0, y: 0, add: false });
            sg.fillStyle(0xffffff, 1).fillCircle(8, 12, 2);
            sg.fillStyle(0x00d1b2, 0.9).fillCircle(34, 30, 1.6);
            sg.fillStyle(0xffdd44, 0.9).fillCircle(52, 10, 1.4);
            sg.fillStyle(0xffffff, 0.7).fillCircle(22, 48, 1.2);
            sg.generateTexture('neon-star', 64, 64);
            sg.destroy();
        }

        const bg = this.add.graphics().setScrollFactor(0).setDepth(-10);
        bg.fillGradientStyle(0x232045, 0x232045, 0x141026, 0x141026, 1);
        bg.fillRect(0, 0, 1024, 768);
        bg.fillStyle(0x00d1b2, 0.18).fillRect(0, 708, 1024, 3);
        bg.fillStyle(0xffdd44, 0.08).fillRect(0, 712, 1024, 8);
        bg.lineStyle(1, 0x00d1b2, 0.07);
        for (let y = 64; y < 768; y += 64) {
            bg.lineBetween(0, y, 1024, y);
        }

        this.bgStars = this.add.tileSprite(512, 384, 1024, 768, 'neon-star')
            .setScrollFactor(0).setDepth(-9).setAlpha(0.85);
        this.tweens.add({ targets: this.bgStars, alpha: 0.55, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        let levelConfig = LEVELS[this.levelIndex] ?? LEVELS[0];
        if (this.campaign) {
            const entry = this.campaign[this.levelIndex];
            if (entry && entry.config) levelConfig = entry.config;
        } else {
            // Generar campaña al vuelo si no llegó (caso de reinicio directo)
            const gen = new LevelGenerator();
            const camp = gen.generateCampaign(this.campaignSeed, LEVELS);
            this.campaign = camp;
            const entry = camp[this.levelIndex];
            if (entry && entry.config) levelConfig = entry.config;
            console.log('[FastMove] campaign seed:', this.campaignSeed);
        }

        this.pace = new GamePace(this);
        this.zoomLevel = 1;

        this.level = new Level(this, levelConfig);
        this.player = new Player(this, levelConfig.spawn.x, levelConfig.spawn.y);

        this.physics.add.collider(this.player.rect, this.level.platforms);

        this.cameras.main.setBounds(0, 0, 1024, 768);
        this.cameras.main.startFollow(this.player.rect, true, 0.12, 0.12);
        this.cameras.main.setDeadzone(80, 120);

        if (this.level.trampolineList.length) {
            this.physics.add.collider(this.player.rect, this.level.trampolines, (player, rect) => {
                const trampoline = this.level.trampolineList.find((t) => t.rect === rect);
                if (trampoline && !this.player.isDashing && player.body.velocity.y > -30) {
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

        this.retryKey = this.input.keyboard.addKey('R');
        this.retryKey.on('down', () => {
            if (!this.gameEnded) {
                this.scene.restart({ levelIndex: this.levelIndex, completedScore: this.completedScore, campaignSeed: this.campaignSeed, campaign: this.campaign });
            }
        });

        this.events.on('player-dash', () => Audio.play('dash'));
        this.events.on('player-dash', () => this.spawnDashGhosts());
        this.events.on('player-dash', () => this.cameras.main.shake(90, 0.0035));
        this.events.on('player-jump', (kind) => Audio.play('jump', { kind }));
        this.trailAcc = 0;

        this.pointSpawner = new PointSpawner(this, levelConfig.pointSpots);
        this.projectileManager = new ProjectileManager(this, this.timer.durationMs, levelConfig.projectiles);

        this.physics.add.overlap(this.player.rect, this.pointSpawner.points.map((point) => point.circle), (player, circle) => {
            const point = this.pointSpawner.getPointByCircle(circle);
            if (!point) return;
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
            if (airBonus > 0) this.floatingText.show(point.circle.x, point.circle.y - 44, `VOLEANDO +${airBonus}`, '#66ff88', 14);
            point.deactivate();
            this.pointSpawner.activateAnother();
            if (this.scoreManager.quotaMet) this.onQuotaMet();
        });

        if (this.level.gemList.length) {
            this.physics.add.overlap(this.player.rect, this.level.gems, (player, circle) => {
                const gem = this.level.gemList.find((g) => g.circle === circle);
                if (!gem || !gem.active) return;
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
                if (airBonus > 0) this.floatingText.show(gem.x, gem.y - 44, `VOLANDO +${airBonus}`, '#66ff88', 14);
                if (this.scoreManager.quotaMet) this.onQuotaMet();
                gem.deactivate();
            });
        }

        this.physics.add.overlap(this.player.rect, this.projectileManager.group, (player, circle) => this.onHit(circle));
        if (this.level.hazardList.length) {
            this.physics.add.overlap(this.player.rect, this.level.hazards, () => this.onHit());
        }

        this.physics.add.overlap(this.player.rect, this.level.goal.frame, () => {
            if (this.level.goal.isOpen) this.onGoalReached();
        });

        this.events.once('shutdown', () => this.pace.restore());
        this.events.once('shutdown', () => this.level.destroy());
    }

    update (time, delta)
    {
        if (this.bgStars) {
            this.bgStars.tilePositionX = this.cameras.main.scrollX * 0.25;
            this.bgStars.tilePositionY = this.cameras.main.scrollY * 0.25 + time * 0.006;
        }

        this.player.update(delta);
        this.updateTrail(delta);
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
        this.hud.setDashCooldown(this.player.dashRemaining, PLAYER_CONFIG.dashCooldownMs);

        this.updateAirStreak();
        this.updatePortals();
    }
}