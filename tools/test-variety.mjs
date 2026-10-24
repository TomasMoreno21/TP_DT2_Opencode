import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ALL_LEVELS as LEVELS } from '../src/assets/levels.js';
import { LevelGenerator } from '../src/systems/LevelGenerator.js';

// Mide la variedad del nivel 2 (y de la posición de sus trampolines) entre semillas.
// Uso: node tools/test-variety.mjs [cantidadSemillas=100] [semillaInicial=1] [--save-baseline]
// Sin --save-baseline compara con tools/variety-baseline.json y sale con código 1
// si no se alcanzan los umbrales (`thresholds`).
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const SAVE = process.argv.includes('--save-baseline');
const COUNT = Number(args[0] ?? 100);
const FIRST = Number(args[1] ?? 1);
const FILE = fileURLToPath(new URL('./variety-baseline.json', import.meta.url));
const LEVEL_ID = 2;

const base = LEVELS.find((l) => l.id === LEVEL_ID);
const generator = new LevelGenerator();

const signatures = new Set();
const trampolineSets = new Set();
const coarse = new Set();
const bins = {};
const shapes = {};
let noveltySum = 0;
let mutated = 0;

for (let k = 0; k < COUNT; k++) {
    const seed = (FIRST + k) >>> 0;
    const entry = generator.generateLevelFor(LEVEL_ID, seed, base);
    const cfg = entry.config;
    if (entry.mutated) mutated++;
    signatures.add(JSON.stringify([cfg.platforms, cfg.trampolines]));
    trampolineSets.add(JSON.stringify(cfg.trampolines));
    // Firma gruesa: forma general del nivel (plataformas redondeadas a 100 px de
    // grilla), así los retoques de unos pocos píxeles no cuentan como variedad.
    coarse.add(JSON.stringify((cfg.platforms || [])
        .map((p) => [Math.round(p.x / 100), Math.round(p.y / 100), Math.round(p.w / 100), Math.round(p.h / 100)])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3])));
    noveltySum += generator._novelty(base, cfg);
    for (const t of cfg.trampolines || []) {
        const bin = Math.floor(t.x / 100);
        bins[bin] = (bins[bin] ?? 0) + 1;
    }
    for (const m of entry.mutations) {
        if (m.startsWith('forma:')) shapes[m] = (shapes[m] ?? 0) + 1;
    }
}

const metrics = {
    seeds: COUNT,
    mutatedPct: Math.round((100 * mutated) / COUNT),
    distinctSignatures: signatures.size,
    coarseSignatures: coarse.size,
    meanNovelty: Math.round((noveltySum / COUNT) * 10) / 10,
    trampolineBins: bins,
    trampolineBinCount: Object.keys(bins).length,
    // Parte de los trampolines que cae en las 3 franjas de 100 px más usadas
    // (menos = más repartidos).
    topBinShare: Math.round(100 * Object.values(bins).sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) /
        Math.max(1, Object.values(bins).reduce((a, b) => a + b, 0))),
    distinctTrampolineSets: trampolineSets.size,
    shapesUsed: Object.keys(shapes).length,
    shapes
};
console.log(JSON.stringify(metrics, null, 2));

if (SAVE) {
    // Umbrales iniciales (los finales se ajustan a mano en el JSON con los valores
    // logrados). `min` exige al menos ese valor; `max` exige no pasarse.
    const thresholds = {
        min: {
            coarseSignatures: Math.min(COUNT, Math.ceil(metrics.coarseSignatures * 2)),
            distinctTrampolineSets: Math.min(COUNT, Math.ceil(metrics.distinctTrampolineSets * 2.5)),
            trampolineBinCount: 10
        },
        max: { topBinShare: 60 }
    };
    writeFileSync(FILE, JSON.stringify({ metrics, thresholds }, null, 2) + '\n');
    console.log(`\nLínea base guardada en ${FILE}`);
    process.exit(0);
}

if (!existsSync(FILE)) {
    console.log('\nFalta tools/variety-baseline.json: correr con --save-baseline.');
    process.exit(1);
}
const { thresholds } = JSON.parse(readFileSync(FILE, 'utf8'));
const failures = [];
for (const [key, min] of Object.entries(thresholds.min)) {
    if (metrics[key] < min) failures.push(`${key}: ${metrics[key]} < umbral ${min}`);
}
for (const [key, max] of Object.entries(thresholds.max)) {
    if (metrics[key] > max) failures.push(`${key}: ${metrics[key]} > umbral ${max}`);
}
if (failures.length) {
    console.log(`\nFALLAS (${failures.length}):`);
    failures.forEach((f) => console.log(' - ' + f));
    process.exit(1);
}
console.log('\nOK: variedad sobre los umbrales.');
