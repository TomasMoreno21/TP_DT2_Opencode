import { ALL_LEVELS } from '../src/assets/levels.js';
import { LEVEL_SHAPES } from '../src/systems/LevelShapes.js';
import { LevelGenerator, GENERATION_COMFORT } from '../src/systems/LevelGenerator.js';
import { LevelValidator } from '../src/systems/LevelValidator.js';

// Barrido offline de las formas de los niveles 3-5 (LevelShapes.js): para cada forma y
// semilla genera el nivel y lo valida con el BFS (spots, gema, salida y ruta segura).
// Uso: node tools/test-models.mjs [semillas=6] [semillaInicial=1] [nivel] [forma]
// Hay que correrlo cada vez que se toque una forma: al jugar no se valida (es lento).
const COUNT = Number(process.argv[2] ?? 6);
const FIRST = Number(process.argv[3] ?? 1);
const ONLY_LEVEL = process.argv[4] ? Number(process.argv[4]) : null;
const ONLY_SHAPE = process.argv[5] ?? null;

const validator = new LevelValidator({ comfort: GENERATION_COMFORT });
const generator = new LevelGenerator();
const failures = [];
let total = 0;

for (const [levelKey, shapes] of Object.entries(LEVEL_SHAPES)) {
    const levelId = Number(levelKey);
    if (ONLY_LEVEL && levelId !== ONLY_LEVEL) continue;
    const base = ALL_LEVELS.find((l) => l.id === levelId);

    for (const shape of Object.keys(shapes)) {
        if (ONLY_SHAPE && shape !== ONLY_SHAPE) continue;
        let ok = 0;
        let ms = 0;

        for (let k = 0; k < COUNT; k++) {
            const seed = FIRST + k;
            const entry = generator.generateLevelFor(levelId, seed, base, undefined, { forceShape: shape });
            const cfg = entry.config;
            const t0 = performance.now();
            const res = validator.validate(cfg);
            ms += performance.now() - t0;
            total++;

            const problems = [];
            if (!res.goalOk) problems.push('salida inalcanzable');
            if (res.spotsOk < res.spotsTotal) problems.push(`spots ${res.spotsOk}/${res.spotsTotal}: ${res.spotsBad.map((s) => `(${s.x},${s.y})`).join(' ')}`);
            if (res.gemsBad.length) problems.push(`gemas: ${res.gemsBad.map((g) => `(${g.x},${g.y})`).join(' ')}`);
            if (res.layoutIssues.length) problems.push(`layout: ${res.layoutIssues.join('; ')}`);
            if (!res.safeRoute) problems.push('sin ruta segura');
            if (cfg.pointSpots.length < 12) problems.push(`solo ${cfg.pointSpots.length} spots`);
            if (levelId >= 3 && !cfg.gems?.length) problems.push('sin gema');

            if (problems.length) failures.push(`N${levelId} ${shape} semilla ${seed}: ${problems.join(' | ')}`);
            else ok++;
        }

        console.log(`N${levelId} ${shape.padEnd(20)} ${ok}/${COUNT} ok  (${Math.round(ms / COUNT)} ms por validación)`);
    }
}

if (failures.length) {
    console.log(`\nFALLAS (${failures.length}/${total}):`);
    for (const f of failures) console.log(' - ' + f);
    process.exit(1);
}

console.log(`\nOK: ${total} niveles validan.`);
