import { LEVELS } from '../src/assets/levels.js';
import { LevelValidator } from '../src/systems/LevelValidator.js';

// Audita los niveles base con el validador actual.
const validator = new LevelValidator();
for (const level of LEVELS) {
    const t0 = performance.now();
    const res = validator.validate(level);
    const dt = (performance.now() - t0).toFixed(0);
    console.log(`N${level.id} ${level.name}: ok=${res.ok} spots=${res.spotsOk}/${res.spotsTotal} goal=${res.goalFrames} worst=${res.pathLengthFrames} visited=${res.visitedCount} ${dt}ms`,
        res.layoutIssues.length ? res.layoutIssues : '', res.gemsBad.length ? `gemasMal=${res.gemsBad.map((g) => g.index)}` : '', res.spotsBad.map((s) => s.index));
}
