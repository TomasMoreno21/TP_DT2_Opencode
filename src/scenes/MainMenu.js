import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x1a1a2e);

        this.add.text(512, 180, 'FAST MOVE', {
            fontFamily: 'Arial Black', fontSize: 72, color: '#00d1b2',
            stroke: '#000000', strokeThickness: 10
        }).setOrigin(0.5);

        this.add.text(512, 240, 'Conseguí la mayor cantidad de puntos en 60 segundos', {
            fontFamily: 'Arial', fontSize: 20, color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(512, 320, 'Controles', {
            fontFamily: 'Arial Black', fontSize: 26, color: '#ffdd44',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(512, 365, 'Mover: A / D o Flechas\nSaltar: Espacio / W / Flecha Arriba\nWall grab: mantené la dirección contra una pared\nWall jump: saltá tocando una pared y salís al lado opuesto', {
            fontFamily: 'Arial', fontSize: 18, color: '#dddddd',
            align: 'center', lineSpacing: 8
        }).setOrigin(0.5);

        this.add.text(512, 480, 'Mejor puntaje: ' + HighScore.get(), {
            fontFamily: 'Arial', fontSize: 20, color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(512, 580, 'Jugar', {
            fontFamily: 'Arial Black', fontSize: 40, color: '#00d1b2',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
          .on('pointerover', (text) => text.setColor('#ffffff'))
          .on('pointerout', (text) => text.setColor('#00d1b2'))
          .on('pointerdown', () => this.scene.start('Game'));
    }
}