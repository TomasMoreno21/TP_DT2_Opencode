import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';
import { Audio } from '../systems/Audio';
import { LEVELS } from '../assets/levels';
import { CampaignBuilder } from '../systems/CampaignBuilder';
import { Leaderboard } from '../systems/Leaderboard';
import { NameEntry } from '../systems/NameEntry';
import { createRankingTable } from '../systems/RankingTable';
import { MenuButton } from '../systems/MenuButton';
import { Lang } from '../systems/Texts';
import { Music } from '../systems/Music';
import { Wipe } from '../systems/Wipe';

const ENDING_CONFIG = {
    hit: { title: '¡Perdiste!', color: '#ff4455', tint: 0xff4455, bg: 0x2a0f16, face: '>_<', faceColor: '#ff8899' },
    timeout: { title: '¡Tiempo!', color: '#ff4455', tint: 0xff4455, bg: 0x2a0f16, face: 'o_o', faceColor: '#ff8899' },
    victory: { title: '¡Victoria!', color: '#00ff88', tint: 0x00ff88, bg: 0x0f2a1a, face: '^_^', faceColor: '#00ff88' }
};

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    init (data)
    {
        // score: puntaje bankeado (niveles completados). lostScore: puntos del nivel fallido.
        this.score = data.score ?? 0;
        this.lostScore = data.lostScore ?? 0;
        this.reason = data.reason ?? 'timeout';
        this.levelIndex = data.levelIndex ?? 0;
        this.maxCombo = data.maxCombo ?? 1;
        this.survived = data.survived ?? 0;
        this.quota = data.quota ?? 0;
        this.collected = data.collected ?? 0;
        // La campaña se conserva (los demás niveles no cambian). Al perder, "Reintentar"
        // reemplaza ESE nivel por uno nuevo generado con otra semilla; en victoria
        // se descarta: empieza una partida nueva.
        this.campaignSeed = data.campaignSeed ?? null;
        this.campaign = data.campaign ?? null;
        this.deaths = data.deaths ?? 0;
        // La escena se reutiliza entre partidas: el estado del reintento se reinicia.
        this.retrying = false;
        this.entryOpen = false;
        // Se lee el récord anterior antes de actualizarlo: si no, update()
        // devolvería el propio score y "nuevo récord" saldría siempre.
        const previousBest = HighScore.get();
        this.best = HighScore.update(this.score);
        this.isNewRecord = this.score > 0 && this.score > previousBest;
    }

    create ()
    {
        const config = ENDING_CONFIG[this.reason] ?? ENDING_CONFIG.hit;
        const isVictory = this.reason === 'victory';

        // Si venimos de un wipe (victoria), se destapa la pantalla.
        const wipeColor = this.registry.get('wipeIn');

        if (wipeColor !== undefined) {
            this.registry.remove('wipeIn');
            Wipe.reveal(this, wipeColor, 360);
        }

        // Tras ganar suena la música tranquila; tras perder, silencio (la muerte ya la apagó).
        if (isVictory) {
            Music.play('menu');
        } else {
            Music.stop();
        }

        this.cameras.main.setBackgroundColor(config.bg);
        this.drawSparkles(config.tint);

        if (!this.textures.exists('particle')) {
            this.make.graphics({ x: 0, y: 0, add: false })
                .fillStyle(0xffffff, 1)
                .fillCircle(4, 4, 4)
                .generateTexture('particle', 8, 8);
        }

        if (isVictory) {
            Audio.play('victory');
        }

        // Carita del bichito según resultado, con pop de entrada.
        const face = this.add.text(512, 96, config.face, {
            fontFamily: 'Arial Black', fontSize: 64, color: config.faceColor,
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setScale(0);
        this.tweens.add({ targets: face, scale: 1, duration: 350, ease: 'Back.easeOut' });

        // Título: cae de arriba con rebote; en derrota sacude la pantalla.
        const title = this.add.text(512, -60, config.title, {
            fontFamily: 'Arial Black', fontSize: 64, color: config.color,
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);
        this.tweens.add({
            targets: title, y: 190, duration: 600, ease: 'Bounce.easeOut',
            onComplete: () => {
                if (!isVictory) {
                    this.cameras.main.shake(200, 0.008);
                } else {
                    this.confetti();
                }
            }
        });

        this.add.text(512, 252, this.subtitle(), {
            fontFamily: 'Arial', fontSize: 22, color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(512, 300, `Puntaje: ${this.score}`, {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.drawStatsPanel();
        this.drawLossInfo();

        if (this.isNewRecord) {
            const record = this.add.text(512, 450, '¡Nuevo récord!', {
                fontFamily: 'Arial Black', fontSize: 22, color: '#00ff88',
                stroke: '#000000', strokeThickness: 6
            }).setOrigin(0.5).setScale(0);
            this.tweens.add({ targets: record, scale: 1, duration: 300, delay: 500, ease: 'Back.easeOut' });
            this.tweens.add({ targets: record, scale: 1.1, duration: 600, delay: 900, yoyo: true, repeat: -1 });
        }

        const primaryLabel = isVictory ? 'JUGAR DE NUEVO' : 'REINTENTAR';
        const primaryTarget = isVictory
            ? { levelIndex: 0, completedScore: 0 }
            : {
                levelIndex: this.levelIndex,
                completedScore: this.score,
                campaignSeed: this.campaignSeed,
                campaign: this.campaign
            };

        const retry = () => this.retry(primaryTarget, isVictory);

        this.primaryLabel = this.createButton(556, primaryLabel, 0x00d1b2, '#00382c', retry);
        this.createButton(634, 'MENÚ', 0x1b1836, '#cccccc',
            () => this.scene.start('MainMenu'), 0x9a94c8);

        // Mientras se piden las iniciales las letras son para el nombre, no atajos.
        const unlessEntering = (action) => () => { if (!this.entryOpen) action(); };

        this.input.keyboard.on('keydown-R', unlessEntering(retry));
        this.input.keyboard.on('keydown-SPACE', unlessEntering(retry));
        this.input.keyboard.on('keydown-M', unlessEntering(() => this.scene.start('MainMenu')));
        this.input.keyboard.on('keydown-ESC', unlessEntering(() => this.scene.start('MainMenu')));

        this.maybeEnterRanking();
    }

    // Ranking local: si el puntaje entra al Top 10 se piden las iniciales (estilo
    // arcade). Una misma partida (campaña) ocupa una sola fila: si mejora el puntaje
    // reemplaza a la anterior. Con vida infinita (código secreto) no se registra.
    maybeEnterRanking ()
    {
        if (this.registry.get('infiniteLife')) {
            return;
        }

        const run = this.registry.get('runEntry');
        const previous = run && this.campaignSeed !== null && run.seed === this.campaignSeed
            ? Leaderboard.find(run.id) : null;

        if (previous && previous.score >= this.score) {
            return;
        }

        const replaceId = previous?.id ?? null;

        if (!Leaderboard.qualifies(this.score, replaceId)) {
            return;
        }

        this.openEntry(replaceId);
    }

    openEntry (replaceId)
    {
        this.entryOpen = true;
        const layer = [];
        const add = (obj) => { obj.setDepth(21); layer.push(obj); return obj; };
        const label = (y, text, size, color, stroke = 6) => add(this.add.text(512, y, text, {
            fontFamily: 'Arial Black', fontSize: size, color, stroke: '#000000', strokeThickness: stroke
        }).setOrigin(0.5));

        const dim = this.add.rectangle(512, 384, 1024, 768, 0x0b0919, 0.97).setInteractive().setDepth(20);
        this.entryDim = dim;

        const place = Leaderboard.positionFor(this.score, replaceId);
        label(96, Lang.t('entryTitle'), 44, '#ffdd44', 8);
        label(150, Lang.t('entryPlace', { p: place, s: this.score }), 26, '#ffffff');
        label(214, Lang.t('entryPrompt'), 22, '#00d1b2', 5);
        label(628, Lang.t('entryHint'), 15, '#8888aa', 3);

        const entry = new NameEntry(this, {
            x: 512, y: 380, initial: Leaderboard.lastName(),
            onConfirm: (name) => {
                const saved = Leaderboard.add({
                    name,
                    score: this.score,
                    levels: this.reason === 'victory' ? LEVELS.length : this.levelIndex,
                    combo: this.maxCombo,
                    victory: this.reason === 'victory'
                }, replaceId);

                // Victoria = partida terminada; si no, se recuerda para reemplazar la fila.
                if (this.reason === 'victory') {
                    this.registry.remove('runEntry');
                } else {
                    this.registry.set('runEntry', { seed: this.campaignSeed, id: saved.id });
                }

                layer.forEach((obj) => obj.destroy());
                this.showEntryTable(saved);
            }
        });
        entry.container.setDepth(21);
    }

    showEntryTable (saved)
    {
        const layer = [];
        const title = this.add.text(512, 50, Lang.t('rankingTitle'), {
            fontFamily: 'Arial Black', fontSize: 40, color: '#ffdd44', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(21);
        const table = createRankingTable(this, 512, 100, Leaderboard.get(), saved.id).setDepth(21);
        layer.push(title, table);

        const close = () => {
            if (!this.entryOpen) return;
            layer.forEach((obj) => obj.destroy());
            button.root.destroy();
            this.entryDim.destroy();
            this.entryOpen = false;
        };

        const button = new MenuButton(this, {
            x: 512, y: 660, w: 300, h: 64, label: Lang.t('entryContinue'), style: 'primary', delay: 200,
            onClick: close
        });
        button.root.setDepth(21);
        button.text.setFontSize(28);
        button.setActive(true);

        // Un instante de espera: el Enter que confirmó las iniciales no debe cerrar la tabla.
        this.time.delayedCall(300, () => {
            this.input.keyboard.once('keydown-ENTER', close);
            this.input.keyboard.once('keydown-SPACE', close);
        });
    }

    // Reintentar: tras perder se genera un nivel nuevo para esa instancia (otra
    // semilla, otro mapa) y se reemplaza solo en la campaña de la partida. Si no
    // hay campaña (arranque directo) o es una victoria, se usa el destino tal cual.
    retry (target, isVictory)
    {
        if (this.retrying) {
            return;
        }

        if (isVictory || !this.campaign) {
            this.scene.start('Game', target);
            return;
        }

        this.retrying = true;
        this.primaryLabel?.setText('Generando nivel...').setFontSize(22);

        const seed = ((Date.now() * 2654435761) ^ Math.floor(Math.random() * 4294967296)) >>> 0;

        // Aprender del error: cada muerte seguida en este nivel pide un mapa más
        // accesible (dificultad más baja, más espacio y algo más de tiempo).
        const assist = this.deaths + 1;

        CampaignBuilder.buildLevel(seed, this.levelIndex, { assist }).then((entry) => {
            const campaign = this.campaign.slice();
            campaign[this.levelIndex] = entry;
            console.log(`[FastMove] N${this.levelIndex + 1} regenerado tras perder (semilla ${seed}, asistencia ${assist}): ${entry.config.durationSeconds}s${entry.mutated ? '' : ' (base)'}`);

            if (this.scene.isActive()) {
                this.scene.start('Game', { ...target, campaign, deaths: assist });
            }
        });
    }

    subtitle()
    {
        if (this.reason === 'victory') {
            return `Completaste los ${LEVELS.length} niveles`;
        }

        const level = LEVELS[this.levelIndex] ?? LEVELS[0];
        return `Nivel ${this.levelIndex + 1}/${LEVELS.length} - ${level.name}`;
    }

    // Derrota: cuánto faltaba para la meta y un consejo según la causa.
    drawLossInfo ()
    {
        if (this.reason === 'victory') {
            return;
        }

        const missing = this.quota - this.collected;
        const lines = [];

        if (missing > 0) lines.push([Lang.t('overMissing', { n: missing }), 20, '#ffcc66']);

        lines.forEach(([text, size, color], i) => {
            const label = this.add.text(512, 410 + i * 24, text, {
                fontFamily: 'Arial', fontSize: size, color
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({ targets: label, alpha: 1, duration: 300, delay: 350 + i * 150 });
        });
    }

    drawStatsPanel ()
    {
        // Una línea simple, sin panel: el color del resultado ya lo da el título.
        const labelColor = this.reason === 'victory' ? '#00ff88' : '#ff99aa';

        const labelText = this.add.text(0, 360, 'Mejor puntaje: ', {
            fontFamily: 'Arial Black', fontSize: 20, color: labelColor
        }).setOrigin(0, 0.5);

        const valueText = this.add.text(0, 360, `${this.best}`, {
            fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff'
        }).setOrigin(0, 0.5);

        const total = labelText.width + valueText.width;
        labelText.setX(512 - total / 2);
        valueText.setX(labelText.x + labelText.width);
    }

    drawSparkles (tint)
    {
        for (let i = 0; i < 16; i++) {
            const spark = this.add.circle(
                40 + Math.random() * 944, 60 + Math.random() * 640,
                1.5 + Math.random() * 2, tint, 0.4);
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

    confetti ()
    {
        const colors = [0x00ff88, 0xffdd44, 0x2dd4ff, 0xff66aa, 0xffffff];

        colors.forEach((color, i) =>
        {
            this.time.delayedCall(i * 120, () =>
            {
                this.add.particles(312 + i * 100, 260, 'particle', {
                    speed: { min: 80, max: 260 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 1.2, end: 0 },
                    lifespan: 700,
                    quantity: 12,
                    emitting: false,
                    tint: color
                }).explode(12, 312 + i * 100, 260);
            });
        });
    }

    createButton (y, text, fill, textColor, onClick, border = 0xffffff)
    {
        const key = `overBtn${fill.toString(16)}`;

        if (!this.textures.exists(key)) {
            const g = this.add.graphics();
            g.fillStyle(fill, 1).fillRoundedRect(0, 0, 300, 62, 16);
            g.lineStyle(4, border, 1).strokeRoundedRect(0, 0, 300, 62, 16);
            g.generateTexture(key, 300, 62);
            g.destroy();
        }

        const btn = this.add.image(512, y, key).setInteractive({ useHandCursor: true });
        const label = this.add.text(512, y, text, {
            fontFamily: 'Arial Black', fontSize: 26, color: textColor
        }).setOrigin(0.5);

        btn.on('pointerover', () => btn.setScale(1.05));
        btn.on('pointerout', () => btn.setScale(1));
        btn.on('pointerdown', () =>
        {
            Audio.play('ui');
            btn.setScale(0.95);
            this.time.delayedCall(120, onClick);
        });

        return label;
    }
}
