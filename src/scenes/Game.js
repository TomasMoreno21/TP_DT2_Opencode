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
import { AchievementToast } from '../systems/AchievementToast';
import { AchievementStore, AIR_STREAK_TARGET, evaluateLevel, goldInAllLevels } from '../systems/Achievements';
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
import { CollectFx } from '../systems/CollectFx';
import { Backdrop } from '../systems/Backdrop';
import { PlatformGlow } from '../systems/PlatformGlow';
import { themeFor } from '../assets/themes';
import { LevelIntro } from '../systems/LevelIntro';
import { Wipe } from '../systems/Wipe';
import { TensionDirector } from '../systems/TensionDirector';
import { Settings } from '../systems/Settings';
import { LevelSummary } from '../systems/LevelSummary';
import { MODIFIERS, rollModifiers, applyToConfig, bonusOf } from '../systems/Modifiers';

// Profundidad a partir de la cual un objeto fijo a la pantalla cuenta como interfaz (HUD, tutorial, avisos).
const UI_DEPTH = 38;

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

        // Resumen de la campaña en curso (rangos, tiempo y combo) para la pantalla final.
        if (this.levelIndex === 0 && !this.practice) {
            this.registry.set('campaignRun', { ranks: [], seconds: 0, maxCombo: 1 });
        }

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

    // Reemplaza un nivel (por defecto este) por otro mapa, sin asistencia extra.
    // Con otro `levelIndex` (opción de desarrollo del menú de pausa) salta a ese nivel.
    regenerateLevel (levelIndex = this.levelIndex)
    {
        const seed = ((Date.now() * 2654435761) ^ Math.floor(Math.random() * 4294967296)) >>> 0;
        const deaths = levelIndex === this.levelIndex ? this.deaths : 0;

        return CampaignBuilder.buildLevel(seed, levelIndex, { assist: deaths }).then((entry) => {
            const campaign = this.campaign.slice();
            campaign[levelIndex] = entry;
            this.scene.start('Game', {
                levelIndex,
                completedScore: this.completedScore,
                campaignSeed: this.campaignSeed,
                campaign,
                deaths,
                noPractice: levelIndex !== this.levelIndex || this.initData.noPractice
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
        if (!this.practice && !this.initData.noPractice && mech && Tutorial.wantsPractice(mech)) {
            this.scene.start('Game', { ...this.initData, practice: { mech } });
            return;
        }

        this.gameEnded = false;
        this.levelComplete = false;
        this.frozen = false;
        this.lastSecond = null;
        this.warned5s = false;
        this.maxMult = 1;
        this.gemsCollected = 0;
        this.intro = null;
        this.restarting = false;

        if (!this.textures.exists('particle')) {
            this.make.graphics({ x: 0, y: 0, add: false })
                .fillStyle(0xffffff, 1)
                .fillCircle(4, 4, 4)
                .generateTexture('particle', 8, 8);
        }

        this.cameras.main.setBackgroundColor(0x141026);

        // El zoom del combo solo debe afectar al mundo: la interfaz (objetos fijos a la pantalla y por
        // encima de UI_DEPTH) va en una segunda cámara sin zoom, así no se corta en los bordes.
        this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiPending = [];
        const queueUi = (go) => this.uiPending.push(go);

        this.events.on('addedtoscene', queueUi);
        this.events.once('shutdown', () => this.events.off('addedtoscene', queueUi));

        // Fondo en capas con parallax y paleta propia del nivel (sin assets externos).
        this.theme = themeFor(this.levelIndex);
        this.backdrop = new Backdrop(this, this.theme);
        this.parallax = new ParallaxBackground(this, WORLD.width, this.player);

        // Modo modificadores: se sortea en cada create, así que reintentar vuelve a sortear.
        const baseConfig = this.resolveLevelConfig();
        this.modifiers = Settings.modifiers && !this.practice ? rollModifiers(baseConfig) : [];
        const levelConfig = applyToConfig(baseConfig, this.modifiers);

        this.pace = new GamePace(this);
        this.fx = new Fx(this);
        this.camFx = new CameraFx(this);
        this.tension = new TensionDirector(this);
        this.collectFx = new CollectFx(this);
        this.zoomLevel = 1;

        this.level = new Level(this, levelConfig, this.theme);
        this.platformGlow = new PlatformGlow(this, this.level, this.theme);
        this.player = new Player(this, levelConfig.spawn.x, levelConfig.spawn.y);

        if (this.modifiers.includes('slowDash')) {
            this.player.dashCooldownMs *= 2;
        }

        this.physics.add.collider(this.player.rect, this.level.platforms);

        this.cameras.main.setBounds(0, 0, WORLD.width, 768);
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

        if (this.level.fragileList.length) {
            // Solo activa el aterrizaje desde arriba: el wall grab (contacto lateral) y el
            // dash no la rompen.
            this.physics.add.collider(this.player.rect, this.level.fragilePlatforms, (player, rect) => {
                const fragile = this.level.fragileList.find((f) => f.rect === rect);
                const onTop = player.body.blocked.down || player.body.touching.down;

                if (fragile && onTop && !this.player.isDashing) {
                    fragile.trigger(this.time.now);
                }
            });
            this.listen('fragile-shake', (x) => Audio.play('fragileShake', { x }));
            this.listen('fragile-fall', (x) => Audio.play('fragileFall', { x }));
            this.listen('fragile-back', (x) => Audio.play('fragileBack', { x }));
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

        if (this.modifiers.includes('fragileCombo')) {
            this.scoreManager.comboWindowMs = 1800;
        }
        this.timer = new GameTimer(this, () => this.onTimeUp(), levelConfig.durationSeconds);
        this.hud = new Hud(this, this.theme);
        this.floatingText = new FloatingText(this);
        this.achToast = new AchievementToast(this);
        this.metrics = new Metrics(this.levelIndex + 1);

        this.rankThresholds = rankThresholds(this.scoreManager.quota);
        this.hud.setRankThresholds(this.rankThresholds);
        this.hud.setScore(this.scoreManager.score);
        this.hud.setQuota(this.scoreManager.collected, this.scoreManager.quota);
        this.hud.setLevel(this.levelIndex + 1, LEVELS.length);
        this.hud.setModifiers(this.modifiersLabel());
        this.hud.setTimerTotal(levelConfig.durationSeconds);
        this.hud.setTime(this.timer.remainingSeconds);

        if (this.practice) {
            this.setupPractice();
        } else {
            this.floatingText.showBanner((WORLD.width / 2), 240, `Nivel ${this.levelIndex + 1} - ${levelConfig.name}`, '#00d1b2', 34);
        }
        if (this.registry.get('infiniteLife')) {
            this.floatingText.showBanner((WORLD.width / 2), 200, 'VIDA INFINITA', '#ff66aa', 18);
        }
        if (this.deaths > 0) {
            this.floatingText.showBanner((WORLD.width / 2), 286, 'Mapa nuevo: más espacio y más tiempo', '#66ff88', 20);
        }

        const coachHint = this.practice ? null : Coach.take();
        if (coachHint) {
            this.floatingText.showBanner((WORLD.width / 2), 340, Lang.t(coachHint), '#ffdd44', 18, 3500);
        }

        this.muteKey = this.input.keyboard.addKey('M');
        this.muteKey.on('down', () => {
            const isMuted = Audio.toggle();
            this.floatingText.show((WORLD.width / 2), 120, isMuted ? 'MUTE' : 'SONIDO', '#ffffff', 18);
        });

        this.retryKey = this.input.keyboard.addKey('R');
        this.input.keyboard.addKey('ESC').on('down', () => this.openPause());

        this.retryKey.on('down', () => {
            if (!this.gameEnded && !this.paused) {
                this.restartLevel();
            }
        });

        this.listen('player-dash', () => Audio.play('dash'));
        this.listen('player-dash', () => this.camFx.shake('dash'));
        this.listen('player-jump', (kind) => Audio.play('jump', { kind }));
        this.listen('player-jump', (kind) => kind === 'wall' && this.unlockBadge('wallJump'));
        this.listen('player-dash', () => this.unlockBadge('dash'));
        this.listen('player-land', (vy) => vy > FEEL.player.landMinVy && Audio.play('land', { vy }));
        this.listen('player-skid', () => Audio.play('skid'));
        this.listen('player-step', () => Audio.play('step'));
        this.listen('player-wallgrab', () => Audio.play('wallGrab'));
        this.listen('player-dashready', () => Audio.play('dashReady'));
        this.listen('combo-up', (level) => Audio.play('comboUp', { level }));
        this.listen('combo-lost', () => Audio.play('comboLost'));
        // El combo se apaga: chispas grises que se disipan sobre el jugador.
        this.listen('combo-lost', () => this.fx.spark(this.player.rect.x, this.player.rect.y, 0x8888aa, 8));
        this.listen('frenzy-start', () => {
            this.floatingText.showBanner((WORLD.width / 2), 230, Lang.t('streakFrenzy'), '#ff4455', 40, 600);
            this.camFx.punch();
        });
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
        this.pointSpawner = new PointSpawner(this, levelConfig.pointSpots, this.pointsPending, this.modifiers.includes('singlePoint') ? 1 : undefined);
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
            this.applyComboZoom();

            if (this.scoreManager.airStreak >= AIR_STREAK_TARGET) {
                this.unlockAchievement('airborne');
            }

            Audio.play('point', { chain: this.scoreManager.combo, combo: this.scoreManager.multiplier, x: point.circle.x });
            this.burstAt(point.circle.x, point.circle.y, point.color);

            if (airBonus > 0) {
                this.floatingText.show(point.circle.x, point.circle.y - 44, `VOLEANDO +${airBonus}`, '#66ff88', 14);
            }

            point.deactivate();
            const next = this.pointSpawner.activateAnother();

            this.collectFx.point({
                x: point.circle.x, y: point.circle.y, color: point.color, gained,
                multiplier: this.scoreManager.multiplier, chain: this.scoreManager.combo, next
            });

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
                this.gemsCollected++;
                this.timer.addSeconds(gem.bonusSeconds);
                this.hud.setScore(this.scoreManager.score);
                this.hud.setMultiplier(this.scoreManager.multiplier);
                this.hud.setAirStreak(this.scoreManager.airStreak);
                this.player.setMultiplier(this.scoreManager.multiplier);
                this.applyComboZoom();

                if (this.scoreManager.airStreak >= AIR_STREAK_TARGET) {
                    this.unlockAchievement('airborne');
                }

                Audio.play('gem', { x: gem.x });
                this.unlockBadge('gem');
                this.burstAt(gem.x, gem.y, gem.color);
                this.collectFx.gem({ x: gem.x, y: gem.y, color: gem.color, gained });

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

        // Si venimos de un wipe (nivel nuevo o reinicio con R), se destapa la pantalla.
        const wipeColor = this.registry.get('wipeIn');

        if (wipeColor !== undefined) {
            this.registry.remove('wipeIn');
            Wipe.reveal(this, wipeColor, 360);
        }

        // Intro del nivel: tarjeta y cuenta 3-2-1 (solo "¡YA!" al reintentar el mismo nivel).
        // El juego queda congelado y el reloj sin correr hasta el "¡YA!".
        if (!this.practice) {
            const short = this.registry.get('lastIntro') === this.levelIndex;

            this.registry.set('lastIntro', this.levelIndex);
            this.physics.world.pause();
            // Los niveles 3 a 5 presentan su mecánica nueva en la tarjeta (ya no hay prácticas previas).
            const tip = { 2: 'introTipFragile', 3: 'introTipHazard', 4: 'introTipPortal' }[this.levelIndex];
            this.intro = new LevelIntro(this, { name: LEVELS[this.levelIndex]?.name, theme: this.theme, short, tip: tip ? Lang.t(tip) : null, mods: this.modifiersLabel() || null });
            this.intro.start(() => this.physics.world.resume());
        }
    }

    // "Reloj corto +15% · Ráfaga +20%" (vacío fuera del modo modificadores).
    modifiersLabel ()
    {
        return this.modifiers.map((id) => `${Lang.t(`mod_${id}`)} +${Math.round(MODIFIERS[id].bonus * 100)}%`).join(' · ');
    }

    // Reinicia el nivel con un wipe corto (R). La pantalla se destapa en la escena nueva.
    restartLevel ()
    {
        if (this.restarting) {
            return;
        }

        this.restarting = true;
        this.registry.set('wipeIn', this.theme.bgBottom);
        Wipe.cover(this, this.theme.bgBottom, 200, () => {
            this.scene.restart({
                levelIndex: this.levelIndex,
                completedScore: this.completedScore,
                campaignSeed: this.campaignSeed,
                campaign: this.campaign,
                deaths: this.deaths
            });
        });
    }

    // Registra un listener de eventos de la escena y lo quita al apagarse. Sin esto,
    // cada reinicio de nivel sumaba otra copia (el dash sonaba y sacudía N veces).
    listen (event, handler)
    {
        this.events.on(event, handler);
        this.events.once('shutdown', () => this.events.off(event, handler));
    }

    // Cada frame: ruta luminosa, aviso de combo por vencer y urgencia de los puntos.
    updateCollect ()
    {
        const sm = this.scoreManager;
        const remaining = sm.comboRemaining(this.time.now);

        this.collectFx.update(remaining, sm.multiplier);

        const urgent = remaining > 0 && remaining < 0.35;

        for (const point of this.pointSpawner.points) {
            point.setUrgent(urgent && point.circle.active);
        }
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
            this.floatingText.showBanner((WORLD.width / 2), 118, '★ ' + Lang.t('badgeNew', { n: Lang.t('badge_' + id) }), '#ffdd44', 20, 1200);
        }
    }

    // Logro de desempeño: no se otorga en vida infinita ni en práctica.
    unlockAchievement (id)
    {
        if (this.registry.get('infiniteLife') || this.practice) {
            return;
        }

        if (AchievementStore.unlock(id)) {
            this.showAchievement(id);
        }
    }

    // Tarjeta del logro (arriba a la izquierda); los que salen juntos se encolan.
    showAchievement (id)
    {
        this.achToast.show(id);

        const p = this.player.rect;
        this.burstAt(p.x, p.y - 10, 0xffdd44);
    }

    // Práctica: sin timer ni proyectiles; los golpes reaparecen en vez de terminar.
    setupPractice ()
    {
        const mech = this.practice.mech;
        const name = Lang.t('pr' + mech[0].toUpperCase() + mech.slice(1));
        this.hud.levelText.setText(Lang.t('prTitle', { m: name }));
        this.add.text((WORLD.width / 2), 150, Lang.t('prTitle', { m: name }), {
            fontFamily: 'Arial Black', fontSize: '26px', color: '#00d1b2', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
        this.add.text((WORLD.width / 2), 186, Lang.t('prHint' + mech[0].toUpperCase() + mech.slice(1)), {
            fontFamily: 'Arial', fontSize: '16px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
        this.add.text((WORLD.width / 2), 210, Lang.t('prSkip'), { fontFamily: 'Arial', fontSize: '13px', color: '#9aa4c7' })
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
        // Fondo con parallax, plataformas que laten con el beat en frenesí y vórtice de la salida.
        const pulse = Music.pulse;

        this.backdrop.update(time, this.player.rect.x, pulse);
        this.platformGlow.update(this.seenMult === 5 ? pulse : 0);
        this.level.goal.update(time);

        this.routeUi();

        // Con la salida cruzada el nivel entero queda congelado hasta el resumen.
        if (this.frozen) {
            return;
        }

        if (this.intro?.active) {
            return;
        }

        this.metrics.sample(this.game.loop.actualFps, time);
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
        this.updateFragilePlatforms();
        this.updateHazards();

        const seconds = this.timer.remainingSeconds;
        if (seconds !== this.lastSecond) {
            this.lastSecond = seconds;
            this.hud.setTime(seconds);
            this.events.emit('time-tick', seconds);

            if (seconds === 5 && !this.warned5s && !this.gameEnded) {
                this.warned5s = true;
                this.floatingText.showBanner((WORLD.width / 2), 200, '¡Últimos 5s!', '#ff4455', 30);
            }
        }

        this.hud.setShield(this.player.shieldUntil - this.time.now, this.shieldTotalMs);
        this.hud.setDashCooldown(this.player.dashRemaining, this.player.dashCooldownMs);
        this.hud.setComboTimer(this.scoreManager.comboRemaining(this.time.now));
        this.trackCombo();
        this.tension.update(delta);
        this.updateCollect();
        this.parallax.update();

        if (!this.gameEnded && this.scoreManager.multiplier > this.maxMult) {
            this.maxMult = this.scoreManager.multiplier;
        }

        this.updateAirStreak();
        this.updatePortals();
    }

    // Detiene todo el nivel (física, proyectiles, pinchos, plataformas y reloj) al cruzar la salida.
    freezeLevel ()
    {
        this.frozen = true;
        this.timer.paused = true;
        this.pace.restore();
        this.physics.world.pause();
    }

    // Reparte los objetos nuevos entre las dos cámaras: la interfaz solo en la de la interfaz y el
    // resto solo en la principal (la que hace zoom). Los hijos de un contenedor siguen a su raíz.
    routeUi ()
    {
        const main = this.cameras.main;
        const route = (go, ui) => {
            (ui ? main : this.uiCam).ignore(go);
            go.list?.forEach((child) => route(child, ui));
        };

        for (const go of this.uiPending.splice(0)) {
            if (!go.scene) continue;

            let root = go;
            while (root.parentContainer) root = root.parentContainer;

            route(go, root.scrollFactorX === 0 && root.depth >= UI_DEPTH);
        }
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

    // Ciclo de las plataformas frágiles: temblor, caída, reaparición.
    updateFragilePlatforms() {
        for (const fragile of this.level.fragileList) {
            fragile.update(this.time.now, this.player.rect);
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
            survived: Math.max(Math.floor((this.time.now - this.timer.startTime) / 1000), 0),
            quota: this.scoreManager.quota,
            collected: this.scoreManager.collected
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

        this.floatingText.showBanner((WORLD.width / 2), 300, '¡META CUMPLIDA!', '#00ff88', 32);
        this.floatingText.showBanner((WORLD.width / 2), 348, 'Llegá a la salida', '#ffffff', 22, 700);
        // Chispas sobre la salida para guiar al jugador.
        this.burstAt(this.level.goal.x, this.level.goal.y, 0x00ff88);
        this.burstAt(this.level.goal.x, this.level.goal.y, 0xffffff);

        this.routeUi();
    }

    onGoalReached ()
    {
        if (this.gameEnded || this.levelComplete) {
            return;
        }

        if (this.practice) {
            Audio.play('goalReached');
            this.floatingText.showBanner((WORLD.width / 2), 300, Lang.t('prDone'), '#00ff88', 32);
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
        // El puntaje final se calcula ya; en pantalla la cuenta sube de a un segundo.
        const seconds = this.timer.remainingSeconds;
        const timeBonus = seconds * TIME_BONUS_PER_SECOND;
        const baseScore = this.scoreManager.score;

        this.scoreManager.addBonus(timeBonus);
        const rank = rankFor(this.scoreManager.score, this.rankThresholds);
        // El bonus de modificadores va después del rango: no infla la medalla.
        const modBonus = Math.round(this.scoreManager.score * bonusOf(this.modifiers));

        this.scoreManager.addBonus(modBonus);
        RankStore.update(this.levelIndex + 1, rank);

        const run = this.registry.get('campaignRun');

        if (run) {
            run.ranks[this.levelIndex] = rank;
            run.seconds += this.endingStats().survived;
            run.maxCombo = Math.max(run.maxCombo, this.maxMult);
        }

        // Logros de fin de nivel. Los puntos del nivel (sin bono de tiempo) alimentan
        // el acumulado de "collector"; un nivel perdido nunca llega acá.
        const remainingRatio = Math.min(seconds / (this.timer.durationMs / 1000), 1);

        for (const id of evaluateLevel({ deaths: this.deaths, maxMult: this.maxMult, rank, remainingRatio })) {
            this.unlockAchievement(id);
        }

        if (goldInAllLevels(RankStore.all(), LEVELS.length)) {
            this.unlockAchievement('goldAll');
        }

        if (this.levelIndex + 1 >= LEVELS.length) {
            this.unlockAchievement('champion');
        }

        if (!this.registry.get('infiniteLife') && AchievementStore.addPoints(baseScore)) {
            this.showAchievement('collector');
        }

        const bankedScore = this.totalScore;

        // Un instante de cámara lenta y punch al pisar la salida; confeti sobre el jugador.
        this.freezeLevel();
        this.camFx.punch();
        const px = this.player.rect.x, py = this.player.rect.y;
        for (const [dx, color] of [[-30, 0x00ff88], [30, 0xffdd44], [0, 0x2dd4ff], [-15, 0xff66aa], [15, 0xffffff]]) {
            this.burstAt(px + dx, py - 10, color);
        }
        this.camFx.shake('goal');

        this.floatingText.showBanner((WORLD.width / 2), 300, `¡Nivel ${this.levelIndex + 1} superado!`, '#00ff88', 32, 1500);

        // Cuenta en vivo: un tic ascendente por cada segundo que sobraba.
        const tallyStart = 280;
        const tallyMs = Math.min(seconds * 90, 1300);

        for (let k = 1; k <= seconds; k++) {
            this.time.delayedCall(tallyStart + (k * tallyMs) / seconds, () => {
                this.hud.setScore(baseScore + k * TIME_BONUS_PER_SECOND);
                Audio.play('tally', { k, n: seconds });
            });
        }

        const doneAt = tallyStart + tallyMs;

        // Resumen del nivel: una fila por dato y la medalla del rango al final.
        const rankColor = rank ? `#${RANK_COLORS[rank].toString(16).padStart(6, '0')}` : '#aaaaaa';
        const rows = [
            { label: Lang.t('sumScore'), value: baseScore },
            { label: Lang.t('sumTime'), value: `+${timeBonus}`, color: '#66ccff' },
            ...(modBonus > 0 ? [{ label: Lang.t('sumMods'), value: `+${modBonus}`, color: '#ffdd44' }] : []),
            { label: Lang.t('sumCombo'), value: `x${this.maxMult}` },
            { label: Lang.t('sumGems'), value: this.gemsCollected },
            { label: Lang.t('sumDeaths'), value: this.deaths }
        ];

        this.time.delayedCall(doneAt, () => {
            this.hud.setScore(this.scoreManager.score);
            new LevelSummary(this).show(`¡Nivel ${this.levelIndex + 1} superado!`, rows, { label: Lang.t('rankLabel'), text: Lang.t(`rank_${rank ?? 'none'}`), color: rankColor });
            this.camFx.punch();
        });

        // Cortina diagonal hacia el nivel siguiente (o hacia la pantalla final), con tiempo para leer el panel.
        this.time.delayedCall(doneAt + 300 + rows.length * 90 + 480 + 1100, () => {
            this.registry.set('wipeIn', this.theme.bgBottom);
            Wipe.cover(this, this.theme.bgBottom, 360, () => {
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
        this.player.fx.shatter();
        this.camFx.desaturate(600);

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