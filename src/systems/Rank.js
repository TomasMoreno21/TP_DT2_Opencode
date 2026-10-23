// Rangos por puntaje y bono de tiempo al pisar la salida. Modulo puro (sin
// Phaser) para poder probarlo con node: ver tools/test-rank.mjs.
const STORAGE_KEY = 'fast-move-ranks';

// Segundos que sobran al pisar la salida -> puntos: da una razon para seguir
// sumando en vez de irse apenas se cumple la meta.
export const TIME_BONUS_PER_SECOND = 5;

export const RANK_ORDER = ['bronze', 'silver', 'gold'];
export const RANK_COLORS = { bronze: 0xcd7f32, silver: 0xc0c0c0, gold: 0xffd700 };

// Puntos por unidad de meta que piden bronce, plata y oro (un punto vale 10, asi
// que bronce = x2 sin combo). Escala con la meta de cada nivel (12-16). shortcut: valores sin playtest, ajustar con partidas reales.
const RANK_PER_QUOTA = { bronze: 20, silver: 35, gold: 50 };

export function rankThresholds(quota) {
    const out = {};
    for (const rank of RANK_ORDER) out[rank] = quota * RANK_PER_QUOTA[rank];
    return out;
}

// Mejor rango alcanzado con `score` (null si no llega al bronce).
export function rankFor(score, thresholds) {
    let best = null;
    for (const rank of RANK_ORDER) if (score >= thresholds[rank]) best = rank;
    return best;
}

export class RankStore {
    static all() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    static get(levelId) {
        return RankStore.all()[levelId] ?? null;
    }

    // Guarda solo si mejora el rango del nivel.
    static update(levelId, rank) {
        if (!rank) return;
        const all = RankStore.all();
        if (RANK_ORDER.indexOf(rank) <= RANK_ORDER.indexOf(all[levelId] ?? null)) return;
        all[levelId] = rank;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        } catch {
            // Sin almacenamiento: el rango vale solo para esta sesion.
        }
    }
}
