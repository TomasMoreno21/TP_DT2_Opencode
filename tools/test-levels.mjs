import { ALL_LEVELS as LEVELS, WORLD } from '../src/assets/levels.js';
import { LevelGenerator, DIFFICULTY_BAND, TIMER_RULES, TIMER_BANDS, GENERATION_COMFORT, LEVEL_TUNING } from '../src/systems/LevelGenerator.js';
import { LevelValidator } from '../src/systems/LevelValidator.js';
import { LEVEL_BASELINES } from '../src/assets/levelBaselines.js';

// Prueba masiva del generador de niveles aleatorios.
// Uso: node tools/test-levels.mjs [cantidadSemillas=100] [semillaInicial=1]
// Verifica por semilla: validez (re-validada), determinismo, invariantes de
// conteo/límites, banda de timer y variedad; resume tasas y tiempos.
const COUNT = Number(process.argv[2] ?? 100);
const FIRST = Number(process.argv[3] ?? 1);
const REVERIFY_EVERY = Number(process.argv[4] ?? 1);

// Re-verificación independiente con el mismo modelo del generador y, además,
// con 5 % más de margen en el salto y la velocidad del jugador (informativo).
const strict = new LevelValidator({ comfort: GENERATION_COMFORT });
const failures = [];

// Los niveles base deben seguir validando y coincidir con los esfuerzos
// precalculados en assets/levelBaselines.js (tools/gen-baselines.mjs).
for (const level of LEVELS) {
    const res = strict.validate(level);
    const pre = LEVEL_BASELINES[level.id];
    if (!res.ok) failures.push(`nivel base N${level.id} no valida`);
    if (!pre || pre.pathLengthFrames !== res.pathLengthFrames || pre.goalFrames !== res.goalFrames || Math.abs((pre.meanFrames ?? -1) - res.meanFrames) > 0.06) {
        failures.push(`levelBaselines.js desactualizado para N${level.id}: correr node tools/gen-baselines.mjs`);
    }
}
const generator = new LevelGenerator();
const perLevel = LEVELS.map((l) => ({
    id: l.id, name: l.name, n: 0, mutated: 0, attempts: 0, ms: 0, maxMs: 0,
    ratios: [], timers: [], mutations: new Map(), rejected: { layout: 0, structure: 0, unreachable: 0, difficulty: 0 },
    signatures: new Set(), proj: []
}));

const sig = (cfg) => JSON.stringify([cfg.platforms, cfg.pointSpots, cfg.goal, cfg.trampolines, cfg.hazards]);
const fail = (seed, id, msg) => failures.push(`semilla ${seed} N${id}: ${msg}`);

const t0 = performance.now();
for (let k = 0; k < COUNT; k++) {
    const seed = (FIRST + k) >>> 0;
    const campaign = generator.generateCampaign(seed, LEVELS);
    const again = new LevelGenerator().generateCampaign(seed, LEVELS);

    campaign.forEach((entry, i) => {
        const base = LEVELS[i];
        const cfg = entry.config;
        const stat = perLevel[i];
        stat.n++;
        if (entry.mutated) stat.mutated++;
        stat.attempts += entry.attempts;
        for (const key of Object.keys(stat.rejected)) stat.rejected[key] += entry.rejected[key];
        for (const m of entry.mutations) stat.mutations.set(m, (stat.mutations.get(m) ?? 0) + 1);
        stat.timers.push(cfg.durationSeconds);
        stat.signatures.add(sig(cfg));

        if (JSON.stringify(again[i].config) !== JSON.stringify(cfg)) fail(seed, base.id, 'no determinista');
        if (!entry.ok) fail(seed, base.id, 'entrada marcada como inválida');

        if (k % REVERIFY_EVERY === 0) {
            const res = strict.validate(cfg);
            if (!res.ok) fail(seed, base.id, `re-validación falla: spots ${res.spotsOk}/${res.spotsTotal} goal=${res.goalFrames} ${res.layoutIssues.join(';')}`);
        }

        for (const key of ['pointSpots', 'gems', 'trampolines', 'hazards', 'powerUps', 'portals', 'movingPlatforms']) {
            // Los niveles con `trampolines: {min,max}` en LEVEL_TUNING pueden variar su cantidad.
            const range = key === 'trampolines' ? LEVEL_TUNING[base.id]?.trampolines : null;
            const n = cfg[key]?.length ?? 0;
            // N3-N5 (formas de LevelShapes): pinchos, escudos, gemas y trampolines varian por forma; lo
            // que se exige es 12 spots, 1 gema y portales en pares (la validez la barre test-models).
            if (LEVEL_TUNING[base.id]?.shaped) {
                if (key === 'pointSpots' && n !== 12) fail(seed, base.id, `${n} spots`);
                if (key === 'gems' && n !== (base.id >= 3 ? 1 : 0)) fail(seed, base.id, `${n} gemas`);
                if (key === 'portals' && n % 2 !== 0) fail(seed, base.id, 'portales impares');
            } else if (range) {
                if (n < range.min || n > range.max) fail(seed, base.id, `${key}: ${n} fuera de [${range.min},${range.max}]`);
            } else if (n !== (base[key]?.length ?? 0)) fail(seed, base.id, `cambió la cantidad de ${key}`);
        }
        if (cfg.quota !== base.quota) fail(seed, base.id, 'cambió la quota');

        const inBounds = (e) => e.x >= 0 && e.x <= WORLD.width && e.y >= 0 && e.y <= WORLD.height;
        for (const key of ['pointSpots', 'gems', 'trampolines', 'hazards', 'powerUps', 'portals', 'platforms']) {
            if ((cfg[key] || []).some((e) => !inBounds(e))) fail(seed, base.id, `${key} fuera del mundo`);
        }
        if (!inBounds(cfg.goal) || !inBounds(cfg.spawn)) fail(seed, base.id, 'goal/spawn fuera del mundo');

        const band = TIMER_BANDS[base.id];
        const lo = Math.max(band.min, Math.round(base.durationSeconds * TIMER_RULES.minScale));
        const hi = Math.min(band.max, Math.round(base.durationSeconds * TIMER_RULES.maxScale));
        if (!(cfg.durationSeconds >= lo && cfg.durationSeconds <= hi)) fail(seed, base.id, `timer ${cfg.durationSeconds}s fuera de [${lo},${hi}]`);
        if (base.projectiles) {
            const p = cfg.projectiles, b = base.projectiles;
            const bad = !p || p.variant !== b.variant || p.wallGapX !== b.wallGapX || p.minInterval >= p.initialInterval;
            if (bad) fail(seed, base.id, 'proyectiles inconsistentes con el base');
            stat.proj.push(p);
        } else if (cfg.projectiles) fail(seed, base.id, 'aparecieron proyectiles en un nivel sin ellos');
    });
}
const total = performance.now() - t0;

console.log(`\nSemillas ${FIRST}..${FIRST + COUNT - 1}  (${COUNT} campañas, ${(total / COUNT).toFixed(0)} ms por campaña incl. doble generación)`);
console.log(`Banda de dificultad ${DIFFICULTY_BAND.min}–${DIFFICULTY_BAND.max}\n`);
for (const s of perLevel) {
    const timers = s.timers.slice().sort((a, b) => a - b);
    console.log(`N${s.id} ${s.name.padEnd(11)} mutado ${(100 * s.mutated / s.n).toFixed(0)}%  intentos/medio ${(s.attempts / s.n).toFixed(1)}  ` +
        `timer ${timers[0]}–${timers[timers.length - 1]}s  mapas distintos ${s.signatures.size}/${s.n}`);
    if (s.proj.length) {
        const r = (k) => { const v = s.proj.map((p) => p[k]).sort((a, b) => a - b); return [v[0], v[v.length - 1]]; };
        s.range = { ini: r('initialInterval'), spd: r('maxSpeedMultiplier') };
        console.log(`   proyectiles: intervalo inicial ${s.range.ini.join('–')} ms, velocidad máx x${s.range.spd.join('–x')}`);
    }
    console.log(`   rechazos: ${Object.entries(s.rejected).map(([k, v]) => `${k}=${v}`).join(' ')}`);
    console.log(`   mutaciones: ${[...s.mutations].map(([k, v]) => `${k}=${v}`).join(' ')}`);
}

// Progresión: del N1 al N4 los timers no pueden volverse más generosos y los
// proyectiles no pueden solaparse con el nivel anterior (N5 timer: otra curva).
for (let i = 1; i < perLevel.length; i++) {
    const a = perLevel[i - 1], b = perLevel[i];
    if (i < 4 && (Math.min(...b.timers) > Math.min(...a.timers) || Math.max(...b.timers) > Math.max(...a.timers))) {
        failures.push(`progresión: timer N${b.id} más generoso que N${a.id}`);
    }
    if (a.range && b.range) {
        if (b.range.ini[1] >= a.range.ini[0]) failures.push(`progresión: intervalo inicial de N${b.id} se solapa con N${a.id}`);
        if (b.range.spd[0] <= a.range.spd[1]) failures.push(`progresión: velocidad de N${b.id} se solapa con N${a.id}`);
    }
}

if (failures.length) {
    console.log(`\nFALLAS (${failures.length}):`);
    failures.slice(0, 30).forEach((f) => console.log(' - ' + f));
    process.exit(1);
}
console.log('\nOK: sin fallas.');
