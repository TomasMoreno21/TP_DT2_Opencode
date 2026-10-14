import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';
import { Audio } from '../systems/Audio';
import { LEVELS } from '../assets/levels';

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
        // La campaña se conserva para que "Reintentar" juegue el mismo mapa (sin
        // re-roll). En victoria se descarta: empieza una partida nueva.
        this.campaignSeed = data.campaignSeed ?? null;
        this.campaign = data.campaign ?? null;
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

        if (this.lostScore > 0) {
            this.add.text(512, 340, `Puntos perdidos en el nivel: ${this.lostScore}`, {
                fontFamily: 'Arial', fontSize: 20, color: '#ff8844'
            }).setOrigin(0.5);
        }

        this.drawStatsPanel();

        if (this.isNewRecord) {
            const record = this.add.text(512, 532, '¡Nuevo récord!', {
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

        this.createButton(596, primaryLabel, 0x00d1b2, '#00382c',
            () => this.scene.start('Game', primaryTarget));
        this.createButton(672, 'MENÚ', 0x1b1836, '#cccccc',
            () => this.scene.start('MainMenu'), 0x9a94c8);

        this.input.keyboard.on('keydown-R', () => this.scene.start('Game', primaryTarget));
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('Game', primaryTarget));
        this.input.keyboard.on('keydown-M', () => this.scene.start('MainMenu'));
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('MainMenu'));
    }

    subtitle()
    {
        if (this.reason === 'victory') {
            return `Completaste los ${LEVELS.length} niveles`;
        }

        const level = LEVELS[this.levelIndex] ?? LEVELS[0];
        return `Nivel ${this.levelIndex + 1}/${LEVELS.length} - ${level.name}`;
    }

    drawStatsPanel ()
    {
        // Panel rojo uniforme en todo final (victoria en verde).
        const accent = this.reason === 'victory'
            ? { label: '#00ff88', fill: 0x17452a, border: 0x00ff88 }
            : { label: '#ff99aa', fill: 0x5c2230, border: 0xff4455 };

        const panel = this.add.graphics();
        panel.fillStyle(accent.fill, 1);
        panel.fillRoundedRect(302, 376, 420, 84, 14);
        panel.lineStyle(3, accent.border, 0.9);
        panel.strokeRoundedRect(302, 376, 420, 84, 14);

        // Mejor puntaje centrado en el medio del panel.
        const labelText = this.add.text(0, 418, 'Mejor puntaje: ', {
            fontFamily: 'Arial Black', fontSize: 22, color: accent.label,
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0, 0.5);

        const valueText = this.add.text(0, 418, `${this.best}`, {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffffff',
            stroke: '#000000', strokeThickness: 5
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
    }
}
