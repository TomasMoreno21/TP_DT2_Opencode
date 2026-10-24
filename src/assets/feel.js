// Constantes de "feel" (game feel) en un solo lugar: duraciones de hitstop, cámara,
// partículas. Son datos puros; cada fase del plan (docs/PLAN_FEEL.md) agrega las suyas.
// Los valores de J0 reproducen exactamente lo que estaba escrito a mano en Game y Hud.
export const FEEL = {
    // Congelación del mundo (ms).
    hitstop: { point: 30, gem: 30, death: 80 },

    // Cámara lenta [duración ms, factor de tiempo].
    slowmo: { death: { ms: 700, factor: 0.35 } },

    // Sacudidas de cámara [duración ms, intensidad].
    shake: {
        dash: [90, 0.0035],
        shield: [160, 0.008],
        death: [400, 0.02],
        goal: [150, 0.006],
        combo: [70, 0.002]
    },

    // Zoom por combo.
    zoom: { comboHigh: 1.03, comboMultiplier: 4, ms: 300, punch: 1.018, punchMs: 80 },

    // Efectos de partículas.
    fx: { burstCount: 10, burstLifespan: 400, ringRadius: 56, ringMs: 220, maxGhosts: 24, maxRings: 16, maxStreaks: 24 },

    // Bloom de pantalla completa (filtro de Phaser 4): sutil, solo realza lo brillante.
    bloom: { threshold: 0.6, blurRadius: 2, blurSteps: 3, blurQuality: 0, blendAmount: 0.7 }
};
