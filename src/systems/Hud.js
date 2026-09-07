export class Hud {
    constructor(scene) {
        this.scene = scene;

        this.scoreText = scene.add.text(16, 16, 'Puntos: 0', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setScrollFactor(0);

        this.comboText = scene.add.text(512, 68, 'x1', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffdd44',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

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

    setMultiplier(multiplier) {
        if (multiplier <= 1) {
            this.comboText.setVisible(false);
            return;
        }

        this.comboText.setText(`x${multiplier}`).setVisible(true);

        if (this.comboTextAlphaTween) {
            this.comboTextAlphaTween.stop();
        }

        this.comboText.setScale(1.4);
        this.comboTextAlphaTween = this.scene.tweens.add({
            targets: this.comboText,
            scale: 1,
            duration: 200,
            ease: 'Quad.easeOut'
        });
    }
}