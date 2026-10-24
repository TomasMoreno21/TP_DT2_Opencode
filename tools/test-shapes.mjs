import { ALL_LEVELS as LEVELS, WORLD } from '../src/assets/levels.js';
import { LevelGenerator, CRAMPED_HEADROOM } from '../src/systems/LevelGenerator.js';
import { LevelValidator } from '../src/systems/LevelValidator.js';
import { MACRO_SHAPE_NAMES, buildShape, CHANNEL_MIN, CHANNEL_MAX } from '../src/systems/MacroShapes.js';

// Chequea cada forma macro del nivel 2 con muchas semillas, sin BFS (rápido):
// que el builder sea determinista, que el layout sea válido, que no pase de 13
// plataformas (filtro `dense` del generador), que no estorbe entre sí y que sus
// canales y trampolines cumplan las reglas.
// Uso: node tools/test-shapes.mjs [semillas=200] [forma]
const COUNT = Number(process.argv[2] ?? 200);
const ONLY = process.argv[3];
const EXPECTED = ['escalera-torre', 'pozo', 'torres-gemelas', 'terrazas'];

const base = LEVELS.find((l) => l.id === 2);
const generator = new LevelGenerator();
const validator = new LevelValidator({ comfort: 1 });
const failures = [];
const baseDistribution = generator.baseline(base).distribution;
const fail = (name, seed, msg) => failures.push(`${name} semilla ${seed}: ${msg}`);

for (const name of EXPECTED) {
    if (!MACRO_SHAPE_NAMES.includes(name)) failures.push(`falta la forma '${name}'`);
}

// rng mínimo e independiente (mismo LCG que el generador no se exporta).
const makeRng = (seed) => {
    let s = seed >>> 0;
    const rng = {
        next() { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; },
        range(a, b) { return a + (b - a) * this.next(); },
        int(a, b) { return Math.floor(this.range(a, b + 1)); },
        chance(p) { return this.next() < p; },
        pick(l) { return l[Math.floor(this.next() * l.length)]; }
    };
    for (let i = 0; i < 6; i++) rng.next();
    return rng;
};

const isFloating = (p) => p.h <= 60 || p.w >= p.h ? p.y < WORLD.floorTop - 20 && p.w < 1000 && !(p.h > 300 && p.w < 60 && (p.x < 60 || p.x > 960)) : false;

for (const name of MACRO_SHAPE_NAMES.filter((n) => !ONLY || n === ONLY)) {
    let built = 0;
    let spread = 0;
    for (let seed = 1; seed <= COUNT; seed++) {
        const spawnX = base.spawn.x;     // el generador arma la forma contra el spawn y luego la espeja
        const shape = buildShape(name, makeRng(seed), spawnX);
        const again = buildShape(name, makeRng(seed), spawnX);
        if (JSON.stringify(shape) !== JSON.stringify(again)) { fail(name, seed, 'no determinista'); continue; }
        if (!shape) continue;       // una semilla sin forma sana se acepta; la tasa se mira abajo
        built++;

        const fixed = base.platforms.filter((p) => !isFloating(p));
        const cfg = { ...JSON.parse(JSON.stringify(base)), platforms: [...fixed, ...shape.platforms], trampolines: shape.trampolines, spawn: { x: spawnX, y: base.spawn.y } };
        cfg.pointSpots = []; cfg.gems = []; cfg.goal = { x: 700, y: -500 };
        cfg.spawn = { x: spawnX, y: base.spawn.y };

        if (cfg.platforms.length > 13) fail(name, seed, `${cfg.platforms.length} plataformas (> 13)`);
        const crowded = generator._crowdedPlatforms(cfg, new Set(fixed.map((p) => generator._platformKey(p))));
        if (crowded > 0) fail(name, seed, `${crowded} plataformas estorbándose`);
        const layout = validator.checkLayout({ ...cfg, goal: undefined }).filter((i) => !i.startsWith('salida'));
        if (layout.length) fail(name, seed, `layout: ${layout.join(';')}`);
        for (const c of shape.channels) {
            if (c.width < CHANNEL_MIN || c.width > CHANNEL_MAX) fail(name, seed, `canal de ${c.width} px fuera de [${CHANNEL_MIN},${CHANNEL_MAX}]`);
        }
        for (const t of shape.trampolines) {
            if (t.w < 60 || t.w > 100) fail(name, seed, `trampolín de ancho ${t.w}`);
        }
        if (generator._distributionOk(cfg, baseDistribution)) spread++;
        // Aire libre sobre cada plataforma: el generador (`_decongest`) quita las apretadas.
        const plays = cfg.platforms.filter((p) => generator._isPlayPlatform(p) && p.y < WORLD.floorTop - 20);
        const cramped = plays.filter((p) => generator._headroomOf(p, plays) < CRAMPED_HEADROOM).length;
        if (cramped > 0) fail(name, seed, `${cramped} plataformas con menos de ${CRAMPED_HEADROOM} px de aire encima`);
        if (name === 'pozo') {
            const c = shape.channels[0];
            if (!shape.trampolines.some((t) => Math.abs(t.x - c.x) <= t.w / 2 + c.width / 2)) fail(name, seed, 'pozo sin trampolín al pie del canal');
        }
        if (name === 'terrazas') {
            for (const t of shape.trampolines) {
                const up = shape.platforms.some((p) => { const rise = t.y - (p.y - p.h / 2); return rise >= 70 && rise <= 460 && Math.abs(p.x - t.x) <= p.w / 2 + 260; });
                if (!up) fail(name, seed, 'trampolín sin plataforma a la que subir');
            }
        }
    }
    const rate = Math.round((100 * built) / COUNT);
    console.log(`${name.padEnd(16)} formas sanas ${built}/${COUNT} (${rate}%)`);
    if (rate < 50) failures.push(`${name}: solo ${rate}% de semillas arma una forma sana`);
    // El reparto en el escenario (franjas x alturas) lo exige el generador (`uneven`).
    console.log(`${' '.repeat(16)} reparto OK ${spread}/${built}`);
    if (built > 0 && spread / built < 0.9) failures.push(`${name}: solo ${Math.round((100 * spread) / built)}% cumple el reparto del escenario`);
}

if (failures.length) {
    console.log(`\nFALLAS (${failures.length}):`);
    failures.slice(0, 30).forEach((f) => console.log(' - ' + f));
    process.exit(1);
}
console.log('\nOK: sin fallas.');
