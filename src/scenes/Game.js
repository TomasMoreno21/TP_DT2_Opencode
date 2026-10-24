import { Scene } from 'phaser';
import { Level } from '../systems/Level';
import { Player, PLAYER_CONFIG } from '../entities/Player';
import { PORTAL_CONFIG } from '../entities/Portal';
import { PointSpawner } from '../systems/PointSpawner';
import { ScoreManager } from '../systems/ScoreManager';
import { RANK_COLORS, RankStore, TIME_BONUS_PER_SECOND, rankFor, rankThresholds } from '../systems/Rank';
import { GameTimer } from '../systems/GameTimer';
import { Hud } from '../systems/Hud';
import { ProjectileManager } from '../systems/ProjectileManager';
import { FloatingText } from '../systems/FloatingText';
import { GamePace } from '../systems/GamePace';
import { Audio } from '../systems/Audio';
import { TutorialManager, Tutorial, Coach } from '../systems/TutorialManager';
import { Badges } from '../systems/Badges';
import { PRACTICE, PRACTICE_BY_LEVEL } from '../assets/practice';
import { Lang } from '../systems/Texts';
import { LEVELS, WORLD } from '../assets/levels';
import { LevelGenerator } from '../systems/LevelGenerator';
import { CampaignBuilder } from '../systems/CampaignBuilder';
import { FEEL } from '../assets/feel';
import { Fx } from '../systems/Fx';
import { CameraFx } from '../systems/CameraFx';
import { Metrics } from '../systems/Metrics';
import { Music } from '../systems/Music';
import { TensionDirector } from '../systems/TensionDirector';

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
        // Muertes seguidas en este nivel: el reintento genera un mapa más accesible.
        this.deaths = data.deaths ?? 0;
        // Micro-práctica: mapa mínimo de una mecánica nueva (ver assets/practice.js).
        this.practice = data.practice ?? null;
        this.initData = data;

        // Pausa: la escena pausada no avanza su reloj, pero el del juego sí. Se resta
        // lo pausado al tiempo que ve la escena para que ningún plazo (combo, dash,
        // proyectiles, reloj) siga corriendo mientras el menú está abierto.
        this.pausedMs = 0;
        this.paused = false;
        this.pauseStart = 0;
        this.lastResume = 0;

        if (!this.sys.stepPatched) {
            const step = this.sys.step.bind(this.sys);
            this.sys.step = (time, delta) => step(time - this.pausedMs, delta);
            this.sys.stepPatched = true;
        }
    }

    get canRegenerate ()
    {
        return !this.practice && Boolean(this.campaign);
    }

    openPause ()
    {
        if (this.paused || this.gameEnded || this.levelComplete || performance.now() - this.lastResume < 250) {
            return;
        }

        this.paused = true;
        this.pauseStart = performance.now();
        this.scene.pause();
        this.scene.launch('Pause', { game: this });
    }

    resumeGame ()
    {
        this.pausedMs += performance.now() - this.pauseStart;
        this.paused = false;
        this.lastResume = performance.now();
        this.scene.resume();
    }

    // Reemplaza este nivel por otro mapa (misma dificultad, sin asistencia extra).
    regenerateLevel ()
    {
        const seed = ((Date.now() * 2654435761) ^ Math.floor(Math.random() * 4294967296)) >>> 0;

        return CampaignBuilder.buildLevel(seed, this.levelIndex, { assist: this.deaths }).then((entry) => {
            const campaign = this.campaign.slice();
            campaign[this.levelIndex] = entry;
            this.scene.start('Game', {
                levelIndex: this.levelIndex,
                completedScore: this.completedScore,
                campaignSeed: this.campaignSeed,
                campaign,
                deaths: this.deaths
            });
        });
    }

    // La campaña generada viaja con la escena (transición de nivel, reintento y
    // GameOver) para que los mapas no cambien durante una partida. Si no llegó
    // (arranque directo), se genera una sola vez con la semilla de la corrida.
    resolveLevelConfig ()
    {
        if (this.practice) {
            return PRACTICE[this.practice.mech];
        }

        if (!this.campaign) {
            this.campaign = new LevelGenerator().generateCampaign(this.campaignSeed, LEVELS);
            console.log(`[FastMove] campaña generada al vuelo (semilla ${this.campaignSeed}):`,
                this.campaign.map((e) => `N${e.config.id}=${e.config.durationSeconds}s${e.ok ? (e.mutated ? '' : '(base)') : '(inválido)'}`).join(' '));
        }

        const entry = this.campaign[this.levelIndex];
        if (entry && entry.config) {
            return entry.config;
        }

        return LEVELS[this.levelIndex] ?? LEVELS[0];
    }

    create ()
    {
        // La primera vez que se llega a un nivel con mecánica nueva, antes va la práctica.
        const mech = PRACTICE_BY_LEVEL[this.levelIndex];
        if (!this.practice && mech && Tutorial.wantsPractice(mech)) {
            this.scene.start('Game', { ...this.initData, practice: { mech } });
            return;
        }

        this.gameEnded = false;
        this.levelComplete = false;
        this.lastSecond = null;
        this.warned5s = false;
        this.maxMult = 1;

        if (!this.textures.exists('particle')) {
            this.make.graphics({ x: 0, y: 0, add: false })
                .fillStyle(0xffffff, 1)
                .fillCircle(4, 4, 4)
                .generateTexture('particle', 8, 8);
        }

        this.cameras.main.setBackgroundColor(0x141026);

        // Fondo neón procedural con parallax suave (sin assets externos).
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

        const levelConfig = this.resolveLevelConfig();

        this.pace = new GamePace(this);
        this.fx = new Fx(this);
        this.camFx = new CameraFx(this);
        this.tension = new TensionDirector(this);
        this.zoomLevel = 1;

        this.level = new Level(this, levelConfig);
        this.player = new Player(this, levelConfig.spawn.x, levelConfig.spawn.y);

        this.physics.add.collider(this.player.rect, this.level.platforms);

        this.cameras.main.setBounds(0, 0, 1024, 768);
        this.cameras.main.startFollow(this.player.rect, true, 0.12, 0.12);
        this.cameras.main.setDeadzone(80, 120);

        if (this.level.trampolineList.length) {
            // El rebote vive en el callback del collider: un overlap aparte
            // evaluaba tras la separación (jugador al ras del trampolín) y su
            // separate() retornaba false, así que el callback nunca corría.
            this.physics.add.collider(this.player.rect, this.level.trampolines, (player, rect) => {
                const trampoline = this.level.trampolineList.find((t) => t.rect === rect);

                // El dash atraviesa los trampolines sin lanzarse: su línea recta manda.
                if (trampoline && !this.player.isDashing && player.body.velocity.y > -30) {
                    const perfect = trampoline.bounce(this.player.rect);
                    Audio.play(perfect ? 'perfect' : 'bounce');
                    if (perfect) this.unlockBadge('perfect');
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
        this.metrics = new Metrics(this.levelIndex + 1);

        this.rankThresholds = rankThresholds(this.scoreManager.quota);
        this.hud.setRankThresholds(this.rankThresholds);
        this.hud.setScore(this.scoreManager.score);
        this.hud.setQuota(this.scoreManager.collected, this.scoreManager.quota);
        this.hud.setLevel(this.levelIndex + 1, LEVELS.length);
        this.hud.setTimerTotal(levelConfig.durationSeconds);
        this.hud.setTime(this.timer.remainingSeconds);

        if (this.practice) {
            this.setupPractice();
        } else {
            this.floatingText.showBanner(512, 240, `Nivel ${this.levelIndex + 1} - ${levelConfig.name}`, '#00d1b2', 34);
        }
        if (this.registry.get('infiniteLife')) {
            this.floatingText.showBanner(512, 200, 'VIDA INFINITA', '#ff66aa', 18);
        }
        if (this.deaths > 0) {
            this.floatingText.showBanner(512, 286, 'Mapa nuevo: más espacio y más tiempo', '#66ff88', 20);
        }

        const coachHint = this.practice ? null : Coach.take();
        if (coachHint) {
            this.floatingText.showBanner(512, 340, Lang.t(coachHint), '#ffdd44', 18, 3500);
        }

        this.muteKey = this.input.keyboard.addKey('M');
        this.muteKey.on('down', () => {
            const isMuted = Audio.toggle();
            this.floatingText.show(512, 120, isMuted ? 'MUTE' : 'SONIDO', '#ffffff', 18);
        });

        this.retryKey = this.input.keyboard.addKey('R');
        this.input.keyboard.addKey('ESC').on('down', () => this.openPause());

        this.retryKey.on('down', () => {
            if (!this.gameEnded && !this.paused) {
                this.scene.restart({
                    levelIndex: this.levelIndex,
                    completedScore: this.completedScore,
                    campaignSeed: this.campaignSeed,
                    campaign: this.campaign,
                    deaths: this.deaths
                });
            }
        });

        this.listen('player-dash', () => Audio.play('dash'));
        this.listen('player-dash', () => this.camFx.shake('dash'));
        this.listen('player-jump', (kind) => Audio.play('jump', { kind }));
        this.listen('player-jump', (kind) => kind === 'wall' && this.unlockBadge('wallJump'));
        this.listen('player-dash', () => this.unlockBadge('dash'));
        this.listen('player-land', (vy) => vy > FEEL.player.landMinVy && Audio.play('land', { vy }));
        this.listen('player-skid', () => Audio.play('skid'));
        this.listen('combo-up', (level) => Audio.play('comboUp', { level }));
        this.listen('combo-lost', () => Audio.play('comboLost'));
        this.listen('frenzy-start', () => Audio.play('frenzy'));
        this.listen('frenzy-start', () => { Music.setFrenzy(true); this.hud.setFrenzy(true); });
        this.listen('frenzy-end', () => { Music.setFrenzy(false); this.hud.setFrenzy(false); });
        this.listen('combo-up', (level) => Music.setCombo(level));
        this.listen('combo-lost', () => Music.setCombo(1));
        this.listen('tension', (value) => Music.setTension(value));
        // Últimos 10 s: tic-tac; últimos 5 s: latido y borde que late cada segundo.
        this.listen('time-tick', (seconds) => {
            Music.setPressure(seconds <= 10);

            if (seconds > 10 || seconds <= 0) return;
            Audio.play(seconds <= 5 ? 'tickUrgent' : 'tick');

            if (seconds <= 5) {
                Audio.play('heartbeat');
                this.hud.pulseEdge();
            }
        });
        this.seenMult = 1;

        // Música del nivel (cada nivel tiene su tonalidad); en la práctica, la del menú.
        Music.play(this.practice ? 'menu' : `level${this.levelIndex % 2}`);
        Music.reset();

        // Hints que se ganan: solo en el nivel 1.
        this.tutorial = this.levelIndex === 0 && !this.practice ? new TutorialManager(this, this.player) : null;

        // Durante el tutorial el reloj está en pausa y no hay orbes: aparecen al terminar.
        this.pointsPending = Boolean(this.tutorial?.active);
        this.pointSpawner = new PointSpawner(this, levelConfig.pointSpots, this.pointsPending);
        this.projectileManager = new ProjectileManager(this, this.timer.durationMs, levelConfig.projectiles);

        this.physics.add.overlap(this.player.rect, this.pointSpawner.points.map((point) => point.circle), (player, circle) => {
            const point = this.pointSpawner.getPointByCircle(circle);

            if (!point) {
                return;
            }

            const airborne = !this.player.body.blocked.down;
            const { gained, airBonus } = this.scoreManager.scorePoint(point.value, this.time.now, { airborne });
            this.metrics.collect(this.time.now, this.scoreManager.multiplier);
            this.events.emit('point-collected');
            this.hud.setScore(this.scoreManager.score);
            this.hud.setQuota(this.scoreManager.collected, this.scoreManager.quota);
            this.hud.setMultiplier(this.scoreManager.multiplier);
            this.hud.setAirStreak(this.scoreManager.airStreak);
            this.player.setMultiplier(this.scoreManager.multiplier);
            this.pace.hitstop(FEEL.hitstop.point);
            this.applyComboZoom();
            Audio.play('point', { chain: this.scoreManager.combo, combo: this.scoreManager.multiplier, x: point.circle.x });
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
                this.metrics.collect(this.time.now, this.scoreManager.multiplier);
                this.events.emit('point-collected');
                this.timer.addSeconds(gem.bonusSeconds);
                this.hud.setScore(this.scoreManager.score);
                this.hud.setMultiplier(this.scoreManager.multiplier);
                this.hud.setAirStreak(this.scoreManager.airStreak);
                this.player.setMultiplier(this.scoreManager.multiplier);
                this.pace.hitstop(FEEL.hitstop.gem);
                this.applyComboZoom();
                Audio.play('gem', { x: gem.x });
                this.unlockBadge('gem');
                this.burstAt(gem.x, gem.y, gem.color);
                this.floatingText.show(gem.x, gem.y - 24, `+${gained}`, '#66ff88', 20);

                if (airBonus > 0) {
                    this.floatingText.show(gem.x, gem.y - 44, `VOLANDO +${airBonus}`, '#66ff88', 14);
                }

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

        // Al reiniciar el nivel o cambiar de escena hay que devolver el mundo a su
        // ritmo normal: si se apaga durante un hitstop, el mundo queda pausado.
        this.events.once('shutdown', () => this.pace.restore());
        this.events.once('shutdown', () => this.level.destroy());
    }

    // Registra un listener de eventos de la escena y lo quita al apagarse. Sin esto,
    // cada reinicio de nivel sumaba otra copia (el dash sonaba y sacudía N veces).
    listen (event, handler)
    {
        this.events.on(event, handler);
        this.events.once('shutdown', () => this.events.off(event, handler));
    }

    // Detecta los cambios del multiplicador efectivo (el que sigue vigente en la ventana
    // del combo) y los anuncia como eventos: combo-up, combo-lost, frenzy-start/end.
    trackCombo ()
    {
        const sm = this.scoreManager;
        const mult = sm.multiplier > 1 && sm.comboRemaining(this.time.now) > 0 ? sm.multiplier : 1;

        if (mult === this.seenMult || this.gameEnded) {
            this.seenMult = mult;
            return;
        }

        if (mult > this.seenMult) {
            this.events.emit('combo-up', mult);
        } else {
            this.events.emit('combo-lost');
        }

        if (mult === 5) this.events.emit('frenzy-start');
        if (this.seenMult === 5) this.events.emit('frenzy-end');

        this.seenMult = mult;
    }

    // Insignia de aprendizaje: aviso corto la primera vez que se usa una mecánica.
    unlockBadge (id)
    {
        if (Badges.unlock(id)) {
            this.floatingText.showBanner(512, 118, '★ ' + Lang.t('badgeNew', { n: Lang.t('badge_' + id) }), '#ffdd44', 20, 1200);
        }
    }

    // Práctica: sin timer ni proyectiles; los golpes reaparecen en vez de terminar.
    setupPractice ()
    {
        const mech = this.practice.mech;
        const name = Lang.t('pr' + mech[0].toUpperCase() + mech.slice(1));
        this.hud.levelText.setText(Lang.t('prTitle', { m: name }));
        this.add.text(512, 150, Lang.t('prTitle', { m: name }), {
            fontFamily: 'Arial Black', fontSize: '26px', color: '#00d1b2', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
        this.add.text(512, 186, Lang.t('prHint' + mech[0].toUpperCase() + mech.slice(1)), {
            fontFamily: 'Arial', fontSize: '16px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
        this.add.text(512, 210, Lang.t('prSkip'), { fontFamily: 'Arial', fontSize: '13px', color: '#9aa4c7' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(51);

        this.input.keyboard.addKey('ENTER').on('down', () => this.endPractice());
    }

    endPractice ()
    {
        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;
        Tutorial.markPractice(this.practice.mech);
        const { practice, ...next } = this.initData;
        this.scene.start('Game', next);
    }

    update (time, delta)
    {
        // Parallax suave: estrellas siguen un poco a la cámara + deriva lenta.
        if (this.bgStars) {
            this.bgStars.tilePositionX = this.cameras.main.scrollX * 0.25;
            this.bgStars.tilePositionY = this.cameras.main.scrollY * 0.25 + time * 0.006;
        }

        this.player.update(delta);
        this.tutorial?.update();
        const inTutorial = Boolean(this.tutorial?.active);
        this.timer.paused = inTutorial;

        if (this.pointsPending && !inTutorial) {
            this.pointsPending = false;
            this.pointSpawner.begin();
        }

        this.timer.update();
        this.projectileManager.update(delta);
        this.updateMovingPlatforms(delta);
        this.updateHazards();

        const seconds = this.timer.remainingSeconds;
        if (seconds !== this.lastSecond) {
            this.lastSecond = seconds;
            this.hud.setTime(seconds);
            this.events.emit('time-tick', seconds);

            if (seconds === 5 && !this.warned5s && !this.gameEnded) {
                this.warned5s = true;
                this.floatingText.showBanner(512, 200, '¡Últimos 5s!', '#ff4455', 30);
            }
        }

        this.hud.setShield(this.player.shieldUntil - this.time.now, this.shieldTotalMs);
        this.hud.setDashCooldown(this.player.dashRemaining, PLAYER_CONFIG.dashCooldownMs);
        this.hud.setComboTimer(this.scoreManager.comboRemaining(this.time.now));
        this.trackCombo();
        this.tension.update(delta);

        if (!this.gameEnded && this.scoreManager.multiplier > this.maxMult) {
            this.maxMult = this.scoreManager.multiplier;
        }

        this.updateAirStreak();
        this.updatePortals();
    }

    // M6: la cadena "sin pies en el suelo" se corta al aterrizar sobre el piso.
    updateAirStreak() {
        const onFloor = this.player.body.blocked.down && this.player.rect.y + this.player.rect.height / 2 >= WORLD.floorTop - 2;

        if (onFloor && this.scoreManager.airStreak > 0) {
            this.scoreManager.resetAirStreak();
            this.scoreManager.dropCombo();
            this.player.setMultiplier(this.scoreManager.multiplier);
            this.hud.setAirStreak(0);
            this.hud.setMultiplier(this.scoreManager.multiplier);
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
                this.unlockBadge('portal');
                this.burstAt(portal.x, portal.y, 0x9d7bff);
                this.burstAt(this.player.rect.x, this.player.rect.y, 0x9d7bff);
                this.camFx.flash(120, 157, 123, 255);
            }
        }
    }

    // Arrastra al jugador parado sobre una plataforma móvil para que viaje con ella.
    updateMovingPlatforms(frameMs) {
        this.player.platformVelocity = null;

        if (this.level.movingPlatformList.length === 0) {
            return;
        }

        const playerRect = this.player.rect;

        for (const platform of this.level.movingPlatformList) {
            const moved = platform.update(frameMs);

            if (moved === 0) {
                continue;
            }

            const platformTop = platform.rect.y - platform.rect.height / 2;
            const playerBottom = playerRect.y + playerRect.height / 2;
            const touchesTop = Math.abs(playerBottom - platformTop) < 10;
            const withinX = Math.abs(playerRect.x - platform.rect.x) <= (platform.rect.width + playerRect.width) / 2;
            const standing = this.player.body.blocked.down && touchesTop && withinX;

            if (standing) {
                if (platform.axis === 'x') {
                    this.player.body.x += moved;
                } else {
                    this.player.body.y += moved;
                }

                // Solo en niveles con carriles el salto hereda la velocidad de la movil.
                if (this.level.config.timedMovers) {
                    this.player.platformVelocity = { x: platform.body.velocity.x, y: platform.body.velocity.y };
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

    // Stats para la pantalla final: mejor combo y segundos sobrevividos del nivel.
    endingStats ()
    {
        return {
            maxCombo: this.maxMult,
            survived: Math.max(Math.floor((this.time.now - this.timer.startTime) / 1000), 0)
        };
    }

    onQuotaMet ()
    {
        if (this.gameEnded || this.levelComplete) {
            return;
        }

        this.level.goal.open();
        this.hud.showExitMarker(this.level.goal.x, this.level.goal.y);
        Audio.play('goalOpen');

        this.floatingText.showBanner(512, 300, '¡META CUMPLIDA!', '#00ff88', 32);
        this.floatingText.showBanner(512, 348, 'Llegá a la salida', '#ffffff', 22, 700);
        // Chispas sobre la salida para guiar al jugador.
        this.burstAt(this.level.goal.x, this.level.goal.y, 0x00ff88);
        this.burstAt(this.level.goal.x, this.level.goal.y, 0xffffff);
    }

    onGoalReached ()
    {
        if (this.gameEnded || this.levelComplete) {
            return;
        }

        if (this.practice) {
            Audio.play('goalReached');
            this.floatingText.showBanner(512, 300, Lang.t('prDone'), '#00ff88', 32);
            this.time.delayedCall(900, () => this.endPractice());
            this.levelComplete = true;
            return;
        }

        this.levelComplete = true;
        this.gameEnded = true;
        this.metrics.finish(this.time.now, 'nivel superado');
        Coach.reset();
        Audio.play('goalReached');

        // Bono de tiempo: los segundos que sobran se convierten en puntos y fijan el rango.
        const timeBonus = this.timer.remainingSeconds * TIME_BONUS_PER_SECOND;
        this.scoreManager.addBonus(timeBonus);
        this.hud.setScore(this.scoreManager.score);
        const rank = rankFor(this.scoreManager.score, this.rankThresholds);
        RankStore.update(this.levelIndex + 1, rank);

        const bankedScore = this.totalScore;

        // Confetti sobre el jugador.
        const px = this.player.rect.x, py = this.player.rect.y;
        for (const [dx, color] of [[-30, 0x00ff88], [30, 0xffdd44], [0, 0x2dd4ff], [-15, 0xff66aa], [15, 0xffffff]]) {
            this.burstAt(px + dx, py - 10, color);
        }
        this.camFx.shake('goal');

        this.floatingText.showBanner(512, 300, `¡Nivel ${this.levelIndex + 1} superado!`, '#00ff88', 32, 1700);
        if (timeBonus > 0) {
            this.floatingText.showBanner(512, 348, Lang.t('timeBonus', { v: timeBonus }), '#66ccff', 22, 1700);
        }
        const rankColor = rank ? `#${RANK_COLORS[rank].toString(16).padStart(6, '0')}` : '#aaaaaa';
        this.floatingText.showBanner(512, 388, `${Lang.t('rankLabel')}: ${Lang.t(`rank_${rank ?? 'none'}`)}`, rankColor, 26, 1700);

        this.time.delayedCall(2200, () => {
            if (this.levelIndex + 1 < LEVELS.length) {
                this.scene.start('Game', {
                    levelIndex: this.levelIndex + 1,
                    completedScore: bankedScore,
                    campaignSeed: this.campaignSeed,
                    campaign: this.campaign
                });
            } else {
                this.scene.start('GameOver', {
                    score: bankedScore,
                    reason: 'victory',
                    levelIndex: this.levelIndex,
                    campaignSeed: this.campaignSeed,
                    campaign: this.campaign,
                    ...this.endingStats()
                });
            }
        });
    }

    onTimeUp ()
    {
        if (this.gameEnded) {
            return;
        }

        // Vida infinita (código secreto): el reloj vuelve a empezar.
        if (this.registry.get('infiniteLife')) {
            this.timer.startTime = this.time.now;
            this.timer.finished = false;
            return;
        }

        this.gameEnded = true;
        Music.die();
        Coach.record('timeout');
        this.metrics.finish(this.time.now, 'tiempo');
        this.scene.start('GameOver', {
            score: this.completedScore,
            lostScore: this.scoreManager.score,
            reason: 'timeout',
            levelIndex: this.levelIndex,
            campaignSeed: this.campaignSeed,
            campaign: this.campaign,
            deaths: this.deaths,
            ...this.endingStats()
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

        if (this.practice && !this.player.hasShield) {
            const spawn = this.level.config.spawn;
            this.player.rect.setPosition(spawn.x, spawn.y);
            this.player.body.reset(spawn.x, spawn.y);
            this.player.invulnerableUntil = this.time.now + 800;
            Audio.play('hit');
            this.floatingText.show(spawn.x, spawn.y - 50, Lang.t('prRetry'), '#ffdd44', 20);
            return;
        }

        // Vida infinita (código secreto): el golpe no mata.
        if (this.registry.get('infiniteLife') && !this.player.hasShield) {
            if (projectileCircle) {
                this.projectileManager.absorbCircle(projectileCircle);
            }
            this.player.invulnerableUntil = this.time.now + 800;
            Audio.play('hit');
            this.camFx.flash(150, 255, 40, 40);
            return;
        }

        if (this.player.hasShield) {
            if (projectileCircle) {
                this.projectileManager.absorbCircle(projectileCircle);
            }

            this.player.absorbHit();
            this.unlockBadge('shield');
            Audio.play('hit');
            this.camFx.shake('shield');
            this.camFx.flash(150, 90, 220, 255);
            this.burstAt(this.player.rect.x, this.player.rect.y, 0x2dd4ff);
            this.floatingText.show(this.player.rect.x, this.player.rect.y - 40, '¡ESCUDO!', '#2dd4ff', 20);
            return;
        }

        this.gameEnded = true;
        Coach.record(projectileCircle ? 'projectile' : 'hazard');
        Music.die();
        this.metrics.finish(this.time.now, projectileCircle ? 'muerte: proyectil' : 'muerte: pincho');
        this.pace.hitstop(FEEL.hitstop.death);
        this.pace.slowmo(FEEL.slowmo.death.ms, FEEL.slowmo.death.factor);
        Audio.play('hit');
        this.player.flinch();
        this.player.rect.setFillStyle(0xff4455);

        this.camFx.shake('death');
        this.camFx.flash(300, 255, 40, 40);

        this.floatingText.show(this.player.rect.x, this.player.rect.y - 40, '¡Impacto!', '#ff4455', 26);

        this.time.delayedCall(600, () => {
            this.scene.start('GameOver', {
                score: this.completedScore,
                lostScore: this.scoreManager.score,
                reason: 'hit',
                levelIndex: this.levelIndex,
                campaignSeed: this.campaignSeed,
                campaign: this.campaign,
                deaths: this.deaths,
                ...this.endingStats()
            });
        });
    }

    // Ráfaga de partículas con emisores en pool (ver systems/Fx.js).
    burstAt(x, y, color) {
        this.fx.burst(x, y, typeof color === 'number' ? color : 0xffdd44);
    }

    applyComboZoom() {
        const target = this.scoreManager.multiplier >= FEEL.zoom.comboMultiplier ? FEEL.zoom.comboHigh : 1;

        if (target === this.zoomLevel) {
            return;
        }

        this.zoomLevel = target;
        this.cameras.main.zoomTo(target, FEEL.zoom.ms, 'Sine.easeInOut');
    }
}