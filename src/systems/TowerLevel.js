import { WORLD } from '../assets/levels.js';
import { createRng } from './LevelGenerator.js';

// px/s con los que sube el escenario en el primer intento; cada muerte lo baja un 10 % (hasta 3 veces).
// Con 76 un salto ideal deja ~1.4x de holgura (tools/tower-pace.mjs): hay que ir sin pausas pero sin ser perfecto.
const SCROLL_SPEED = 76;
const PLAT_H = 20;
const COLOR = 0x3a3a5c;
const FLOOR_H = 56;
const SIDE = 50;
const WARMUP_ROWS = 3;
const TOP_MARGIN = 300;
// Saltos: el apex de un salto normal es 139 px y el de un trampolín 213 px; en horizontal se llega a
// ~280 px de hueco corriendo y a ~340 con dash.
const LONG_GAP = 280;
const MAX_GAP = 340;
const BOUNCE_RISE = [165, 190];
const TRAMPOLINE_W = 56;
const TRAMPOLINE_MIN_W = 100;
const SPIKE_MIN_W = 110;
const SPIKE_EXIT_GAP = 190;
const SHIELD_EVERY = 900;
const FRAGILE_RUN_MAX = 3;
// Ciclo de los pinchos de la torre: más tiempo seguro que el de los otros niveles (71 % -> 79 %), porque
// cubren toda la plataforma y hay que poder aterrizar y salir.
const SPIKE_CYCLE = { restMs: 1700, warnMs: 900, extendedMs: 700 };

// Estilos de sección (5-8 filas cada una). `gap`: hueco entre bordes de plataformas; `dir`: 'alt' va
// y vuelve, 'run' sigue de largo hasta la pared; `long`: alterna saltos largos (de dash) con cortos;
// `crumble`: tolera una tanda de frágiles seguidas; el resto son probabilidades por plataforma.
export const STYLES = {
    zigzag:   { weight: 3, rows: [5, 8], rise: [96, 112], gap: [150, 270], w: [90, 150], dir: 'alt', fragile: 0.12, spike: 0.1, tramp: 0.1, extra: 0.6 },
    sweep:    { weight: 2, rows: [5, 7], rise: [96, 108], gap: [90, 170], w: [90, 130], dir: 'run', fragile: 0.1, spike: 0.08, tramp: 0.08, extra: 0.5 },
    leaps:    { weight: 2, rows: [4, 6], rise: [96, 110], gap: [150, 220], w: [120, 170], dir: 'alt', long: true, fragile: 0.05, spike: 0, tramp: 0.12, extra: 0.4 },
    bounce:   { weight: 2, rows: [4, 6], rise: [96, 110], gap: [100, 210], w: [100, 140], dir: 'alt', fragile: 0, spike: 0, tramp: 1, extra: 0.5 },
    crumble:  { weight: 2, rows: [4, 6], rise: [96, 104], gap: [100, 180], w: [100, 140], dir: 'alt', crumble: true, fragile: 0.75, spike: 0, tramp: 0.05, extra: 0.4 },
    gauntlet: { weight: 2, rows: [5, 7], rise: [96, 110], gap: [120, 200], w: [120, 160], dir: 'alt', fragile: 0, spike: 0.38, tramp: 0.1, extra: 0.6 },
    rest:     { weight: 1, rows: [3, 4], rise: [96, 106], gap: [120, 190], w: [150, 200], dir: 'alt', fragile: 0, spike: 0, tramp: 0, extra: 0.8, shield: true }
};

const overlapX = (a, b, margin) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + margin;

// Nivel final: una torre larga que el escenario recorre solo (ver RisingVoid), armada por secciones de
// estilos distintos. Reglas de justicia (verificadas por tools/test-tower.mjs): cada plataforma de la
// cadena principal se alcanza desde la anterior; los saltos largos aterrizan en plataformas anchas y
// sólidas; los pinchos y los frágiles nunca van seguidos (salvo la tanda de `crumble`, que empieza y
// termina en sólido); tras unos pinchos el siguiente salto es corto; nada tapa la cabeza ni un rebote.
// Las extras (fuera del camino de los saltos) son perchas con orbes. La salida no existe hasta cumplir
// la cuota: Game la coloca donde se detiene el nivel.
export function buildTower(seed, base, assist = 0) {
    const rng = createRng(seed);
    const level = 1 - 0.25 * Math.min(assist, 3);
    const scrollSpeed = SCROLL_SPEED * (1 - 0.1 * Math.min(assist, 3));
    const need = scrollSpeed * base.durationSeconds + WORLD.height + 200;
    const names = Object.keys(STYLES);
    const pickStyle = (last) => {
        const pool = names.filter((n) => n !== last).flatMap((n) => Array(STYLES[n].weight).fill(n));

        return rng.pick(pool);
    };

    const main = [];
    const sections = [];
    let prev = { x: rng.int(300, 600), w: 160, rel: 0, kind: 'solid', tramp: false, long: false, forceShort: false };
    let dir = 1;
    let badRun = 0;
    let left = 0;
    let name = null;
    let style = null;

    while (prev.rel < need) {
        if (left <= 0) {
            name = main.length === 0 ? 'rest' : pickStyle(name);
            style = STYLES[name];
            left = main.length === 0 ? WARMUP_ROWS : rng.int(style.rows[0], style.rows[1]);
            sections.push(name);
        }

        const live = main.length >= WARMUP_ROWS;
        const rise = prev.tramp ? rng.int(BOUNCE_RISE[0], BOUNCE_RISE[1]) : rng.int(style.rise[0], style.rise[1]);
        const w = rng.int(style.w[0], style.w[1]);
        let gap = rng.int(style.gap[0], style.gap[1]);
        let long = false;

        if (style.long && !prev.long && !prev.forceShort && rng.chance(0.6)) {
            gap = rng.int(LONG_GAP, MAX_GAP);
            long = true;
        }

        if (prev.forceShort) gap = Math.min(gap, SPIKE_EXIT_GAP);
        if (style.dir === 'alt' && rng.chance(0.8)) dir = -dir;

        let x = prev.x + dir * ((prev.w + w) / 2 + gap);

        // Si se sale por un borde, el salto va hacia el lado contrario.
        if (x < SIDE + w / 2 || x > WORLD.width - SIDE - w / 2) {
            dir = -dir;
            x = prev.x + dir * ((prev.w + w) / 2 + gap);
        }

        x = Math.round(Math.min(WORLD.width - SIDE - w / 2, Math.max(SIDE + w / 2, x)));

        const realGap = Math.abs(x - prev.x) - (prev.w + w) / 2;
        let kind = 'solid';

        if (live && !long) {
            // La tanda de frágiles solo sigue a otra de `crumble` (empieza y termina en sólido).
            const runOk = badRun === 0 || (style.crumble && prev.style === 'crumble' && prev.kind === 'fragile' && badRun < FRAGILE_RUN_MAX);

            if (runOk && rng.chance(style.fragile * level)) kind = 'fragile';
            else if (badRun === 0 && !prev.tramp && w >= SPIKE_MIN_W && realGap <= SPIKE_EXIT_GAP && rng.chance(style.spike * level)) kind = 'spike';
        }

        const tramp = live && kind === 'solid' && w >= TRAMPOLINE_MIN_W && (style.tramp === 1 || rng.chance(style.tramp));
        const item = { x, w, rel: prev.rel + rise, kind, tramp, long, forceShort: kind === 'spike', style: name, rise, gap: realGap };

        main.push(item);
        badRun = kind === 'solid' ? 0 : badRun + 1;
        prev = item;
        left--;
    }

    const floorTop = TOP_MARGIN + prev.rel;
    const toTop = (rel) => floorTop - rel;
    const all = main.map((m) => ({ ...m, top: toTop(m.rel) }));
    const extras = [];

    // Extras: del lado libre de la fila, sin tapar la cabeza de nada ni un rebote.
    const fits = (e) => all.concat(extras).every((p) => {
        if (overlapX(p, e, p.tramp ? 40 : 24) && Math.abs(p.top - e.top) < 130) return false;

        return !(p.tramp && overlapX(p, e, 40) && p.top - e.top > 0 && p.top - e.top <= 240);
    });

    all.forEach((m, i) => {
        const st = STYLES[m.style];

        if (i === 0 || !rng.chance(st.extra)) return;

        const near = all.slice(Math.max(0, i - 2), i + 3);
        const lo = Math.min(...near.map((p) => p.x - p.w / 2)) - 60;
        const hi = Math.max(...near.map((p) => p.x + p.w / 2)) + 60;
        const w = rng.int(90, 150);
        const sides = [];

        if (lo - SIDE >= w) sides.push(Math.round(rng.range(SIDE + w / 2, lo - w / 2)));
        if (WORLD.width - SIDE - hi >= w) sides.push(Math.round(rng.range(hi + w / 2, WORLD.width - SIDE - w / 2)));

        if (!sides.length) return;

        const e = { x: rng.pick(sides), w, top: m.top + rng.int(-10, 10), kind: rng.chance(0.35 * level) ? 'fragile' : 'solid', style: m.style, extra: true };

        if (fits(e)) extras.push(e);
    });

    // El spawn queda al costado de la primera plataforma, no debajo (si no, se pega la cabeza al saltar).
    const first = all[0];
    const spawnX = Math.round(first.x < WORLD.width / 2 ? first.x + first.w / 2 + 140 : first.x - first.w / 2 - 140);
    const platforms = [{ x: WORLD.width / 2, y: floorTop + FLOOR_H / 2, w: WORLD.width, h: FLOOR_H, color: COLOR }];
    const fragilePlatforms = [];
    const hazards = [];
    const trampolines = [];
    const powerUps = [];
    const pointSpots = [{ x: 200, y: floorTop - 24 }, { x: 1160, y: floorTop - 24 }];
    let sinceShield = 0;

    all.concat(extras).forEach((p) => {
        if (p.kind === 'fragile') {
            fragilePlatforms.push({ x: p.x, y: p.top + PLAT_H / 2, w: p.w });
        } else {
            platforms.push({ x: p.x, y: p.top + PLAT_H / 2, w: p.w, h: PLAT_H, color: COLOR });

            if (p.kind === 'spike') {
                hazards.push({ x: p.x, y: p.top - 4, w: p.w, offsetMs: rng.int(0, 3300), ...SPIKE_CYCLE });
                return;
            }

            if (p.tramp) trampolines.push({ x: p.x, y: p.top - 6, w: TRAMPOLINE_W });

            if (!p.extra) {
                sinceShield += p.rise;

                if (sinceShield >= (STYLES[p.style].shield ? SHIELD_EVERY / 2 : SHIELD_EVERY)) {
                    powerUps.push({ x: p.x, y: p.top - 40, respawnMs: 16000 });
                    sinceShield = 0;
                }
            }
        }

        pointSpots.push({ x: p.x, y: p.top - 24 });
    });

    return {
        ...base,
        worldHeight: floorTop + FLOOR_H,
        scrollSpeed,
        quota: 12,
        spawn: { x: spawnX, y: floorTop - 28 },
        goal: { x: -1000, y: -1000 },
        // Pocos y espaciados: el peligro principal es el escenario.
        projectiles: { initialInterval: 3200, minInterval: 2200, maxSpeedMultiplier: 1.2, wallGapX: 52 },
        platforms,
        fragilePlatforms,
        pointSpots,
        powerUps,
        hazards,
        trampolines,
        portals: [],
        // Para tools/test-tower.mjs y para depurar: la estructura sin aplanar.
        tower: { main: all, extras, sections, need, floorTop }
    };
}
