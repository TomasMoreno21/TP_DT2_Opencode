// Contadores de playtest (docs/PLAN_FEEL.md §12 y docs/PLAYTEST_1.md): recolecciones por
// minuto, tiempo entre recolecciones, combo, FPS mínimo y cómo terminó cada nivel. Solo se
// registran en desarrollo o con ?playtest=1 en la URL; fuera de eso todos los métodos salen
// de inmediato. Cada nivel jugado se guarda en localStorage y F9 copia el resumen.
const STORE_KEY = 'fast-move-metrics';
const MAX_RUNS = 40;

export function metricsEnabled() {
    try {
        return Boolean(import.meta.env.DEV) || new URLSearchParams(window.location.search).has('playtest');
    } catch {
        return false;
    }
}

const ENABLED = metricsEnabled();

export class Metrics {
    constructor(level) {
        this.level = level;
        this.startedAt = null;
        this.collects = [];
        this.maxCombo = 1;
        this.minFps = Infinity;
        this.fpsFrom = null;
        this.result = null;
    }

    collect(now, combo) {
        if (!ENABLED) return;
        this.startedAt ??= now;
        this.collects.push(now);
        this.maxCombo = Math.max(this.maxCombo, combo);
    }

    // FPS instantáneo; se ignora el primer segundo (la escena recién arrancó).
    sample(fps, now) {
        if (!ENABLED) return;
        this.fpsFrom ??= now + 1000;

        if (now >= this.fpsFrom && fps > 0) {
            this.minFps = Math.min(this.minFps, fps);
        }
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
        const run = {
            at: new Date().toISOString(),
            level: this.level,
            result: this.result,
            seconds: Math.round(elapsed),
            collects: this.collects.length,
            perMinute,
            medianGap: this.medianGapMs === null ? null : Number((this.medianGapMs / 1000).toFixed(2)),
            maxCombo: this.maxCombo,
            minFps: Number.isFinite(this.minFps) ? Math.round(this.minFps) : null
        };

        console.table({
            [`Nivel ${run.level}`]: {
                resultado: run.result,
                recolecciones: run.collects,
                'por minuto': run.perMinute,
                'mediana entre recolecciones (s)': run.medianGap ?? '-',
                'combo máx': run.maxCombo,
                'FPS mín': run.minFps ?? '-'
            }
        });

        Metrics.save(run);
    }

    // --- Historial en el navegador --------------------------------------------

    static history() {
        try {
            const list = JSON.parse(localStorage.getItem(STORE_KEY));

            return Array.isArray(list) ? list : [];
        } catch {
            return [];
        }
    }

    static save(run) {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify([...Metrics.history(), run].slice(-MAX_RUNS)));
        } catch {
            // Sin almacenamiento: queda solo en la consola.
        }
    }

    static clear() {
        try {
            localStorage.removeItem(STORE_KEY);
        } catch {
            // Ignorar.
        }
    }

    // Resumen en texto para pegar en el chat o en el formulario (F9 lo copia).
    static exportText() {
        const runs = Metrics.history();

        if (runs.length === 0) {
            return 'Sin partidas registradas todavía.';
        }

        const lines = [`MÉTRICAS DE PLAYTEST · ${runs.length} niveles jugados · ${new Date().toLocaleString('es-AR')}`];

        for (const r of runs) {
            lines.push(`N${r.level} · ${r.result} · ${r.seconds}s · ${r.collects} rec (${r.perMinute}/min) · mediana ${r.medianGap ?? '-'}s · combo x${r.maxCombo} · FPS mín ${r.minFps ?? '-'}`);
        }

        const total = runs.reduce((n, r) => n + r.collects, 0);
        const wins = runs.filter((r) => r.result === 'nivel superado').length;

        lines.push(`Total: ${total} recolecciones · ${wins} niveles superados · ${runs.length - wins} derrotas`);

        return lines.join('\n');
    }
}
