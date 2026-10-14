import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import { LevelValidator } from '../src/systems/LevelValidator.js';

const levelsPath = process.argv[2];
if (!levelsPath) {
    console.error('Uso: node tools/gen-audit.mjs <ruta/levels.js>');
    process.exit(1);
}

const { LEVELS } = await import(pathToFileURL(levelsPath).href);
const validator = new LevelValidator();
for (const level of LEVELS) {
    const t0 = performance.now();
    const res = validator.validate(level);
    const dt = (performance.now() - t0).toFixed(1);
    console.log(`N${level.id} ${level.name}: ok=${res.ok} spots=${res.spotsOk}/${res.spotsTotal} goalOk=${res.goalOk} time=${dt}ms`);
}