// Constantes de "feel" (game feel) en un solo lugar: duraciones de hitstop, cámara,
// partículas. Son datos puros; cada fase del plan (docs/PLAN_FEEL.md) agrega las suyas.
// Los valores de J0 reproducen exactamente lo que estaba escrito a mano en Game y Hud.
export const FEEL = {
    // Congelación del mundo (ms).
    // Hitstop del punto por multiplicador x1..x5: a combo alto se acorta y en x5 lo
    // reemplaza un punch de zoom (el juego fluye en vez de ir a golpes).
    hitstop: { point: [34, 28, 22, 14, 0], gem: 30, death: 80 },

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

    // Dash: ventana de buffer (ms) para no perder un Shift apretado un instante antes de tiempo.
    dash: { bufferMs: 120 },

    // Feedback del jugador (docs/PLAN_FEEL.md §5).
    player: {
        runDustEveryMs: 110,
        runDustMinK: 0.55,
        speedGhostEveryMs: 80,
        speedGhostAlpha: 0.14,
        skidEveryMs: 60,
        skidMinK: 0.4,
        landMinVy: 120,
        alertDistance: 160,
        happyMs: 400,
        panicSeconds: 5
    },

    // Tensión 0..1 (docs/PLAN_FEEL.md §7.1): pesos de reloj, combo, proyectiles y meta.
    tension: { wTime: 0.45, wCombo: 0.25, wProj: 0.2, wQuota: 0.1, smooth: 0.08 },

    // Música procedural: volumen moderado (0..1) y fundidos (ms).
    music: { volume: 0.6, fadeInMs: 600, fadeOutMs: 400, dieMs: 700 },

    // Efectos de partículas.
    fx: { burstCount: 10, burstLifespan: 400, ringRadius: 56, ringMs: 220, maxGhosts: 24, maxRings: 16, maxStreaks: 24, maxOrbs: 12, maxFrags: 24, maxArrows: 4 },

    // Bloom de pantalla completa (filtro de Phaser 4): sutil, solo realza lo brillante.
    bloom: { threshold: 0.6, blurRadius: 2, blurSteps: 3, blurQuality: 0, blendAmount: 0.7 }
};
