import { WORLD } from '../assets/levels.js';
import { createRng } from './LevelGenerator.js';

const SCROLL_SPEED = 80;
const ROW_GAP = [96, 112];
// Separación horizontal entre bordes: hasta ~280 se cruza corriendo; más allá hace falta el dash.
const EDGE_GAP = [150, 340];
const PLAT_W = [90, 150];
const PLAT_H = 20;
const COLOR = 0x3a3a5c;
const FLOOR_H = 56;
const SIDE = 50;
const SHIELD_EVERY = 8;
const EXTRA_CHANCE = 0.6;
// Mecánicas: porcentaje de plataformas que las llevan (desde la fila 4, antes es de calentamiento).
const WARMUP_ROWS = 4;
const FRAGILE_MAIN = 0.15;
const FRAGILE_EXTRA = 0.4;
const SPIKE_CHANCE = 0.12;
const TRAMPOLINE_CHANCE = 0.14;
const TRAMPOLINE_W = 56;

// Nivel final: una torre larga que el escenario recorre solo (ver RisingVoid). La cadena principal
// tiene una plataforma por fila, sin solaparse en horizontal (si no, se pega la cabeza al saltar),
// alternando de lado con saltos largos; es siempre sólida o frágil de paso y alcanza para llegar
// arriba. Las extras (del otro lado, fuera del camino de los saltos) son perchas con orbes. La salida
// no existe hasta cumplir la cuota: Game la coloca donde se detiene el nivel.
export function buildTower(seed, base, assist = 0) {
    const rng = createRng(seed);
    const scrollSpeed = SCROLL_SPEED * (1 - 0.1 * Math.min(assist, 3));
    // Alcanza para toda la partida: lo que recorre la vista en el tiempo del nivel más una pantalla.
    const rows = Math.ceil((scrollSpeed * base.durationSeconds + WORLD.height) / ROW_GAP[0]) + 2;
    const gaps = Array.from({ length: rows }, () => rng.int(ROW_GAP[0], ROW_GAP[1]));
    const floorTop = 300 + gaps.reduce((a, b) => a + b, 0);
    let prev = { x: rng.int(300, 600), w: 160 };
    let top = floorTop;
    let dir = 1;

    const main = [];

    for (let i = 0; i < rows; i++) {
        const w = rng.int(PLAT_W[0], PLAT_W[1]);
        const edgeGap = rng.chance(0.25) ? rng.int(280, EDGE_GAP[1]) : rng.int(EDGE_GAP[0], 280);
        let x = prev.x + dir * ((prev.w + w) / 2 + edgeGap);

        // Si se sale por un borde, el salto largo va hacia el lado contrario.
        if (x < SIDE + w / 2 || x > WORLD.width - SIDE - w / 2) {
            dir = -dir;
            x = prev.x + dir * ((prev.w + w) / 2 + edgeGap);
        }

        x = Math.round(Math.min(WORLD.width - SIDE - w / 2, Math.max(SIDE + w / 2, x)));
        dir = rng.chance(0.7) ? dir : -dir;
        top -= gaps[i];
        main.push({ x, w, top });
        prev = { x, w };
    }

    // Extras: del lado libre de la fila, fuera del tramo que cubren los saltos vecinos.
    const extras = [];

    main.forEach((m, i) => {
        if (!rng.chance(EXTRA_CHANCE)) return;

        const near = [main[i - 1], m, main[i + 1]].filter(Boolean);
        const lo = Math.min(...near.map((p) => p.x - p.w / 2)) - 70;
        const hi = Math.max(...near.map((p) => p.x + p.w / 2)) + 70;
        const w = rng.int(PLAT_W[0], PLAT_W[1]);
        const sides = [];

        if (lo - SIDE >= w) sides.push(Math.round(rng.range(SIDE + w / 2, lo - w / 2)));
        if (WORLD.width - SIDE - hi >= w) sides.push(Math.round(rng.range(hi + w / 2, WORLD.width - SIDE - w / 2)));

        if (!sides.length) return;

        const e = { x: rng.pick(sides), w, top: m.top + rng.int(-10, 10), row: i };

        // Que no se pise con otra extra de una fila cercana.
        if (!extras.some((o) => Math.abs(o.top - e.top) < 100 && Math.abs(o.x - e.x) < (o.w + e.w) / 2 + 30)) extras.push(e);
    });

    const platforms = [{ x: WORLD.width / 2, y: floorTop + FLOOR_H / 2, w: WORLD.width, h: FLOOR_H, color: COLOR }];
    const fragilePlatforms = [];
    const hazards = [];
    const trampolines = [];
    const powerUps = [];
    const pointSpots = [{ x: 200, y: floorTop - 24 }, { x: 1160, y: floorTop - 24 }];

    const place = (p, row, isMain) => {
        const live = row >= WARMUP_ROWS;

        if (live && rng.chance(isMain ? FRAGILE_MAIN : FRAGILE_EXTRA)) {
            fragilePlatforms.push({ x: p.x, y: p.top + PLAT_H / 2, w: p.w });
        } else {
            platforms.push({ x: p.x, y: p.top + PLAT_H / 2, w: p.w, h: PLAT_H, color: COLOR });

            // Pinchos en toda la plataforma (se cruza en la ventana retraída); no llevan orbes ni escudo.
            if (live && rng.chance(SPIKE_CHANCE)) {
                hazards.push({ x: p.x, y: p.top - 4, w: p.w, offsetMs: rng.int(0, 2000) });
                p.spiked = true;

                return;
            } else if (live && isMain && rng.chance(TRAMPOLINE_CHANCE)) {
                trampolines.push({ x: p.x, y: p.top - 6, w: TRAMPOLINE_W });
            }
        }

        pointSpots.push({ x: p.x, y: p.top - 24 });
    };

    main.forEach((m, i) => place(m, i, true));
    extras.forEach((e) => place(e, e.row, false));

    for (let i = SHIELD_EVERY - 1; i < rows; i += SHIELD_EVERY) {
        // El escudo va en la primera plataforma sin pinchos desde esa fila.
        const m = main.slice(i).find((p) => !p.spiked);

        if (m) powerUps.push({ x: m.x, y: m.top - 40, respawnMs: 16000 });
    }

    return {
        ...base,
        worldHeight: floorTop + FLOOR_H,
        scrollSpeed,
        quota: 12,
        spawn: { x: 200, y: floorTop - 28 },
        goal: { x: -1000, y: -1000 },
        // Pocos y espaciados: el peligro principal es el escenario.
        projectiles: { initialInterval: 3200, minInterval: 2200, maxSpeedMultiplier: 1.2, wallGapX: 52 },
        platforms,
        fragilePlatforms,
        pointSpots,
        powerUps,
        hazards,
        trampolines,
        portals: []
    };
}
