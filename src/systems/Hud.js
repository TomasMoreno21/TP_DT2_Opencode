import { Lang } from './Texts';
import { Audio } from './Audio';
import { RANK_COLORS, RANK_ORDER, rankFor } from './Rank';

export const HUD_CONFIG = {
    timerX: 512,
    timerY: 52,
    timerRadius: 42,
    lowTimeThreshold: 10,
    criticalTimeThreshold: 5
};

const DEPTH = 40;
const TOP = -Math.PI / 2;
const COMBO_COLORS = { 2: 0xffdd44, 3: 0xff8844, 4: 0xff6622, 5: 0xff4455 };
const hex = (color) => `#${color.toString(16).padStart(6, '0')}`;

// Barra redondeada: pista oscura + relleno proporcional.
function drawBar (g, x, y, w, h, fraction, color) {
    g.clear();
    g.fillStyle(0x2a2750, 1).fillRoundedRect(x, y, w, h, h / 2);

    if (fraction > 0) {
        const fillW = Math.max(h, w * Math.min(fraction, 1));
        g.fillStyle(color, 1).fillRoundedRect(x, y, fillW, h, h / 2);
        g.fillStyle(0xffffff, 0.18).fillRoundedRect(x + 2, y + 1, Math.max(fillW - 4, 0), h / 2 - 1, h / 4);
    }
}

// Arco que arranca arriba y avanza en sentido horario; fraction 1 = círculo completo.
function drawArc (g, cx, cy, radius, width, fraction, color, alpha = 1) {
    if (fraction <= 0) {
        return;
    }

    g.lineStyle(width, color, alpha);
    g.beginPath();
    g.arc(cx, cy, radius, TOP, TOP + Math.PI * 2 * Math.min(fraction, 1), false);
    g.strokePath();
}

// HUD en tres zonas: puntaje y meta (izquierda), reloj y combo (centro), nivel y
// rango (derecha), con las habilidades abajo a la izquierda. Todo se dibuja con
// Graphics, como el resto del proyecto.
export class Hud {
    constructor (scene) {
        this.scene = scene;
        this.normalColor = '#ffffff';
        this.lowColor = '#ffdd44';
        this.criticalColor = '#ff4455';
        this.lastMult = 1;
        this.timerTotal = 60;
        this.quotaMet = false;
        this.rankThresholds = null;
        this.lastRankIndex = -1;
        this.dashReady = true;
        this.shieldActive = false;
        this.scoreShown = 0;
        this.scoreTarget = 0;
        this.scoreAnim = { v: 0 };
        this.quotaState = { collected: 0, quota: 0 };
        this.rankAnnounced = false;

        this.buildLeft();
        this.buildTimer();
        this.buildCombo();
        this.buildRight();
        this.buildAbilities();

        this.vignette = this.fix(scene.add.graphics()).setVisible(false);

        // Borde rojo que late una vez por segundo en los últimos 5 s.
        this.edgePulseGfx = this.fix(scene.add.graphics()).setAlpha(0);
        // Borde dorado que respira mientras dura el frenesí (x5).
        this.frenzyGfx = this.fix(scene.add.graphics()).setVisible(false);
        this.frenzyGfx.lineStyle(14, 0xffdd44, 0.5).strokeRect(0, 0, 1024, 768);
        this.frenzyTween = null;
    }

    // Todo el HUD queda fijo en pantalla y por encima del juego.
    fix (obj) {
        return obj.setScrollFactor(0).setDepth(DEPTH);
    }

    text (x, y, str, size, color, opts = {}) {
        return this.fix(this.scene.add.text(x, y, str, {
            fontFamily: opts.font ?? 'Arial Black', fontSize: size, color,
            stroke: '#000000', strokeThickness: opts.stroke ?? 5
        }).setOrigin(opts.originX ?? 0, opts.originY ?? 0.5));
    }

    panel (x, y, w, h) {
        const g = this.fix(this.scene.add.graphics());
        g.fillStyle(0x0b0919, 0.62).fillRoundedRect(x, y, w, h, 14);
        g.lineStyle(2, 0x2a2a5a, 0.9).strokeRoundedRect(x, y, w, h, 14);
        return g;
    }

    // --- Izquierda: puntaje y meta ---------------------------------------------

    buildLeft () {
        const scene = this.scene;
        this.panel(8, 8, 262, 112);

        // Sin rótulo "PUNTAJE": el número grande se explica solo.
        this.scoreText = this.text(22, 44, '0', 38, '#ffffff', { stroke: 6 });

        this.quotaText = this.text(22, 82, '', 15, '#cccccc', { stroke: 3 });
        this.quotaBar = this.fix(scene.add.graphics());
        this.drawQuotaBar(0, false);
    }

    drawQuotaBar (fraction, met) {
        const color = met ? 0x00ff88 : 0x00d1b2;
        drawBar(this.quotaBar, 22, 100, 234, 12, fraction, color);

        // Marcador de la meta al final de la barra.
        this.quotaBar.fillStyle(met ? 0x00ff88 : 0xffdd44, 1)
            .fillTriangle(256, 94, 262, 106, 250, 106);
    }

    setScore (value) {
        this.updateRank(value);

        if (value === this.scoreTarget) {
            return;
        }

        const gained = value > this.scoreTarget;
        this.scoreTarget = value;
        this.scoreAnim.v = this.scoreShown;
        this.scoreTween?.stop();

        // Los números suben de a poco en vez de saltar.
        this.scoreTween = this.scene.tweens.add({
            targets: this.scoreAnim,
            v: value,
            duration: Math.min(450, 120 + Math.abs(value - this.scoreShown) * 4),
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                this.scoreShown = Math.round(this.scoreAnim.v);
                this.scoreText.setText(String(this.scoreShown));
            },
            onComplete: () => {
                this.scoreShown = value;
                this.scoreText.setText(String(value));
            }
        });

        if (gained) {
            this.pop(this.scoreText, 1.18);
        }
    }

    setQuota (collected, quota) {
        const met = collected >= quota;
        const progressed = collected > this.quotaState.collected;
        this.quotaState = { collected, quota };

        this.quotaText.setText(`${met ? '✓ ' : ''}${Lang.t('hudQuota', { c: collected, q: quota })}`);
        this.quotaText.setColor(met ? '#00ff88' : '#cccccc');
        this.drawQuotaBar(quota > 0 ? collected / quota : 0, met);

        if (met && !this.quotaMet) {
            this.pop(this.quotaText, 1.4);
            this.flash(8, 8, 262, 112, 0x00ff88);
        } else if (progressed) {
            this.pop(this.quotaText, 1.12);
        }

        this.quotaMet = met;
    }

    // --- Centro: reloj y combo -------------------------------------------------

    buildTimer () {
        const { timerX: x, timerY: y, timerRadius: r } = HUD_CONFIG;
        const disc = this.fix(this.scene.add.graphics());
        disc.fillStyle(0x0b0919, 0.7).fillCircle(x, y, r + 8);
        disc.lineStyle(2, 0x2a2a5a, 0.9).strokeCircle(x, y, r + 8);

        this.timerRing = this.fix(this.scene.add.graphics());
        this.timerText = this.text(x, y, '1:00', 30, this.normalColor, { originX: 0.5, stroke: 6 });
        this.drawTimerRing(1, 0xffffff);
    }

    drawTimerRing (fraction, color) {
        const { timerX: x, timerY: y, timerRadius: r } = HUD_CONFIG;
        const g = this.timerRing.clear();
        g.lineStyle(7, 0x0e0c1f, 1).strokeCircle(x, y, r);
        drawArc(g, x, y, r, 7, fraction, color);
    }

    // Hacia dónde vuelan los orbes al recoger: el puntaje y el reloj (coordenadas de pantalla).
    get scoreAnchor() {
        return { x: this.scoreText.x + 32, y: this.scoreText.y };
    }

    get timerAnchor() {
        return { x: HUD_CONFIG.timerX, y: HUD_CONFIG.timerY };
    }

    // Destello de borde (uno por segundo como máximo; respeta "reducir destellos").
    pulseEdge (color = 0xff2233) {
        if (this.scene.camFx.reduceFlash) {
            return;
        }

        this.edgePulseGfx.clear().lineStyle(18, color, 0.55).strokeRect(0, 0, 1024, 768);
        this.scene.tweens.killTweensOf(this.edgePulseGfx);
        this.edgePulseGfx.setAlpha(1);
        this.scene.tweens.add({ targets: this.edgePulseGfx, alpha: 0, duration: 420, ease: 'Quad.easeOut' });
    }

    // Frenesí: borde dorado respirando.
    setFrenzy (on) {
        this.frenzyTween?.stop();
        this.frenzyTween = null;
        this.frenzyGfx.setVisible(on);

        if (on && this.scene.camFx.reduceFlash) {
            // Sin destellos: el borde queda fijo, sin respirar.
            this.frenzyGfx.setAlpha(0.5);
        } else if (on) {
            this.frenzyGfx.setAlpha(0.35);
            this.frenzyTween = this.scene.tweens.add({
                targets: this.frenzyGfx, alpha: 1, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }
    }

    setTimerTotal (totalSeconds) {
        this.timerTotal = Math.max(totalSeconds, 1);
    }

    formatTime (seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    }

    setTime (seconds) {
        this.timerText.setText(this.formatTime(seconds));

        // El anillo se vacía con el tiempo y cambia de color con la urgencia.
        const fraction = Math.max(Math.min(seconds / this.timerTotal, 1), 0);

        if (seconds <= HUD_CONFIG.criticalTimeThreshold) {
            this.timerText.setColor(this.criticalColor);
            this.drawTimerRing(fraction, 0xff4455);
            this.startPulse();
            this.updateVignette(1);
        } else if (seconds <= HUD_CONFIG.lowTimeThreshold) {
            this.timerText.setColor(this.lowColor);
            this.drawTimerRing(fraction, 0xffdd44);
            this.stopPulse();
            this.updateVignette(0.5);
        } else {
            this.timerText.setColor(this.normalColor);
            this.drawTimerRing(fraction, 0xffffff);
            this.stopPulse();
            this.updateVignette(0);
        }
    }

    buildCombo () {
        const scene = this.scene;
        this.comboBg = this.fix(scene.add.graphics()).setVisible(false);
        this.comboBar = this.fix(scene.add.graphics()).setVisible(false);
        this.comboText = this.text(512, 124, 'x2', 24, '#ffdd44', { originX: 0.5, stroke: 6 }).setVisible(false);

        this.airBg = this.fix(scene.add.graphics()).setVisible(false);
        this.airText = this.text(512, 160, '', 14, '#66ff88', { originX: 0.5, stroke: 3 }).setVisible(false);
    }

    drawComboChip (color) {
        this.comboBg.clear();
        this.comboBg.fillStyle(0x0b0919, 0.75).fillRoundedRect(452, 108, 120, 38, 12);
        this.comboBg.lineStyle(2, color, 1).strokeRoundedRect(452, 108, 120, 38, 12);
    }

    setMultiplier (multiplier) {
        if (multiplier <= 1) {
            this.comboText.setVisible(false);
            this.comboBg.setVisible(false);
            this.comboBar.setVisible(false);
            this.stopComboScale();
            this.lastMult = 1;
            return;
        }

        // Subir de combo pega un sacudón chico y cambia de color por nivel.
        if (multiplier > this.lastMult) {
            this.scene.camFx.shake('combo');
        }

        this.lastMult = multiplier;
        const color = COMBO_COLORS[multiplier] ?? 0xffdd44;
        this.drawComboChip(color);
        this.comboBg.setVisible(true);
        this.comboBar.setVisible(true);
        this.comboText.setText(`COMBO x${multiplier}`).setColor(hex(color)).setFontSize(20).setVisible(true);

        this.stopComboScale();
        this.comboText.setScale(1.4);

        this.comboTextScaleTween = this.scene.tweens.add({
            targets: this.comboText,
            scale: 1,
            duration: 200,
            ease: 'Quad.easeOut'
        });
    }

    // Tiempo que le queda al combo (1 → 0). Al agotarse el chip se apaga.
    setComboTimer (fraction) {
        if (this.lastMult <= 1) {
            return;
        }

        if (fraction <= 0) {
            this.setMultiplier(1);
            return;
        }

        const color = COMBO_COLORS[this.lastMult] ?? 0xffdd44;
        drawBar(this.comboBar, 462, 135, 100, 6, fraction, fraction < 0.25 ? 0xff4455 : color);

        // Por vencer: el chip parpadea despacio (≈1,5 Hz, lejos del umbral de fotosensibilidad).
        const blink = fraction < 0.25 && Math.floor(this.scene.time.now / 330) % 2 === 0;
        this.comboBg.setAlpha(blink ? 0.35 : 1);
    }

    // Detiene el tween de escala anterior: si no, se acumulan sobre el mismo
    // objetivo y la animación de "pop" se pisa a sí misma.
    stopComboScale () {
        if (this.comboTextScaleTween) {
            this.comboTextScaleTween.stop();
            this.comboTextScaleTween = null;
        }

        this.comboText.setScale(1);
    }

    setAirStreak (streak) {
        if (streak > 0) {
            this.airText.setText(Lang.t('hudAir', { n: streak })).setVisible(true);
            const w = this.airText.width + 24;
            this.airBg.clear().setVisible(true);
            this.airBg.fillStyle(0x0b0919, 0.7).fillRoundedRect(512 - w / 2, 148, w, 24, 12);
            this.airBg.lineStyle(2, 0x66ff88, 0.9).strokeRoundedRect(512 - w / 2, 148, w, 24, 12);
            return;
        }

        this.airText.setVisible(false);
        this.airBg.setVisible(false);
    }

    // Viñeta difuminada por capas (no un rectángulo duro): crece al acabarse el tiempo.
    drawVignette (strength) {
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

    updateVignette (strength) {
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

    startPulse () {
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

    stopPulse () {
        if (this.timerPulse) {
            this.timerPulse.stop();
            this.timerPulse = null;
            this.timerText.setScale(1);
        }
    }

    // --- Derecha: nivel y rango -----------------------------------------------

    buildRight () {
        this.panel(754, 8, 262, 112);

        this.levelText = this.text(1002, 26, 'Nivel 1/1', 20, '#ffffff', { originX: 1, stroke: 5 });
        this.rankText = this.text(1002, 58, '', 15, '#aaaaaa', { originX: 1, stroke: 3 });
        this.rankBar = this.fix(this.scene.add.graphics());
        this.rankMarks = this.fix(this.scene.add.graphics());
        this.drawRankBar(0, 0x888888);
    }

    drawRankBar (fraction, color) {
        drawBar(this.rankBar, 768, 84, 234, 12, fraction, color);
    }

    setLevel (current, total) {
        this.levelText.setText(Lang.t('hudLevel', { c: current, t: total }));
    }

    // Marcas de bronce, plata y oro sobre la barra de rango.
    setRankThresholds (thresholds) {
        this.rankThresholds = thresholds;
        const g = this.rankMarks.clear();

        RANK_ORDER.forEach((rank, i) => {
            const x = 768 + 234 * (thresholds[rank] / thresholds.gold);
            const big = i === RANK_ORDER.length - 1;
            g.fillStyle(0x000000, 0.6).fillCircle(x - (big ? 3 : 0), 90, 8);
            g.fillStyle(RANK_COLORS[rank], 1).fillCircle(x - (big ? 3 : 0), 90, 6);
        });
    }

    updateRank (score) {
        if (!this.rankThresholds) return;

        const rank = rankFor(score, this.rankThresholds);
        const color = rank ? RANK_COLORS[rank] : 0x888888;
        const index = rank ? RANK_ORDER.indexOf(rank) : -1;

        this.rankText.setText(`${Lang.t('rankLabel')}: ${Lang.t(`rank_${rank ?? 'none'}`)}`);
        this.rankText.setColor(rank ? hex(color) : '#aaaaaa');
        this.drawRankBar(Math.min(score / this.rankThresholds.gold, 1), color);

        // Subir de medalla: pop, destello y sonido.
        if (this.rankAnnounced && index > this.lastRankIndex) {
            this.pop(this.rankText, 1.35);
            this.flash(754, 8, 262, 112, color);
            Audio.play('perfect');
        }

        this.lastRankIndex = index;
        this.rankAnnounced = true;
    }

    // --- Habilidades -----------------------------------------------------------

    buildAbilities () {
        const scene = this.scene;
        const y = 728;

        // Dash.
        this.dashRing = this.fix(scene.add.graphics());
        this.dashIcon = this.fix(scene.add.graphics());
        this.dashPos = { x: 40, y };
        this.dashLabel = this.text(40, y + 27, 'SHIFT', 11, '#aaaacc', { originX: 0.5, stroke: 2 });

        // Escudo: solo aparece mientras está activo.
        this.shieldPos = { x: 92, y };
        this.shieldRing = this.fix(scene.add.graphics()).setVisible(false);
        this.shieldIcon = this.fix(scene.add.graphics()).setVisible(false);

        this.setDashCooldown(0, 1);
    }

    drawAbilityBase (g, x, y) {
        g.fillStyle(0x0b0919, 0.85).fillCircle(x, y, 22);
        g.lineStyle(4, 0x0e0c1f, 1).strokeCircle(x, y, 19);
    }

    // Indicador del dash: el anillo se llena mientras recarga y brilla al estar listo.
    setDashCooldown (remainingMs, totalMs) {
        const ready = remainingMs <= 0;
        const fraction = ready ? 1 : Math.max(Math.min(1 - remainingMs / totalMs, 1), 0);
        const { x, y } = this.dashPos;
        const color = ready ? 0xffaa44 : 0x777777;

        this.dashRing.clear();
        this.drawAbilityBase(this.dashRing, x, y);
        drawArc(this.dashRing, x, y, 19, 4, fraction, color);

        // Dos chevrones »
        this.dashIcon.clear().lineStyle(3, color, 1);
        for (const dx of [-6, 3]) {
            this.dashIcon.beginPath();
            this.dashIcon.moveTo(x + dx - 3, y - 7);
            this.dashIcon.lineTo(x + dx + 4, y);
            this.dashIcon.lineTo(x + dx - 3, y + 7);
            this.dashIcon.strokePath();
        }

        this.dashLabel.setColor(ready ? '#ffaa44' : '#555566');

        if (ready && !this.dashReady) {
            this.flash(x - 26, y - 26, 52, 52, 0xffaa44, 26);
        }

        this.dashReady = ready;
    }

    setShield (remainingMs, totalMs) {
        const active = remainingMs > 0;
        const { x, y } = this.shieldPos;

        this.shieldRing.setVisible(active);
        this.shieldIcon.setVisible(active);

        if (!active) {
            this.shieldActive = false;
            return;
        }

        const fraction = Math.max(Math.min(remainingMs / totalMs, 1), 0);
        const color = fraction < 0.25 ? 0xff4455 : 0x2dd4ff;

        this.shieldRing.clear();
        this.drawAbilityBase(this.shieldRing, x, y);
        drawArc(this.shieldRing, x, y, 19, 4, fraction, color);

        // Escudo: silueta de blasón.
        this.shieldIcon.clear().fillStyle(color, 1);
        this.shieldIcon.fillPoints([
            { x: x - 8, y: y - 8 }, { x: x + 8, y: y - 8 }, { x: x + 8, y: y + 1 },
            { x, y: y + 10 }, { x: x - 8, y: y + 1 }
        ], true);

        if (!this.shieldActive) {
            this.shieldActive = true;
            this.flash(x - 26, y - 26, 52, 52, 0x2dd4ff, 26);
        }
    }

    // --- Efectos ---------------------------------------------------------------

    // Pop de escala para textos (crece de golpe y vuelve a 1).
    pop (text, scale) {
        text.setScale(scale);
        this.scene.tweens.add({
            targets: text, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.easeOut'
        });
    }

    // Destello rectangular que se apaga (feedback de logros del HUD).
    flash (x, y, w, h, color, radius = 14) {
        const g = this.fix(this.scene.add.graphics());
        g.fillStyle(color, 0.45).fillRoundedRect(x, y, w, h, radius);
        this.scene.tweens.add({
            targets: g, alpha: 0, duration: 480, ease: 'Quad.easeOut',
            onComplete: () => g.destroy()
        });
    }

    // Flecha que rebota sobre la salida cuando se abre.
    showExitMarker (x, y) {
        const scene = this.scene;
        const top = Math.max(y - 78, 70);
        const arrow = this.fix(scene.add.graphics());
        arrow.fillStyle(0x00ff88, 1).fillTriangle(-14, 0, 14, 0, 0, 18);
        arrow.lineStyle(3, 0x000000, 0.5).strokeTriangle(-14, 0, 14, 0, 0, 18);
        const label = this.text(0, -16, Lang.t('hudExit'), 16, '#00ff88', { originX: 0.5, stroke: 5 });

        const marker = scene.add.container(x, top, [arrow, label]).setScrollFactor(0).setDepth(DEPTH);
        scene.tweens.add({ targets: marker, y: top + 12, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.exitMarker = marker;
    }
}
