export class Hud {
    constructor(scene) {
        this.scene = scene;

        this.scoreText = scene.add.text(16, 16, 'Puntos: 0', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setScrollFactor(0);

        this.timerText = scene.add.text(1008, 16, '60', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(1, 0).setScrollFactor(0);
    }

    setScore(value) {
        this.scoreText.setText(`Puntos: ${value}`);
    }

    setTime(seconds) {
        this.timerText.setText(`${seconds}`);
    }
}