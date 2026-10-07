export const HAZARD_CONFIG = {
    height: 8,
    restMs: 1300,
    warnMs: 500,
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
        const half = this.width / 2;
        const baseY = this.y - HAZARD_CONFIG.height / 2;
        const step = this.width / HAZARD_CONFIG.spikeCount;

        g.fillStyle(HAZARD_CONFIG.plateColor, 1);
        g.fillRect(this.x - half, baseY, this.width, HAZARD_CONFIG.height);

        for (let i = 0; i < HAZARD_CONFIG.spikeCount; i++) {
            const cx = this.x - half + step * (i + 0.5);
            let topY = baseY - 6;
            let color = HAZARD_CONFIG.safeColor;
            let tremble = 0;

            if (phase.name === 'warn') {
                const grow = 0.35 + 0.65 * Math.min(phase.t / this.warnMs, 1);
                topY = baseY - 6 - HAZARD_CONFIG.spikeHeight * grow;
                // Aviso gritón: parpadeo blanco/naranja que se acelera al final.
                const blinkRate = phase.t > this.warnMs * 0.6 ? 60 : 110;
                color = Math.sin(phase.t / blinkRate) > 0 ? 0xffffff : HAZARD_CONFIG.warnColor;
                // Oscilación derivada del tiempo de fase, no aleatoria: el aviso
                // debe verse igual en cada frame en lugar de parpadear al azar.
                tremble = Math.sin(phase.t / 45) * 4 * Math.min(phase.t / this.warnMs, 1);
            } else if (phase.name === 'active') {
                topY = baseY - 6 - HAZARD_CONFIG.spikeHeight;
                color = HAZARD_CONFIG.dangerColor;
            }

            g.fillStyle(color, 1);
            g.fillTriangle(cx - 6 + tremble, baseY, cx + 6 + tremble, baseY, cx + tremble, topY);
        }
    }
}