import { Scene } from 'phaser';

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
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x0f0f1a);

        const title = this.reason === 'hit' ? '¡Perdiste!' : '¡Tiempo!';
        const titleColor = this.reason === 'hit' ? '#ff4455' : '#ffdd44';

        this.add.text(512, 280, title, {
            fontFamily: 'Arial Black', fontSize: 64, color: titleColor,
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(512, 370, `Puntaje: ${this.score}`, {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(512, 480, 'Reiniciar', {
            fontFamily: 'Arial Black', fontSize: 34, color: '#00d1b2',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('Game'));

        this.add.text(512, 550, 'Salir', {
            fontFamily: 'Arial Black', fontSize: 34, color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.scene.start('MainMenu'));
    }
}