import { WORLD } from '../assets/levels.js';
import { HAZARD_CONFIG } from '../entities/Hazard.js';

// Formas de los niveles 3 a 5 (frágiles, pinchos y portales): cada nivel tiene
// varias estructuras que se sortean por semilla (como las formas macro del N2) y
// cuyas mecánicas se mutan (ver `mutateMechanics`). Son builders puros: reciben el
// rng del generador y devuelven datos. A diferencia de las formas del N2 no se
// validan con BFS al jugar (es lento): cada forma se barre offline con
// tools/test-models.mjs (`npm run test-models`) y los parámetros se acotan para que
// cualquier valor del rango sea alcanzable. Si se toca una forma hay que correrlo.

const FLOOR_TOP = WORLD.floorTop;
const PLATFORM_COLOR = 0x3a3a5c;
const WALL_COLOR = 0x4a4270;
const TOWER_COLOR = 0x453f6b;
const WALL_EDGE_LEFT = 52;
const WALL_EDGE_RIGHT = WORLD.width - 52;

const plat = (x, top, w, h = 20) => ({ x: Math.round(x), y: Math.round(top + h / 2), w: Math.round(w), h, color: PLATFORM_COLOR });
const fragile = (x, top, w) => ({ x: Math.round(x), y: Math.round(top + 10), w: Math.round(w) });
const tower = (x, top, w) => ({ x, y: Math.round((top + FLOOR_TOP) / 2), w, h: FLOOR_TOP - top, color: TOWER_COLOR });

function frame() {
    return [
        { x: 512, y: 740, w: 1024, h: 56, color: PLATFORM_COLOR },
        { x: 40, y: 400, w: 24, h: 720, color: WALL_COLOR },
        { x: 984, y: 400, w: 24, h: 720, color: WALL_COLOR }
    ];
}

// Cadena de escalones: avanza desde el borde x0 hacia `dir` (+1 derecha, -1 izquierda); cada
// escalon es una plataforma ancha `w` con un hueco hasta el siguiente. Los escalones se achican
// (minimo 70 px) para que la cadena termine antes de `limit` (por defecto, antes del centro:
// las dos escaleras de una forma nunca se tocan, porque dos plataformas pegadas a alturas
// levemente distintas forman un escalon de pocos px que traba al jugador). Devuelve [{ x, top, w }].
function chain(rng, x0, dir, tops, wMin, wMax, gap = 14, limit = dir > 0 ? 470 : 554) {
    const out = [];
    let edge = x0;

    tops.forEach((top, i) => {
        const left = tops.length - i;
        const room = Math.abs(limit - edge);
        const cap = Math.floor((room - (left - 1) * (gap + 6)) / left);
        const w = Math.min(rng.int(wMin, wMax), Math.max(70, cap));

        // La altura (±4 px) y el hueco varian por escalon: el BFS al generar descarta lo que no se sube.
        out.push({ x: edge + (dir * w) / 2, top: top + rng.int(-4, 4), w });
        edge += dir * (w + gap + rng.int(0, 8));
    });

    return out;
}

const SPAWN_LEFT = { x: 120, y: 684 };

// --- Nivel 1: sin mecánicas, solo estructura ------------------------------------

const N1_SPAWN = { x: 200, y: 684 };
const N1_GOAL = { x: 920, y: 676 };

// Filas escalonadas: 3 plataformas, luego 2 entre ellas, etc.; cada una queda a ~150 px
// de dos de la fila de abajo, así que siempre hay por dónde subir.
function terraces(rng) {
    const tops = [620, 530, 440, 350, 260];
    const platforms = [];
    const j = () => rng.int(-25, 25);

    tops.forEach((top, r) => {
        const xs = r % 2 === 0 ? [200, 512, 824] : [356, 668];

        for (const x of xs) platforms.push(plat(x + j(), top, rng.int(120, 160)));
    });

    return { platforms, spawn: { ...N1_SPAWN }, goal: { ...N1_GOAL } };
}

// Dos escaleras de cuatro escalones que suben hacia el centro y una plataforma arriba.
function stairsN1(rng) {
    const tops = [620, 530, 440, 350];
    const left = chain(rng, 60, 1, tops, 90, 120);
    const right = chain(rng, 964, -1, tops, 90, 120);

    return {
        platforms: [...left, ...right].map((s) => plat(s.x, s.top, s.w)).concat(plat(512 + rng.int(-30, 30), 260, rng.int(130, 170))),
        spawn: { ...N1_SPAWN },
        goal: { ...N1_GOAL }
    };
}

// Pirámide: pares de plataformas que se acercan al centro al subir, y una cima sola.
function pyramid(rng) {
    const tops = [620, 530, 440, 350, 260];
    const platforms = [];
    const w = () => rng.int(120, 150);

    tops.forEach((top, r) => {
        const dx = 330 - r * 60 + rng.int(-15, 15);

        platforms.push(plat(512 - dx, top, w()), plat(512 + dx, top, w()));
    });
    platforms.push(plat(512 + rng.int(-20, 20), 170, rng.int(130, 170)));

    return { platforms, spawn: { ...N1_SPAWN }, goal: { ...N1_GOAL } };
}

// --- Nivel 3: plataformas frágiles ------------------------------------------

// Dos escaleras de cuatro escalones que suben hacia el centro y una plataforma de
// salida entre ellas arriba. La izquierda es segura; la derecha es frágil.
function fragileDoubleStairs(rng) {
    const tops = [620, 530, 440, 350];
    const left = chain(rng, 60, 1, tops, 100, 120);
    const right = chain(rng, 964, -1, tops, 100, 120);
    const goalW = rng.int(110, 140);
    const goalX = 512 + rng.int(-20, 20);

    return {
        platforms: [...left.map((s) => plat(s.x, s.top, s.w)), plat(goalX, 260, goalW)],
        fragilePlatforms: right.map((s) => fragile(s.x, s.top, s.w)),
        spawn: { ...SPAWN_LEFT },
        goal: { x: goalX, y: 260 - 36 }
    };
}

// El diseño base del N3: zigzag seguro por la izquierda y diagonal frágil por la derecha.
function fragileZigzag(rng) {
    const j = () => rng.int(-12, 12);

    return {
        platforms: [
            plat(170 + j(), 620, 190), plat(340 + j(), 530, 150), plat(170 + j(), 440, 170),
            plat(340 + j(), 350, 150), plat(520 + j(), 260, 170), plat(880, 260, 190)
        ],
        fragilePlatforms: [
            fragile(560 + j(), 620, 150), fragile(740 + j(), 530, 140), fragile(880, 440, 140),
            fragile(520 + j(), 440, 130), fragile(720 + j(), 350, 130)
        ],
        spawn: { ...SPAWN_LEFT },
        goal: { x: 880, y: 224 }
    };
}

// Puente frágil: a la izquierda, una escalera segura de cuatro escalones hasta la salida; a la
// derecha, una escalera frágil de tres escalones y una pasarela frágil que llega a la misma salida.
function fragileBridge(rng) {
    const left = chain(rng, 60, 1, [620, 530, 440, 350], 90, 110, 14, 430);
    const right = chain(rng, 964, -1, [620, 530, 440], 100, 120, 14, 700);
    const goalX = 540 + rng.int(-10, 10);
    const goalW = rng.int(110, 130);
    const lastRight = right[2];
    const deck = fragile(lastRight.x - lastRight.w / 2 - 55, 350, rng.int(100, 120));

    return {
        platforms: [...left.map((s) => plat(s.x, s.top, s.w)), plat(goalX, 260, goalW)],
        fragilePlatforms: [...right.map((s) => fragile(s.x, s.top, s.w)), deck],
        spawn: { ...SPAWN_LEFT },
        goal: { x: goalX, y: 260 - 36 }
    };
}

// --- Nivel 4: pinchos y escudo ------------------------------------------------

const HAZARD_PLATE = 14;

const hazardOn = (x, top, w) => ({ x: Math.round(x), y: Math.round(top - 4), w: Math.round(w) });
const powerOn = (x, top) => ({ x: Math.round(x), y: Math.round(top - 26) });

// Escaleras dobles seguras que suben hacia un remate central; pinchos al piso y en
// los escalones del medio.
function hazardStairs(rng) {
    const tops = [620, 530, 440, 350];
    const left = chain(rng, 60, 1, tops, 100, 130);
    const right = chain(rng, 964, -1, tops, 100, 130);
    const top = plat(512 + rng.int(-20, 20), 260, rng.int(130, 170));

    return {
        platforms: [...left, ...right].map((s) => plat(s.x, s.top, s.w)).concat(top),
        hazardSlots: [
            hazardOn(300, FLOOR_TOP, 110), hazardOn(512, FLOOR_TOP, 110), hazardOn(724, FLOOR_TOP, 110),
            hazardOn(left[1].x, left[1].top, left[1].w - 40), hazardOn(right[1].x, right[1].top, right[1].w - 40),
            hazardOn(left[3].x, left[3].top, left[3].w - 40), hazardOn(right[3].x, right[3].top, right[3].w - 40)
        ],
        powerSlots: [powerOn(left[0].x, left[0].top), powerOn(right[2].x, right[2].top), powerOn(left[3].x, left[3].top), powerOn(right[3].x, right[3].top)],
        spawn: { x: 110, y: 684 },
        goal: { x: top.x, y: 260 - 36 }
    };
}

// Serpiente: filas largas ancladas a una pared y a la otra, alternando; se sube por
// la abertura del lado libre. Los pinchos cruzan las filas.
function hazardSnake(rng) {
    const tops = [620, 530, 440];
    // Filas cortas (la mitad del ancho del mundo, mas o menos): el recorrido de la serpiente
    // debe entrar en el tiempo del nivel.
    const gap = rng.int(480, 540);
    const platforms = [];
    const slots = [];
    const powers = [];

    tops.forEach((top, i) => {
        const leftAnchored = i % 2 === 0;
        const w = WALL_EDGE_RIGHT - WALL_EDGE_LEFT - gap;
        const x = leftAnchored ? WALL_EDGE_LEFT + w / 2 : WALL_EDGE_RIGHT - w / 2;

        platforms.push(plat(x, top, w));
        slots.push(hazardOn(x + rng.int(-60, 60), top, 100));
        powers.push(powerOn(leftAnchored ? x + w / 2 - 40 : x - w / 2 + 40, top));
    });

    // La salida va en el extremo de la última fila.
    const last = platforms[2];

    return {
        platforms,
        hazardSlots: [hazardOn(300, FLOOR_TOP, 110), hazardOn(700, FLOOR_TOP, 110), ...slots],
        powerSlots: powers,
        spawn: { x: 110, y: 684 },
        goal: { x: last.x + (last.x < 512 ? last.w / 2 - 60 : -last.w / 2 + 60), y: 440 - 36 }
    };
}

// --- Nivel 5: portales + combinación -----------------------------------------

// Torre central con rutas laterales: se sortea qué filas de escalones son frágiles
// (la fila alta lleva los portales de destino y siempre es segura) y a dónde llevan
// los portales. El trampolín queda entre el portal y las rutas, con el pasillo libre.
const TOWER_PATTERNS = [
    { fragileRows: [1], crossPortals: false },
    { fragileRows: [1], crossPortals: true },
    { fragileRows: [0], crossPortals: false },
    { fragileRows: [0, 1], crossPortals: true }
];

function portalTower(rng) {
    const pattern = rng.pick(TOWER_PATTERNS);
    const rows = [580, 470, 360];
    const xs = [366, 658];
    const platforms = [
        { x: 512, y: 740, w: 1024, h: 56, color: PLATFORM_COLOR },
        ...frame().slice(1),
        tower(512, 288, 60),
        plat(512, 266, 200),
        plat(512, 166, 170)
    ];
    const fragiles = [];

    rows.forEach((top, r) => {
        for (const x of xs) {
            if (pattern.fragileRows.includes(r)) fragiles.push(fragile(x, top, 140));
            else platforms.push(plat(x, top, 140));
        }
    });

    const [pl, pr] = [{ x: 170, y: 688 }, { x: 854, y: 688 }];
    const [dl, dr] = [{ x: xs[0], y: 360 }, { x: xs[1], y: 360 }];

    return {
        platforms,
        fragilePlatforms: fragiles,
        trampolines: [rng.pick([{ x: 240, y: 706, w: 56 }, { x: 784, y: 706, w: 56 }])],
        hazardSlots: [hazardOn(360, FLOOR_TOP, 100), hazardOn(790, FLOOR_TOP, 100), hazardOn(680, FLOOR_TOP, 70)],
        powerSlots: [{ x: 450, y: 688 }, { x: 610, y: 688 }],
        portals: pattern.crossPortals ? [pl, dr, pr, dl] : [pl, dl, pr, dr],
        spawn: { x: 110, y: 684 },
        goal: { x: 512, y: 230 }
    };
}

// Escaleras dobles con portales: una escalera segura y otra frágil, un portal del
// piso al último escalón seguro y pinchos al piso.
function portalStairs(rng) {
    const tops = [620, 530, 440, 350];
    const left = chain(rng, 60, 1, tops, 100, 120);
    const right = chain(rng, 964, -1, tops, 100, 120);
    const goalX = 512 + rng.int(-20, 20);

    return {
        platforms: [...left.map((s) => plat(s.x, s.top, s.w)), plat(goalX, 260, 130), plat(goalX, 160, 100)],
        fragilePlatforms: right.map((s) => fragile(s.x, s.top, s.w)),
        hazardSlots: [hazardOn(440, FLOOR_TOP, 100), hazardOn(620, FLOOR_TOP, 100), hazardOn(800, FLOOR_TOP, 100)],
        powerSlots: [{ x: 530, y: 688 }, { x: 710, y: 688 }],
        portals: [{ x: 300, y: 688 }, { x: left[3].x, y: left[3].top }],
        spawn: { x: 110, y: 684 },
        goal: { x: goalX, y: 260 - 36 }
    };
}

export const LEVEL_SHAPES = {
    1: { base: null, terrazas: terraces, 'escalera-doble': stairsN1, piramide: pyramid },
    3: { base: null, zigzag: fragileZigzag, 'doble-escalera': fragileDoubleStairs, puente: fragileBridge },
    4: { base: null, 'escaleras-y-pinchos': hazardStairs, serpiente: hazardSnake },
    5: { base: null, 'torre-portales': portalTower, 'escaleras-portales': portalStairs }
};

// --- Spots, gemas y mecánicas -------------------------------------------------

const SPOT_NN = 85;
const SPOT_COUNT = 12;
const HEADROOM = 30;

function surfaces(cfg) {
    const list = [];

    for (const p of cfg.platforms) {
        if (p.h <= 26 && p.w >= 60 && p.y < FLOOR_TOP - 40) list.push({ x: p.x, top: p.y - p.h / 2, w: p.w });
    }

    for (const f of cfg.fragilePlatforms ?? []) list.push({ x: f.x, top: f.y - 10, w: f.w });

    return list;
}

// Candidatos: el centro (y, en plataformas anchas, los tercios) de cada superficie
// más puntos del piso; se descartan los que quedan tapados o pegados a un obstáculo.
function spotCandidates(cfg) {
    const out = [];

    for (const s of surfaces(cfg)) {
        const offsets = s.w >= 200 ? [0, -s.w * 0.42, -s.w * 0.21, s.w * 0.21, s.w * 0.42] : s.w >= 100 ? [0, -s.w * 0.3, s.w * 0.3] : [0];

        for (const dx of offsets) out.push({ x: Math.round(s.x + dx), y: Math.round(s.top - 24) });
    }

    for (let x = 100; x <= 924; x += 60) out.push({ x, y: FLOOR_TOP - 24 });

    const above = (c) => cfg.platforms.concat(cfg.fragilePlatforms ?? []).some((p) => {
        const h = p.h ?? 20;
        const bottom = p.y + h / 2;

        return h <= 26 && Math.abs(c.x - p.x) < p.w / 2 + 14 && bottom > c.y - HEADROOM && bottom < c.y;
    });
    const nearAny = (c) => [
        ...(cfg.hazards ?? []).map((h) => ({ x: h.x, y: h.y, r: h.w / 2 + 28 })),
        ...(cfg.portals ?? []).map((p) => ({ x: p.x, y: p.y, r: 50 })),
        ...(cfg.trampolines ?? []).map((t) => ({ x: t.x, y: t.y, r: t.w / 2 + 40 })),
        ...(cfg.powerUps ?? []).map((p) => ({ x: p.x, y: p.y, r: 45 })),
        { x: cfg.spawn.x, y: cfg.spawn.y, r: 70 },
        { x: cfg.goal.x, y: cfg.goal.y, r: 90 }
    ].some((o) => Math.hypot(c.x - o.x, (c.y - o.y) * 0.7) < o.r);

    const buried = (c) => cfg.platforms.some((p) => Math.abs(c.x - p.x) < p.w / 2 + 8 && Math.abs(c.y - p.y) < p.h / 2 + 8);

    return out.filter((c) => c.x > 70 && c.x < WORLD.width - 70 && !above(c) && !buried(c) && !nearAny(c));
}

function shuffle(rng, list) {
    const a = list.slice();

    for (let i = a.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}

function placeSpots(rng, cfg) {
    const pool = shuffle(rng, spotCandidates(cfg));
    const picked = [];

    for (const nn of [SPOT_NN, 65, 50, 42]) {
        for (const c of pool) {
            if (picked.length >= SPOT_COUNT) break;
            if (picked.every((p) => Math.hypot(p.x - c.x, p.y - c.y) >= nn)) picked.push(c);
        }
    }

    return picked.slice(0, SPOT_COUNT);
}

// Una gema a 52 px sobre una superficie (se alcanza con un salto normal) lejos de los spots.
function placeGem(rng, cfg) {
    const list = shuffle(rng, surfaces(cfg).filter((s) => s.w >= 100 && s.top < FLOOR_TOP - 150));

    for (const s of list) {
        for (const rise of [52, 62, 44]) {
            for (const dx of [0, -s.w * 0.25, s.w * 0.25]) {
                const gem = { x: Math.round(s.x + dx), y: Math.round(s.top - rise) };
                const clear = cfg.pointSpots.every((p) => Math.hypot(p.x - gem.x, p.y - gem.y) >= 45) &&
                    cfg.platforms.every((p) => !(Math.abs(gem.x - p.x) < p.w / 2 + 10 && Math.abs(gem.y - p.y) < p.h / 2 + 12));

                if (clear) return gem;
            }
        }
    }

    return null;
}

// Pinchos con techo encima (no se pueden saltar por encima): se cruzan con la fase
// retraída, así que su reposo no puede ser corto.
function lowCeiling(cfg, h) {
    const ceiling = cfg.platforms.concat((cfg.fragilePlatforms ?? []).map((f) => ({ ...f, h: 20 })))
        .filter((p) => p.h <= 26 && Math.abs(h.x - p.x) < p.w / 2 + 20 && p.y + p.h / 2 < h.y)
        .map((p) => p.y + p.h / 2)
        .sort((a, b) => b - a)[0];

    return ceiling !== undefined && h.y - ceiling < 48 + 26 + 20;
}

// Mutación de las mecánicas propias de cada nivel.
function mutateMechanics(rng, levelId, cfg, hazardCap = Infinity) {
    if (cfg.fragilePlatforms?.length) {
        const shakeMs = rng.pick([600, 650, 700, 750, 800]);
        const respawnMs = rng.pick([2500, 3000, 3500]);

        cfg.fragilePlatforms = cfg.fragilePlatforms.map((f) => ({ ...f, shakeMs, respawnMs }));
    }

    if (cfg.hazardSlots) {
        const wanted = Math.min(hazardCap, levelId === 4 ? rng.int(2, 4) : rng.int(1, 2));
        // Los pinchos no van junto al spawn ni a la salida, ni tapan un portal o el trampolin, ni
        // quedan casi pegados a otros de la misma fila.
        const chosen = [];

        for (const h of shuffle(rng, cfg.hazardSlots)) {
            const free = Math.hypot(h.x - cfg.spawn.x, h.y - cfg.spawn.y) >= h.w / 2 + 80 &&
                Math.hypot(h.x - cfg.goal.x, h.y - cfg.goal.y) >= h.w / 2 + 70 &&
                (cfg.portals ?? []).every((p) => Math.hypot(h.x - p.x, h.y - p.y) > 100) &&
                (cfg.trampolines ?? []).every((tr) => Math.hypot(h.x - tr.x, h.y - tr.y) > tr.w / 2 + h.w / 2 + 40) &&
                chosen.every((o) => Math.abs(o.y - h.y) >= 20 || Math.abs(o.x - h.x) >= (o.w + h.w) / 2 + 70);

            if (free && chosen.length < wanted) chosen.push(h);
        }

        const cycle = HAZARD_CONFIG.restMs + HAZARD_CONFIG.warnMs + HAZARD_CONFIG.extendedMs;

        cfg.hazards = chosen.map((h, i) => ({
            ...h,
            // Fases escalonadas: nunca todos activos a la vez.
            offsetMs: Math.round((i * cycle) / chosen.length + rng.int(-120, 120)),
            restMs: rng.pick(lowCeiling(cfg, h) ? [1300, 1500] : [1100, 1300, 1500])
        }));
    }

    if (cfg.powerSlots) {
        const count = levelId === 4 ? rng.int(2, 3) : 1;

        cfg.powerUps = shuffle(rng, cfg.powerSlots).slice(0, count).map((p) => ({ ...p, respawnMs: rng.pick([14000, 16000]) }));
    }

}

// El spawn no puede quedar tapado por una plataforma (el simulador lo teletransportaría y
// la ruta validada sería falsa). Piso y paredes quedan fuera.
export function spawnClear(cfg) {
    return cfg.platforms.concat((cfg.fragilePlatforms ?? []).map((f) => ({ ...f, h: 20 }))).every((p) =>
        (p.w >= 1000 || p.h >= 700) || !(Math.abs(cfg.spawn.x - p.x) < p.w / 2 + 16 && Math.abs(cfg.spawn.y - p.y) < p.h / 2 + 22));
}

function mirror(cfg) {
    const flip = (e) => { if (e && typeof e.x === 'number') e.x = WORLD.width - e.x; };

    flip(cfg.spawn);
    flip(cfg.goal);

    for (const key of ['platforms', 'fragilePlatforms', 'pointSpots', 'gems', 'trampolines', 'hazards', 'powerUps', 'portals']) {
        for (const e of cfg[key] ?? []) flip(e);
    }
}

// Arma el nivel `levelId` (3-5) de una semilla: elige una forma (o el diseño base),
// muta sus mecánicas, reparte spots y gema, y a veces la espeja. `baseConfig` aporta
// el nombre, la quota, el tiempo y los proyectiles.
export function generateShapedLevel(rng, levelId, baseConfig, forceShape = null) {
    const shapes = LEVEL_SHAPES[levelId];
    const names = Object.keys(shapes);
    const picked = rng.pick(names);
    const name = forceShape ?? picked;
    const clone = (obj) => JSON.parse(JSON.stringify(obj));
    const cfg = clone(baseConfig);

    if (shapes[name]) {
        const built = shapes[name](rng);

        for (const key of ['platforms', 'fragilePlatforms', 'trampolines', 'hazards', 'powerUps', 'portals', 'gems', 'pointSpots', 'hazardSlots', 'powerSlots']) {
            delete cfg[key];
        }
        // Piso y paredes siempre presentes (las formas solo describen lo flotante).
        built.platforms = [...frame(), ...built.platforms.filter((p) => p.w < 1000 && p.h < 700)];
        Object.assign(cfg, built);
    } else {
        // Diseño base: sus pinchos y escudos pasan a ser "slots" para mutarlos igual.
        delete cfg.gems;
        cfg.hazardSlots = (baseConfig.hazards ?? []).map(({ x, y, w }) => ({ x, y, w }));
        cfg.powerSlots = (baseConfig.powerUps ?? []).map(({ x, y }) => ({ x, y }));
        delete cfg.hazards;
        delete cfg.powerUps;
    }

    cfg.shape = shapes[name] ? name : 'base';

    // Si con todos los pinchos no entran los 12 spots, se baja la cantidad de pinchos.
    for (let cap = Infinity; ; cap = (cfg.hazards?.length ?? 0) - 1) {
        mutateMechanics(rng, levelId, cfg, cap);
        cfg.pointSpots = placeSpots(rng, cfg);

        if (cfg.pointSpots.length >= SPOT_COUNT || (cfg.hazards?.length ?? 0) <= 1) break;
    }

    delete cfg.hazardSlots;
    delete cfg.powerSlots;

    // Gemas desde el nivel 3 (el 1 no lleva).
    const gem = levelId >= 3 ? placeGem(rng, cfg) : null;
    if (gem) cfg.gems = [gem];

    if (rng.chance(0.5)) mirror(cfg);

    return cfg;
}
