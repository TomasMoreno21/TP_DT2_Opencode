// Logros de desempeño (GDD §9). Módulo puro (sin Phaser) para poder probarlo
// con node: ver tools/test-achievements.mjs.
const STORAGE_KEY = 'fastMoveAchievements';

export const AIR_STREAK_TARGET = 5;
export const SPEEDSTER_RATIO = 0.5;
export const COLLECTOR_TARGET = 1000;

export const ACHIEVEMENTS = [
    { id: 'noDeaths' },
    { id: 'maxCombo' },
    { id: 'champion' },
    { id: 'gold' },
    { id: 'goldAll' },
    { id: 'airborne' },
    { id: 'speedster' },
    { id: 'collector', target: COLLECTOR_TARGET }
];

// Hitos que se deciden al pisar la salida; devuelve los ids cumplidos.
export function evaluateLevel({ deaths, maxMult, rank, remainingRatio }) {
    const done = [];
    if (deaths === 0) done.push('noDeaths');
    if (maxMult >= 5) done.push('maxCombo');
    if (rank === 'gold') done.push('gold');
    if (remainingRatio >= SPEEDSTER_RATIO) done.push('speedster');
    return done;
}

// `ranks` es lo que devuelve RankStore.all() (claves 1..levelCount).
export function goldInAllLevels(ranks, levelCount) {
    for (let level = 1; level <= levelCount; level++) {
        if (ranks[level] !== 'gold') return false;
    }
    return true;
}

function load() {
    const empty = { unlocked: [], points: 0 };

    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!saved || typeof saved !== 'object') return empty;

        return {
            unlocked: Array.isArray(saved.unlocked) ? saved.unlocked : [],
            points: Number.isFinite(saved.points) ? saved.points : 0
        };
    } catch {
        return empty;
    }
}

function save(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Sin almacenamiento: el logro vale solo para esta sesión.
    }
}

export class AchievementStore {
    static has(id) {
        return load().unlocked.includes(id);
    }

    // true solo la primera vez (para mostrar el aviso).
    static unlock(id) {
        const state = load();

        if (state.unlocked.includes(id)) return false;

        save({ ...state, unlocked: [...state.unlocked, id] });
        return true;
    }

    static points() {
        return load().points;
    }

    // Suma puntos al acumulado; true si esta suma desbloqueó "collector".
    static addPoints(n) {
        if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return false;

        const state = load();
        save({ ...state, points: state.points + n });

        return state.points + n >= COLLECTOR_TARGET && AchievementStore.unlock('collector');
    }

    static progress(id) {
        const def = ACHIEVEMENTS.find((a) => a.id === id);

        if (!def?.target) return null;

        return { value: Math.min(AchievementStore.points(), def.target), target: def.target };
    }
}
