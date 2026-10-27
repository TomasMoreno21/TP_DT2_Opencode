// Identidad visual por nivel (docs/PLAN_FEEL.md §9, decisión 9.1): datos puros.
// accent: borde de plataformas, grilla y horizonte. wall: borde de las paredes.
// far / mid: color de las siluetas lejanas. ambient: partículas que flotan sobre el fondo
// (color, dy = px/s con signo hacia abajo, sway = vaivén lateral en px, size, count, alpha).
export const THEMES = [
    {
        key: 'cian',
        bgTop: 0x0e2c3d, bgBottom: 0x07131d,
        accent: 0x00d1b2, wall: 0x2dd4ff,
        far: 0x0c4a5e, mid: 0x0a3a4c,
        ambient: { color: 0x2dd4ff, dy: -14, sway: 10, size: 2, count: 26, alpha: 0.5 }
    },
    {
        key: 'violeta',
        bgTop: 0x2b1a52, bgBottom: 0x110826,
        accent: 0xb07bff, wall: 0xff7be8,
        far: 0x3b2680, mid: 0x2e1c66,
        ambient: { color: 0xd9b8ff, dy: 18, sway: 18, size: 2.5, count: 22, alpha: 0.45 }
    },
    {
        key: 'ambar',
        bgTop: 0x3d2410, bgBottom: 0x1a0d05,
        accent: 0xffb02e, wall: 0xff7a2d,
        far: 0x5e3512, mid: 0x4a2a0e,
        ambient: { color: 0xffb02e, dy: -38, sway: 14, size: 2, count: 34, alpha: 0.65 }
    },
    {
        key: 'magenta',
        bgTop: 0x3d0f33, bgBottom: 0x1a0515,
        accent: 0xff4fc3, wall: 0xff9bdc,
        far: 0x6b1a58, mid: 0x521345,
        ambient: { color: 0xff9bdc, dy: -8, sway: 26, size: 3, count: 20, alpha: 0.4 }
    },
    {
        key: 'rojo',
        bgTop: 0x3d0f12, bgBottom: 0x1a0507,
        accent: 0xff4455, wall: 0xff8a66,
        far: 0x5e1a1f, mid: 0x4a1218,
        ambient: { color: 0xff6a55, dy: 46, sway: 8, size: 1.6, count: 40, alpha: 0.6 }
    }
];

export const themeFor = (levelIndex) => THEMES[Math.abs(levelIndex) % THEMES.length];
