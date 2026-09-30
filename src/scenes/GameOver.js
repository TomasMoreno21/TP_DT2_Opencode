import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';
import { Audio } from '../systems/Audio';
import { LEVELS } from '../assets/levels';

const ENDING_CONFIG = {
    hit: { title: '¡Perdiste!', color: '#ff4455' },
    timeout: { title: '¡Tiempo!', color: '#ffdd44' },
    victory: { title: '¡Victoria!', color: '#00ff88' }
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
        this.best = HighScore.update(this.score);
        this.isNewRecord = this.score > 0 && this.score >= this.best;
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x0f0f1a);

        if (this.reason === 'victory') {
            Audio.play('victory');
        }

        const config = ENDING_CONFIG[this.reason] ?? ENDING_CONFIG.hit;

        this.add.text(512, 210, config.title, {
            fontFamily: 'Arial Black', fontSize: 64, color: config.color,
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(512, 280, this.subtitle(), {
            fontFamily: 'Arial', fontSize: 22, color: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(512, 345, `Puntaje: ${this.score}`, {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        if (this.lostScore > 0) {
            this.add.text(512, 392, `Puntos perdidos en el nivel: ${this.lostScore}`, {
                fontFamily: 'Arial', fontSize: 20, color: '#ff8844'
            }).setOrigin(0.5);
        }

        this.add.text(512, 440, `Mejor: ${this.best}`, {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffdd44',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        if (this.isNewRecord) {
            this.add.text(512, 482, '¡Nuevo récord!', {
                fontFamily: 'Arial Black', fontSize: 22, color: '#00ff88',
                stroke: '#000000', strokeThickness: 6
            }).setOrigin(0.5);
        }

        this.createPrimaryButton();
        this.createExitButton();
    }

    subtitle()
    {
        if (this.reason === 'victory') {
            return `Completaste los ${LEVELS.length} niveles`;
        }

        const level = LEVELS[this.levelIndex] ?? LEVELS[0];
        return `Nivel ${this.levelIndex + 1}/${LEVELS.length} - ${level.name}`;
    }

    createPrimaryButton ()
    {
        const isVictory = this.reason === 'victory';
        const label = isVictory ? 'Jugar de nuevo' : 'Reintentar nivel';

        this.add.text(512, 545, label, {
            fontFamily: 'Arial Black', fontSize: 34, color: '#00d1b2',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('Game', isVictory
              ? { levelIndex: 0, completedScore: 0 }
              : { levelIndex: this.levelIndex, completedScore: this.score }));
    }

    createExitButton ()
    {
        this.add.text(512, 615, 'Salir', {
            fontFamily: 'Arial Black', fontSize: 34, color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('MainMenu'));
    }
}
