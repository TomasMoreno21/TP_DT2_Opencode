export const HAZARD_CONFIG = {
    height: 8,
    restMs: 1300,
    warnMs: 900,
    extendedMs: 900,
    spikeHeight: 26,
    spikeCount: 5,
    plateColor: 0x3f2f44,
    warnColor: 0xffaa44,
    dangerColor: 0xff4455,
    safeColor: 0x554455
};

// Pincho cíclico: aviso (temblor) -> extendido (daño) -> retraído (seguro).
export class Hazard {
    constructor(scene, data) {
        this.scene = scene;
        this.x = data.x;
        this.y = data.y;
        this.width = data.w ?? 120;
        this.restMs = data.restMs ?? HAZARD_CONFIG.restMs;
        this.warnMs = data.warnMs ?? HAZARD_CONFIG.warnMs;
        this.extendedMs = data.extendedMs ?? HAZARD_CONFIG.extendedMs;
        this.offsetMs = data.offsetMs ?? 0;
        this.cycleMs = this.restMs + this.warnMs + this.extendedMs;

        this.rect = scene.add.rectangle(this.x, this.y, this.width, HAZARD_CONFIG.height, HAZARD_CONFIG.plateColor);
        this.rect.setStrokeStyle(1, 0x1a1a2e);

        // Cuerpo estático: solo produce daño en la fase extendida.
        scene.physics.add.existing(this.rect, true);
        this.body = this.rect.body;
        this.body.enable = false;

        this.graphics = scene.add.graphics();
        this.selectedPhase = null;
    }

    get phase() {
        const t = (this.scene.time.now + this.offsetMs) % this.cycleMs;

        if (t < this.restMs) {
            return { name: 'rest', t };
        }

        if (t < this.restMs + this.warnMs) {
            return { name: 'warn', t: t - this.restMs };
        }

        return { name: 'active', t: t - this.restMs - this.warnMs };
    }

    get isDangerous() {
        return this.body.enable;
    }

    update() {
        const phase = this.phase;
        this.body.enable = phase.name === 'active';

        // Flash blanco al momento de extenderse.
        if (phase.name === 'active' && this.selectedPhase !== 'active') {
            const flash = this.scene.add.rectangle(this.x, this.y - HAZARD_CONFIG.spikeHeight / 2,
                this.width, HAZARD_CONFIG.spikeHeight + 10, 0xffffff, 0.55);
            this.scene.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 220,
                ease: 'Quad.easeOut',
                onComplete: () => flash.destroy()
            });
        }

        this.selectedPhase = phase.name;
        this.draw(phase);
    }

    draw(phase) {
        const g = this.graphics.clear();
        const cfg = HAZARD_CONFIG;
        const half = this.width / 2;
        const baseY = this.y - cfg.height / 2;
        const step = this.width / cfg.spikeCount;
        const stub = 6;
        const full = cfg.spikeHeight;
        const p = phase.name === 'warn' ? Math.min(phase.t / this.warnMs, 1) : 0;

        let h = stub;
        let tone = cfg.safeColor;
        let light = 0x8a7a92;
        let tremble = 0;

        if (phase.name === 'rest' && phase.t < 160) {
            // Retracción suave tras el golpe en lugar de desaparecer de golpe.
            const k = 1 - phase.t / 160;
            h = stub + (full - stub) * k * k;
            tone = mix(cfg.safeColor, cfg.dangerColor, k);
            light = mix(light, 0xff8a94, k);
        } else if (phase.name === 'warn') {
            h = stub + (full * 0.55 - stub) * (1 - (1 - p) * (1 - p));
            const pulse = 0.5 + 0.5 * Math.sin(phase.t * (0.02 + 0.07 * p));
            tone = mix(cfg.safeColor, cfg.warnColor, Math.min(1, 0.35 + 0.65 * p) * (0.7 + 0.3 * pulse));
            light = mix(0xb8a8c0, 0xffffff, pulse * p);
            tremble = Math.sin(phase.t / 40) * 3 * p;
        } else if (phase.name === 'active') {
            // Golpe con rebote: sobrepasa un poco la altura y se asienta.
            h = full * (1 + 0.2 * Math.sin(Math.PI * Math.min(phase.t / 140, 1)));
            tone = cfg.dangerColor;
            light = 0xff8a94;
        }

        g.fillStyle(cfg.plateColor, 1);
        g.fillRect(this.x - half, baseY, this.width, cfg.height);

        if (phase.name === 'warn') {
            // Barra de carga en la placa + silueta fantasma del alcance real.
            g.fillStyle(cfg.warnColor, 0.9);
            g.fillRect(this.x - half, baseY + 2, this.width * p, cfg.height - 4);
            g.fillStyle(cfg.warnColor, 0.08 + 0.12 * p);
            g.fillRect(this.x - half, baseY - stub - full, this.width, stub + full);
        } else if (phase.name === 'active') {
            g.fillStyle(cfg.dangerColor, 0.9);
            g.fillRect(this.x - half, baseY + 2, this.width, cfg.height - 4);
            g.fillStyle(cfg.dangerColor, 0.14);
            g.fillRect(this.x - half, baseY - stub - full, this.width, stub + full);
        }

        for (let i = 0; i < cfg.spikeCount; i++) {
            const cx = this.x - half + step * (i + 0.5) + tremble;
            const topY = baseY - h;
            const w = 7;

            if (phase.name === 'warn') {
                g.lineStyle(1, cfg.warnColor, 0.25 + 0.45 * p);
                g.strokeTriangle(cx - w, baseY, cx + w, baseY, cx, baseY - stub - full);
            }

            // Dos tonos: cara iluminada a la izquierda, sombra a la derecha.
            g.fillStyle(light, 1);
            g.fillTriangle(cx - w, baseY, cx, baseY, cx, topY);
            g.fillStyle(tone, 1);
            g.fillTriangle(cx, baseY, cx + w, baseY, cx, topY);

            if (phase.name === 'active') {
                g.fillStyle(0xffffff, 0.9);
                g.fillCircle(cx, topY + 2, 1.5);
            }
        }
    }
}

function mix(a, b, t) {
    const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
