// Contadores de playtest (docs/PLAN_FEEL.md §12): recolecciones por minuto, tiempo
// entre recolecciones, combo, muertes. Solo se registran en desarrollo; en el build
// de producción todos los métodos salen de inmediato.
const ENABLED = import.meta.env.DEV;

export class Metrics {
    constructor(level) {
        this.level = level;
        this.startedAt = null;
        this.collects = [];
        this.maxCombo = 1;
        this.grazes = 0;
        this.result = null;
    }

    collect(now, combo) {
        if (!ENABLED) return;
        this.startedAt ??= now;
        this.collects.push(now);
        this.maxCombo = Math.max(this.maxCombo, combo);
    }

    finish(now, result) {
        if (!ENABLED || this.result) return;
        this.result = result;
        this.report(now);
    }

    // Mediana de los intervalos entre recolecciones consecutivas (ms), o null.
    get medianGapMs() {
        const gaps = this.collects.slice(1).map((t, i) => t - this.collects[i]).sort((a, b) => a - b);

        return gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;
    }

    report(now) {
        const elapsed = this.startedAt === null ? 0 : (now - this.startedAt) / 1000;
        const perMinute = elapsed > 0 ? Math.round((this.collects.length / elapsed) * 60) : 0;

        console.table({
            [`Nivel ${this.level}`]: {
                resultado: this.result,
                recolecciones: this.collects.length,
                'por minuto': perMinute,
                'mediana entre recolecciones (s)': this.medianGapMs === null ? '-' : (this.medianGapMs / 1000).toFixed(2),
                'combo máx': this.maxCombo
            }
        });
    }
}
