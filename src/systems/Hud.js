export const HUD_CONFIG = {
    timerX: 512,
    timerY: 22,
    lowTimeThreshold: 10,
    criticalTimeThreshold: 5
};

export class Hud {
    constructor(scene) {
        this.scene = scene;
        this.normalColor = '#ffffff';
        this.lowColor = '#ffdd44';
        this.criticalColor = '#ff4455';

        this.scoreText = scene.add.text(16, 16, 'Puntos: 0', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setScrollFactor(0);

        this.quotaText = scene.add.text(16, 52, 'Meta: 0/0', {
            fontFamily: 'Arial', fontSize: 18, color: '#cccccc',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0);

        this.levelText = scene.add.text(1008, 16, 'Nivel 1/1', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(1, 0).setScrollFactor(0);

        this.comboText = scene.add.text(512, 68, 'x1', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffdd44',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

        this.airText = scene.add.text(512, 96, 'VOLANDO', {
            fontFamily: 'Arial Black', fontSize: 16, color: '#66ff88',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

        this.shieldBar = scene.add.rectangle(16, 100, 130, 10, 0x1a1a2e, 0.85)
            .setOrigin(0, 0).setScrollFactor(0).setVisible(false);
        this.shieldBar.setStrokeStyle(1, 0x2dd4ff, 0.8);
        this.shieldFill = scene.add.rectangle(18, 102, 126, 6, 0x2dd4ff, 0.9)
            .setOrigin(0, 0).setScrollFactor(0).setVisible(false);
        this.shieldLabel = scene.add.text(16, 84, 'ESCUDO', {
            fontFamily: 'Arial Black', fontSize: 14, color: '#2dd4ff',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setVisible(false);

        this.timerText = scene.add.text(HUD_CONFIG.timerX, HUD_CONFIG.timerY, '1:00', {
            fontFamily: 'Arial Black', fontSize: 56, color: this.normalColor,
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5, 0).setScrollFactor(0);
    }

    setScore(value) {
        this.scoreText.setText(`Puntos: ${value}`);
    }

    setQuota(collected, quota) {
        const met = collected >= quota;
        this.quotaText.setText(`Meta: ${collected}/${quota}`);
        this.quotaText.setColor(met ? '#00ff88' : '#cccccc');
    }

    setLevel(current, total) {
        this.levelText.setText(`Nivel ${current}/${total}`);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    setTime(seconds) {
        this.timerText.setText(this.formatTime(seconds));

        if (seconds <= HUD_CONFIG.criticalTimeThreshold) {
            this.timerText.setColor(this.criticalColor);
            this.startPulse();
        } else if (seconds <= HUD_CONFIG.lowTimeThreshold) {
            this.timerText.setColor(this.lowColor);
            this.stopPulse();
        } else {
            this.timerText.setColor(this.normalColor);
            this.stopPulse();
        }
    }

    startPulse() {
        if (this.timerPulse) {
            return;
        }

        this.timerPulse = this.scene.tweens.add({
            targets: this.timerText,
            scale: 1.18,
            duration: 260,
            yoyo: true,
            repeat: -1,
            ease: 'Quad.easeInOut'
        });
    }

    stopPulse() {
        if (this.timerPulse) {
            this.timerPulse.stop();
            this.timerPulse = null;
            this.timerText.setScale(1);
        }
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

    setShield(remainingMs, totalMs) {
        const active = remainingMs > 0;

        this.shieldBar.setVisible(active);
        this.shieldFill.setVisible(active);
        this.shieldLabel.setVisible(active);

        if (!active) {
            return;
        }

        const fraction = Math.max(Math.min(remainingMs / totalMs, 1), 0);
        this.shieldFill.setScale(fraction, 1);
    }

    setAirStreak(streak) {
        if (streak > 0) {
            this.airText.setText(`VOLANDO x${streak}`).setVisible(true);
            return;
        }

        this.airText.setVisible(false);
    }
}