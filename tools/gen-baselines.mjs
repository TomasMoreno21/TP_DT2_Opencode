import fs from 'node:fs';
import { ALL_LEVELS as LEVELS } from '../src/assets/levels.js';
import { LevelValidator } from '../src/systems/LevelValidator.js';
import { GENERATION_COMFORT } from '../src/systems/LevelGenerator.js';

// Calcula el esfuerzo de referencia (frames del peor spot y de la salida) de
// cada nivel base y lo guarda en src/assets/levelBaselines.js. El generador lo
// usa para no re-validar los niveles base en cada partida (~1 s por nivel).
// Hay que correrlo cada vez que cambie assets/levels.js o el LevelValidator:
// `npm run test-levels` falla si el archivo quedó desactualizado.
const validator = new LevelValidator({ comfort: GENERATION_COMFORT });
const out = {};

for (const level of LEVELS) {
    const res = validator.validate(level);
    if (!res.ok) {
        console.error(`N${level.id} no valida con el validador actual:`, res);
        process.exit(1);
    }
    out[level.id] = { pathLengthFrames: res.pathLengthFrames, meanFrames: Math.round(res.meanFrames * 10) / 10, goalFrames: res.goalFrames };
    console.log(`N${level.id}`, out[level.id]);
}

const body = `// GENERADO por tools/gen-baselines.mjs: no editar a mano.
// Esfuerzo de referencia de los niveles base (validador con comfort ${GENERATION_COMFORT}).
export const LEVEL_BASELINES = ${JSON.stringify(out, null, 4)};
`;
fs.writeFileSync(new URL('../src/assets/levelBaselines.js', import.meta.url), body);
console.log('escrito src/assets/levelBaselines.js');
