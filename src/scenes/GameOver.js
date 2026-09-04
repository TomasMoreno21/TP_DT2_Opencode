import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    init (data)
    {
        this.score = data.score ?? 0;
        this.reason = data.reason ?? 'timeout';
        this.best = HighScore.update(this.score);
        this.isNewRecord = this.score > 0 && this.score >= this.best;
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x0f0f1a);

        const title = this.reason === 'hit' ? '¡Perdiste!' : '¡Tiempo!';
        const titleColor = this.reason === 'hit' ? '#ff4455' : '#ffdd44';

        this.add.text(512, 260, title, {
            fontFamily: 'Arial Black', fontSize: 64, color: titleColor,
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(512, 350, `Puntaje: ${this.score}`, {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(512, 405, `Mejor: ${this.best}`, {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffdd44',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        if (this.isNewRecord) {
            this.add.text(512, 455, '¡Nuevo récord!', {
                fontFamily: 'Arial Black', fontSize: 22, color: '#00ff88',
                stroke: '#000000', strokeThickness: 6
            }).setOrigin(0.5);
        }

        this.add.text(512, 520, 'Reiniciar', {
            fontFamily: 'Arial Black', fontSize: 34, color: '#00d1b2',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('Game'));

        this.add.text(512, 590, 'Salir', {
            fontFamily: 'Arial Black', fontSize: 34, color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('MainMenu'));
    }
}