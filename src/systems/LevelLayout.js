import { WORLD } from '../assets/levels.js';

// Generador procedural de la estructura de los niveles: crece un grafo de plataformas desde el
// piso con reglas duras de espacio (nada de plataformas amontonadas ni que estorben el salto) y
// reserva primero los carriles de los trampolines. Es puro: recibe el rng del generador y
// devuelve datos; el BFS del generador confirma después que todo sea alcanzable.

const FLOOR_TOP = WORLD.floorTop;
const PLATFORM_COLOR = 0x3a3a5c;
const WALL_COLOR = 0x4a4270;
const COLUMN_COLOR = 0x4a4270;

export const plat = (x, top, w, h = 20) => ({ x: Math.round(x), y: Math.round(top + h / 2), w: Math.round(w), h, color: PLATFORM_COLOR });
export const fragile = (x, top, w) => ({ x: Math.round(x), y: Math.round(top + 10), w: Math.round(w) });
export const hazardOn = (x, top, w) => ({ x: Math.round(x), y: Math.round(top - 4), w: Math.round(w) });
export const powerOn = (x, top) => ({ x: Math.round(x), y: Math.round(top - 26) });

export function frame() {
    return [
        { x: WORLD.width / 2, y: 740, w: WORLD.width, h: 56, color: PLATFORM_COLOR },
        { x: 40, y: 400, w: 24, h: 720, color: WALL_COLOR },
        { x: WORLD.width - 40, y: 400, w: 24, h: 720, color: WALL_COLOR }
    ];
}

// --- Reglas de espacio ------------------------------------------------------------

// Aire entre plataformas que se superponen en x (el salto sube ~117 y el jugador mide 48):
// con 175 se puede saltar desde una sin pegarle a la de arriba.
const VERTICAL_CLEAR = 175;
// Si dos plataformas están a menos de este hueco en x cuentan como "superpuestas".
const OVERLAP_MARGIN = 30;
// Hueco mínimo entre plataformas a una altura parecida, y distancia mínima entre centros.
const SIDE_GAP = 100;
const SAME_BAND = 70;
const MIN_CENTER_DIST = 170;
// Margen contra las paredes (deja lugar para el wall jump), alturas permitidas y zona del spawn.
const EDGE = 110;
const TOP_MIN = 200;
const TOP_MAX = 625;
const SPAWN_HALF = 80;
// Carril libre de un trampolín: el rebote perfecto sube ~510 px, así que no puede haber
// ninguna plataforma encima (ancho: el del trampolín + el jugador + margen).
export const LANE_MARGIN = 48;

export const laneOf = (t) => ({ lo: t.x - t.w / 2 - LANE_MARGIN, hi: t.x + t.w / 2 + LANE_MARGIN });

// ¿La plataforma `c` ({x, top, w}) cabe entre las `items` sin romper ninguna regla?
// ctx: { reserved: carriles de trampolines, spawn }.
export function fitsLayout(c, items, ctx) {
    const left = c.x - c.w / 2;
    const right = c.x + c.w / 2;

    if (left < EDGE || right > WORLD.width - EDGE) return false;
    if (c.top < TOP_MIN || c.top > TOP_MAX) return false;
    if (ctx.reserved.some((r) => right > r.lo && left < r.hi && (r.maxTop === undefined || c.top <= r.maxTop))) return false;
    if (ctx.spawn && c.top > 480 && right > ctx.spawn.x - SPAWN_HALF && left < ctx.spawn.x + SPAWN_HALF) return false;

    for (const q of items) {
        const overlap = Math.min(right, q.x + q.w / 2) - Math.max(left, q.x - q.w / 2);
        const dTop = Math.abs(c.top - q.top);

        if (overlap > -OVERLAP_MARGIN && dTop < VERTICAL_CLEAR) return false;
        if (dTop < SAME_BAND && -overlap < SIDE_GAP) return false;
        if (Math.hypot(c.x - q.x, dTop) < MIN_CENTER_DIST) return false;
    }

    return true;
}

// --- Estilos -----------------------------------------------------------------------

// seeds: plataformas iniciales a la altura del piso; mode: 'chain' (cada paso sale de la última)
// o 'tree' (sale de cualquiera); dir: 'alt' alterna el lado, 'same' sigue hacia un lado,
// 'rand' sortea; rise: rango de subida por paso (negativo = baja); w: ancho.
export const LAYOUT_STYLES = {
    ascenso: { seeds: 1, mode: 'chain', dir: 'same', rise: [88, 96], w: [120, 170] },
    archipielago: { seeds: 3, mode: 'tree', dir: 'rand', rise: [-60, 95], w: [110, 190] },
    serpentina: { seeds: 2, mode: 'chain', dir: 'same', rise: [-45, 96], w: [140, 200] },
    cumbres: { seeds: 2, mode: 'tree', dir: 'alt', rise: [88, 96], w: [120, 160] },
    ramas: { seeds: 2, mode: 'tree', dir: 'rand', rise: [0, 95], w: [110, 170] },
    // Nuevo estilo: pasajes estrechos y paredes laterales (foco en wall jump)
    cavern: { seeds: 2, mode: 'chain', dir: 'alt', rise: [60, 100], w: [80, 130] },
    // Nuevo estilo: plataforma central grande, acceso desde los 4 lados
    open_plateau: { seeds: 4, mode: 'tree', dir: 'rand', rise: [-30, 70], w: [150, 220] }
};

// Trampolines por nivel: N1 no lleva, N2 (rebotes) se arma aparte en buildBounce con 2 o 3 y el resto uno.
const TRAMPOLINES = { 1: [0, 0], 3: [1, 1], 4: [1, 1], 5: [1, 1] };
// Probabilidad de que el nivel tenga una torre de wall jump (opcional: sube a una repisa con premios).
const TOWER_CHANCE = { 1: 0, 2: 0.1, 3: 0.75, 4: 0.65, 5: 0.8 };
const COUNT = [8, 11];
const SPAWN_X = [110, 200];
const COLUMNS = 5;
const BUILD_TRIES = 250;

// Sortea los carriles de los trampolines en el piso: lejos del spawn y entre sí.
function reserveTrampolines(rng, levelId, spawn, relax, tower) {
    const [min, max] = TRAMPOLINES[levelId] ?? [1, 1];
    const want = relax ? Math.min(min, 1) : rng.int(min, max);
    const xMax = tower ? tower.zone.lo - 160 : WORLD.width - 240;
    const out = [];

    // Con carriles múltiples se reparten en bandas separadas: así queda un tramo central amplio para las plataformas.
    // N1: 0 trampolines (tutorial), N2: 2-3 con bandas separadas, N3-N5: 1-2 con distribución adaptativa
    const isN1 = levelId === 1;
    const isN2 = levelId === 2;
    const isN3or5 = levelId === 3 || levelId === 5;
    const isN4 = levelId === 4;

    // Distribución de bandas por nivel
    let bands;
    if (isN2) {
        // N2: dos bandas separadas para el mecanismo de rebotes
        bands = [[WORLD.width * 0.2, WORLD.width * 0.34], [WORLD.width * 0.64, Math.min(WORLD.width * 0.78, xMax)]];
    } else if (isN3or5) {
        // N3 y N5: una banda principal más ancho, o dos si hay torre
        if (tower) {
            bands = [[WORLD.width * 0.15, WORLD.width * 0.3], [WORLD.width * 0.65, Math.min(WORLD.width * 0.85, xMax)]];
        } else {
            // Una banda central amplia
            bands = [[WORLD.width * 0.2, Math.min(WORLD.width * 0.7, xMax)]];
        }
    } else if (isN4) {
        // N4: una banda, menos trampolines, focus en hazards y pinchos
        bands = [[240, xMax]];
    } else {
        // N1: ninguno
        bands = [];
    }

    for (let tries = 0; out.length < want && tries < 60; tries++) {
        const band = bands[Math.min(out.length, bands.length - 1)];
        if (!band) break;
        const [lo, hi] = band;
        const t = { x: Math.round(rng.range(lo, hi)), y: 706, w: rng.pick([56, 64, 72]) };

        if (Math.abs(t.x - spawn.x) < 170) continue;
        if (out.some((o) => Math.abs(o.x - t.x) < 300)) continue;
        out.push(t);
    }

    return out;
}

// Torre de wall jump pegada a la pared derecha (el espejado la pasa a la izquierda): un pilar deja
// con la pared un canal de 125-155 px; se sube pegándose a las caras y se cae sobre la repisa de
// arriba, que queda sola (sin otras plataformas cerca) con spots. El pilar no llega al
// piso (puerta de 130 px) para no partirlo. Nunca es obligatoria: el resto del nivel se recorre igual.
function makeTower(rng) {
    const gap = rng.int(125, 155);
    const capW = rng.int(140, 170);
    const top = FLOOR_TOP - rng.int(400, 440);
    const bottom = FLOOR_TOP - 130;
    const px = WORLD.width - 52 - gap - 14;
    const cap = { x: Math.round(px + 14 - capW / 2), top: top - 20, w: capW, parent: -2, dir: -1, tower: true };
    const pillar = { x: px, y: Math.round((top + bottom) / 2), w: 28, h: bottom - top, color: COLUMN_COLOR };

    return {
        cap,
        pillar,
        // Pilar y canal (todo el alto) y, alrededor de la repisa, el aire que necesita para el salto.
        zones: [{ lo: px - 14 - 60, hi: WORLD.width }, { lo: cap.x - cap.w / 2 - 110, hi: WORLD.width, maxTop: cap.top + VERTICAL_CLEAR + 20 }],
        zone: { lo: cap.x - cap.w / 2 - 110 }
    };
}

// Una de cada ocho plataformas es larga (miradores, puentes): cambia la silueta del nivel.
const widthOf = (rng, style) => (rng.chance(0.125) ? rng.int(240, 320) : rng.int(style.w[0], style.w[1]));

function grow(rng, style, trampolines, spawn, tower) {
    const ctx = { reserved: [...trampolines.map(laneOf), ...(tower?.zones ?? [])], spawn };
    const target = rng.int(COUNT[0], COUNT[1]);
    const items = [];

    // Semillas: plataformas bajas, alcanzables desde el piso, repartidas a lo ancho.
    for (let i = 0; i < style.seeds * 40 && items.length < style.seeds; i++) {
        const slot = (items.length + rng.next() * 0.8) / style.seeds;
        const w = widthOf(rng, style);
        const c = { x: Math.round(EDGE + w / 2 + slot * (WORLD.width - 2 * EDGE - w)), top: rng.int(595, TOP_MAX), w, parent: -1, dir: 0 };
        c.dir = c.x < WORLD.width / 2 ? 1 : -1;

        if (fitsLayout(c, items, ctx)) items.push(c);
    }

    // Cada paso sale de la última plataforma (cadena) o de cualquiera (árbol); si el estilo se
    // atasca (borde, trampolín, plataformas vecinas) se prueba el otro lado y otros padres.
    let fails = 0;

    for (let tries = 0; items.length > 0 && items.length < target && tries < 600; tries++) {
        const parent = style.mode === 'chain' && fails < 6 ? items[items.length - 1] : rng.pick(items);
        let dir = style.dir === 'rand' ? (rng.chance(0.5) ? 1 : -1) : style.dir === 'alt' ? -parent.dir : parent.dir;

        if (rng.chance(0.15)) dir = -dir;

        let placed = false;

        for (const d of [dir, -dir, dir, -dir]) {
            let rise = rng.int(style.rise[0], style.rise[1]);

            if (parent.top < 260 && rise > 0) rise = -rise;

            const w = widthOf(rng, style);
            const gap = rise > 40 ? rng.int(100, 115) : rise > 10 ? rng.int(100, 125) : rng.int(100, 150);
            const c = { x: Math.round(parent.x + d * (parent.w / 2 + gap + w / 2)), top: parent.top - rise, w, parent: items.indexOf(parent), dir: d };

            if (fitsLayout(c, items, ctx)) {
                items.push(c);
                placed = true;
                break;
            }
        }

        fails = placed ? 0 : fails + 1;
    }

    if (tower) items.push(tower.cap);

    return { items, ctx };
}

// Que se reparta a lo ancho (5 franjas) y a lo alto (3 alturas) y que el trampolín tenga a qué subir.
function distributed(items, trampolines) {
    if (items.length < COUNT[0] - 1) return false;

    const cols = new Set(items.map((p) => Math.min(COLUMNS - 1, Math.floor(p.x / (WORLD.width / COLUMNS)))));
    const rows = [0, 0, 0];

    for (const p of items) rows[p.top >= 520 ? 0 : p.top >= 340 ? 1 : 2]++;

    // Cada carril de trampolín extra le saca una franja al reparto.
    const minCols = COLUMNS - Math.max(1, trampolines.length);

    if (cols.size < minCols || rows.some((n) => n === 0) || Math.max(...rows) > items.length * 0.6) return false;

    return trampolines.every((t) => items.some((p) => t.y - p.top >= 70 && t.y - p.top <= 460 && Math.abs(p.x - t.x) < p.w / 2 + 260));
}

// La salida va en una plataforma alta y lejos del spawn.
function pickGoal(rng, items, spawn) {
    const score = (p) => Math.min(Math.abs(p.x - spawn.x), 600) + (FLOOR_TOP - p.top) * 0.8 + rng.range(0, 120);
    const open = items.filter((p) => !p.tower);
    const pool = open.filter((p) => p.top <= 450 && p.w >= 110 && Math.abs(p.x - spawn.x) >= 450);

    return (pool.length ? pool : open.filter((p) => p.top <= 450 && p.w >= 110)).sort((a, b) => score(b) - score(a))[0] ?? null;
}

// --- Nivel 2: rebotes ---------------------------------------------------------------

// Estilos del N2: cuántos trampolines lleva (2, 3 o al azar).
export const BOUNCE_STYLES = { 'rebote-doble': 2, 'rebote-triple': 3, 'rebote-mixto': 0 };

// Alturas de las plataformas (borde superior): baja (se salta desde el piso), media (la alcanza el
// rebote común, ~213 px) y alta (solo con el rebote perfecto, ~450 px, que exige pisar el centro).
const BOUNCE_ROWS = { low: [595, 625], mid: [510, 545], high: [330, 400] };

// Los trampolines del piso parten el escenario en tramos y cada tramo tiene sus plataformas: se
// sube rebotando de un tramo al otro. Los carriles son los de siempre (nada encima del trampolín).
function buildBounce(rng, count) {
    const W = WORLD.width;

    for (let i = 0; i < BUILD_TRIES; i++) {
        const k = count || rng.int(2, 3);
        const spawn = { x: rng.int(SPAWN_X[0], SPAWN_X[1]), y: 684 };
        const first = Math.max(k === 2 ? 380 : 330, spawn.x + 190);
        const xs = k === 2 ? [rng.int(first, first + 100), rng.int(W * 0.64, W * 0.72)] : [rng.int(first, first + 70), rng.int(W * 0.46, W * 0.54), rng.int(W * 0.74, W * 0.78)];
        const trampolines = xs.map((x) => ({ x, y: 706, w: rng.pick([60, 68, 76]) }));
        const lanes = trampolines.map(laneOf);
        const ctx = { reserved: lanes, spawn };
        const edges = [EDGE, ...lanes.flatMap((l) => [l.lo, l.hi]), W - EDGE];
        const items = [];

        for (let s = 0; s < edges.length; s += 2) {
            const lo = edges[s];
            const hi = edges[s + 1];

            // Hasta tres plataformas por tramo (según su ancho), cada una en su altura.
            for (let n = 0, placed = 0; n < 30 && placed < (hi - lo > 330 ? 3 : hi - lo > 190 ? 2 : 1); n++) {
                const w = rng.int(110, Math.min(190, hi - lo));

                if (w > hi - lo) break;

                const row = rng.pick(['low', 'mid', 'mid', 'high', 'high']);
                const c = { x: Math.round(rng.range(lo + w / 2, hi - w / 2)), top: rng.int(BOUNCE_ROWS[row][0], BOUNCE_ROWS[row][1]), w, parent: -1, dir: 1, row };

                if (fitsLayout(c, items, ctx)) {
                    items.push(c);
                    placed++;
                }
            }
        }

        const rows = new Set(items.map((p) => p.row));
        const useful = trampolines.every((t) => items.some((p) => t.y - p.top >= 70 && t.y - p.top <= 460 && Math.abs(p.x - t.x) < p.w / 2 + 260));

        if (items.length < 4 || rows.size < 3 || !useful) continue;

        const goalItem = pickGoal(rng, items.filter((p) => p.row === 'high'), spawn) ?? pickGoal(rng, items, spawn);

        if (!goalItem) continue;

        return { items, ctx, spawn, trampolines, goalItem, path: new Set([goalItem]), tower: null, goal: { x: goalItem.x, y: goalItem.top - 36 } };
    }

    return null;
}

// Arma la estructura del nivel `levelId` con el estilo `styleName`. Devuelve null si ningún
// intento cumple las reglas de reparto.
export function buildLayout(rng, levelId, styleName) {
    if (styleName in BOUNCE_STYLES) return buildBounce(rng, BOUNCE_STYLES[styleName]);

    const style = LAYOUT_STYLES[styleName];

    for (let i = 0; i < BUILD_TRIES; i++) {
        const spawn = { x: rng.int(SPAWN_X[0], SPAWN_X[1]), y: 684 };
        // Con varios carriles el piso queda muy partido: tras la mitad de los intentos se pide uno solo.
        const tower = rng.chance(TOWER_CHANCE[levelId] ?? 0) ? makeTower(rng) : null;
        const trampolines = reserveTrampolines(rng, levelId, spawn, i >= BUILD_TRIES * 0.7, tower);
        const { items, ctx } = grow(rng, style, trampolines, spawn, tower);

        if (!distributed(items, trampolines)) continue;

        const goalItem = pickGoal(rng, items, spawn);

        if (!goalItem) continue;

        const path = new Set();

        for (let k = items.indexOf(goalItem); k >= 0; k = items[k].parent) path.add(items[k]);

        return { items, ctx, spawn, trampolines, goalItem, path, tower, goal: { x: goalItem.x, y: goalItem.top - 36 } };
    }

    return null;
}

// Posiciones del piso libres de trampolines (su carril), del spawn y de los `avoid` dados.
export function floorSpots(rng, layout, minGap, avoid = [], avoidGap = minGap) {
    const out = [];

    for (let x = 180; x <= WORLD.width - 180; x += 30) {
        const free = layout.ctx.reserved.filter((r) => r.maxTop === undefined).every((r) => x < r.lo - minGap / 2 || x > r.hi + minGap / 2) &&
            Math.abs(x - layout.spawn.x) > 170 && Math.abs(x - layout.goal.x) > 90 &&
            avoid.every((o) => Math.abs(o.x - x) > avoidGap);

        if (free) out.push(x);
    }

    return out.length ? out : null;
}
