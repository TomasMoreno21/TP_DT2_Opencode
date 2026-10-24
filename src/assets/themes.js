// Identidad visual por nivel (docs/PLAN_FEEL.md §9, decisión 9.1): datos puros.
// accent: borde de plataformas, grilla y horizonte. wall: borde de las paredes.
// far / mid: color de las siluetas lejanas. Hoy hay dos niveles; los demás repiten el ciclo
// y quedan listos para sumar ámbar, magenta y multicolor si la campaña crece.
export const THEMES = [
    {
        key: 'cian',
        bgTop: 0x0e2c3d, bgBottom: 0x07131d,
        accent: 0x00d1b2, wall: 0x2dd4ff,
        far: 0x0c4a5e, mid: 0x0a3a4c
    },
    {
        key: 'violeta',
        bgTop: 0x2b1a52, bgBottom: 0x110826,
        accent: 0xb07bff, wall: 0xff7be8,
        far: 0x3b2680, mid: 0x2e1c66
    }
];

export const themeFor = (levelIndex) => THEMES[Math.abs(levelIndex) % THEMES.length];
