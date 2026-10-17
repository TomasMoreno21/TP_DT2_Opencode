import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';
import { Audio } from '../systems/Audio';
import { Lang } from '../systems/Texts';
import { LEVELS } from '../assets/levels';
import { CampaignBuilder } from '../systems/CampaignBuilder';

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
        this.campaignSeed = data.campaignSeed ?? (data.seed ?? null);
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

        const best = this.add.text(512, 330, Lang.t('best', { v: HighScore.get() }), {
            fontFamily: 'Arial Black', fontSize: 22, color: COLORS.gold,
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: best, alpha: 1, duration: 350, delay: 300 });

        this.createPlayButton();

        this.createSecondaryButton(376, 570, 'controlsButton', Lang.t('controls'), () => this.toggleControls());
        this.createSecondaryButton(648, 570, 'langButton', Lang.t('lang'), () => this.toggleLang());
        this.buildLangPopup();
        this.createSeedControls();

        this.input.keyboard.on('keydown-ESC', () => {
            this.toggleControls(false);
            this.toggleLang(false);
        });
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
            levelIndex: 0,
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
        this.controlsPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.controlsPopup.setAlpha(0);
            this.tweens.add({ targets: this.controlsPopup, alpha: 1, duration: 160 });
        }
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
        this.langPopup.setVisible(visible);
        this.controlsDim.setVisible(visible);
        Audio.play('ui');

        if (visible) {
            this.langPopup.setAlpha(0);
            this.tweens.add({ targets: this.langPopup, alpha: 1, duration: 160 });
        }
    }
}