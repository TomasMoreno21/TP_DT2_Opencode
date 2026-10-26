import { ALL_LEVELS } from '../src/assets/levels.js';
import { LEVEL_SHAPES } from '../src/systems/LevelShapes.js';
import { LevelGenerator, GENERATION_COMFORT } from '../src/systems/LevelGenerator.js';
import { LevelValidator } from '../src/systems/LevelValidator.js';
import { PLAYER_CONFIG } from '../src/entities/Player.js';
import { HAZARD_CONFIG } from '../src/entities/Hazard.js';

// Auditoria de justicia de los niveles 3-5 (lo que el BFS de alcanzabilidad no mide):
//  - presupuesto de tiempo: segundos para juntar la quota (quota x frames medios a un spot)
//    sobre el timer; los niveles 1 y 2 estan en ~30 %.
//  - ruta segura: cuanto tarda la salida sin pisar fragiles frente a la ruta rapida.
//  - pinchos: plataforma tapada por completo, pinchos pegados al spawn o a la salida,
//    pinchos en pasillos donde no se puede saltar por encima (techo bajo).
// Uso: node tools/audit-fairness.mjs [semillas=8] [semillaInicial=1] [nivel] [forma]
const COUNT = Number(process.argv[2] ?? 8);
const FIRST = Number(process.argv[3] ?? 1);
const ONLY_LEVEL = process.argv[4] ? Number(process.argv[4]) : null;
const ONLY_SHAPE = process.argv[5] ?? null;

const validator = new LevelValidator({ comfort: GENERATION_COMFORT });
const generator = new LevelGenerator();
const PLAYER_H = PLAYER_CONFIG.height;
const PLAYER_W = PLAYER_CONFIG.width;
const SPIKE_H = 26;
// Un salto de mas de 20 px entre dos frames de la ruta (sin portal) es un teletransporte del
// simulador (p. ej. spawn enterrado bajo una plataforma): la validacion no vale.
function teleports(cfg) {
    const path = validator.findPath(cfg, { x: cfg.spawn.x, y: cfg.spawn.y, vx: 0, vy: 0 }, { x: cfg.goal.x, y: cfg.goal.y, dx: 44, dy: 50 });
    if (!path) return ['sin ruta a la salida'];
    let prev = { x: cfg.spawn.x, y: cfg.spawn.y };
    for (const m of path) {
        if (!m.wait && Math.hypot(m.x - prev.x, m.y - prev.y) > 20) return [`teletransporte en la ruta (${Math.round(prev.x)},${Math.round(prev.y)})`];
        prev = m;
    }
    return [];
}
const goalOf = (cfg) => ({ x: cfg.goal.x, y: cfg.goal.y, dx: 44, dy: 50, frames: Infinity });

function budget(cfg, res) {
    return (cfg.quota * res.meanFrames / 60) / cfg.durationSeconds;
}

function hazardIssues(cfg) {
    const out = [];
    const plats = cfg.platforms.filter((p) => p.h <= 26 && p.w >= 60);
    const fr = (cfg.fragilePlatforms ?? []).map((f) => ({ ...f, h: 20 }));

    for (const h of cfg.hazards ?? []) {
        const base = plats.concat(fr).find((p) => Math.abs(h.x - p.x) < p.w / 2 && Math.abs(h.y + 4 - (p.y - p.h / 2)) < 3);
        if (base && base.w - h.w < PLAYER_W + 8) out.push(`pinchos tapan la plataforma (${base.x},${base.y})`);

        if (Math.hypot(h.x - cfg.spawn.x, h.y - cfg.spawn.y) < h.w / 2 + 70) out.push('pinchos junto al spawn');
        if (Math.hypot(h.x - cfg.goal.x, h.y - cfg.goal.y) < h.w / 2 + 60) out.push('pinchos junto a la salida');

        // Techo encima: si no se puede saltar los pinchos, hay que cruzarlos con la fase retraida.
        const ceiling = plats.concat(fr).filter((p) => Math.abs(h.x - p.x) < p.w / 2 + 20 && p.y + p.h / 2 < h.y)
            .map((p) => p.y + p.h / 2).sort((a, b) => b - a)[0];
        if (ceiling !== undefined && h.y - ceiling < PLAYER_H + SPIKE_H) {
            // Es jugable (la fase retraida dura >= 1,1 s) pero conviene saber cuantos hay.
            if (h.restMs < 1200) out.push(`pinchos bajo techo con reposo corto (${h.restMs} ms)`);
        }
    }

    const hz = cfg.hazards ?? [];
    for (let i = 0; i < hz.length; i++) {
        for (let j = i + 1; j < hz.length; j++) {
            if (Math.abs(hz[i].y - hz[j].y) < 20 && Math.abs(hz[i].x - hz[j].x) < (hz[i].w + hz[j].w) / 2 + 60) out.push('dos pinchos casi pegados');
        }
    }

    // Pinchos activos todos a la vez en el piso.
    const cycle = (h) => (h.restMs ?? HAZARD_CONFIG.restMs) + HAZARD_CONFIG.warnMs + HAZARD_CONFIG.extendedMs;
    for (let t = 0; t < 3200; t += 50) {
        const active = hz.filter((h) => ((t + (h.offsetMs ?? 0)) % cycle(h)) >= (h.restMs ?? HAZARD_CONFIG.restMs) + HAZARD_CONFIG.warnMs);
        if (hz.length >= 3 && active.length === hz.length) { out.push('todos los pinchos activos a la vez'); break; }
    }

    return [...new Set(out)];
}

const rows = [];
const issues = new Map();

for (const [levelKey, shapes] of Object.entries(LEVEL_SHAPES)) {
    const levelId = Number(levelKey);
    if (ONLY_LEVEL && levelId !== ONLY_LEVEL) continue;
    const base = ALL_LEVELS.find((l) => l.id === levelId);

    for (const shape of Object.keys(shapes)) {
        if (ONLY_SHAPE && shape !== ONLY_SHAPE) continue;
        const stat = { levelId, shape, n: 0, budget: [], fast: [], safe: [], mean: [] };

        for (let k = 0; k < COUNT; k++) {
            const seed = FIRST + k;
            const cfg = generator.generateLevelFor(levelId, seed, base, undefined, { forceShape: shape }).config;
            const res = validator.validate(cfg);
            const safeGoal = goalOf(cfg);
            validator.explore(cfg, [safeGoal], { noFragile: true });
            const safeSec = safeGoal.frames / 60;

            stat.n++;
            stat.budget.push(budget(cfg, res));
            stat.fast.push(res.goalFrames / 60);
            stat.safe.push(safeSec);
            stat.mean.push(res.meanFrames);

            const found = hazardIssues(cfg).concat(teleports(cfg));
            if (!Number.isFinite(safeSec) || safeSec > cfg.durationSeconds * 0.5) found.push(`ruta segura lenta (${safeSec.toFixed(1)} s)`);
            for (const msg of found) {
                const key = `N${levelId} ${shape}: ${msg}`;
                issues.set(key, (issues.get(key) ?? 0) + 1);
            }
        }

        rows.push(stat);
    }
}

const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
console.log('nivel forma                  presupuesto(min/med/max)   salida rapida   salida segura');
for (const r of rows) {
    console.log(`N${r.levelId}  ${r.shape.padEnd(22)} ${(Math.min(...r.budget) * 100).toFixed(0)}% / ${(avg(r.budget) * 100).toFixed(0)}% / ${(Math.max(...r.budget) * 100).toFixed(0)}%`
        .padEnd(58) + `${avg(r.fast).toFixed(1)} s`.padEnd(16) + `${avg(r.safe).toFixed(1)} s (max ${Math.max(...r.safe).toFixed(1)})`);
}

console.log('\nProblemas detectados (veces / semillas por forma):');
if (issues.size === 0) console.log(' ninguno');
for (const [msg, n] of [...issues].sort()) console.log(` - ${msg}: ${n}/${COUNT}`);
