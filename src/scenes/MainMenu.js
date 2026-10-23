import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';
import { RANK_COLORS, RankStore } from '../systems/Rank';
import { Audio } from '../systems/Audio';
import { Lang } from '../systems/Texts';
import { LEVELS } from '../assets/levels';
import { CampaignBuilder } from '../systems/CampaignBuilder';
import { Tutorial } from '../systems/TutorialManager';
import { Badges, BADGES } from '../systems/Badges';

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
        this.drawBackground();

        const title = this.add.text(512, 145, 'FAST MOVE', {
            fontFamily: 'Arial Black', fontSize: 80, color: COLORS.teal,
            stroke: '#000000', strokeThickness: 12,
            shadow: { offsetX: 0, offsetY: 6, color: '#004f42', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5).setAlpha(0);

        // Entrada escalonada: título primero, el resto por delay.
        this.tweens.add({ targets: title, alpha: 1, duration: 350 });
        this.tweens.add({ targets: title, y: 138, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const subtitle = this.add.text(512, 228, Lang.t('subtitle', { n: LEVELS.length }), {
            fontFamily: 'Arial', fontSize: 20, color: COLORS.grey
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: subtitle, alpha: 1, duration: 350, delay: 120 });

        this.drawControlsPanel();

        const best = this.add.text(512, 292, Lang.t('best', { v: HighScore.get() }), {
            fontFamily: 'Arial Black', fontSize: 22, color: COLORS.gold,
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: best, alpha: 1, duration: 350, delay: 300 });

        this.createRankMedals();

        this.createPlayButton();

        this.createSecondaryButton(376, 570, 'controlsButton', Lang.t('controls'), () => this.toggleControls());
        this.createSecondaryButton(648, 570, 'langButton', Lang.t('lang'), () => this.toggleLang());
        this.createSecondaryButton(512, 646, 'tutorialButton', Lang.t('tutorialBtn'), () => this.toggleTutorial());
        this.buildLangPopup();
        this.buildTutorialPopup();
        this.createSeedControls();

        this.input.keyboard.on('keydown-ESC', () => {
            this.toggleControls(false);
            this.toggleLang(false);
            this.toggleTutorial(false);
            if (this.cheatPopup?.visible) {
                this.cheatPopup.setVisible(false);
                this.controlsDim.setVisible(false);
            }
        });

        // Código secreto: tipear "pene" abre el selector de nivel con vida infinita.
        this.typed = '';
        this.input.keyboard.on('keydown', (event) => {
            this.typed = (this.typed + event.key.toLowerCase()).slice(-4);
            if (this.typed === 'pene') this.openCheatMenu();
        });
    }

    // Selector de nivel del código secreto: activa la vida infinita (dura hasta
    // recargar la página) y arranca en el nivel elegido.
    openCheatMenu () {
        this.registry.set('infiniteLife', true);
        this.toggleControls(false);
        this.toggleLang(false);
        this.toggleTutorial(false);

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
        this.controlsDim.setVisible(true);
        Audio.play('ui');
    }

    // Botón superior para sortear una semilla nueva (otros niveles) y la semilla
    // actual debajo, para poder repetir o reportar una campaña concreta.
    createSeedControls () {
        this.createSecondaryButton(512, 44, 'seedButton', Lang.t('newLevels'), () => {
            Audio.play('ui');
            const seed = ((Date.now() * 2654435761) ^ Math.floor(Math.random() * 4294967296)) >>> 0;
            this.scene.restart({ campaignSeed: seed });
        });

        this.add.text(512, 90, Lang.t('seed', { n: this.campaignSeed }), {
            fontFamily: 'Arial', fontSize: 16, color: COLORS.grey
        }).setOrigin(0.5);
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
        const launch = () => this.scene.start('Game', {
            levelIndex: this.startLevel,
            completedScore: 0,
            campaignSeed: this.campaignSeed,
            campaign: this.campaign
        });

        if (this.campaign) {
            launch();
            return;
        }

        label.setText(Lang.t('generating')).setFontSize(26);
        this.pendingStart = launch;
    }

    drawBackground () {
        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
        g.fillRect(0, 0, 1024, 768);

        g.fillStyle(COLORS.floor, 1);
        g.fillRect(0, 704, 1024, 64);

        g.fillStyle(0x1b1836, 1);
        g.fillRect(120, 678, 220, 26);
        g.fillRect(684, 678, 220, 26);
        g.fillRect(462, 646, 100, 26);

        const spots = [[200, 630], [824, 630], [512, 596], [300, 596], [724, 596]];

        for (const [x, y] of spots) {
            const dot = this.add.circle(x, y, 12, 0x00d1b2, 0.4);
            this.tweens.add({
                targets: dot,
                y: y - 18,
                duration: 1300 + Math.random() * 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Destellos blancos flotando para dar vida al fondo.
        for (let i = 0; i < 14; i++) {
            const sx = 40 + Math.random() * 944, sy = 60 + Math.random() * 560;
            const spark = this.add.circle(sx, sy, 1.5 + Math.random() * 1.5, 0xffffff, 0.5);
            this.tweens.add({
                targets: spark,
                alpha: 0.1,
                duration: 900 + Math.random() * 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    drawControlsPanel () {
        // Fondo oscuro que cierra el popup al clickear afuera.
        this.controlsDim = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.6)
            .setInteractive().setVisible(false).setDepth(9);
        this.controlsDim.on('pointerdown', () => {
            this.toggleControls(false);
            this.toggleLang(false);
            this.toggleTutorial(false);
            if (this.cheatPopup?.visible) {
                this.cheatPopup.setVisible(false);
                this.controlsDim.setVisible(false);
            }
        });

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
        this.controlsPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.controlsPopup.setAlpha(0);
            this.tweens.add({ targets: this.controlsPopup, alpha: 1, duration: 160 });
        }
    }

    // Una medalla por nivel con su mejor rango: color de bronce/plata/oro, o una
    // ranura apagada si todavia no hay rango. Las de oro brillan.
    createRankMedals () {
        const label = this.add.text(512, 326, Lang.t('ranksMenu').toUpperCase(), {
            fontFamily: 'Arial Black', fontSize: 15, color: COLORS.grey
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: label, alpha: 0.8, duration: 350, delay: 340 });

        const spacing = 84;
        const startX = 512 - ((LEVELS.length - 1) * spacing) / 2;
        LEVELS.forEach((_, i) => {
            const medal = this.drawMedal(startX + i * spacing, 374, i + 1, RankStore.get(i + 1));
            medal.setScale(0);
            this.tweens.add({ targets: medal, scale: 1.5, duration: 380, delay: 380 + i * 90, ease: 'Back.easeOut' });
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

    createPlayButton () {
        if (!this.textures.exists('playButton')) {
            const g = this.add.graphics();
            g.fillStyle(0x00d1b2, 1).fillRoundedRect(0, 0, 320, 92, 22);
            g.lineStyle(5, 0xffffff, 1).strokeRoundedRect(0, 0, 320, 92, 22);
            g.generateTexture('playButton', 320, 92);
            g.destroy();
        }

        const btn = this.add.image(512, 470, 'playButton').setInteractive({ useHandCursor: true }).setAlpha(0);
        const label = this.add.text(512, 470, Lang.t('play'), {
            fontFamily: 'Arial Black', fontSize: 38, color: '#00382c'
        }).setOrigin(0.5).setAlpha(0);

        // Entrada con pop + latido continuo (escala) y flotación (y).
        this.tweens.add({ targets: [btn, label], alpha: 1, duration: 300, delay: 420 });
        this.tweens.add({ targets: [btn, label], scale: 1.045, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 700 });

        btn.on('pointerup', () => Audio.play('ui'));

        this.tweens.add({ targets: btn, y: 464, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: label, y: 464, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        btn.on('pointerover', () => {
            btn.setTint(0xccfff5);
            label.setColor('#00150f');
        });

        btn.on('pointerout', () => {
            btn.clearTint();
            label.setColor('#00382c');
        });

        btn.on('pointerdown', () => {
            this.tweens.killTweensOf(btn);
            this.tweens.killTweensOf(label);
            btn.setScale(0.93);
            label.setScale(0.93);
            this.time.delayedCall(140, () => this.startGame(label));
        });
    }

    createSecondaryButton (x, y, textureKey, labelText, onClick) {
        if (!this.textures.exists(textureKey)) {
            const g = this.add.graphics();
            g.fillStyle(0x1b1836, 1).fillRoundedRect(0, 0, 260, 64, 16);
            g.lineStyle(3, 0x00d1b2, 1).strokeRoundedRect(0, 0, 260, 64, 16);
            g.generateTexture(textureKey, 260, 64);
            g.destroy();
        }

        const btn = this.add.image(x, y, textureKey).setInteractive({ useHandCursor: true }).setAlpha(0);
        const label = this.add.text(x, y, labelText, {
            fontFamily: 'Arial Black', fontSize: 22, color: COLORS.teal
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({ targets: [btn, label], alpha: 1, duration: 300, delay: 520 });

        btn.on('pointerover', () => btn.setTint(0x2a2a5a));
        btn.on('pointerout', () => btn.clearTint());
        btn.on('pointerdown', onClick);
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

            opt.on('pointerdown', () => {
                Lang.set(lang);
                this.scene.restart({ campaignSeed: this.campaignSeed });
            });
            options.push(opt);
        }

        popup.add([panel, title, ...options]);
        this.langPopup = popup;
    }

    toggleLang (show = null) {
        const visible = show ?? !this.langPopup.visible;

        if (this.langPopup.visible === visible) {
            return;
        }

        this.toggleControls(false);
        this.toggleTutorial(false);
        this.langPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.langPopup.setAlpha(0);
            this.tweens.add({ targets: this.langPopup, alpha: 1, duration: 160 });
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

    toggleTutorial (show = null) {
        const visible = show ?? !this.tutorialPopup.visible;

        if (this.tutorialPopup.visible === visible) {
            return;
        }

        this.toggleControls(false);
        this.toggleLang(false);
        this.tutorialPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');
    }
}