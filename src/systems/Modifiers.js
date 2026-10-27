// Modo modificadores (GDD §9): cada nivel sortea 1 modificador (2 con 5 %) que lo
// endurece y suma un bonus al puntaje del nivel. Sin Phaser: se testea con node.
export const TWO_MODIFIERS_CHANCE = 0.05;

export const MODIFIERS = {
    shortClock: { bonus: 0.15, applies: () => true },
    burst: { bonus: 0.20, applies: (cfg) => Boolean(cfg.projectiles) },
    slowDash: { bonus: 0.10, applies: () => true },
    fragileCombo: { bonus: 0.15, applies: () => true },
    singlePoint: { bonus: 0.10, applies: () => true },
    highGoal: { bonus: 0.15, applies: () => true }
};

// Pares que se anulan entre sí: el reloj corto con la meta alta vuelve el nivel imposible.
const CLASHES = [['shortClock', 'highGoal']];

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

// Copia del config del nivel con los efectos sobre duración, meta y proyectiles.
export function applyToConfig(levelConfig, ids) {
    const cfg = { ...levelConfig };

    if (ids.includes('shortClock')) {
        cfg.durationSeconds = Math.round(cfg.durationSeconds * 0.75);
    }

    if (ids.includes('highGoal')) {
        cfg.quota = Math.ceil(cfg.quota * 1.25);
    }

    if (ids.includes('burst') && cfg.projectiles) {
        cfg.projectiles = {
            ...cfg.projectiles,
            initialInterval: Math.round(cfg.projectiles.initialInterval * 0.7),
            minInterval: Math.round(cfg.projectiles.minInterval * 0.7)
        };
    }

    return cfg;
}
