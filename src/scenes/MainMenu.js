import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';
import { RANK_COLORS, RankStore } from '../systems/Rank';
import { Audio } from '../systems/Audio';
import { Lang } from '../systems/Texts';
import { LEVELS } from '../assets/levels';
import { CampaignBuilder } from '../systems/CampaignBuilder';
import { Tutorial } from '../systems/TutorialManager';
import { Badges, BADGES } from '../systems/Badges';
import { ACHIEVEMENTS, AchievementStore } from '../systems/Achievements';
import { MenuButton } from '../systems/MenuButton';
import { Music } from '../systems/Music';
import { Settings } from '../systems/Settings';
import { MenuBackground } from '../systems/MenuBackground';
import { Wipe } from '../systems/Wipe';

const COLORS = {
    bgTop: 0x232045,
    bgBottom: 0x141026,
    floor: 0x0f0d1e,
    panel: 0x1b1836,
    panelBorder: 0x2a2a5a,
    teal: '#00d1b2',
    gold: '#ffdd44',
    white: '#ffffff',
    grey: '#cccccc',
    text: '#dddddd'
};

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    init (data)
    {
        // Playtest: ?seed=N repite una campaña concreta y ?level=N arranca en ese nivel.
        const params = new URLSearchParams(window.location.search);
        const urlSeed = params.get('seed');
        this.campaignSeed = data.campaignSeed ?? (data.seed ?? (urlSeed !== null ? Number(urlSeed) : null));
        this.startLevel = Math.max(0, Math.min(LEVELS.length - 1, Number(params.get('level') ?? 1) - 1));
    }

    create ()
    {
        Lang.init();
        // La campaña se genera acá, en el menú, antes de que el jugador apriete
        // JUGAR: así la pausa de generación (~1 s) queda fuera de la partida.
        this.generateCampaign();
        this.cameras.main.setBackgroundColor(0x16132a);
        Music.play('menu');
        this.drawBackground();

        const glow = this.add.ellipse(512, 135, 520, 130, 0x00d1b2, 0.1).setAlpha(0);
        this.tweens.add({ targets: glow, alpha: 1, duration: 600 });
        if (!Settings.reduceMotion) {
            this.tweens.add({ targets: glow, scaleX: 1.15, scaleY: 1.3, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        const title = this.add.text(512, 135, 'FAST MOVE', {
            fontFamily: 'Arial Black', fontSize: 84, color: COLORS.teal,
            stroke: '#000000', strokeThickness: 12,
            shadow: { offsetX: 0, offsetY: 6, color: '#004f42', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5).setAlpha(0).setScale(0.8);

        // Entrada escalonada: título primero, el resto por delay.
        this.tweens.add({ targets: title, alpha: 1, scale: 1, duration: 520, ease: 'Back.easeOut' });
        this.tweens.add({ targets: title, y: 128, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 520 });

        const subtitle = this.add.text(512, 205, Lang.t('subtitle', { n: LEVELS.length }), {
            fontFamily: 'Arial', fontSize: 19, color: COLORS.grey
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: subtitle, alpha: 1, duration: 350, delay: 160 });

        this.drawControlsPanel();
        this.createBestScorePanel();
        this.createRankMedals();
        this.createButtons();
        this.buildLangPopup();
        this.buildTutorialPopup();
        this.buildAchievementsPopup();
        this.buildOptionsPopup();
        this.createSeedInfo();
        this.createKeyboardNav();

        this.input.keyboard.on('keydown-ESC', () => this.closeModals());

        // Código secreto: tipear "pene" abre el selector de nivel con vida infinita.
        this.typed = '';
        this.input.keyboard.on('keydown', (event) => {
            this.typed = (this.typed + event.key.toLowerCase()).slice(-4);
            if (this.typed === 'pene') this.openCheatMenu();
        });
    }

    // Parallax: el fondo sigue suavemente al mouse.
    update ()
    {
        this.background.follow(this.input.activePointer);
    }

    // Opción de texto de un popup: resalta con brillo y escala al pasar el mouse.
    makeHoverable (text)
    {
        text.on('pointerover', () => {
            text.setShadow(0, 0, '#00d1b2', 10, true, true);
            this.tweens.add({ targets: text, scale: 1.08, duration: 110, ease: 'Back.easeOut' });
            Audio.play('hover');
        });
        text.on('pointerout', () => {
            text.setShadow(0, 0, '#000000', 0, false, false);
            this.tweens.add({ targets: text, scale: 1, duration: 110 });
        });
        return text;
    }

    // Entrada de popup: aparece subiendo desde unos píxeles más abajo.
    showPopup (popup)
    {
        popup.setAlpha(0).setY(Settings.reduceMotion ? 0 : 16);
        this.tweens.add({ targets: popup, alpha: 1, y: 0, duration: 180, ease: 'Cubic.easeOut' });
    }

    isModalOpen ()
    {
        return Boolean(this.controlsPopup.visible || this.langPopup.visible
            || this.tutorialPopup.visible || this.achievementsPopup.visible || this.optionsPopup.visible || this.cheatPopup?.visible);
    }

    closeModals ()
    {
        this.toggleControls(false);
        this.toggleLang(false);
        this.toggleTutorial(false);
        this.toggleAchievements(false);
        this.toggleOptions(false);

        if (this.cheatPopup?.visible) {
            this.cheatPopup.setVisible(false);
            this.controlsDim.setVisible(false);
        }
    }

    // Botones del menú. Comparten el foco entre mouse y teclado: el último en
    // recibir hover o flecha queda activo, y Enter/Espacio lo acciona.
    createButtons ()
    {
        this.playButton = new MenuButton(this, {
            x: 512, y: 450, w: 340, h: 88, label: Lang.t('play'), style: 'primary', delay: 420,
            onClick: () => this.time.delayedCall(120, () => this.startGame(this.playButton)),
            onHover: () => this.focusButton(0)
        });

        const secondary = [
            [Lang.t('achievementsBtn'), () => this.toggleAchievements()],
            [Lang.t('rankingBtn'), () => this.scene.start('Ranking', { campaignSeed: this.campaignSeed })],
            [Lang.t('optionsBtn'), () => this.toggleOptions()]
        ];
        const spacing = 220;
        const startX = 512 - ((secondary.length - 1) * spacing) / 2;

        this.buttons = [this.playButton];
        secondary.forEach(([label, onClick], i) => {
            const index = this.buttons.length;
            this.buttons.push(new MenuButton(this, {
                x: startX + i * spacing, y: 570, w: 200, h: 56, label, delay: 520 + i * 70,
                onClick, onHover: () => this.focusButton(index)
            }));
        });

        this.focusIndex = -1;
        this.focusButton(0);
    }

    focusButton (index)
    {
        if (this.focusIndex === index) {
            return;
        }

        this.focusIndex = index;
        this.buttons.forEach((button, i) => button.setActive(i === index));
    }

    createKeyboardNav ()
    {
        const move = (step) => {
            if (this.isModalOpen() || this.starting) return;
            this.focusButton((this.focusIndex + step + this.buttons.length) % this.buttons.length);
            Audio.play('ui');
        };
        const activate = () => {
            if (this.isModalOpen() || this.starting) return;
            const button = this.buttons[this.focusIndex];
            button.press();
            this.time.delayedCall(90, () => {
                button.release();
                button.fire();
            });
        };

        this.input.keyboard.on('keydown-UP', () => move(-1));
        this.input.keyboard.on('keydown-LEFT', () => move(-1));
        this.input.keyboard.on('keydown-DOWN', () => move(1));
        this.input.keyboard.on('keydown-RIGHT', () => move(1));
        this.input.keyboard.on('keydown-ENTER', activate);
        this.input.keyboard.on('keydown-SPACE', activate);
    }

    // Mejor puntaje y medallas de rango en una sola línea bajo el subtítulo.
    createBestScorePanel ()
    {
        const text = this.add.text(500, 270, Lang.t('best', { v: HighScore.get() }), {
            fontFamily: 'Arial Black', fontSize: 20, color: COLORS.gold
        }).setOrigin(1, 0.5).setAlpha(0);
        this.tweens.add({ targets: text, alpha: 1, duration: 350, delay: 300 });
    }

    // Selector de nivel del código secreto: activa la vida infinita (dura hasta
    // recargar la página) y arranca en el nivel elegido.
    openCheatMenu () {
        this.registry.set('infiniteLife', true);
        this.toggleControls(false);
        this.toggleLang(false);
        this.toggleTutorial(false);
        this.toggleAchievements(false);

        if (!this.cheatPopup) {
            const height = 110 + LEVELS.length * 56;
            const top = 384 - height / 2;
            const panel = this.add.graphics();
            panel.fillStyle(COLORS.panel, 1).fillRoundedRect(332, top, 360, height, 18);
            panel.lineStyle(2, COLORS.panelBorder, 1).strokeRoundedRect(332, top, 360, height, 18);

            const title = this.add.text(512, top + 26, 'ELEGIR NIVEL', {
                fontFamily: 'Arial Black', fontSize: 22, color: COLORS.gold, stroke: '#000000', strokeThickness: 5
            }).setOrigin(0.5);
            const note = this.add.text(512, top + 56, 'Vida infinita activada', {
                fontFamily: 'Arial', fontSize: 16, color: COLORS.teal
            }).setOrigin(0.5);

            const options = LEVELS.map((level, i) => {
                const opt = this.add.text(512, top + 100 + i * 56, `Nivel ${i + 1} - ${level.name}`, {
                    fontFamily: 'Arial Black', fontSize: 20, color: COLORS.text
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                this.makeHoverable(opt);
                opt.on('pointerdown', () => {
                    Audio.play('ui');
                    this.startLevel = i;
                    this.startGame(opt);
                });
                return opt;
            });

            this.cheatPopup = this.add.container(0, 0, [panel, title, note, ...options]).setDepth(10);
        }

        this.cheatPopup.setVisible(true);
        this.showPopup(this.cheatPopup);
        this.controlsDim.setVisible(true);
        Audio.play('ui');
    }

    // La semilla actual queda visible (abajo a la izquierda) para repetir o
    // reportar una campaña concreta.
    createSeedInfo () {
        this.add.text(24, 738, Lang.t('seed', { n: this.campaignSeed }), {
            fontFamily: 'Arial', fontSize: 14, color: '#8888aa'
        }).setOrigin(0, 0.5);
    }

    // Pide la campaña en segundo plano (Web Worker) apenas se abre el menú: la
    // validación de los mapas tarda unos segundos y no debe congelar la pantalla.
    // Se conserva para toda la partida (sin re-roll por nivel); la semilla queda
    // en consola dev.
    generateCampaign ()
    {
        const seed = (this.campaignSeed === null || this.campaignSeed === undefined)
            ? (Date.now() * 2654435761 >>> 0)
            : (this.campaignSeed >>> 0);

        this.campaignSeed = seed;
        this.campaign = null;
        this.pendingStart = null;
        this.starting = false;

        CampaignBuilder.build(seed).then((campaign) => {
            this.campaign = campaign;

            console.log(`[FastMove] campaña generada (semilla ${seed}):`,
                campaign.map((e) => `N${e.config.id}=${e.config.durationSeconds}s${e.ok ? (e.mutated ? '' : '(base)') : '(inválido)'}`).join(' '));

            const failed = campaign.filter((e) => !e.ok);
            if (failed.length) {
                console.warn('[FastMove] niveles sin candidato válido:', failed.map((e) => e.config.id).join(','));
            }

            // Si el jugador ya apretó JUGAR, arranca ahora.
            if (this.pendingStart && this.scene.isActive()) {
                this.pendingStart();
            }
        });
    }

    // Arranca la partida con la campaña lista; si todavía se está generando,
    // espera mostrando un aviso en el botón.
    startGame (label)
    {
        if (this.starting) {
            return;
        }

        this.starting = true;
        // Partida nueva: el ranking vuelve a pedir iniciales (ver GameOver.maybeEnterRanking).
        this.registry.remove('runEntry');
        this.registry.remove('lastIntro');
        const launch = () => Wipe.cover(this, 0x16132a, 380, () => this.scene.start('Game', {
            levelIndex: this.startLevel,
            completedScore: 0,
            campaignSeed: this.campaignSeed,
            campaign: this.campaign
        }));

        if (this.campaign) {
            launch();
            return;
        }

        label.setLabel(Lang.t('generating'), 26);
        this.pendingStart = launch;
    }

    drawBackground () {
        this.background = new MenuBackground(this);
    }

    drawControlsPanel () {
        // Fondo oscuro que cierra el popup al clickear afuera.
        this.controlsDim = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.6)
            .setInteractive().setVisible(false).setDepth(9);
        this.controlsDim.on('pointerdown', () => this.closeModals());

        const popup = this.add.container(0, 0).setVisible(false).setDepth(10);

        const panel = this.add.graphics();
        panel.fillStyle(COLORS.panel, 1);
        panel.fillRoundedRect(232, 252, 560, 264, 18);
        panel.lineStyle(2, COLORS.panelBorder, 1);
        panel.strokeRoundedRect(232, 252, 560, 264, 18);

        const title = this.add.text(512, 276, Lang.t('controlsTitle'), {
            fontFamily: 'Arial Black', fontSize: 26, color: COLORS.gold,
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        panel.lineStyle(2, COLORS.panelBorder, 1);
        panel.lineBetween(272, 300, 752, 300);

        const rows = [
            [Lang.t('rowMove'), Lang.t('rowMoveC')],
            [Lang.t('rowJump'), Lang.t('rowJumpC')],
            [Lang.t('rowGrab'), Lang.t('rowGrabC')],
            [Lang.t('rowWallJump'), Lang.t('rowWallJumpC')],
            [Lang.t('rowDash'), Lang.t('rowDashC')],
            [Lang.t('rowMisc'), Lang.t('rowMiscC')]
        ];

        const rowTexts = [];

        rows.forEach(([action, controls], i) => {
            const y = 328 + i * 28;

            rowTexts.push(this.add.text(430, y, action, {
                fontFamily: 'Arial', fontSize: 17, color: COLORS.teal, fontStyle: 'bold'
            }).setOrigin(1, 0.5));

            rowTexts.push(this.add.text(444, y, controls, {
                fontFamily: 'Arial', fontSize: 15, color: COLORS.text,
                wordWrap: { width: 300, useAdvancedWrap: true }, align: 'left'
            }).setOrigin(0, 0.5));
        });

        const hint = this.add.text(512, 498, Lang.t('popupHint'), {
            fontFamily: 'Arial', fontSize: 13, color: COLORS.grey
        }).setOrigin(0.5);

        popup.add([panel, title, ...rowTexts, hint]);
        this.controlsPopup = popup;
    }

    toggleControls (show = null) {
        const visible = show ?? !this.controlsPopup.visible;

        if (this.controlsPopup.visible === visible) {
            return;
        }

        this.toggleLang(false);
        this.toggleTutorial(false);
        this.toggleAchievements(false);
        this.toggleOptions(false);
        this.controlsPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.showPopup(this.controlsPopup);
        }
    }

    // Una medalla por nivel con su mejor rango: color de bronce/plata/oro, o una
    // ranura apagada si todavia no hay rango. Las de oro brillan.
    createRankMedals () {
        LEVELS.forEach((_, i) => {
            const medal = this.drawMedal(548 + i * 50, 270, i + 1, RankStore.get(i + 1));
            medal.setScale(0);
            this.tweens.add({ targets: medal, scale: 1.1, duration: 380, delay: 380 + i * 90, ease: 'Back.easeOut' });
        });
    }

    drawMedal (x, y, levelNumber, rank) {
        const earned = Boolean(rank);
        const g = this.add.graphics();
        // Cintas detras del disco.
        g.fillStyle(earned ? 0xcc3344 : 0x2a2a4a, 1);
        g.fillTriangle(-11, 8, -1, 12, -8, 26);
        g.fillTriangle(11, 8, 1, 12, 8, 26);
        // Disco con borde y aro interior.
        g.fillStyle(earned ? RANK_COLORS[rank] : 0x24213f, 1).fillCircle(0, 0, 16);
        g.lineStyle(3, earned ? 0x000000 : 0x4a4a7a, earned ? 0.35 : 1).strokeCircle(0, 0, 16);
        g.lineStyle(2, 0xffffff, earned ? 0.4 : 0.12).strokeCircle(0, 0, 11);

        const number = this.add.text(0, 0, String(levelNumber), {
            fontFamily: 'Arial Black', fontSize: 16, color: earned ? '#2a1a00' : '#5a5a8a'
        }).setOrigin(0.5);
        const items = [g, number];

        if (rank === 'gold') {
            const shine = this.add.ellipse(-6, -7, 7, 4, 0xffffff, 0.8).setAngle(-35);
            this.tweens.add({ targets: shine, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            items.push(shine);
        }

        return this.add.container(x, y, items);
    }

    buildLangPopup () {
        const popup = this.add.container(0, 0).setVisible(false).setDepth(10);

        const panel = this.add.graphics();
        panel.fillStyle(COLORS.panel, 1);
        panel.fillRoundedRect(332, 282, 360, 204, 18);
        panel.lineStyle(2, COLORS.panelBorder, 1);
        panel.strokeRoundedRect(332, 282, 360, 204, 18);

        const title = this.add.text(512, 306, Lang.t('langTitle'), {
            fontFamily: 'Arial Black', fontSize: 22, color: COLORS.gold,
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);

        const options = [];

        for (const [i, lang] of ['es', 'en'].entries()) {
            const y = 352 + i * 56;
            const current = Lang.current === lang;
            const opt = this.add.text(512, y, `${current ? '● ' : '○ '}${Lang.t(lang === 'es' ? 'langEs' : 'langEn')}`, {
                fontFamily: 'Arial Black', fontSize: 20, color: current ? COLORS.teal : COLORS.text
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            this.makeHoverable(opt);
            opt.on('pointerdown', () => {
                Lang.set(lang);
                this.scene.restart({ campaignSeed: this.campaignSeed });
            });
            options.push(opt);
        }

        popup.add([panel, title, ...options]);
        this.langPopup = popup;
    }

    // Opciones de accesibilidad: reducir destellos y reducir movimiento (ver systems/Settings.js).
    buildOptionsPopup () {
        const popup = this.add.container(0, 0).setVisible(false).setDepth(10);

        const panel = this.add.graphics();
        panel.fillStyle(COLORS.panel, 1).fillRoundedRect(282, 214, 460, 346, 18);
        panel.lineStyle(2, COLORS.panelBorder, 1).strokeRoundedRect(282, 214, 460, 346, 18);
        panel.lineStyle(1, 0x3a3a5c, 1).lineBetween(312, 392, 712, 392);

        const title = this.add.text(512, 246, Lang.t('optionsTitle'), {
            fontFamily: 'Arial Black', fontSize: 24, color: COLORS.gold, stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);

        const rows = [['reduceFlash', 'optReduceFlash'], ['reduceMotion', 'optReduceMotion']].map(([name, key], i) => {
            const label = this.add.text(512, 302 + i * 50, '', {
                fontFamily: 'Arial Black', fontSize: 20
            }).setOrigin(0.5).setPadding(20, 8).setInteractive({ useHandCursor: true });

            const paint = () => {
                const on = Settings[name];

                label.setText(`${on ? '● ' : '○ '}${Lang.t(key)}`).setColor(on ? COLORS.teal : COLORS.text);
            };

            this.makeHoverable(label);
            label.on('pointerdown', () => {
                Settings.set(name, !Settings[name]);
                paint();
                Audio.play('ui');
            });
            paint();

            return label;
        });

        // Accesos que ya no ocupan el menú principal.
        const links = [
            [Lang.t('controls'), () => this.toggleControls()],
            [Lang.t('tutorialBtn'), () => this.toggleTutorial()],
            [Lang.t('lang'), () => this.toggleLang()],
            [Lang.t('newLevels'), () => {
                const seed = ((Date.now() * 2654435761) ^ Math.floor(Math.random() * 4294967296)) >>> 0;
                this.scene.restart({ campaignSeed: seed });
            }]
        ].flatMap(([text, onClick], i) => {
            const x = 402 + (i % 2) * 220;
            const y = 436 + Math.floor(i / 2) * 54;
            const bg = this.add.graphics();
            bg.fillStyle(0x1b1b33, 1).fillRoundedRect(x - 100, y - 20, 200, 40, 10);
            bg.lineStyle(2, 0x3a3a5c, 1).strokeRoundedRect(x - 100, y - 20, 200, 40, 10);
            const label = this.add.text(x, y, text, {
                fontFamily: 'Arial Black', fontSize: 16, color: COLORS.text
            }).setOrigin(0.5).setPadding(30, 10).setInteractive({ useHandCursor: true });
            label.on('pointerover', () => label.setColor(COLORS.teal));
            label.on('pointerout', () => label.setColor(COLORS.text));
            label.on('pointerdown', () => { Audio.play('ui'); onClick(); });
            return [bg, label];
        });

        const hint = this.add.text(512, 536, Lang.t('optHint'), {
            fontFamily: 'Arial', fontSize: 14, color: COLORS.grey
        }).setOrigin(0.5);

        popup.add([panel, title, ...rows, ...links, hint]);
        this.optionsPopup = popup;
    }

    toggleOptions (show = null) {
        if (!this.optionsPopup) {
            return;
        }

        const visible = show ?? !this.optionsPopup.visible;

        if (this.optionsPopup.visible === visible) {
            return;
        }

        if (visible) {
            this.toggleControls(false);
            this.toggleLang(false);
            this.toggleTutorial(false);
            this.toggleAchievements(false);
        }

        this.optionsPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.showPopup(this.optionsPopup);
        }
    }

    toggleLang (show = null) {
        const visible = show ?? !this.langPopup.visible;

        if (this.langPopup.visible === visible) {
            return;
        }

        this.toggleControls(false);
        this.toggleTutorial(false);
        this.toggleAchievements(false);
        this.toggleOptions(false);
        this.langPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.showPopup(this.langPopup);
        }
    }

    // Popup de tutorial: interruptor, reinicio de hints/prácticas y lista de insignias.
    buildTutorialPopup () {
        const popup = this.add.container(0, 0).setVisible(false).setDepth(10);

        const panel = this.add.graphics();
        panel.fillStyle(COLORS.panel, 1).fillRoundedRect(262, 232, 500, 300, 18);
        panel.lineStyle(2, COLORS.panelBorder, 1).strokeRoundedRect(262, 232, 500, 300, 18);

        const title = this.add.text(512, 258, Lang.t('tutorialTitle'), {
            fontFamily: 'Arial Black', fontSize: 24, color: COLORS.gold, stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);

        // Dos botones iguales (interruptor y reinicio) y debajo la colección de insignias.
        const on = !Tutorial.isOff();
        const parts = [panel, title];
        const button = (x, label, active, onClick) => {
            const bg = this.add.graphics();
            bg.fillStyle(active ? 0x0c4a45 : 0x1b1b33, 1).fillRoundedRect(x - 105, 290, 210, 40, 10);
            bg.lineStyle(2, active ? 0x00d1b2 : 0x3a3a5c, 1).strokeRoundedRect(x - 105, 290, 210, 40, 10);
            const text = this.add.text(x, 310, label, {
                fontFamily: 'Arial Black', fontSize: 16, color: active ? COLORS.teal : COLORS.text
            }).setOrigin(0.5).setPadding(24, 12).setInteractive({ useHandCursor: true });
            this.makeHoverable(text);
            text.on('pointerdown', () => {
                onClick();
                Audio.play('ui');
                this.scene.restart({ campaignSeed: this.campaignSeed });
            });
            parts.push(bg, text);
        };
        button(397, `${on ? '● ' : '○ '}${Lang.t(on ? 'tutorialOn' : 'tutorialOff')}`, on, () => Tutorial.setOff(on));
        button(627, Lang.t('tutorialReset'), false, () => Tutorial.reset());

        const owned = BADGES.filter((id) => Badges.has(id)).length;
        const divider = this.add.graphics();
        divider.lineStyle(1, 0x3a3a5c, 1).lineBetween(292, 352, 732, 352);
        const badgesTitle = this.add.text(512, 374, `${Lang.t('badgesTitle')}  ${owned}/${BADGES.length}`, {
            fontFamily: 'Arial Black', fontSize: 18, color: COLORS.teal
        }).setOrigin(0.5);
        parts.push(divider, badgesTitle);

        // Fichas en filas de 3, la última fila centrada.
        BADGES.forEach((id, i) => {
            const has = Badges.has(id);
            const inRow = Math.min(3, BADGES.length - Math.floor(i / 3) * 3);
            const x = 512 + ((i % 3) - (inRow - 1) / 2) * 152;
            const y = 420 + Math.floor(i / 3) * 46;
            const chip = this.add.graphics();
            chip.fillStyle(has ? 0x3a3010 : 0x1b1b33, 1).fillRoundedRect(x - 72, y - 18, 144, 36, 9);
            chip.lineStyle(2, has ? 0xffdd44 : 0x3a3a5c, 1).strokeRoundedRect(x - 72, y - 18, 144, 36, 9);
            const label = this.add.text(x, y, `${has ? '★' : '☆'} ${Lang.t('badge_' + id)}`, {
                fontFamily: 'Arial', fontSize: 15, color: has ? COLORS.gold : '#6b6b8a'
            }).setOrigin(0.5);
            parts.push(chip, label);
        });

        const hint = this.add.text(512, 508, Lang.t('popupHint'), {
            fontFamily: 'Arial', fontSize: 13, color: COLORS.grey
        }).setOrigin(0.5);

        popup.add([...parts, hint]);
        this.tutorialPopup = popup;
    }

    // Popup de logros (GDD §9): 8 hitos en dos columnas, con progreso del acumulado.
    buildAchievementsPopup () {
        const popup = this.add.container(0, 0).setVisible(false).setDepth(10);

        const panel = this.add.graphics();
        panel.fillStyle(COLORS.panel, 1).fillRoundedRect(192, 190, 640, 340, 18);
        panel.lineStyle(2, COLORS.panelBorder, 1).strokeRoundedRect(192, 190, 640, 340, 18);

        const owned = ACHIEVEMENTS.filter((a) => AchievementStore.has(a.id)).length;
        const title = this.add.text(512, 222, `${Lang.t('achievementsTitle')}  ${owned}/${ACHIEVEMENTS.length}`, {
            fontFamily: 'Arial Black', fontSize: 24, color: COLORS.gold, stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5);

        const parts = [panel, title];

        ACHIEVEMENTS.forEach((a, i) => {
            const has = AchievementStore.has(a.id);
            const cx = i % 2 === 0 ? 352 : 672;
            const y = 284 + Math.floor(i / 2) * 62;
            const chip = this.add.graphics();
            chip.fillStyle(has ? 0x3a3010 : 0x1b1b33, 1).fillRoundedRect(cx - 150, y - 26, 300, 52, 9);
            chip.lineStyle(2, has ? 0xffdd44 : 0x3a3a5c, 1).strokeRoundedRect(cx - 150, y - 26, 300, 52, 9);

            const progress = AchievementStore.progress(a.id);
            const desc = Lang.t(`ach_${a.id}_desc`) + (progress ? `  (${progress.value}/${progress.target})` : '');
            const name = this.add.text(cx - 136, y - 10, `${has ? '★' : '☆'} ${Lang.t('ach_' + a.id)}`, {
                fontFamily: 'Arial Black', fontSize: 15, color: has ? COLORS.gold : '#6b6b8a'
            }).setOrigin(0, 0.5);
            const detail = this.add.text(cx - 136, y + 12, desc, {
                fontFamily: 'Arial', fontSize: 13, color: has ? COLORS.text : '#6b6b8a'
            }).setOrigin(0, 0.5);
            parts.push(chip, name, detail);
        });

        const hint = this.add.text(512, 508, Lang.t('popupHint'), {
            fontFamily: 'Arial', fontSize: 13, color: COLORS.grey
        }).setOrigin(0.5);

        popup.add([...parts, hint]);
        this.achievementsPopup = popup;
    }

    toggleAchievements (show = null) {
        const visible = show ?? !this.achievementsPopup.visible;

        if (this.achievementsPopup.visible === visible) {
            return;
        }

        this.toggleControls(false);
        this.toggleLang(false);
        this.toggleOptions(false);
        this.toggleTutorial(false);
        this.achievementsPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.showPopup(this.achievementsPopup);
        }
    }

    toggleTutorial (show = null) {
        const visible = show ?? !this.tutorialPopup.visible;

        if (this.tutorialPopup.visible === visible) {
            return;
        }

        this.toggleControls(false);
        this.toggleLang(false);
        this.toggleOptions(false);
        this.toggleAchievements(false);
        this.tutorialPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.showPopup(this.tutorialPopup);
        }
    }
}