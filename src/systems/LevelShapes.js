import { WORLD } from '../assets/levels.js';
import { HAZARD_CONFIG } from '../entities/Hazard.js';
import { LAYOUT_STYLES, BOUNCE_STYLES, buildLayout, fitsLayout, floorSpots, frame, plat, fragile, hazardOn, powerOn } from './LevelLayout.js';

// Niveles 1 a 5: la estructura sale de LevelLayout.js (grafo de plataformas con reglas de espacio
// y carriles de trampolín reservados) y acá se le suman las mecánicas de cada nivel (frágiles,
// pinchos, portales), los spots y la gema. Son builders puros: reciben el rng del generador y
// devuelven datos. Al jugar no se valida con BFS (es lento): cada estilo se barre offline con
// tools/test-models.mjs (`npm run test-models`) y los parámetros se acotan para que cualquier
// valor del rango sea alcanzable. Si se toca el generador hay que correrlo.

const FLOOR_TOP = WORLD.floorTop;

// Estilos de estructura por nivel: el N2 (rebotes) tiene los suyos; el resto comparte los generales.
export const LEVEL_SHAPES = { 1: LAYOUT_STYLES, 2: BOUNCE_STYLES, 3: LAYOUT_STYLES, 4: LAYOUT_STYLES, 5: LAYOUT_STYLES };

// --- Mecánicas por nivel ----------------------------------------------------------

function shuffle(rng, list) {
    const a = list.slice();

    for (let i = a.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}

// Elige hasta `count` posiciones del piso separadas al menos `apart` entre sí.
function pickFloor(rng, layout, count, apart, taken = []) {
    const xs = floorSpots(rng, layout, 140, taken, 110);
    const out = [];

    for (const x of xs ? shuffle(rng, xs) : []) {
        if (out.length >= count) break;
        if (out.every((o) => Math.abs(o - x) >= apart)) out.push(x);
    }

    return out;
}

// Pasa la estructura al formato del nivel: N3 y N5 convierten plataformas que no están en el
// camino a la salida en frágiles; N4 y N5 suman lugares para pinchos y escudos; N5, portales.
function layoutToConfig(rng, levelId, layout) {
    const { items, path, trampolines, spawn, goal, goalItem, tower } = layout;
    const below = (p) => items.filter((q) => { for (let k = q.parent; k >= 0; k = items[k].parent) if (items[k] === p) return true; return false; });
    // N3: las frágiles son el camino casi obligado a lo que hay arriba de ellas (cuanto más cuelga de
    // una, antes se elige); la ruta segura a la salida queda siempre fuera de ellas.
    const off = shuffle(rng, items.filter((p) => !path.has(p) && !p.tower))
        .sort((a, b) => (levelId === 3 ? below(b).length - below(a).length : 0));
    const fragiles = new Set(off.slice(0, levelId === 3 ? rng.int(3, 4) : levelId === 5 ? 2 : 0));
    const safe = items.filter((p) => !fragiles.has(p));
    const cfg = {
        platforms: [...frame(), ...(tower ? [tower.pillar] : []), ...safe.map((p) => plat(p.x, p.top, p.w))],
        trampolines,
        spawn,
        goal
    };

    if (fragiles.size) cfg.fragilePlatforms = [...fragiles].map((p) => fragile(p.x, p.top, p.w));
    if (levelId === 3) cfg.regionKeys = [...new Set([...fragiles].flatMap((f) => [f, ...below(f)]))].map((p) => keyOf(p.x, p.top));
    if (tower) cfg.bonusKeys = [keyOf(tower.cap.x, tower.cap.top)];

    if (levelId >= 4) {
        const taken = [];

        // N5: portales primero (pares piso -> plataforma), así los pinchos se reparten alrededor.
        if (levelId === 5) {
            const dests = shuffle(rng, safe.filter((p) => p !== goalItem && !p.tower && p.top <= 520 && p.w >= 110)).slice(0, rng.int(1, 2));

            cfg.portals = [];

            for (const d of dests) {
                const x = pickFloor(rng, layout, 1, 0, taken)[0];

                if (x === undefined) break;
                taken.push({ x });
                cfg.portals.push({ x, y: FLOOR_TOP - 24 }, { x: d.x, y: d.top - 24 });
            }
        }

        const floorXs = pickFloor(rng, layout, 3, 260, taken);
        const onPlat = shuffle(rng, safe.filter((p) => p !== goalItem && !p.tower && p.w >= 140)).slice(0, 3);
        const powered = shuffle(rng, safe.filter((p) => p !== goalItem && !p.tower)).slice(0, 3);

        cfg.hazardSlots = [...floorXs.map((x) => hazardOn(x, FLOOR_TOP, 100)), ...onPlat.map((p) => hazardOn(p.x, p.top, p.w - 50))];
        cfg.powerSlots = powered.map((p) => powerOn(p.x, p.top));
    }

    return cfg;
}

// --- Mecánicas de niveles anteriores ------------------------------------------

function floatingSurfaces(cfg) {
    return cfg.platforms.filter((p) => p.h <= 26 && p.w < 1000 && p.y < FLOOR_TOP - 40)
        .concat((cfg.fragilePlatforms ?? []).map((f) => ({ ...f, h: 20 })));
}

// Escalones frágiles a un lado de una plataforma segura (con hueco y respetando el espacio libre).
function addFragileLedges(rng, cfg, count, ctx) {
    const added = [];
    const asItem = (p) => ({ x: p.x, top: p.y - p.h / 2, w: p.w });

    for (const base of shuffle(rng, floatingSurfaces(cfg))) {
        if (added.length >= count) break;

        const w = rng.int(100, 130);
        const items = floatingSurfaces(cfg).concat(added.map((f) => ({ ...f, h: 20 }))).map(asItem);

        for (const [side, rise] of shuffle(rng, [[1, 0], [-1, 0], [1, -60], [-1, -60], [1, 60], [-1, 60]])) {
            const x = Math.round(base.x + side * (base.w / 2 + rng.int(100, 115) + w / 2));
            const top = base.y - base.h / 2 + rise;
            const apart = [cfg.spawn, cfg.goal, ...(cfg.hazardSlots ?? []), ...(cfg.powerSlots ?? []), ...(cfg.portals ?? [])]
                .every((o) => Math.hypot(x - o.x, top - o.y) > 90);

            if (apart && fitsLayout({ x, top, w }, items, ctx)) {
                added.push(fragile(x, top, w));
                break;
            }
        }
    }

    cfg.fragilePlatforms = [...(cfg.fragilePlatforms ?? []), ...added];
}

// El N4 conserva dos escalones frágiles del N3.
function addCarryover(rng, levelId, cfg, ctx) {
    if (levelId === 4 && !cfg.fragilePlatforms?.length) addFragileLedges(rng, cfg, 2, ctx);
}

// --- Spots, gemas y mecánicas -------------------------------------------------

const SPOT_NN = 170;
const SPOT_COUNT = 12;
const HEADROOM = 30;

const keyOf = (x, top) => `${Math.round(x)},${Math.round(top)}`;

// regionKeys: plataformas que solo se alcanzan pisando una frágil (N3); bonusKeys: la repisa de la
// torre de wall jump. Los dos son temporales (los pone layoutToConfig y los borra generateShapedLevel).
function surfaces(cfg) {
    const list = [];
    const region = new Set(cfg.regionKeys ?? []);
    const bonus = new Set(cfg.bonusKeys ?? []);
    const mark = (x, top) => ({ region: region.has(keyOf(x, top)), bonus: bonus.has(keyOf(x, top)) });

    for (const p of cfg.platforms) {
        if (p.h <= 26 && p.w >= 60 && p.y < FLOOR_TOP - 40) list.push({ x: p.x, top: p.y - p.h / 2, w: p.w, ...mark(p.x, p.y - p.h / 2) });
    }

    for (const f of cfg.fragilePlatforms ?? []) list.push({ x: f.x, top: f.y - 10, w: f.w, fragile: true, region: true });

    return list;
}

// Candidatos: el centro (y, en plataformas anchas, los tercios) de cada superficie
// más puntos del piso; se descartan los que quedan tapados o pegados a un obstáculo.
function spotCandidates(cfg) {
    const out = [];

    for (const s of surfaces(cfg)) {
        const offsets = s.w >= 200 ? [0, -s.w * 0.42, -s.w * 0.21, s.w * 0.21, s.w * 0.42] : s.w >= 100 ? [0, -s.w * 0.3, s.w * 0.3] : [0];

        for (const dx of offsets) out.push({ x: Math.round(s.x + dx), y: Math.round(s.top - 24), fragile: Boolean(s.fragile || s.region), bonus: Boolean(s.bonus) });
    }

    for (let x = 100; x <= WORLD.width - 100; x += 30) out.push({ x, y: FLOOR_TOP - 24 });

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

// N3: la mecánica de las frágiles es el centro del diseño, así que la mayoría de los spots (y la gema)
// quedan sobre ellas o sobre lo que solo se alcanza por ellas: recolectar obliga a pisarlas.
const FRAGILE_SPOTS = 8;
// Spots que premian la torre de wall jump.
const BONUS_SPOTS = 2;

// El N2 tiene menos lugar (los carriles de los trampolines): admite spots algo más juntos al final.
function placeSpots(rng, cfg, preferFragile = false, tight = false) {
    const pool = shuffle(rng, spotCandidates(cfg));
    const picked = [];

    for (const c of pool.filter((o) => o.bonus)) {
        if (picked.length >= BONUS_SPOTS) break;
        if (picked.every((p) => Math.hypot(p.x - c.x, p.y - c.y) >= 110)) picked.push(c);
    }

    if (preferFragile) {
        for (const nn of [SPOT_NN, 130, 100]) {
            for (const c of pool.filter((o) => o.fragile)) {
                if (picked.length >= FRAGILE_SPOTS) break;
                if (picked.every((p) => Math.hypot(p.x - c.x, p.y - c.y) >= nn)) picked.push(c);
            }
        }
    }

    for (const nn of tight ? [SPOT_NN, 140, 115, 95, 80, 65] : [SPOT_NN, 140, 115, 95, 80]) {
        for (const c of pool) {
            if (picked.length >= SPOT_COUNT) break;
            if (picked.every((p) => Math.hypot(p.x - c.x, p.y - c.y) >= nn)) picked.push(c);
        }
    }

    return picked.slice(0, SPOT_COUNT);
}

// Una gema a 52 px sobre una superficie (se alcanza con un salto normal) lejos de los spots.
function placeGem(rng, cfg, preferFragile = false) {
    const list = shuffle(rng, surfaces(cfg).filter((s) => s.w >= 100 && s.top < FLOOR_TOP - 150))
        .sort((a, b) => Number(Boolean(b.bonus)) - Number(Boolean(a.bonus)) || (preferFragile ? Number(Boolean(b.fragile)) - Number(Boolean(a.fragile)) : 0));

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
        const shakeMs = rng.pick([400, 450, 500, 550]);
        const respawnMs = rng.pick([3200, 3600, 4000, 4200]);

        // N3 es el nivel de las frágiles: cada una varía un poco su aviso y su regreso.
        const jitter = (ms, step) => (levelId === 3 ? ms + rng.pick([-step, 0, step]) : ms);

        cfg.fragilePlatforms = cfg.fragilePlatforms.map((f) => ({ ...f, shakeMs: jitter(shakeMs, 50), respawnMs: jitter(respawnMs, 250) }));
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

// Arma el nivel `levelId` (1-5) de una semilla: elige un estilo (o el diseño base si ninguno
// cumple las reglas), suma sus mecánicas, reparte spots y gema, y a veces lo espeja.
// `baseConfig` aporta el nombre, la quota, el tiempo y los proyectiles.
export function generateShapedLevel(rng, levelId, baseConfig, forceShape = null) {
    const styles = Object.keys(LEVEL_SHAPES[levelId]);
    const picked = forceShape ?? rng.pick(styles);
    const clone = (obj) => JSON.parse(JSON.stringify(obj));
    const cfg = clone(baseConfig);
    // Si el estilo sorteado no logra cumplir las reglas de espacio se prueba con los demás.
    let name = picked;
    let layout = null;

    for (const style of [picked, ...shuffle(rng, styles.filter((n) => n !== picked))]) {
        layout = buildLayout(rng, levelId, style);
        if (layout) { name = style; break; }
        if (forceShape) break;
    }

    let ctx = { reserved: [], spawn: cfg.spawn };

    if (layout) {
        for (const key of ['platforms', 'fragilePlatforms', 'trampolines', 'hazards', 'powerUps', 'portals', 'gems', 'pointSpots', 'hazardSlots', 'powerSlots']) {
            delete cfg[key];
        }
        Object.assign(cfg, layoutToConfig(rng, levelId, layout));
        ctx = layout.ctx;
    } else {
        // Diseño base: sus pinchos y escudos pasan a ser "slots" para mutarlos igual.
        delete cfg.gems;
        cfg.hazardSlots = (baseConfig.hazards ?? []).map(({ x, y, w }) => ({ x, y, w }));
        cfg.powerSlots = (baseConfig.powerUps ?? []).map(({ x, y }) => ({ x, y }));
        delete cfg.hazards;
        delete cfg.powerUps;
    }

    cfg.shape = layout ? name : 'base';
    addCarryover(rng, levelId, cfg, ctx);

    // Si con todos los pinchos no entran los 12 spots, se baja la cantidad de pinchos.
    for (let cap = Infinity; ; cap = (cfg.hazards?.length ?? 0) - 1) {
        mutateMechanics(rng, levelId, cfg, cap);
        cfg.pointSpots = placeSpots(rng, cfg, levelId === 3, levelId === 2);

        if (cfg.pointSpots.length >= SPOT_COUNT || (cfg.hazards?.length ?? 0) <= 1) break;
    }

    delete cfg.hazardSlots;
    delete cfg.powerSlots;

    // Gemas desde el nivel 3 (el 1 no lleva).
    const gem = levelId >= 3 ? placeGem(rng, cfg, levelId === 3) : null;
    if (gem) cfg.gems = [gem];
    delete cfg.regionKeys;
    delete cfg.bonusKeys;

    if (rng.chance(0.5)) mirror(cfg);

    return cfg;
}
