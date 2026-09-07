export const HUD_CONFIG = {
    timerBarWidth: 400,
    timerBarHeight: 18,
    timerBarX: 512,
    timerBarY: 28,
    lowTimeThreshold: 10,
    criticalTimeThreshold: 5
};

export class Hud {
    constructor(scene) {
        this.scene = scene;
        this.normalColor = 0x00d1b2;
        this.lowColor = 0xffdd44;
        this.criticalColor = 0xff4455;

        this.scoreText = scene.add.text(16, 16, 'Puntos: 0', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setScrollFactor(0);

        this.comboText = scene.add.text(512, 68, 'x1', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffdd44',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

        this.timerText = scene.add.text(1008, 8, '60', {
            fontFamily: 'Arial Black', fontSize: 40, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.timerBarBg = scene.add.rectangle(
            HUD_CONFIG.timerBarX, HUD_CONFIG.timerBarY,
            HUD_CONFIG.timerBarWidth, HUD_CONFIG.timerBarHeight,
            0x000000, 0.5
        ).setScrollFactor(0);

        this.timerBar = scene.add.rectangle(
            HUD_CONFIG.timerBarX, HUD_CONFIG.timerBarY,
            HUD_CONFIG.timerBarWidth, HUD_CONFIG.timerBarHeight,
            this.normalColor
        ).setOrigin(0.5, 0.5).setScrollFactor(0);

        this.addTimerBarBorder();
    }

    addTimerBarBorder() {
        this.scene.add.rectangle(
            HUD_CONFIG.timerBarX, HUD_CONFIG.timerBarY,
            HUD_CONFIG.timerBarWidth + 6, HUD_CONFIG.timerBarHeight + 6,
            0x000000, 0
        ).setStrokeStyle(3, 0xffffff).setScrollFactor(0);
    }

    setScore(value) {
        this.scoreText.setText(`Puntos: ${value}`);
    }

    setTime(seconds, totalSeconds) {
        this.timerText.setText(`${seconds}`);

        const ratio = Math.max(seconds / totalSeconds, 0.02);
        this.timerBar.setScale(ratio, 1);

        let color = this.normalColor;

        if (seconds <= HUD_CONFIG.criticalTimeThreshold) {
            color = this.criticalColor;
            this.timerText.setColor('#ff4455');
        } else if (seconds <= HUD_CONFIG.lowTimeThreshold) {
            color = this.lowColor;
            this.timerText.setColor('#ffdd44');
        } else {
            this.timerText.setColor('#ffffff');
        }

        this.timerBar.setFillStyle(color);
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