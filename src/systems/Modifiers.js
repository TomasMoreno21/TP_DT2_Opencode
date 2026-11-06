// Modo modificadores (GDD §9): cada nivel sortea 1 modificador (2 con 5 %) que lo
// endurece y suma un bonus al puntaje del nivel. Sin Phaser: se testea con node.
import { HAZARD_CONFIG } from '../entities/Hazard.js';

export const TWO_MODIFIERS_CHANCE = 0.05;

// Los efectos de Game/Player/Fog (moon, noDash, slowDash, singlePoint, fleeting, fog) se aplican en Game.js.
export const MODIFIERS = {
    shortClock: { bonus: 0.20, applies: () => true },
    slowDash: { bonus: 0.15, applies: () => true },
    singlePoint: { bonus: 0.15, applies: () => true },
    highGoal: { bonus: 0.20, applies: () => true },
    moon: { bonus: 0.15, applies: () => true },
    noDash: { bonus: 0.20, applies: () => true },
    fleeting: { bonus: 0.20, applies: () => true },
    fastSpikes: { bonus: 0.15, applies: (cfg) => Boolean(cfg.hazards?.length) },
    fog: { bonus: 0.25, applies: () => true }
};

// Pares que se anulan entre sí o vuelven el nivel imposible.
const CLASHES = [
    ['shortClock', 'highGoal'],
    ['noDash', 'slowDash'],
    ['fog', 'fleeting'],
    ['fog', 'singlePoint']
];

export function rollModifiers(levelConfig, rng = Math.random) {
    const pool = Object.keys(MODIFIERS).filter((id) => MODIFIERS[id].applies(levelConfig));
    const picked = [pool[Math.floor(rng() * pool.length)]];

    if (rng() < TWO_MODIFIERS_CHANCE) {
        const rest = pool.filter((id) => id !== picked[0]
            && !CLASHES.some(([a, b]) => (a === picked[0] && b === id) || (b === picked[0] && a === id)));

        if (rest.length) {
            picked.push(rest[Math.floor(rng() * rest.length)]);
        }
    }

    return picked;
}

export const bonusOf = (ids) => ids.reduce((sum, id) => sum + MODIFIERS[id].bonus, 0);

// Copia del config del nivel con los efectos sobre duración, meta y pinchos.
export function applyToConfig(levelConfig, ids) {
    const cfg = { ...levelConfig };

    if (ids.includes('shortClock')) {
        cfg.durationSeconds = Math.round(cfg.durationSeconds * 0.65);
    }

    if (ids.includes('highGoal')) {
        cfg.quota = Math.ceil(cfg.quota * 1.4);
    }

    // Reposo muy corto; el aviso (warnMs) se conserva para que siga siendo justo.
    if (ids.includes('fastSpikes') && cfg.hazards) {
        cfg.hazards = cfg.hazards.map((h) => ({ ...h, restMs: Math.round((h.restMs ?? HAZARD_CONFIG.restMs) * 0.3) }));
    }

    return cfg;
}
