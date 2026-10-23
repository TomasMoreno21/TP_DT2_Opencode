import { Lang } from './Texts';
import { RANK_COLORS, RANK_ORDER, rankFor } from './Rank';

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
        this.lastMult = 1;
        this.timerTotal = 60;

        // Panel translúcido detrás del bloque de estado izquierdo.
        const panel = scene.add.graphics().setScrollFactor(0);
        panel.fillStyle(0x000000, 0.35);
        panel.fillRoundedRect(8, 8, 212, 144, 12);

        this.scoreText = scene.add.text(16, 16, 'Puntos: 0', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setScrollFactor(0);

        this.quotaText = scene.add.text(16, 52, 'Meta: 0/0', {
            fontFamily: 'Arial', fontSize: 18, color: '#cccccc',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0);

        // Barra de progreso de la quota bajo el texto.
        this.quotaBarBg = scene.add.rectangle(16, 74, 170, 8, 0x1a1a2e, 0.9)
            .setOrigin(0, 0).setScrollFactor(0);
        this.quotaBarBg.setStrokeStyle(1, 0xcccccc, 0.6);
        this.quotaFill = scene.add.rectangle(17, 75, 168, 6, 0x00d1b2, 1)
            .setOrigin(0, 0).setScrollFactor(0);
        this.quotaFill.setScale(0, 1);

        this.levelText = scene.add.text(1008, 16, 'Nivel 1/1', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(1, 0).setScrollFactor(0);

        // Rango: barra hacia el oro con marcas de bronce y plata, bajo el nivel.
        this.rankThresholds = null;
        this.rankText = scene.add.text(1008, 48, '', {
            fontFamily: 'Arial Black', fontSize: 16, color: '#aaaaaa',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0);
        this.rankBarBg = scene.add.rectangle(838, 72, 170, 8, 0x1a1a2e, 0.9)
            .setOrigin(0, 0).setScrollFactor(0);
        this.rankBarBg.setStrokeStyle(1, 0xcccccc, 0.6);
        this.rankFill = scene.add.rectangle(839, 73, 168, 6, 0x888888, 1)
            .setOrigin(0, 0).setScrollFactor(0);
        this.rankFill.setScale(0, 1);
        this.rankTicks = scene.add.graphics().setScrollFactor(0);

        this.comboText = scene.add.text(512, 102, 'x1', {
            fontFamily: 'Arial Black', fontSize: 22, color: '#ffdd44',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

        this.airText = scene.add.text(512, 130, 'VOLANDO', {
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

        this.dashLabel = scene.add.text(16, 120, 'DASH', {
            fontFamily: 'Arial Black', fontSize: 14, color: '#ffaa44',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0);
        this.dashBar = scene.add.rectangle(16, 136, 130, 10, 0x1a1a2e, 0.85)
            .setOrigin(0, 0).setScrollFactor(0);
        this.dashBar.setStrokeStyle(1, 0xffaa44, 0.8);
        this.dashFill = scene.add.rectangle(18, 138, 126, 6, 0xffaa44, 0.9)
            .setOrigin(0, 0).setScrollFactor(0);

        this.timerText = scene.add.text(HUD_CONFIG.timerX, HUD_CONFIG.timerY, '1:00', {
            fontFamily: 'Arial Black', fontSize: 56, color: this.normalColor,
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5, 0).setScrollFactor(0);

        // Barra del timer bajo el número + viñeta roja de tiempo bajo.
        this.timerBarBg = scene.add.rectangle(HUD_CONFIG.timerX - 100, 86, 200, 8, 0x1a1a2e, 0.9)
            .setOrigin(0, 0).setScrollFactor(0);
        this.timerBarBg.setStrokeStyle(1, 0xffffff, 0.5);
        this.timerFill = scene.add.rectangle(HUD_CONFIG.timerX - 99, 87, 198, 6, 0xffffff, 1)
            .setOrigin(0, 0).setScrollFactor(0);
        this.vignette = scene.add.graphics().setScrollFactor(0).setVisible(false);
    }

    setTimerTotal(totalSeconds) {
        this.timerTotal = Math.max(totalSeconds, 1);
    }

    setScore(value) {
        this.scoreText.setText(`Puntos: ${value}`);
        this.updateRank(value);
    }

    setRankThresholds(thresholds) {
        this.rankThresholds = thresholds;
        this.rankTicks.clear();
        for (const rank of RANK_ORDER.slice(0, -1)) {
            const x = 839 + 168 * (thresholds[rank] / thresholds.gold);
            this.rankTicks.lineStyle(2, RANK_COLORS[rank], 1).lineBetween(x, 69, x, 83);
        }
    }

    updateRank(score) {
        if (!this.rankThresholds) return;
        const rank = rankFor(score, this.rankThresholds);
        const color = rank ? RANK_COLORS[rank] : 0x888888;
        this.rankText.setText(`${Lang.t('rankLabel')}: ${Lang.t(`rank_${rank ?? 'none'}`)}`);
        this.rankText.setColor(rank ? `#${color.toString(16).padStart(6, '0')}` : '#aaaaaa');
        this.rankFill.setScale(Math.min(score / this.rankThresholds.gold, 1), 1);
        this.rankFill.setFillStyle(color, 1);
    }

    setQuota(collected, quota) {
        const met = collected >= quota;
        this.quotaText.setText(`Meta: ${collected}/${quota}`);
        this.quotaText.setColor(met ? '#00ff88' : '#cccccc');
        this.quotaFill.setScale(quota > 0 ? Math.min(collected / quota, 1) : 0, 1);
        this.quotaFill.setFillStyle(met ? 0x00ff88 : 0x00d1b2, 1);
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

        // La barra se vacía con el tiempo y cambia de color con la urgencia.
        const fraction = Math.max(Math.min(seconds / this.timerTotal, 1), 0);
        this.timerFill.setScale(fraction, 1);

        if (seconds <= HUD_CONFIG.criticalTimeThreshold) {
            this.timerText.setColor(this.criticalColor);
            this.timerFill.setFillStyle(0xff4455, 1);
            this.startPulse();
            this.updateVignette(1);
        } else if (seconds <= HUD_CONFIG.lowTimeThreshold) {
            this.timerText.setColor(this.lowColor);
            this.timerFill.setFillStyle(0xffdd44, 1);
            this.stopPulse();
            this.updateVignette(0.5);
        } else {
            this.timerText.setColor(this.normalColor);
            this.timerFill.setFillStyle(0xffffff, 1);
            this.stopPulse();
            this.updateVignette(0);
        }
    }

    // Viñeta difuminada por capas (no un rectángulo duro): crece al acabarse el tiempo.
    drawVignette(strength) {
        const g = this.vignette.clear();
        const layers = [
            { w: 120, a: 0.10 }, { w: 95, a: 0.15 }, { w: 70, a: 0.22 },
            { w: 48, a: 0.32 }, { w: 28, a: 0.42 }
        ];

        for (const { w, a } of layers) {
            g.lineStyle(w, 0xff2233, a * strength);
            g.strokeRect(0, 0, 1024, 768);
        }
    }

    updateVignette(strength) {
        if (strength <= 0) {
            if (this.vignetteTween) {
                this.vignetteTween.stop();
                this.vignetteTween = null;
            }

            this.vignette.setVisible(false);
            return;
        }

        this.drawVignette(strength);

        if (!this.vignette.visible) {
            this.vignette.setVisible(true);
            this.vignette.setAlpha(0.5);
            this.vignetteTween = this.scene.tweens.add({
                targets: this.vignette,
                alpha: 1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
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
            this.stopComboScale();
            this.lastMult = 1;
            return;
        }

        // Subir de combo pega un sacudón chico y cambia de color por nivel.
        if (multiplier > this.lastMult) {
            this.scene.cameras.main.shake(70, 0.002);
        }

        this.lastMult = multiplier;
        const colors = { 2: '#ffdd44', 3: '#ff8844', 4: '#ff6622', 5: '#ff4455' };
        this.comboText.setText(`x${multiplier}`).setColor(colors[multiplier] ?? '#ffdd44').setVisible(true);

        this.stopComboScale();
        this.comboText.setScale(1.4);

        this.comboTextScaleTween = this.scene.tweens.add({
            targets: this.comboText,
            scale: 1,
            duration: 200,
            ease: 'Quad.easeOut'
        });
    }

    // Detiene el tween de escala anterior: si no, se acumulan sobre el mismo
    // objetivo y la animacion de "pop" se pisa a si misma.
    stopComboScale() {
        if (this.comboTextScaleTween) {
            this.comboTextScaleTween.stop();
            this.comboTextScaleTween = null;
        }

        this.comboText.setScale(1);
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

    // Indicador de cooldown del dash: la barra se llena cuando está listo.
    setDashCooldown(remainingMs, totalMs) {
        const ready = remainingMs <= 0;
        const fraction = ready ? 1 : Math.max(Math.min(1 - remainingMs / totalMs, 1), 0);

        this.dashFill.setScale(fraction, 1);
        this.dashLabel.setColor(ready ? '#ffaa44' : '#777777');
    }
}