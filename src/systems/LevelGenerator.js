import { WORLD } from '../assets/levels.js';
import { LevelValidator } from './LevelValidator.js';
import { LEVEL_BASELINES } from '../assets/levelBaselines.js';
import { PLAYER_CONFIG } from '../entities/Player.js';
import { TRAMPOLINE_CONFIG } from '../entities/Trampoline.js';
import { MOVING_PLATFORM_CONFIG } from '../entities/MovingPlatform.js';

const RNG_A = 1664525;
const RNG_C = 1013904223;
const RNG_M = 2 ** 32;

export const DEFAULT_ATTEMPTS = 60;

// En cada ronda se juntan hasta CANDIDATE_POOL candidatos que pasan los filtros
// baratos y se valida (BFS, lo caro). Para evitar que los mapas siempre se vean
// iguales, no se elige siempre el de mejor calidad: se hace una selección
// ponderada (softmax) entre los candidatos válidos, así el jugador ve variedad.
export const CANDIDATE_POOL = 5;

// Cuanto más baja, más se privilegia la calidad y menos variedad hay.
// 0.45 es un punto medio: mapas buenos pero distintos entre semillas.
export const SELECTION_TEMPERATURE = 0.45;

// Espacio para moverse: una plataforma con menos de CRAMPED_HEADROOM px de aire
// encima se considera apretada (el jugador mide 48 y el salto sube ~117).
export const CRAMPED_HEADROOM = 120;
// Máximo de techos bajos que se quitan por nivel para ganar espacio.
export const DECONGEST_MAX = 3;
// Lugar de sobra para spots que tiene que quedar al quitar una plataforma.
export const SPOT_ROOM_SPARE = 1;

// Asistencia tras morir: cada muerte seguida en un nivel baja la banda de
// dificultad del siguiente intento y premia aún más el espacio libre.
export const ASSIST_MAX = 3;

// Qué tan distinto debe ser un candidato del nivel base (ver _novelty) y hasta
// qué fracción de los intentos se exige.
export const MIN_NOVELTY = 6;
export const MIN_NOVELTY_UNTIL = 0.7;

// Densidad: un candidato debe tener al menos MIN_REMOVED plataformas menos que el
// nivel base (mismo calendario de intentos que la novedad).
export const MIN_REMOVED = 1;

// Separación mínima de las plataformas que el generador toca o agrega respecto
// de TODAS las demás, para que no se estorben entre sí:
//  - verticalmente: si se superponen en x, al menos CLEAR_VERTICAL px de aire
//    (el salto llega a ~117 px y el jugador mide 48);
//  - horizontalmente: a una altura parecida, al menos CLEAR_HORIZONTAL px de
//    hueco (nada de ranuras que no dejan pasar ni sirven para saltar).
export const CLEAR_VERTICAL = 100;
export const CLEAR_HORIZONTAL = 70;

// Plataformas "encimadas": superpuestas en x con menos de STACK_GAP px de aire
// vertical (con 120 el jugador, de 48 px, apenas tiene lugar para saltar entre
// ellas). El generador las separa en horizontal o las quita.
export const STACK_GAP = 120;

// Trampolines: aire libre encima (TRAMPOLINE_CLEARANCE px) y al menos una
// plataforma más alta dentro del alcance del rebote para que sirva para subir
// (el rebote base llega a ~210 px; el perfecto, hasta el techo).
export const TRAMPOLINE_CLEARANCE = 200;
const TRAMPOLINE_HALF_HEIGHT = 6;
export const TRAMPOLINE_MIN_RISE = 70;
export const TRAMPOLINE_MAX_RISE = 460;

// Zona libre alrededor de cada trampolín: ninguna plataforma (salvo la que lo
// sostiene) a menos de TRAMPOLINE_SIDE px de sus bordes hasta TRAMPOLINE_NEAR px
// arriba, ni en vertical hasta la altura máxima del rebote; pinchos, spots al ras,
// la salida, el spawn y otros trampolines también se mantienen a distancia.
export const TRAMPOLINE_SIDE = 45;
export const TRAMPOLINE_NEAR = 110;
export const TRAMPOLINE_ENTITY_GAP = 60;
// Los spots pueden quedar algo más cerca (no estorban el rebote, solo no deben
// estar encima ni pegados al borde).
export const TRAMPOLINE_SPOT_GAP = 35;

// Pasillo vertical del rebote: libre hasta donde llega la cabeza del jugador en
// el punto más alto (v²/2g + su altura + la mitad del trampolín + margen). El
// rebote base sale de cualquier punto del trampolín; el perfecto, de su centro.
const TRAMPOLINE_GRAVITY = 900;
const PLAYER_HALF_WIDTH = (PLAYER_CONFIG.width * 1.18) / 2;
const apexOf = (vy) => vy * vy / (2 * TRAMPOLINE_GRAVITY) + PLAYER_CONFIG.height + TRAMPOLINE_HALF_HEIGHT + 10;
export const TRAMPOLINE_BASE_APEX = apexOf(TRAMPOLINE_CONFIG.baseVy);
export const TRAMPOLINE_PERFECT_APEX = apexOf(TRAMPOLINE_CONFIG.perfectVy);

// Reparto en el escenario: cuadrícula DIST_COLS x DIST_ROWS, y mínimo de celdas
// ocupadas que se pide aunque el base tenga más.
export const DIST_COLS = 4;
export const DIST_ROWS = 3;
export const DIST_MIN_CELLS = 7;

// Colocación de los elementos: separación mínima entre spots, máximo por franja,
// salida lejos del spawn y de cualquier spot, y pasos del pulido de spots.
export const SPOT_MIN_NN = 75;
export const SPOT_MAX_PER_BAND = 6;
export const GOAL_MIN_FROM_SPAWN = 450;
export const GOAL_MIN_FROM_SPOT = 90;
// Cuánto puede variar la altura de la salida respecto del diseño base.
export const GOAL_Y_TOLERANCE = 170;
export const POLISH_STEPS = 80;
export const POLISH_SAMPLES = 10;
// Cuánto puede diferir el reparto de spots por alturas respecto del base (suma
// de diferencias entre las 3 franjas horizontales).
export const ROW_DEVIATION = 3;

// Escala de capacidades con la que se valida cada mapa generado (1 = las del
// jugador). El validador ya es conservador por otros lados (sin trepar pegado a
// la pared, hitbox ensanchada como al correr, tolerancias de recogida justas),
// y con 0,95 los niveles base de N1 dejan de ser alcanzables: se usa 1.
export const GENERATION_COMFORT = 1;

// Banda de dificultad aceptada: el esfuerzo del candidato (frames del peor
// objetivo) respecto del nivel base. Fuera de la banda el mapa se descarta por
// trivial o por injugable aunque sea técnicamente alcanzable.
export const DIFFICULTY_BAND = { min: 0.7, max: 1.4 };

// Ajuste por nivel (solo N1-N3, que son los que pulimos a fondo): intensidad
// máxima de mutación, novedad exigida, banda de dificultad y tolerancia de la
// salida respecto del diseño base. N1 es un nivel de arranque: menos mutación,
// salida baja y banda más indulgente. N3 exige más variedad y más esfuerzo.
export const LEVEL_TUNING = {
    1: { maxIntensity: 0.55, minNovelty: 3, difficulty: { min: 0.6, max: 1.15 }, goalYTolerance: 90 },
    2: { maxIntensity: 0.75, minNovelty: 5, difficulty: { min: 0.7, max: 1.25 }, goalYTolerance: 130 },
    3: {
        maxIntensity: 0.95,
        minNovelty: 7,
        difficulty: { min: 0.75, max: 1.35 },
        goalYTolerance: 170,
        // N3 se centra en plataformas móviles: se exige al menos una, alcanzable y
        // que conecte zonas o lleve a puntos/gemas/meta.
        requireMovingPlatform: true,
        movingPlatformMinRise: 60,
        movingPlatformMaxRise: 260,
        // Foco en móviles: menos plataformas estáticas y al menos tres móviles.
        maxStaticPlatforms: 7,
        minMovingPlatforms: 3,
    },
};

// El timer parte del timer diseñado del nivel y se escala (amortiguado) con el
// esfuerzo relativo del candidato, para no perder el balance que tiene cada
// nivel en assets/levels.js.
export const TIMER_RULES = { minScale: 0.85, maxScale: 1.25, damping: 0.7 };

// Curva de progresión: banda de segundos permitida por nivel, así un mapa
// "fácil" del N4 nunca resulta más generoso que uno "difícil" del N2. Del N1 al
// N4 los límites son decrecientes; el N5 sube porque su quota es la mayor (16).
export const TIMER_BANDS = {
    1: { min: 55, max: 66 },
    2: { min: 50, max: 57 },
    3: { min: 47, max: 54 },
    4: { min: 44, max: 51 },
    5: { min: 54, max: 62 }
};

// Los proyectiles compensan la dificultad medida del mapa: si el recorrido es
// más exigente que el base (ratio > 1) la presión baja un poco y viceversa.
// El rango es corto para que los niveles no se solapen entre sí.
export const PROJECTILE_RULES = { exponent: -0.6, min: 0.92, max: 1.08 };

const FLOOR_TOP = WORLD.floorTop;
const GOAL_HEIGHT_ABOVE_TOP = 36;
const SPOT_HEIGHT_ABOVE_TOP = 24;
const PLAYER_CLEARANCE = 60;

function createRng(seed) {
    let s = seed >>> 0;
    const rng = {
        next() {
            s = (Math.imul(s, RNG_A) + RNG_C) >>> 0;
            return s / RNG_M;
        },
        range(min, max) {
            return min + (max - min) * this.next();
        },
        int(min, max) {
            return Math.floor(this.range(min, max + 1));
        },
        chance(p) {
            return this.next() < p;
        },
        pick(list) {
            return list[Math.floor(this.next() * list.length)];
        }
    };
    // El LCG correlaciona sus primeras salidas con la semilla: se descartan.
    for (let i = 0; i < 6; i++) rng.next();
    return rng;
}

const clone = (obj) => JSON.parse(JSON.stringify(obj));
const top = (p) => p.y - p.h / 2;
const bottom = (p) => p.y + p.h / 2;
const left = (p) => p.x - p.w / 2;
const right = (p) => p.x + p.w / 2;

export class LevelGenerator {
    // `validator` valida con margen (GENERATION_COMFORT). `exactValidator` es
    // opcional: si se pasa, el candidato también debe pasar con las capacidades
    // exactas del jugador (más lento: cada validación cuesta ~1 s).
    constructor(validator = new LevelValidator({ comfort: GENERATION_COMFORT }), exactValidator = null) {
        this.validator = validator;
        this.exactValidator = exactValidator;
        this.baselines = new WeakMap();
    }

    // Referencia del nivel base: esfuerzo (frames) y defectos de estructura. El
    // esfuerzo sale de assets/levelBaselines.js (precalculado); si el nivel no
    // está ahí se valida en el momento. Se cachea: es el fallback seguro.
    baseline(baseConfig) {
        let entry = this.baselines.get(baseConfig);
        if (!entry) {
            const pre = LEVEL_BASELINES[baseConfig.id];
            const res = pre
                ? { ok: true, pathLengthFrames: pre.pathLengthFrames, meanFrames: pre.meanFrames, goalFrames: pre.goalFrames, precomputed: true }
                : this.validator.validate(baseConfig);
            entry = {
                res,
                effort: this.effortOf(res),
                structure: this.structureStats(baseConfig.platforms || []),
                // Las plataformas del base, tal cual y espejadas: un nivel espejado no
                // cuenta como "tocado" (su separación sigue siendo la del diseño).
                keys: new Set((baseConfig.platforms || []).flatMap((p) => [
                    this._platformKey(p),
                    this._platformKey({ ...p, x: WORLD.width - p.x })
                ])),
                distribution: this.distribution(baseConfig),
                placement: this.placementStats(baseConfig)
            };
            this.baselines.set(baseConfig, entry);
        }
        return entry;
    }

    _platformKey(p) {
        return `${p.x},${p.y},${p.w},${p.h}`;
    }

    // Cuántas plataformas tocadas/agregadas (que no están tal cual en el base)
    // estorban a otra: sin superposición, con aire suficiente encima/debajo y sin
    // ranuras estrechas al costado. Las plataformas del diseño base quedan exentas
    // entre sí (su separación es intencional), pero no respecto de las nuevas.
    _crowdedPlatforms(cfg, baseKeys) {
        const platforms = cfg.platforms || [];
        let crowded = 0;

        for (let i = 0; i < platforms.length; i++) {
            const a = platforms[i];
            if (a.h > 60 && a.w < a.h) continue;                     // paredes y columnas
            if (baseKeys.has(this._platformKey(a))) continue;         // sin tocar

            for (let j = 0; j < platforms.length; j++) {
                if (i === j) continue;
                const b = platforms[j];
                // El piso, las paredes y las columnas no cuentan como "vecinas".
                if ((b.h > 60 && b.w < b.h) || b.w >= 1000) continue;
                const xOverlap = Math.min(right(a), right(b)) - Math.max(left(a), left(b));
                const upper = a.y < b.y ? a : b;
                const lower = a.y < b.y ? b : a;
                const vGap = top(lower) - bottom(upper);

                if (xOverlap > 10 && vGap < CLEAR_VERTICAL) { crowded++; break; }

                const sameBand = Math.abs(a.y - b.y) < 50;
                const hGap = -xOverlap;
                if (sameBand && hGap < CLEAR_HORIZONTAL) { crowded++; break; }
            }
        }
        return crowded;
    }

    // Medida de cuánto cambió un candidato: plataformas distintas (agregadas,
    // quitadas o movidas/redimensionadas) x1,5, +1 si cambió la salida y 0,2 por spot
    // (el espejo solo no cuenta: N2 es casi simétrico).
    _novelty(base, cand) {
        const key = (p) => `${p.x},${p.y},${p.w},${p.h}`;
        const baseSet = new Set((base.platforms || []).map(key));
        const candSet = new Set((cand.platforms || []).map(key));
        let changed = 0;
        for (const k of candSet) if (!baseSet.has(k)) changed++;
        for (const k of baseSet) if (!candSet.has(k)) changed++;

        const goalMoved = base.goal.x !== cand.goal.x || base.goal.y !== cand.goal.y ? 1 : 0;
        const spotsMoved = (cand.pointSpots || []).filter((sp, i) => {
            const b = base.pointSpots?.[i];
            return !b || b.x !== sp.x || b.y !== sp.y;
        }).length;
        return changed * 1.5 + goalMoved + spotsMoved * 0.2;
    }

    effortOf(res) {
        // Esfuerzo = mezcla del tiempo medio a los spots (recorrido general) y de la
        // salida (tramo final). Ni el peor spot ni el máximo de ambos: son muy
        // ruidosos y sacaban al mapa de la banda de dificultad por un solo spot
        // lejano o por mover la salida.
        const goal = Number.isFinite(res.goalFrames) ? res.goalFrames : res.pathLengthFrames;
        const mean = res.meanFrames ?? res.pathLengthFrames;
        return Math.max(0.6 * mean + 0.4 * goal, 1);
    }

    // Banda de dificultad aceptada según la asistencia (muertes seguidas).
    difficultyBand(assist = 0) {
        const a = Math.min(ASSIST_MAX, Math.max(0, assist));
        if (a === 0) return DIFFICULTY_BAND;
        return {
            min: Math.max(0.5, DIFFICULTY_BAND.min - 0.07 * a),
            max: Math.max(1.1, DIFFICULTY_BAND.max - 0.1 * a)
        };
    }

    // opts.assist: cuántas veces seguidas murió el jugador en este nivel. Con
    // asistencia el mapa sale más fácil y más espacioso (y con algo más de tiempo).
    generateLevelFor(levelId, seed, baseConfig, attempts = DEFAULT_ATTEMPTS, opts = {}) {
        const assist = Math.min(ASSIST_MAX, Math.max(0, opts.assist ?? 0));
        const rng = createRng((seed ^ Math.imul(levelId, 131542391)) >>> 0);
        // Pre-mutación suave: cada semilla parte de un diseño base ligeramente
        // distinto (plataformas movidas pocos px) para tener más variedad de
        // niveles buenos sin perder la estructura ni la dificultad del nivel.
        const variedBase = this._preMutateBase(rng, clone(baseConfig));
        const base = this.baseline(variedBase);

        // Ajuste específico por nivel (N1-N3 pulidos): la mutación de N1 es más
        // suave, la salida se mantiene baja y la banda de dificultad es más
        // indulgente para no frustrar al jugador nuevo.
        const tuning = LEVEL_TUNING[levelId] ?? { maxIntensity: 1, minNovelty: MIN_NOVELTY, difficulty: DIFFICULTY_BAND, goalYTolerance: GOAL_Y_TOLERANCE };
        this.maxIntensity = tuning.maxIntensity;
        this.minNovelty = tuning.minNovelty;
        this.goalYTolerance = tuning.goalYTolerance;
        this.requireMovingPlatform = tuning.requireMovingPlatform ?? false;
        this.movingPlatformMinRise = tuning.movingPlatformMinRise ?? 60;
        this.movingPlatformMaxRise = tuning.movingPlatformMaxRise ?? 260;
        this.maxStaticPlatforms = tuning.maxStaticPlatforms ?? Infinity;
        this.minMovingPlatforms = tuning.minMovingPlatforms ?? 0;

        const band = tuning.difficulty;
        this.ctx = {
            baseConfig: variedBase,
            baseKeys: base.keys,
            baseStructure: base.structure,
            baseDistribution: base.distribution,
            basePlacement: base.placement,
            baseCount: variedBase.platforms.length,
            assist
        };
        const stats = { layout: 0, structure: 0, unreachable: 0, difficulty: 0, tame: 0, dense: 0, crowded: 0, isolated: 0, trampolines: 0, uneven: 0, placement: 0 };
        let tried = 0;
        let validations = 0;

        while (tried < attempts) {
            // 1) Ronda de candidatos baratos: mutación + filtros sin BFS.
            const pool = [];
            for (let k = 0; k < CANDIDATE_POOL * 3 && pool.length < CANDIDATE_POOL && tried < attempts; k++) {
                const i = tried++;
                // Las primeras tentativas son agresivas; si fallan, se vuelven más
                // suaves hasta converger a cambios mínimos. El tope de intensidad
                // depende del nivel (N1 no se muta tan fuerte).
                const intensity = Math.min(1 - 0.6 * (i / attempts), this.maxIntensity);
                const mutations = [];
                const candidate = this._mutate(rng, clone(baseConfig), levelId, intensity, mutations);
                const reason = this._cheapReject(candidate, base, baseConfig, i, attempts);
                if (reason) { stats[reason]++; continue; }
                pool.push({ candidate, mutations, quality: this._quality(candidate, assist) });
            }

            // 2) Se valida cada candidato (BFS, lo caro) y se recolectan los
            //    válidos. No se elige siempre el mejor: se hace una selección
            //    ponderada por calidad (softmax) para que los mapas varíen entre
            //    semillas sin perder jugabilidad.
            const valid = [];
            for (const { candidate, mutations, quality } of pool) {
                validations++;
                const touched = candidate.platforms
                    .map((pl, index) => (base.keys.has(this._platformKey(pl)) ? -1 : index)).filter((index) => index >= 0);
                const res = this.validator.validate(candidate, { platformTargets: touched });
                if (!res.ok || (this.exactValidator && !this.exactValidator.validate(candidate).ok)) { stats.unreachable++; continue; }

                // Plataformas nuevas o movidas a las que no se puede llegar: se quitan
                // (nunca se usaron en una ruta, así que sacarlas no rompe nada). Las
                // del diseño base se respetan aunque la búsqueda no las alcance.
                const isolated = res.isolatedPlatforms
                    .filter((index) => !base.keys.has(this._platformKey(candidate.platforms[index])));
                if (isolated.length > 0) {
                    candidate.platforms = candidate.platforms.filter((_, index) => !isolated.includes(index));
                    stats.isolated += isolated.length;
                }

                // Con asistencia, la banda se relaja hacia la normal a medida que se
                // agotan los intentos: mejor un mapa algo más difícil que ninguno.
                const assistBand = this.difficultyBand(assist);
                const minRatio = Math.max(band.min, assistBand.min);
                const maxRatio = Math.min(band.max, assistBand.max);
                const progress = tried / attempts;
                const relaxedMax = maxRatio + (DIFFICULTY_BAND.max - maxRatio) * progress;
                const ratio = this.effortOf(res) / base.effort;
                if (ratio < minRatio || ratio > relaxedMax) { stats.difficulty++; continue; }

                valid.push({ candidate, mutations, quality, res, ratio });
            }

            if (valid.length > 0) {
                // Selección ponderada: calidad alta tiene más probabilidad, pero no es
                // determinista. Softmax con temperatura para variedad.
                const maxQ = Math.max(...valid.map((v) => v.quality));
                const weights = valid.map((v) => Math.exp((v.quality - maxQ) / SELECTION_TEMPERATURE));
                const sumW = weights.reduce((a, b) => a + b, 0);
                let pick = rng.next() * sumW;
                let chosen = valid[valid.length - 1];
                for (let k = 0; k < valid.length; k++) {
                    pick -= weights[k];
                    if (pick <= 0) { chosen = valid[k]; break; }
                }

                const { candidate, mutations, quality, res, ratio } = chosen;
                // Con asistencia el tiempo nunca baja por ser un mapa más corto.
                const timerRatio = assist > 0 ? Math.max(ratio, 1) : ratio;
                candidate.durationSeconds = this.deriveTimerSeconds(baseConfig.durationSeconds, timerRatio, levelId, assist);
                candidate.projectiles = this.deriveProjectiles(baseConfig.projectiles, ratio);
                return {
                    config: candidate, res, seed, ok: true, mutated: true, attempts: tried, validations,
                    mutations, rejected: stats, difficulty: ratio, quality, assist
                };
            }
        }

        // Sin candidato: se usa el nivel base, que ya está validado.
        return {
            config: clone(baseConfig), res: base.res, seed, ok: base.res.ok, mutated: false, attempts: tried, validations,
            mutations: [], rejected: stats, difficulty: 1, quality: this._quality(baseConfig, assist), assist
        };
    }

    // Filtros baratos (sin BFS). Devuelve el motivo del rechazo o null.
    _cheapReject(candidate, base, baseConfig, i, attempts) {
        if (this.validator.checkLayout(candidate).length > 0) return 'layout';
        if (!this.structureNoWorse(candidate.platforms, base.structure)) return 'structure';
        // Novedad mínima y menos densidad que el base: se exigen durante la mayor
        // parte de los intentos; los últimos aceptan cambios chicos. El tope de
        // novedad depende del nivel (N1 pide menos cambios).
        const strict = i < attempts * MIN_NOVELTY_UNTIL;
        if (strict && this._novelty(baseConfig, candidate) < this.minNovelty) return 'tame';
        if (strict && candidate.platforms.length > baseConfig.platforms.length - MIN_REMOVED) return 'dense';
        // Las gemas deben estar al alcance de un salto desde alguna plataforma
        // o el suelo: si no, el nivel tiene un objeto inalcanzable y frustra.
        if (!this._allGemsReachable(candidate)) return 'gems';
        // Los trampolines necesitan aire libre y plataformas altas a las que subir.
        if (!this._trampolinesUsable(candidate)) return 'trampolines';
        // Elementos bien colocados: spots separados y repartidos, salida lejos.
        if (!this._placementOk(candidate, base.placement)) return 'placement';
        // Con menos plataformas, que queden repartidas por todo el escenario.
        if (!this._distributionOk(candidate, base.distribution)) return 'uneven';
        // Lo que el generador mueve o agrega no puede estorbar a las demás.
        if (this._crowdedPlatforms(candidate, base.keys) > 0) return 'crowded';
        // En N3, las plataformas móviles deben ser útiles: alcanzables y con algo
        // que alcanzar en su ruta (spots, gemas o salida), o conectar áreas.
        if (this.requireMovingPlatform && !this._movingPlatformsUseful(candidate)) return 'movers';
        // N3 foco en móviles: no demasiadas estáticas y al menos el mínimo de móviles.
        if (levelId === 3) {
            const statics = (candidate.platforms || []).filter((p) => this._isPlayPlatform(p)).length;
            if (statics > this.maxStaticPlatforms) return 'statics';
            if ((candidate.movingPlatforms || []).length < this.minMovingPlatforms) return 'movers';
        }
        return null;
    }

    // Aire libre sobre una plataforma: distancia hasta la plataforma más cercana
    // que tenga encima (superpuesta en x), o hasta el techo del mundo.
    _headroomOf(p, platforms) {
        let head = top(p) - 20;
        for (const q of platforms) {
            if (q === p || !this._isPlayPlatform(q)) continue;
            const xOverlap = Math.min(right(p), right(q)) - Math.max(left(p), left(q));
            if (xOverlap > 10 && bottom(q) <= top(p)) head = Math.min(head, top(p) - bottom(q));
        }
        return head;
    }

    // Calidad de un mapa (más alto = mejor): aire libre sobre las plataformas,
    // pocas apretadas o encimadas, spots bien repartidos, escenario ocupado de
    // punta a punta y la salida del spawn sin techo encima. Con asistencia pesa más
    // el espacio.
    _quality(cfg, assist = 0) {
        const plats = (cfg.platforms || []).filter((p) => this._isPlayPlatform(p) && p.y < FLOOR_TOP - 20);
        if (plats.length === 0) return 0;

        let open = 0;
        let cramped = 0;
        for (const p of plats) {
            const head = this._headroomOf(p, plats);
            open += Math.min(head, 220);
            if (head < CRAMPED_HEADROOM) cramped++;
        }

        let stacked = 0;
        for (let i = 0; i < plats.length; i++) {
            for (let j = i + 1; j < plats.length; j++) {
                const a = plats[i];
                const b = plats[j];
                const xOverlap = Math.min(right(a), right(b)) - Math.max(left(a), left(b));
                const upper = a.y < b.y ? a : b;
                const lower = a.y < b.y ? b : a;
                if (xOverlap > 10 && top(lower) - bottom(upper) < STACK_GAP) stacked++;
            }
        }

        const spawn = cfg.spawn;
        const spawnCovered = plats.some((p) => Math.abs(p.x - spawn.x) < p.w / 2 + 30 &&
            bottom(p) < spawn.y && bottom(p) > spawn.y - 150) ? 1 : 0;

        const space = open / plats.length - cramped * 25 - stacked * 40 - spawnCovered * 60;
        let score = space * (1 + 0.5 * assist) + this._spotSetScore(cfg) * 0.15 + this.distribution(cfg).occupied * 8;

        // N3: bonifica usar plataformas móviles (más spots/gemas sobre ellas = más
        // foco en la mecánica principal del nivel).
        if (this.requireMovingPlatform) {
            const movers = cfg.movingPlatforms || [];
            const targets = [...(cfg.pointSpots || []), ...(cfg.gems || [])];
            let onMovers = 0;
            for (const t of targets) {
                if (movers.some((m) => Math.hypot(t.x - m.x, t.y - m.y) < 110)) onMovers++;
            }
            score += onMovers * 25 + movers.length * 15;
        }
        return score;
    }

    generateCampaign(seed, LEVELS) {
        const campaign = [];
        for (let i = 0; i < LEVELS.length; i++) {
            campaign.push(this.generateLevelFor(i + 1, seed, LEVELS[i]));
        }
        return campaign;
    }

    deriveTimerSeconds(baseSeconds, effortRatio = 1, levelId = null, assist = 0) {
        const scaled = Math.pow(effortRatio, TIMER_RULES.damping);
        const scale = Math.max(TIMER_RULES.minScale, Math.min(TIMER_RULES.maxScale, scaled));
        const seconds = Math.round(baseSeconds * scale);
        const band = TIMER_BANDS[levelId];
        // Con asistencia, +2 s por muerte seguida (sin pasarse del máximo del nivel).
        const assisted = seconds + 2 * Math.min(ASSIST_MAX, Math.max(0, assist));
        return band ? Math.max(band.min, Math.min(band.max, assisted)) : assisted;
    }

    // Escala ritmo (intervalos) y velocidad máxima de los proyectiles según la
    // dificultad medida. Sin proyectiles (N1) no hay nada que escalar.
    deriveProjectiles(base, effortRatio = 1) {
        if (!base) return base ?? null;
        const raw = Math.pow(effortRatio, PROJECTILE_RULES.exponent);
        const s = Math.max(PROJECTILE_RULES.min, Math.min(PROJECTILE_RULES.max, raw));
        return {
            ...base,
            initialInterval: Math.round(base.initialInterval / s),
            minInterval: Math.round(base.minInterval / s),
            maxSpeedMultiplier: Math.round((1 + (base.maxSpeedMultiplier - 1) * s) * 100) / 100
        };
    }

    // ------------------------------------------------------------------
    // Mutaciones
    // ------------------------------------------------------------------

    // Pre-mutación suave aplicada al diseño base antes de empezar: desplaza 1-3
    // plataformas libres pocos px para que cada semilla parta de un punto de
    // partida distinto, sin perder la estructura ni la dificultad del nivel.
    _preMutateBase(rng, cfg) {
        const plats = (cfg.platforms || []).filter((p) => this._isPlayPlatform(p));
        const count = rng.int(1, 3);
        const shuffled = plats.sort(() => rng.next() - 0.5);
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
            const p = shuffled[i];
            if (!rng.chance(0.5)) continue;
            const dx = rng.pick([-1, 1]) * rng.int(10, 30);
            const dy = rng.pick([-1, 1]) * rng.int(5, 15);
            p.x = Math.max(100, Math.min(WORLD.width - 100, p.x + dx));
            p.y = Math.max(120, Math.min(680, p.y + dy));
        }
        return cfg;
    }

    _mutate(rng, cfg, id, intensity, log) {
        const apply = (name, p, fn) => {
            if (rng.chance(p * intensity)) {
                if (fn() !== false) log.push(name);
            }
        };

        // 1) Espejo horizontal de todo el nivel: variedad barata y siempre válida.
        // N1 no se espeja: el nivel de arranque debe mantener el spawn a la
        // izquierda y la meta a la derecha para no desorientar al jugador nuevo.
        if (id !== 1 && rng.chance(0.5)) {
            this._mirror(cfg);
            log.push('espejo');
        }

        // 2) Estructura: se pueden quitar y agregar plataformas libres (la
        //    cantidad no es fija: lo que importa es que todo siga alcanzable).
        apply('quitar', 1.0, () => this._removePlatforms(rng, cfg, intensity));
        apply('agregar', 0.35, () => this._addPlatforms(rng, cfg, intensity));

        // 3) Geometría de las plataformas libres que quedan.
        apply('columna', 0.7, () => this._shiftColumn(rng, cfg, intensity));
        apply('desplazar', 1.0, () => this._shiftPlatforms(rng, cfg, intensity));
        apply('alturas', 0.8, () => this._jitterHeights(rng, cfg, intensity));
        apply('anchos', 0.8, () => this._resizePlatforms(rng, cfg));

        // Lo que haya quedado encimado o pegado se separa (o se quita).
        this._separate(rng, cfg);
        this._fixTrampolines(rng, cfg);

        // 4) Entidades móviles del suelo.
        apply('pinchos', 0.9, () => this._jitterHazards(rng, cfg));
        apply('trampolines', 0.8, () => this._jitterTrampolines(rng, cfg));

        // 4b) Plataformas móviles (N3): ajusta distancia/velocidad y, si falta,
        //     agrega una en un lugar útil para cruzar huecos o llegar a puntos.
        if (id === 3 || this.requireMovingPlatform) {
            apply('mover-distancia', 0.6, () => this._adjustMovingPlatforms(rng, cfg, intensity));
            apply('mover-agregar', 0.4, () => this._addMovingPlatform(rng, cfg, intensity));
        }

        // 5) Puntos, gemas y salida sobre la estructura final.
        apply('salida', 0.6, () => this._relocateGoal(rng, cfg));
        apply('spots', 1.0, () => this._relocateSpots(rng, cfg, intensity));
        apply('gemas', 0.5, () => this._relocateGems(rng, cfg));

        this._repairSpots(rng, cfg);
        this._polishSpots(rng, cfg);
        this._enforce(rng, cfg);
        return cfg;
    }

    _mirror(cfg) {
        const W = WORLD.width;
        const flip = (e) => { if (e && typeof e.x === 'number') e.x = W - e.x; };
        flip(cfg.spawn);
        flip(cfg.goal);
        for (const key of ['platforms', 'pointSpots', 'gems', 'trampolines', 'hazards', 'powerUps', 'portals', 'movingPlatforms']) {
            for (const e of cfg[key] || []) flip(e);
        }
    }

    // Entidades que descansan sobre una plataforma y deben acompañarla cuando se
    // la mueve: trampolines, pinchos, power-ups, gemas, la salida y los spots.
    // Si lleva un trampolín elevado, también viaja su "corredor": las plataformas
    // que lo flanquean por arriba (la boca por la que sale el rebote) y lo que hay
    // en ese hueco, para que no se desalinee. Los elementos son objetos con x/y
    // (las plataformas además tienen w/h). Devuelve null si algo no transportable
    // (un portal) depende de ella.
    _carriedBy(cfg, p) {
        const t = top(p);
        const on = (e, window) => Math.abs(e.x - p.x) <= p.w / 2 + 12 && (t - e.y) >= -14 && (t - e.y) <= window;

        if ((cfg.portals || []).some((e) => on(e, 40))) return null;

        const carried = [];
        const trampolines = (cfg.trampolines || []).filter((e) => on(e, 26));
        for (const e of trampolines) carried.push(e);
        for (const e of cfg.hazards || []) if (on(e, 26)) carried.push(e);
        for (const e of cfg.powerUps || []) if (on(e, 26)) carried.push(e);
        for (const e of cfg.gems || []) if (on(e, 70)) carried.push(e);
        for (const e of cfg.pointSpots || []) if (this._restsOn(e.x, e.y, p)) carried.push(e);
        if (cfg.goal && on(cfg.goal, 70)) carried.push(cfg.goal);

        for (const tramp of trampolines) {
            if (tramp.y >= FLOOR_TOP - 30) continue;
            for (const q of cfg.platforms || []) {
                if (q !== p && this._isPlayPlatform(q) && this._flanksTrampoline(tramp, q) && !carried.includes(q)) carried.push(q);
            }
            for (const key of ['gems', 'pointSpots', 'powerUps']) {
                for (const e of cfg[key] || []) {
                    const inHole = Math.abs(e.x - tramp.x) <= tramp.w / 2 + 70 &&
                        e.y < tramp.y - 20 && e.y > tramp.y - TRAMPOLINE_CLEARANCE - 130;
                    if (inHole && !carried.includes(e)) carried.push(e);
                }
            }
        }
        return carried;
    }

    // ¿`q` flanquea por arriba a un trampolín elevado (la boca de salida)?
    _flanksTrampoline(t, q) {
        const above = bottom(q) <= t.y - 6 && bottom(q) > t.y - (TRAMPOLINE_CLEARANCE + 60);
        const near = right(q) > t.x - t.w / 2 - 70 && left(q) < t.x + t.w / 2 + 70;
        return above && near;
    }

    // Las plataformas que forman la boca de un trampolín elevado no se mueven
    // solas: viajan con la plataforma del trampolín.
    _isCorridorMate(cfg, q) {
        return (cfg.trampolines || []).some((t) => t.y < FLOOR_TOP - 30 && this._flanksTrampoline(t, q));
    }

    // Una plataforma se puede mover (con lo que lleva encima) si es flotante, de
    // tamaño normal, no forma parte del cruce de un móvil ni de la boca de un
    // trampolín.
    // Con `allowMate` también se mueven las compañeras de un trampolín (para correrlas
    // fuera de su pasillo de rebote).
    _isMovable(p, cfg, allowMate = false) {
        if (!(p.h <= 26 && p.w >= 60 && p.w <= 280 && p.y >= 90 && p.y <= 700)) return false;
        if ((cfg.movingPlatforms || []).some((m) => this._nearMover(p, m))) return false;
        if (!allowMate && this._isCorridorMate(cfg, p)) return false;
        return this._carriedBy(cfg, p) !== null;
    }

    // Rango de desplazamiento horizontal permitido para `p` y lo que lleva: nada
    // puede acercarse a las paredes.
    _shiftBounds(p, carried) {
        const lowOf = (e) => (e.w ? 60 + e.w / 2 - e.x : 70 - e.x);
        const highOf = (e) => (e.w ? WORLD.width - 60 - e.w / 2 - e.x : WORLD.width - 70 - e.x);
        return {
            lo: Math.max(lowOf(p), ...carried.map(lowOf)),
            hi: Math.min(highOf(p), ...carried.map(highOf))
        };
    }

    _shiftPlatforms(rng, cfg, intensity) {
        const maxShift = 40 + 130 * intensity;
        let moved = 0;

        for (const p of cfg.platforms || []) {
            if (!this._isMovable(p, cfg)) continue;
            if (!rng.chance(0.6)) continue;

            const carried = this._carriedBy(cfg, p);
            const dir = rng.chance(0.5) ? -1 : 1;
            const { lo, hi } = this._shiftBounds(p, carried);
            const dx = Math.max(lo, Math.min(hi, dir * rng.int(16, Math.round(maxShift))));
            if (Math.abs(dx) < 4) continue;

            if (this._tryMove(cfg, p, carried, dx, 0)) moved++;
        }
        return moved > 0;
    }

    _jitterHeights(rng, cfg, intensity = 1) {
        let moved = 0;

        for (const p of cfg.platforms || []) {
            if (!this._isMovable(p, cfg)) continue;
            if (!rng.chance(0.3)) continue;

            const carried = this._carriedBy(cfg, p);
            const reach = Math.max(1, Math.round(1 + 3 * intensity));
            const dy = rng.pick([-1, 1]) * rng.int(8, 12 * reach);
            const targetY = p.y + dy;
            if (targetY < 150 || targetY > 690) continue;
            if (carried.some((e) => e.w && (e.y + dy < 90 || e.y + dy > 690))) continue;

            if (this._tryMove(cfg, p, carried, 0, dy)) moved++;
        }
        return moved > 0;
    }

    // Desplaza en bloque el "núcleo" central de los niveles con una columna alta
    // (N2, N5): la columna, lo que se apoya arriba y todo lo que la rodea.
    _shiftColumn(rng, cfg, intensity) {
        const column = (cfg.platforms || []).find((p) => p.h >= 300 && p.w <= 80 && p.x > 250 && p.x < 770);
        if (!column) return false;

        const band = 110;
        const inBand = (e) => Math.abs(e.x - column.x) < band;
        const above = (e) => e.y < FLOOR_TOP - 50;

        const platforms = cfg.platforms.filter((p) => p.h <= 26 || p === column ? inBand(p) && p.y < FLOOR_TOP : false);
        const entities = [];
        for (const key of ['trampolines', 'hazards', 'powerUps', 'gems', 'pointSpots']) {
            for (const e of cfg[key] || []) if (inBand(e) && above(e)) entities.push(e);
        }
        if (inBand(cfg.goal) && above(cfg.goal)) entities.push(cfg.goal);
        if ((cfg.portals || []).some((e) => inBand(e)) || (cfg.movingPlatforms || []).some((m) => inBand(m))) return false;

        const group = [...platforms, ...entities];
        const lo = Math.max(...platforms.map((p) => 60 + p.w / 2 - p.x), ...entities.map((e) => 70 - e.x));
        const hi = Math.min(...platforms.map((p) => WORLD.width - 60 - p.w / 2 - p.x), ...entities.map((e) => WORLD.width - 70 - e.x));
        const reach = 40 + 90 * intensity;
        const dx = Math.max(lo, Math.min(hi, rng.pick([-1, 1]) * rng.int(40, Math.round(reach))));
        if (Math.abs(dx) < 20) return false;

        for (const e of group) e.x += dx;
        return true;
    }

    _resizePlatforms(rng, cfg) {
        const anchors = this._collectAnchors(cfg);
        let changed = 0;

        for (const p of cfg.platforms || []) {
            if (!this._isFree(p, anchors, cfg)) continue;
            if (!rng.chance(0.3)) continue;

            const newW = Math.max(100, Math.min(280, Math.round(p.w * rng.range(0.7, 1.5))));
            if (newW === p.w) continue;

            const before = { w: p.w, x: p.x, spots: cfg.pointSpots.map((sp) => ({ ...sp })) };
            const check = this._regressionProbe(cfg);

            p.w = newW;
            if (left(p) < 60 || right(p) > WORLD.width - 60) {
                p.x = Math.max(60 + p.w / 2, Math.min(WORLD.width - 60 - p.w / 2, p.x));
            }

            // Los spots apoyados se mantienen dentro del nuevo ancho.
            for (const spot of cfg.pointSpots || []) {
                if (Math.abs(top(p) - spot.y - SPOT_HEIGHT_ABOVE_TOP + 10) <= 14 && Math.abs(spot.x - p.x) <= p.w / 2 + 40) {
                    const limit = Math.max(p.w / 2 - 22, 0);
                    spot.x = Math.max(p.x - limit, Math.min(p.x + limit, spot.x));
                }
            }

            if (this._regressed(cfg, check)) {
                // Deshacer: el cambio de ancho estorbaba a otra plataforma o a un trampolín.
                p.w = before.w;
                p.x = before.x;
                cfg.pointSpots.forEach((sp, i) => { sp.x = before.spots[i].x; sp.y = before.spots[i].y; });
                continue;
            }
            changed++;
        }
        return changed > 0;
    }

    _jitterHazards(rng, cfg) {
        const hazards = (cfg.hazards || []).filter((h) => h.y >= FLOOR_TOP - 12);
        if (hazards.length === 0) return false;

        for (const h of hazards) {
            const dir = rng.chance(0.5) ? -1 : 1;
            const candidate = Math.max(150, Math.min(WORLD.width - 150, h.x + dir * rng.int(30, 110)));
            const others = cfg.hazards.filter((o) => o !== h && Math.abs(o.y - h.y) < 30);
            const farFromHazards = others.every((o) => Math.abs(o.x - candidate) >= (o.w + h.w) / 2 + 60);
            const farFromSpawn = Math.abs(cfg.spawn.x - candidate) >= h.w / 2 + 90;
            const farFromGoal = Math.abs(cfg.goal.x - candidate) >= h.w / 2 + 80 || cfg.goal.y < FLOOR_TOP - 120;
            const farFromTramps = (cfg.trampolines || []).every((t) =>
                t.y < FLOOR_TOP - 40 || Math.abs(t.x - candidate) >= (t.w + h.w) / 2 + TRAMPOLINE_ENTITY_GAP);
            if (farFromHazards && farFromSpawn && farFromGoal && farFromTramps) h.x = candidate;
        }

        // Fases escalonadas: de izquierda a derecha cada pincho arranca en un punto
        // distinto del ciclo, para que nunca estén todos activos a la vez y siempre
        // haya una ventana segura al cruzar.
        const cycle = 2700;
        const ordered = [...hazards].sort((a, b) => a.x - b.x);
        const shift = rng.int(0, 107) * 25;
        ordered.forEach((h, k) => {
            h.offsetMs = Math.round(((k * cycle) / ordered.length + shift + rng.int(0, 6) * 25) % cycle / 25) * 25;
        });
        return true;
    }

    // Reubica los trampolines del piso en un lugar con cielo libre (sin plataformas
    // encima) y con alguna plataforma más alta a la que el rebote sirva para subir.
    _jitterTrampolines(rng, cfg) {
        const trampolines = (cfg.trampolines || []).filter((t) => t.y >= FLOOR_TOP - 12);
        let moved = 0;
        for (const t of trampolines) {
            if (this._placeTrampoline(rng, cfg, t)) moved++;
        }
        return moved > 0;
    }

    // Tras mover estructura, un trampolín del piso puede haber quedado tapado o sin
    // nada a lo que subir: se lo vuelve a poner en un lugar útil.
    _fixTrampolines(rng, cfg) {
        for (const t of cfg.trampolines || []) {
            const playPlatforms = (cfg.platforms || []).filter((p) => this._isPlayPlatform(p));
            const floor = t.y >= FLOOR_TOP - 12;
            const portalBound = this._isPortalBound(cfg, t);
            const blocks = (p) => (portalBound ? this._blocksBounceLane(t, p) : this._blocksTrampoline(t, p));

            // Un trampolín del piso tapado se prueba primero en otro lugar libre.
            if (floor && !portalBound) {
                if (!this._trampolineWorks(t, playPlatforms) || this._entityNearTrampoline(cfg, t)) this._placeTrampoline(rng, cfg, t);
                if (this._trampolineWorks(t, (cfg.platforms || []).filter((p) => this._isPlayPlatform(p)))) continue;
            }

            // Si no, se despeja su zona en el lugar: cada plataforma que la invade se
            // corre hacia afuera (con lo que lleva) o, si está libre, se quita.
            const anchors = this._collectAnchors(cfg);
            for (const p of [...cfg.platforms]) {
                if (!blocks(p)) continue;

                if (this._isMovable(p, cfg, true)) {
                    const carried = this._carriedBy(cfg, p);
                    const { lo, hi } = this._shiftBounds(p, carried);
                    const toLeft = (t.x - t.w / 2 - TRAMPOLINE_SIDE - 2) - right(p);
                    const toRight = (t.x + t.w / 2 + TRAMPOLINE_SIDE + 2) - left(p);
                    const options = (p.x < t.x ? [toLeft, toRight] : [toRight, toLeft]).filter((d) => d >= lo && d <= hi);
                    if (options.some((d) => this._tryMove(cfg, p, carried, d, 0) && !blocks(p))) continue;
                }

                const free = this._isCorridorMate(cfg, p) || this._isFree(p, anchors, cfg);
                const carried = this._carriedBy(cfg, p);
                if (!free || carried === null || carried.some((e) => !e.w && !(cfg.pointSpots || []).includes(e))) continue;
                if (!this._roomAfterRemoving(cfg, p)) continue;

                const orphans = [];
                (cfg.pointSpots || []).forEach((spot, i) => { if (this._restsOn(spot.x, spot.y, p)) orphans.push(i); });
                cfg.platforms.splice(cfg.platforms.indexOf(p), 1);
                for (const i of orphans) this._placeSpot(rng, cfg, i);
            }

            // Si su lugar no se pudo despejar (p. ej. un trampolín sobre una
            // escalera, rodeado de escalones), se lo baja al piso donde haya lugar.
            const stillBlocked = cfg.platforms.some((p) => this._blocksTrampoline(t, p)) || this._entityNearTrampoline(cfg, t);
            if (stillBlocked && !floor && !portalBound) {
                const old = { x: t.x, y: t.y };
                t.y = FLOOR_TOP - TRAMPOLINE_HALF_HEIGHT;
                if (!this._placeTrampoline(rng, cfg, t)) {
                    t.x = old.x;
                    t.y = old.y;
                }
            }
        }

        // Lo que haya quedado pegado a un trampolín (spots) se corre.
        this._clearAroundTrampolines(rng, cfg);
    }

    _trampolineWorks(t, playPlatforms) {
        return !playPlatforms.some((p) => this._blocksTrampoline(t, p)) &&
            playPlatforms.some((p) => {
                const rise = t.y - top(p);
                return rise >= TRAMPOLINE_MIN_RISE && rise <= TRAMPOLINE_MAX_RISE && left(p) - 260 < t.x && right(p) + 260 > t.x;
            });
    }

    // Busca un lugar del piso donde el trampolín `t` funcione con su zona libre.
    // Recorre todo el piso (no al azar) y sortea entre los lugares válidos; si no
    // hay ninguno, hace lugar quitando las plataformas libres que menos estorban.
    // Devuelve false si no lo logra (queda donde estaba).
    _placeTrampoline(rng, cfg, t) {
        // Solo los del piso; y no se toca un trampolín que comparta lugar con un portal.
        if (t.y < FLOOR_TOP - 12 || this._isPortalBound(cfg, t)) return false;

        const playPlatforms = () => (cfg.platforms || []).filter((p) => this._isPlayPlatform(p));
        const entityOk = (probe) => (cfg.portals || []).every((pt) => Math.abs(pt.x - probe.x) >= t.w / 2 + 90) &&
            !this._entityNearTrampoline({ ...cfg, trampolines: (cfg.trampolines || []).map((o) => (o === t ? probe : o)) }, probe, true);

        const xs = [];
        for (let x = Math.round(80 + t.w / 2); x <= WORLD.width - 80 - t.w / 2; x += 2) xs.push(x);

        // 1) Lugares que ya están libres.
        const plats = playPlatforms();
        const valid = xs.filter((x) => {
            const probe = { x, y: t.y, w: t.w };
            return entityOk(probe) && this._trampolineWorks(probe, plats);
        });
        if (valid.length > 0) {
            t.x = rng.pick(valid);
            this._clearAroundTrampolines(rng, cfg);
            return true;
        }

        // 2) Hacer lugar: se prueban los x con menos plataformas en la zona y cada
        //    una se quita (si está libre y solo lleva spots) o se corre hacia afuera
        //    con lo que lleva. Si al final la zona no queda libre, se deshace todo.
        const anchors = this._collectAnchors(cfg);
        const ranked = xs
            .map((x) => ({ x, blockers: plats.filter((p) => this._blocksTrampoline({ x, y: t.y, w: t.w }, p)) }))
            .filter(({ x, blockers }) => blockers.length > 0 && blockers.length <= 3 && entityOk({ x, y: t.y, w: t.w }))
            // Un x al azar por cada grupo distinto de plataformas que estorban (los x
            // vecinos suelen chocar con las mismas y fallar igual).
            .sort(() => rng.next() - 0.5)
            .filter(({ blockers }, i, all) => all.findIndex((o) => o.blockers.length === blockers.length &&
                o.blockers.every((b, k) => b === blockers[k])) === i)
            .sort((m, n) => m.blockers.length - n.blockers.length)
            .slice(0, 20);

        for (const { x, blockers } of ranked) {
            const before = this._blockedCount(cfg, t);
            const spots = (cfg.pointSpots || []).map((sp) => ({ x: sp.x, y: sp.y }));
            const undo = [];
            const oldX = t.x;
            t.x = x;
            let ok = true;

            for (const blocker of blockers) {
                const carried = this._carriedBy(cfg, blocker);
                const onlySpots = carried !== null && carried.every((e) => (cfg.pointSpots || []).includes(e));

                if (this._isFree(blocker, anchors, cfg) && onlySpots && this._roomAfterRemoving(cfg, blocker)) {
                    const index = cfg.platforms.indexOf(blocker);
                    cfg.platforms.splice(index, 1);
                    undo.push(() => cfg.platforms.splice(index, 0, blocker));
                    continue;
                }

                // Se corre hacia el lado que no tape otro trampolín (primero el más cercano).
                const { lo, hi } = this._shiftBounds(blocker, carried);
                const toLeft = (x - t.w / 2 - TRAMPOLINE_SIDE - 2) - right(blocker);
                const toRight = (x + t.w / 2 + TRAMPOLINE_SIDE + 2) - left(blocker);
                const options = (blocker.x < x ? [toLeft, toRight] : [toRight, toLeft]).filter((d) => d >= lo && d <= hi);
                const shift = (d) => { blocker.x += d; for (const e of carried) e.x += d; };
                const dx = options.find((d) => {
                    shift(d);
                    const fine = this._blockedCount(cfg, t) <= before;
                    shift(-d);
                    return fine;
                }) ?? options[0];
                shift(dx);
                undo.push(() => shift(-dx));
            }

            const st = this.structureStats(cfg.platforms);
            const base = this._ctx().baseStructure;
            ok = ok && this._trampolineWorks(t, playPlatforms()) && !this._entityNearTrampoline(cfg, t, true) &&
                this._blockedCount(cfg, t) <= before && st.overlaps <= base.overlaps && st.lowCeilings <= base.lowCeilings;

            if (ok) {
                this._clearAroundTrampolines(rng, cfg);
                return true;
            }

            for (const fn of undo.reverse()) fn();
            cfg.pointSpots.forEach((sp, i) => { sp.x = spots[i].x; sp.y = spots[i].y; });
            t.x = oldX;
        }
        return false;
    }

    // Corre los spots, gemas y power-ups sueltos que hayan quedado al ras de un
    // trampolín (el rebote necesita su entorno libre).
    _clearAroundTrampolines(rng, cfg) {
        const near = (e) => (cfg.trampolines || []).some((t) =>
            Math.abs(e.x - t.x) < t.w / 2 + TRAMPOLINE_SPOT_GAP && Math.abs(e.y - t.y) < 60);
        (cfg.pointSpots || []).forEach((sp, i) => { if (near(sp)) this._placeSpot(rng, cfg, i); });
    }

    _relocateSpots(rng, cfg, intensity) {
        const spots = cfg.pointSpots || [];
        if (spots.length === 0) return false;

        const count = Math.max(1, Math.round(rng.range(3, 7) * intensity));
        let moved = 0;

        for (let n = 0; n < count; n++) {
            if (this._placeSpot(rng, cfg, rng.int(0, spots.length - 1))) moved++;
        }
        return moved > 0;
    }

    // Mueve el spot `index` a un punto libre sobre alguna plataforma.
    // En N3 (requireMovingPlatform) también propone puntos sobre móviles.
    _placeSpot(rng, cfg, index) {
        // Con pocas plataformas los lugares libres escasean: se insiste un poco
        // (antes fallaba ~la mitad de las veces y el spot quedaba donde estaba).
        for (let k = 0; k < 4; k++) {
            const spot = this._spotCandidate(rng, cfg, index, null, this.requireMovingPlatform);
            if (spot) {
                cfg.pointSpots[index] = spot;
                return true;
            }
        }
        return false;
    }

    // Propone un punto libre sobre alguna plataforma para el spot `index` (o null).
    // Con `band` = [xMin, xMax] solo propone puntos dentro de esa franja (para
    // llenar una franja vacía). Con `includeMovers` también propone puntos sobre
    // plataformas móviles (N3).
    _spotCandidate(rng, cfg, index, band = null, includeMovers = this.requireMovingPlatform ?? false) {
        const surfaces = this._surfaces(cfg, includeMovers).filter((surf) =>
            !band || (right(surf) - 30 > band[0] && left(surf) + 30 < band[1]));
        if (surfaces.length === 0) return null;

        for (let tries = 0; tries < 24; tries++) {
            const surface = rng.pick(surfaces);
            const margin = 30;
            const minX = Math.max(left(surface) + margin, 90, band ? band[0] : 0);
            const maxX = Math.min(right(surface) - margin, WORLD.width - 90, band ? band[1] : WORLD.width);
            if (maxX <= minX) continue;

            const x = Math.round(rng.range(minX, maxX));
            const y = top(surface) - SPOT_HEIGHT_ABOVE_TOP;
            if (!this._spotIsFree(cfg, x, y, index, allowOnMovers = includeMovers)) continue;
            return { x, y };
        }
        return null;
    }

    // Cuántos spots entran de verdad (empacado goloso respetando todas las
    // distancias: spawn, salida, trampolines, pinchos, entre spots…). Sirve para
    // no quitar tantas plataformas que después no haya dónde poner los puntos.
    _spotRoom(cfg) {
        const probe = { ...cfg, pointSpots: [] };
        for (const surface of this._surfaces(cfg)) {
            const y = top(surface) - SPOT_HEIGHT_ABOVE_TOP;
            for (let x = Math.max(left(surface) + 30, 90); x <= Math.min(right(surface) - 30, WORLD.width - 90); x += 15) {
                if (this._spotIsFree(probe, x, y, -1)) probe.pointSpots.push({ x, y });
            }
        }
        return probe.pointSpots.length;
    }

    // ¿Sin esa plataforma siguen entrando todos los spots (con margen)? Si el mapa
    // ya venía justo de lugar (algunos niveles base lo están), alcanza con que la
    // quita no lo empeore.
    _roomAfterRemoving(cfg, victim) {
        const without = { ...cfg, platforms: cfg.platforms.filter((o) => o !== victim) };
        const need = (cfg.pointSpots || []).length + SPOT_ROOM_SPARE;
        const after = this._spotRoom(without);
        return after >= need || after >= this._spotRoom(cfg);
    }

    // ¿Las plataformas que quedan ofrecen lugar suficiente (a ~90 px entre spots)
    // en cada franja de alturas para los spots que el diseño base tiene ahí?
    _rowCapacityOk(cfg, baseRows) {
        if (!baseRows) return true;
        const ys = (FLOOR_TOP - 90) / DIST_ROWS;
        const capacity = new Array(DIST_ROWS).fill(0);

        for (const surface of this._surfaces(cfg)) {
            const y = top(surface) - SPOT_HEIGHT_ABOVE_TOP;
            const row = Math.max(0, Math.min(DIST_ROWS - 1, Math.floor((y - 90) / ys)));
            capacity[row] += Math.max(1, Math.floor((surface.w - 60) / 90) + 1);
        }
        return capacity.every((c, r) => c >= baseRows[r]);
    }

    // Spots por franja vertical de pantalla (DIST_COLS) y cuántas franjas quedan sin
    // nada que hacer (ni spots, ni gemas, ni la salida).
    _bandStats(cfg) {
        const xs = (WORLD.width - 104) / DIST_COLS;
        const bandOf = (e) => Math.max(0, Math.min(DIST_COLS - 1, Math.floor((e.x - 52) / xs)));
        const spots = new Array(DIST_COLS).fill(0);
        const content = new Array(DIST_COLS).fill(0);
        for (const sp of cfg.pointSpots || []) { spots[bandOf(sp)]++; content[bandOf(sp)]++; }
        for (const g of cfg.gems || []) content[bandOf(g)]++;
        if (cfg.goal) content[bandOf(cfg.goal)]++;
        const ys = (FLOOR_TOP - 90) / DIST_ROWS;
        const rows = new Array(DIST_ROWS).fill(0);
        for (const sp of cfg.pointSpots || []) rows[Math.max(0, Math.min(DIST_ROWS - 1, Math.floor((sp.y - 90) / ys)))]++;
        return { spots, rows, content, empty: content.filter((n) => n === 0).length, firstEmpty: content.findIndex((n) => n === 0) };
    }

    // Puntaje de cómo están repartidos los spots: separación entre ellos (y con la
    // salida, las gemas y el spawn), reparto por franjas verticales de pantalla y
    // por alturas. Más alto = más parejo.
    _spotSetScore(cfg) {
        const spots = cfg.pointSpots || [];
        if (spots.length === 0) return 0;

        const others = [...(cfg.gems || []), cfg.goal, cfg.spawn];
        let minNN = Infinity;
        let sumNN = 0;
        spots.forEach((a, i) => {
            let nn = Infinity;
            spots.forEach((b, j) => { if (i !== j) nn = Math.min(nn, Math.hypot(a.x - b.x, a.y - b.y)); });
            for (const o of others) nn = Math.min(nn, Math.hypot(a.x - o.x, a.y - o.y) * 1.2);
            minNN = Math.min(minNN, nn);
            sumNN += Math.min(nn, 220);
        });

        const bands = new Array(DIST_COLS).fill(0);
        const rows = new Array(DIST_ROWS).fill(0);
        const xs = (WORLD.width - 104) / DIST_COLS;
        const ys = (FLOOR_TOP - 90) / DIST_ROWS;
        for (const sp of spots) {
            bands[Math.max(0, Math.min(DIST_COLS - 1, Math.floor((sp.x - 52) / xs)))]++;
            rows[Math.max(0, Math.min(DIST_ROWS - 1, Math.floor((sp.y - 90) / ys)))]++;
        }

        const content = this._bandStats(cfg).content;
        let penalty = 0;
        bands.forEach((n, b) => { penalty += content[b] === 0 ? 140 : n > 5 ? 22 * (n - 5) : 0; });
        for (const n of rows) penalty += n === 0 ? 60 : n > 7 ? 15 * (n - 7) : 0;

        // El perfil de alturas de los spots se mantiene parecido al del base: así la
        // dificultad no se dispara ni se desploma al reubicarlos.
        const baseRows = this._ctx().basePlacement.rows;
        if (baseRows) penalty += 18 * rows.reduce((acc, n, r) => acc + Math.abs(n - baseRows[r]), 0);

        return 2 * Math.min(minNN, 200) + sumNN / spots.length - penalty;
    }

    // Mejora el reparto de los spots: escalada de colina que reubica el spot más
    // apretado (o uno al azar) y se queda con el cambio si el reparto mejora.
    _polishSpots(rng, cfg) {
        const spots = cfg.pointSpots || [];
        if (spots.length < 3) return false;

        let best = this._spotSetScore(cfg);
        let improved = false;

        const xs = (WORLD.width - 104) / DIST_COLS;
        const bandOf = (sp) => Math.max(0, Math.min(DIST_COLS - 1, Math.floor((sp.x - 52) / xs)));

        for (let step = 0; step < POLISH_STEPS; step++) {
            // Si una franja quedó sin spots, se trae uno de la más cargada.
            const counts = new Array(DIST_COLS).fill(0);
            for (const sp of spots) counts[bandOf(sp)]++;
            const empty = this._bandStats(cfg).firstEmpty;
            if (empty >= 0 && rng.chance(0.7)) {
                const fullest = counts.indexOf(Math.max(...counts));
                const donors = spots.map((sp, i) => ({ sp, i })).filter(({ sp }) => bandOf(sp) === fullest);
                const { i } = rng.pick(donors);
                const previous = spots[i];
                const candidate = this._spotCandidate(rng, cfg, i, [52 + empty * xs + 20, 52 + (empty + 1) * xs - 20]);
                if (candidate) {
                    spots[i] = candidate;
                    const score = this._spotSetScore(cfg);
                    if (score > best) { best = score; improved = true; } else spots[i] = previous;
                }
                continue;
            }

            let index;
            if (rng.chance(0.6)) {
                // El más apretado.
                let worst = Infinity;
                index = 0;
                spots.forEach((a, i) => {
                    const nn = Math.min(...spots.map((b, j) => (i === j ? Infinity : Math.hypot(a.x - b.x, a.y - b.y))));
                    if (nn < worst) { worst = nn; index = i; }
                });
            } else {
                index = rng.int(0, spots.length - 1);
            }

            // Se prueban varias posiciones para ese spot y se queda con la mejor.
            const previous = spots[index];
            let bestSpot = null;
            let bestScore = best + 0.5;
            for (let k = 0; k < POLISH_SAMPLES; k++) {
                const candidate = this._spotCandidate(rng, cfg, index);
                if (!candidate) continue;
                spots[index] = candidate;
                const score = this._spotSetScore(cfg);
                if (score > bestScore) { bestScore = score; bestSpot = candidate; }
            }

            if (bestSpot) {
                spots[index] = bestSpot;
                best = bestScore;
                improved = true;
            } else {
                spots[index] = previous;
            }
        }
        return improved;
    }

    // Métricas de colocación de los elementos (para exigir un mínimo de calidad).
    placementStats(cfg) {
        const spots = cfg.pointSpots || [];
        let minNN = Infinity;
        spots.forEach((a, i) => spots.forEach((b, j) => { if (i !== j) minNN = Math.min(minNN, Math.hypot(a.x - b.x, a.y - b.y)); }));

        const bands = this._bandStats(cfg);

        return {
            minNN,
            emptyBands: bands.empty,
            maxBand: Math.max(...bands.spots),
            rows: bands.rows,
            goalSpawn: Math.hypot(cfg.goal.x - cfg.spawn.x, cfg.goal.y - cfg.spawn.y),
            goalSpot: Math.min(...spots.map((sp) => Math.hypot(sp.x - cfg.goal.x, sp.y - cfg.goal.y)))
        };
    }

    // Un candidato debe tener los elementos bien colocados: spots separados y
    // repartidos, la salida lejos del spawn y de cualquier spot.
    _placementOk(cfg, basePlacement) {
        const m = this.placementStats(cfg);
        return m.minNN >= Math.min(SPOT_MIN_NN, basePlacement.minNN) &&
            m.emptyBands <= basePlacement.emptyBands &&
            m.maxBand <= Math.max(SPOT_MAX_PER_BAND, basePlacement.maxBand) &&
            m.goalSpawn >= Math.min(GOAL_MIN_FROM_SPAWN, basePlacement.goalSpawn) &&
            m.goalSpot >= GOAL_MIN_FROM_SPOT &&
            (!basePlacement.rows || m.rows.reduce((acc, n, r) => acc + Math.abs(n - basePlacement.rows[r]), 0) <= ROW_DEVIATION);
    }

    // Tras mover estructura, algún spot puede haber quedado dentro de una
    // plataforma, pegado a otro spot o a la salida: se lo reubica en vez de
    // descartar todo el candidato (así los cambios grandes sobreviven más).
    _repairSpots(rng, cfg) {
        const spots = cfg.pointSpots || [];
        const platforms = cfg.platforms || [];

        spots.forEach((s, i) => {
            const inside = platforms.some((p) => s.x > left(p) - 2 && s.x < right(p) + 2 && s.y > top(p) - 2 && s.y < bottom(p) + 2);
            const crowded = spots.some((o, j) => j !== i && Math.hypot(o.x - s.x, o.y - s.y) < 60) ||
                Math.hypot(cfg.goal.x - s.x, cfg.goal.y - s.y) < GOAL_MIN_FROM_SPOT;
            const byTrampoline = (cfg.trampolines || []).some((t) =>
                Math.abs(s.x - t.x) < t.w / 2 + TRAMPOLINE_SPOT_GAP && Math.abs(s.y - t.y) < 60);
            if (inside || crowded || byTrampoline) this._placeSpot(rng, cfg, i);
        });
    }

    // Último paso de la mutación: en vez de dejar que los filtros descarten el
    // candidato, se corrige lo que falte (densidad, novedad, salida, spots,
    // reparto). Cada corrección es barata; si no alcanza, el filtro lo descarta.
    _enforce(rng, cfg) {
        const ctx = this.ctx;
        if (!ctx) return;

        // Espacio: se quitan techos que dejan plataformas apretadas.
        this._decongest(rng, cfg);

        // Densidad: al menos MIN_REMOVED plataformas menos que el base.
        for (let i = 0; i < 4 && cfg.platforms.length > ctx.baseCount - MIN_REMOVED; i++) {
            if (!this._removePlatforms(rng, cfg, 1, 1)) break;
        }

        // N3 foco en móviles: quita estáticas sobrantes y asegura el mínimo de móviles.
        if (levelId === 3) {
            for (let i = 0; i < 6 && this._countStaticPlatforms(cfg) > this.maxStaticPlatforms; i++) {
                if (!this._removePlatforms(rng, cfg, 1, 1)) break;
            }
            for (let i = 0; i < 4 && (cfg.movingPlatforms || []).length < this.minMovingPlatforms; i++) {
                this._addMovingPlatform(rng, cfg, 1);
            }
        }

        // Reparto por el escenario.
        if (!this._distributionOk(cfg, ctx.baseDistribution)) this._fixDistribution(rng, cfg);

        // Novedad: si se parece demasiado al base, se mueve más estructura.
        for (let i = 0; i < 4 && this._novelty(ctx.baseConfig, cfg) < MIN_NOVELTY; i++) {
            this._shiftPlatforms(rng, cfg, 1);
            this._jitterHeights(rng, cfg, 1);
        }

        // Salida lejos del spawn y spots bien repartidos.
        const m = this.placementStats(cfg);
        if (m.goalSpawn < Math.min(GOAL_MIN_FROM_SPAWN, ctx.basePlacement.goalSpawn)) this._relocateGoal(rng, cfg);
        for (let i = 0; i < 5 && !this._placementOk(cfg, ctx.basePlacement); i++) {
            this._repairSpots(rng, cfg);
            this._polishSpots(rng, cfg);
        }

        // Momento didáctico: al menos un punto debe estar al alcance directo del
        // spawn (sobre el suelo o la primera plataforma), para que el nivel no
        // empiece exigiendo un combo complejo.
        this._ensureFirstSpotNearSpawn(rng, cfg);

        // Último repaso de los trampolines: zona libre y entorno despejado.
        if (!this._trampolinesUsable(cfg)) {
            this._fixTrampolines(rng, cfg);
            this._polishSpots(rng, cfg);
        }
    }

    // Quita (hasta DECONGEST_MAX) plataformas libres que hacen de techo bajo de
    // otra (o la apretada misma, si su techo no se puede tocar), siempre que el
    // escenario siga repartido, con los trampolines útiles y lugar para los spots.
    _decongest(rng, cfg) {
        const ctx = this.ctx;
        let removed = 0;

        for (let round = 0; round < DECONGEST_MAX; round++) {
            const plats = cfg.platforms.filter((p) => this._isPlayPlatform(p) && p.y < FLOOR_TOP - 20);
            const anchors = this._collectAnchors(cfg);
            const options = [];

            for (const p of plats) {
                if (this._headroomOf(p, plats) >= CRAMPED_HEADROOM) continue;
                // El techo: la plataforma más baja que tiene encima, superpuesta en x.
                const ceiling = plats
                    .filter((q) => q !== p && Math.min(right(p), right(q)) - Math.max(left(p), left(q)) > 10 && bottom(q) <= top(p))
                    .sort((a, b) => bottom(b) - bottom(a))[0];
                for (const victim of [ceiling, p]) {
                    if (victim && this._isFree(victim, anchors, cfg) && !options.includes(victim)) options.push(victim);
                }
            }

            const viable = options.filter((victim) => {
                const without = { ...cfg, platforms: cfg.platforms.filter((o) => o !== victim) };
                return this._distributionOk(without, ctx.baseDistribution) && this._trampolinesUsable(without) &&
                    this._rowCapacityOk(without, ctx.basePlacement.rows) && this._roomAfterRemoving(cfg, victim);
            });
            if (viable.length === 0) break;

            const victim = rng.pick(viable);
            const orphans = [];
            (cfg.pointSpots || []).forEach((spot, i) => { if (this._restsOn(spot.x, spot.y, victim)) orphans.push(i); });
            cfg.platforms.splice(cfg.platforms.indexOf(victim), 1);
            for (const i of orphans) this._placeSpot(rng, cfg, i);
            removed++;
        }
        return removed > 0;
    }

    // Reparto por celdas: pasa una plataforma libre de la zona más cargada a una
    // celda vacía (la cantidad de plataformas no cambia).
    _fixDistribution(rng, cfg) {
        const ctx = this.ctx;
        const xs = (WORLD.width - 104) / DIST_COLS;
        const ys = (FLOOR_TOP - 90) / DIST_ROWS;
        const cellOf = (p) => ({
            c: Math.max(0, Math.min(DIST_COLS - 1, Math.floor((p.x - 52) / xs))),
            r: Math.max(0, Math.min(DIST_ROWS - 1, Math.floor((p.y - 90) / ys)))
        });

        for (let round = 0; round < 3 && !this._distributionOk(cfg, ctx.baseDistribution); round++) {
            const counts = new Map();
            for (const p of cfg.platforms) {
                if (!this._isPlayPlatform(p) || p.y > FLOOR_TOP - 20) continue;
                const { c, r } = cellOf(p);
                counts.set(`${c},${r}`, (counts.get(`${c},${r}`) ?? 0) + 1);
            }

            // Celdas vacías (primero las que dejan una columna o fila sin nada).
            const empties = [];
            for (let c = 0; c < DIST_COLS; c++) {
                for (let r = 0; r < DIST_ROWS; r++) {
                    if (counts.has(`${c},${r}`)) continue;
                    const colEmpty = ![...counts.keys()].some((k) => k.startsWith(`${c},`));
                    const rowEmpty = ![...counts.keys()].some((k) => k.endsWith(`,${r}`));
                    empties.push({ c, r, weight: (colEmpty ? 2 : 0) + (rowEmpty ? 2 : 0) + rng.next() });
                }
            }
            empties.sort((a, b) => b.weight - a.weight);

            const anchors = this._collectAnchors(cfg);
            const donors = cfg.platforms
                .filter((p) => this._isPlayPlatform(p) && this._isFree(p, anchors, cfg) && (counts.get(`${cellOf(p).c},${cellOf(p).r}`) ?? 0) >= 2)
                .sort((a, b) => this._crowdingOf(b, cfg.platforms) - this._crowdingOf(a, cfg.platforms));

            let done = false;
            for (const cell of empties.slice(0, 4)) {
                for (const donor of donors.slice(0, 4)) {
                    for (let tries = 0; tries < 10 && !done; tries++) {
                        const w = donor.w;
                        const x = Math.round(rng.range(Math.max(52 + cell.c * xs + w / 2, 60 + w / 2), Math.min(52 + (cell.c + 1) * xs - w / 2 + 40, WORLD.width - 60 - w / 2)));
                        const y = Math.round((90 + cell.r * ys + rng.range(30, ys - 30)) / 10) * 10 + (donor.y % 10);
                        if (y < 150 || y > 660) continue;

                        const probe = { ...donor, x, y };
                        const others = cfg.platforms.filter((o) => o !== donor);
                        const hyp = { ...cfg, platforms: [...others, probe] };
                        if (!this._platformFits({ ...cfg, platforms: others }, probe)) continue;
                        if (this._crowdedPlatforms(hyp, ctx.baseKeys) > this._crowdedPlatforms({ ...cfg, platforms: others }, ctx.baseKeys)) continue;
                        const st = this.structureStats(hyp.platforms);
                        if (st.overlaps > ctx.baseStructure.overlaps || st.lowCeilings > ctx.baseStructure.lowCeilings) continue;
                        if (!this._trampolinesUsable(hyp)) continue;

                        const orphans = [];
                        (cfg.pointSpots || []).forEach((spot, i) => { if (this._restsOn(spot.x, spot.y, donor)) orphans.push(i); });
                        donor.x = x;
                        donor.y = y;
                        for (const i of orphans) this._placeSpot(rng, cfg, i);
                        done = true;
                    }
                    if (done) break;
                }
                if (done) break;
            }
            if (!done) break;
        }
    }

    // Plataformas "de juego": sin piso, paredes ni columnas.
    _isPlayPlatform(p) {
        return !(p.w >= 1000 || (p.h > 60 && p.w < p.h));
    }

    // Cuenta plataformas estáticas de juego (sin piso, paredes ni columnas).
    _countStaticPlatforms(cfg) {
        return (cfg.platforms || []).filter((p) => this._isPlayPlatform(p)).length;
    }

    // Cuántas plataformas hay cerca (en un radio de 230 px): cuanto más, más
    // apretada está la zona.
    _crowdingOf(p, platforms) {
        return platforms.filter((o) => o !== p && this._isPlayPlatform(o) && Math.hypot(o.x - p.x, o.y - p.y) < 230).length;
    }

    // Quita 2–4 plataformas libres (o `exact` si se indica), siempre de las zonas más
    // apretadas (así lo que queda se reparte mejor) y solo si el escenario sigue
    // bien repartido y los trampolines siguen sirviendo. Los spots que estaban
    // apoyados en ellas se reubican sobre las que quedan.
    _removePlatforms(rng, cfg, intensity, exact = 0) {
        const ctx = this._ctx();
        const anchors = this._collectAnchors(cfg);
        const candidates = (cfg.platforms || []).filter((p) => this._isFree(p, anchors, cfg));
        const wanted = exact || Math.max(2, Math.round(rng.range(2, 4) * intensity));
        const count = Math.min(candidates.length, wanted);
        let removed = 0;

        for (let n = 0; n < count; n++) {
            const alive = candidates.filter((p) => cfg.platforms.includes(p));
            if (alive.length === 0) break;

            const ranked = alive
                .map((p) => ({ p, crowd: this._crowdingOf(p, cfg.platforms) + (this._headroomOf(p, cfg.platforms) < CRAMPED_HEADROOM ? 2 : 0) + rng.next() * 0.9 }))
                .sort((a, b) => b.crowd - a.crowd)
                .filter(({ p }) => {
                    const without = { ...cfg, platforms: cfg.platforms.filter((o) => o !== p) };
                    return this._distributionOk(without, ctx.baseDistribution) && this._trampolinesUsable(without) &&
                        this._rowCapacityOk(without, ctx.basePlacement.rows);
                })
                .slice(0, 5)
                .filter(({ p }) => this._roomAfterRemoving(cfg, p));
            if (ranked.length === 0) break;

            // Se elige al azar entre las 3 más apretadas.
            const victim = rng.pick(ranked.slice(0, 3)).p;

            const orphans = [];
            (cfg.pointSpots || []).forEach((spot, i) => {
                if (this._restsOn(spot.x, spot.y, victim)) orphans.push(i);
            });

            cfg.platforms.splice(cfg.platforms.indexOf(victim), 1);
            removed++;

            for (const i of orphans) {
                // Si no hay lugar libre el spot queda flotando y el layout del
                // candidato lo rechazará.
                this._placeSpot(rng, cfg, i);
            }
        }
        return removed > 0;
    }

    // Agrega 1–2 plataformas flotantes nuevas, siempre en el hueco más vacío de
    // varios sorteados (la que queda más lejos de las demás) y sin estorbar.
    _addPlatforms(rng, cfg, intensity) {
        const count = Math.max(1, Math.round(rng.range(1, 2) * intensity));
        const baseStats = this.structureStats(cfg.platforms);
        let added = 0;

        for (let n = 0; n < count; n++) {
            let best = null;

            for (let tries = 0; tries < 24; tries++) {
                const w = rng.int(100, 200);
                const p = {
                    x: Math.round(rng.range(110 + w / 2, WORLD.width - 110 - w / 2)),
                    y: rng.int(8, 33) * 20 + 10,
                    w,
                    h: 20,
                    color: 0x3a3a5c
                };
                if (p.y < 150 || p.y > 660) continue;
                if (!this._platformFits(cfg, p)) continue;

                const stats = this.structureStats([...cfg.platforms, p]);
                if (stats.overlaps > baseStats.overlaps || stats.lowCeilings > baseStats.lowCeilings) continue;
                if (this._crowdedPlatforms({ platforms: [...cfg.platforms, p] }, this._ctx().baseKeys) > this._crowdedPlatforms(cfg, this._ctx().baseKeys)) continue;

                const nearest = Math.min(...cfg.platforms.filter((o) => this._isPlayPlatform(o))
                    .map((o) => Math.hypot(o.x - p.x, (o.y - p.y) * 1.6)), 9999);
                if (!best || nearest > best.nearest) best = { p, stats, nearest };
            }

            if (best) {
                cfg.platforms.push(best.p);
                baseStats.overlaps = best.stats.overlaps;
                baseStats.lowCeilings = best.stats.lowCeilings;
                added++;
            }
        }
        return added > 0;
    }

    // Una plataforma nueva no puede pisar entidades, la ruta de un móvil ni el
    // pasillo de aire que necesita un trampolín.
    _platformFits(cfg, p) {
        const pad = 26;
        const hits = (e) => e.x > left(p) - pad && e.x < right(p) + pad && e.y > top(p) - 60 && e.y < bottom(p) + 60;
        const lists = ['pointSpots', 'gems', 'powerUps', 'portals', 'trampolines', 'hazards'];

        if (lists.some((key) => (cfg[key] || []).some(hits))) return false;
        if (hits(cfg.goal) || hits(cfg.spawn)) return false;
        if ((cfg.movingPlatforms || []).some((m) => this._insideMoverRoute(m, p.x, p.y, 90) ||
            this._insideMoverRoute(m, left(p), p.y, 60) || this._insideMoverRoute(m, right(p), p.y, 60))) return false;
        if ((cfg.trampolines || []).some((t) => this._blocksTrampoline(t, p))) return false;
        return true;
    }

    // ------------------------------------------------------------------
    // Trampolines: pasillo de aire libre y plataformas altas a las que sirvan
    // ------------------------------------------------------------------

    // Cantidad de trampolines (salvo `skip`) con alguna plataforma en su zona libre.
    _blockedCount(cfg, skip = null) {
        const plats = (cfg.platforms || []).filter((p) => this._isPlayPlatform(p));
        let n = 0;
        for (const t of cfg.trampolines || []) {
            if (t === skip || this._isPortalBound(cfg, t)) continue;
            if (plats.some((p) => this._blocksTrampoline(t, p))) n++;
        }
        return n;
    }

    // Referencia previa a un cambio (trampolines tapados, plataformas que estorban)
    // para detectar si el cambio empeora algo.
    _regressionProbe(cfg) {
        return {
            blocked: this._blockedCount(cfg),
            crowded: this._crowdedPlatforms(cfg, this._ctx().baseKeys)
        };
    }

    // ¿El cambio dejó el mapa peor que antes (o que el nivel base en estructura)?
    _regressed(cfg, before) {
        if (this._blockedCount(cfg) > before.blocked) return true;
        if (this._crowdedPlatforms(cfg, this._ctx().baseKeys) > before.crowded) return true;
        const st = this.structureStats(cfg.platforms);
        const base = this._ctx().baseStructure;
        return st.overlaps > base.overlaps || st.lowCeilings > base.lowCeilings;
    }

    // Traslada la plataforma `p` y lo que lleva (dx, dy). Si el movimiento empeora
    // el mapa (tapa un trampolín, la encima o estorba a otra) se deshace y devuelve
    // false: así el generador no produce candidatos que después haya que descartar.
    _tryMove(cfg, p, carried, dx, dy) {
        const before = this._regressionProbe(cfg);
        const apply = (sign) => {
            p.x += sign * dx; p.y += sign * dy;
            for (const e of carried) { e.x += sign * dx; e.y += sign * dy; }
        };
        apply(1);
        if (this._regressed(cfg, before)) {
            apply(-1);
            return false;
        }
        return true;
    }

    // Contexto del nivel que se está generando (se fija en generateLevelFor). Los
    // operadores lo usan para no salirse de lo que luego exigen los filtros.
    _ctx() {
        return this.ctx ?? {
            baseConfig: null,
            baseKeys: new Set(),
            baseStructure: { overlaps: Infinity, lowCeilings: Infinity },
            baseDistribution: { occupied: 0, emptyCols: Infinity, emptyRows: Infinity, balance: Infinity },
            basePlacement: { minNN: 0, emptyBands: Infinity, maxBand: Infinity, goalSpawn: 0 },
            baseCount: Infinity
        };
    }

    // ¿La plataforma `p` invade la zona libre del trampolín `t`? La zona tiene dos
    // partes: alrededor (TRAMPOLINE_SIDE px a cada lado de sus bordes, desde su
    // altura hasta TRAMPOLINE_NEAR px arriba), para entrar y salir del rebote sin
    // chocar; y el pasillo vertical del rebote (hasta la altura máxima que alcanza
    // el jugador), para que no choque al subir. La plataforma que lo sostiene no cuenta.
    _blocksTrampoline(t, p) {
        if (!this._isPlayPlatform(p) || this._isSupportOf(t, p)) return false;
        const overlaps = (half, height) =>
            right(p) > t.x - half && left(p) < t.x + half && bottom(p) > t.y - height && top(p) < t.y + 30;
        return overlaps(t.w / 2 + TRAMPOLINE_SIDE, TRAMPOLINE_NEAR) || this._blocksBounceLane(t, p);
    }

    // ¿`p` corta en vertical el rebote de `t` antes de su altura máxima?
    _blocksBounceLane(t, p) {
        if (!this._isPlayPlatform(p) || this._isSupportOf(t, p)) return false;
        const overlaps = (half, height) =>
            right(p) > t.x - half && left(p) < t.x + half && bottom(p) > t.y - height && top(p) < t.y - 6;
        const perfectHalf = Math.min(TRAMPOLINE_CONFIG.perfectZoneHalf, t.w / 2) + PLAYER_HALF_WIDTH;
        return overlaps(t.w / 2 + PLAYER_HALF_WIDTH, TRAMPOLINE_BASE_APEX) || overlaps(perfectHalf, TRAMPOLINE_PERFECT_APEX);
    }

    // Trampolín montado junto a un portal (combinación diseñada, como en N5): no se
    // mueve y queda exento de la zona libre (solo se le exige el pasillo vertical del rebote).
    _isPortalBound(cfg, t) {
        return (cfg.portals || []).some((p) => Math.abs(p.x - t.x) < 90 && Math.abs(p.y - t.y) < 60);
    }

    // ¿`p` es la plataforma sobre la que está apoyado el trampolín `t`?
    _isSupportOf(t, p) {
        return Math.abs(top(p) - (t.y + TRAMPOLINE_HALF_HEIGHT)) <= 8 && right(p) > t.x - t.w / 2 && left(p) < t.x + t.w / 2;
    }

    // ¿Algún elemento (pincho, spot al ras, gema al ras, power-up, salida, spawn u
    // otro trampolín) quedó pegado al trampolín `t`?
    // Con `movable` = true no cuentan los spots (se pueden correr después).
    _entityNearTrampoline(cfg, t, movable = false) {
        const half = t.w / 2 + TRAMPOLINE_ENTITY_GAP;
        const level = (e, dy) => Math.abs(e.x - t.x) < half && Math.abs(e.y - t.y) < dy;

        if ((cfg.hazards || []).some((h) => Math.abs(h.x - t.x) < (h.w + t.w) / 2 + TRAMPOLINE_ENTITY_GAP && Math.abs(h.y - t.y) < 40)) return true;
        if ((cfg.trampolines || []).some((o) => o !== t && Math.abs(o.x - t.x) < (o.w + t.w) / 2 + 100 && Math.abs(o.y - t.y) < 120)) return true;
        const spotLevel = (e) => Math.abs(e.x - t.x) < t.w / 2 + TRAMPOLINE_SPOT_GAP && Math.abs(e.y - t.y) < 60;
        if (!movable && (cfg.pointSpots || []).some(spotLevel)) return true;
        if ((cfg.gems || []).some((g) => level(g, 60))) return true;
        if ((cfg.powerUps || []).some((u) => level(u, 60))) return true;
        if (cfg.goal && Math.abs(cfg.goal.x - t.x) < t.w / 2 + 80 && Math.abs(cfg.goal.y - t.y) < 110) return true;
        if (cfg.spawn && Math.abs(cfg.spawn.x - t.x) < t.w / 2 + 80 && Math.abs(cfg.spawn.y - t.y) < 110) return true;
        return false;
    }

// ¿Todas las gemas están al alcance de un salto desde alguna plataforma o el suelo?
// Un salto desde una plataforma de techo H lleva el centro del jugador desde
// H-24 hasta H-141.6 (apex) y de vuelta. Una gema en Y con radio 12 se pisa si Y
// cae en [apex-12, inicio+12] y está cerca horizontalmente (alcance ~220 px).
_allGemsReachable(cfg) {
    const gems = cfg.gems || [];
    if (gems.length === 0) return true;

    const JUMP_RISE = 117.6;
    const PLAYER_HALF_H = 24;
    const GEM_R = 12;
    const HORIZ_REACH = 220;

    // El suelo se trata como una plataforma de ancho completo para los saltos iniciales.
    const platforms = [...(cfg.platforms || []), { x: WORLD.width / 2, y: FLOOR_TOP, w: WORLD.width, h: 0 }];
    // Las plataformas móviles también sirven como punto de salto (ej. la gema de
    // N3 solo se alcanza desde la ferry).
    const moverSurfaces = (cfg.movingPlatforms || []).map((m) => ({
        x: m.x, y: m.y, w: m.w ?? MOVING_PLATFORM_CONFIG.width,
        h: m.h ?? MOVING_PLATFORM_CONFIG.height
    }));

    for (const gem of gems) {
        let reachable = false;
        for (const p of [...platforms, ...moverSurfaces]) {
            const platformTop = p.h > 0 ? p.y - p.h / 2 : p.y;
            const apex = platformTop - PLAYER_HALF_H - JUMP_RISE;
            const highestCenter = platformTop - PLAYER_HALF_H;
            if (gem.y >= apex - GEM_R && gem.y <= highestCenter + GEM_R &&
                Math.abs(gem.x - p.x) <= p.w / 2 + HORIZ_REACH) {
                reachable = true;
                break;
            }
        }
        if (!reachable) return false;
    }
    return true;
}

// ¿Las plataformas móviles del nivel son útiles? Cada una debe:
//  - estar alcanzable desde alguna plataforma o el suelo (salto desde abajo o desde lado), y
//  - tener algo que alcanzar en su ruta (spot, gema o salida), o conectar dos áreas
//    separadas que de otro modo requerirían varios saltos.
_movingPlatformsUseful(cfg) {
    const movers = cfg.movingPlatforms || [];
    if (movers.length === 0) return false;

    const platforms = cfg.platforms || [];
    const JUMP_RISE = 117.6;
    const PLAYER_HALF_H = 24;
    const HORIZ_REACH = 220;

    // Puntos de interés que una plataforma móvil puede llevar al jugador.
    const targets = [...(cfg.pointSpots || []), ...(cfg.gems || []), cfg.goal];

    for (const m of movers) {
        const horizontal = (m.axis ?? 'x') === 'x';
        const w = m.w ?? MOVING_PLATFORM_CONFIG.width;
        const h = m.h ?? MOVING_PLATFORM_CONFIG.height;
        const dist = m.distance ?? 200;

        // Posiciones muestreadas a lo largo de la ruta (como el validador).
        const samples = [];
        for (let i = 0; i < 5; i++) {
            const off = -dist / 2 + (dist * i) / 4;
            samples.push({
                x: horizontal ? m.x + off : m.x,
                y: horizontal ? m.y : m.y + off,
            });
        }

        // 1) ¿Es alcanzable desde el suelo o alguna plataforma cercana?
        let reachable = false;
        for (const sample of samples) {
            const topY = horizontal ? sample.y - h / 2 : sample.y;
            for (const p of platforms) {
                const pTop = p.y - p.h / 2;
                const apex = pTop - PLAYER_HALF_H - JUMP_RISE;
                const highestCenter = pTop - PLAYER_HALF_H;
                const canJumpUp = topY >= apex - 12 && topY <= highestCenter + 12 &&
                    Math.abs(sample.x - p.x) <= p.w / 2 + HORIZ_REACH;
                // También se puede llegar saltando desde el lado si está a la misma altura.
                const canSideJump = Math.abs(topY - pTop) < 40 &&
                    Math.abs(sample.x - p.x) <= p.w / 2 + w / 2 + HORIZ_REACH;
                if (canJumpUp || canSideJump) { reachable = true; break; }
            }
            if (reachable) break;
        }
        if (!reachable) return false;

        // 2) ¿Sirve para algo? Algún objetivo cerca de una muestra de su ruta.
        let useful = false;
        for (const sample of samples) {
            const nearTarget = targets.some((t) =>
                Math.hypot(t.x - sample.x, t.y - sample.y) < (horizontal ? w / 2 + 60 : h / 2 + 60));
            if (nearTarget) { useful = true; break; }
        }
        if (!useful) return false;
    }
    return true;
}

// Todos los trampolines deben tener el pasillo libre y al menos una plataforma
// más alta a su alcance (cerca en horizontal y dentro de lo que llega el rebote)
// para que sirvan para subir.
_trampolinesUsable(cfg) {
    const platforms = (cfg.platforms || []).filter((p) => this._isPlayPlatform(p));

    for (const t of cfg.trampolines || []) {
        if (this._isPortalBound(cfg, t)) {
                // Solo el pasillo vertical del rebote tiene que estar libre.
                if (platforms.some((p) => this._blocksBounceLane(t, p))) return false;
                continue;
            }
            if (platforms.some((p) => this._blocksTrampoline(t, p))) return false;
            if (this._entityNearTrampoline(cfg, t)) return false;

            const reachable = platforms.some((p) => {
                const rise = t.y - top(p);
                const nearX = left(p) - 260 < t.x && right(p) + 260 > t.x;
                return rise >= TRAMPOLINE_MIN_RISE && rise <= TRAMPOLINE_MAX_RISE && nearX;
            });
            if (!reachable) return false;
        }
        return true;
    }

    // ------------------------------------------------------------------
    // Separación y distribución de las plataformas
    // ------------------------------------------------------------------

    // Separa las plataformas que quedaron encimadas (superpuestas en x con poco
    // aire vertical) o pegadas a un costado: mueve en horizontal la que se puede
    // mover (con lo que lleva) y, si no hay forma, la quita cuando está libre.
    _separate(rng, cfg) {
        const baseKeys = this._ctx().baseKeys;
        let changed = false;

        for (let pass = 0; pass < 6; pass++) {
            let moved = false;

            for (const a of [...cfg.platforms]) {
                if (!this._isPlayPlatform(a) || !this._isMovable(a, cfg)) continue;

                for (const b of cfg.platforms) {
                    if (a === b || !this._isPlayPlatform(b)) continue;

                    const xOverlap = Math.min(right(a), right(b)) - Math.max(left(a), left(b));
                    const upper = a.y < b.y ? a : b;
                    const lower = a.y < b.y ? b : a;
                    const vGap = top(lower) - bottom(upper);
                    // Las escaleras del diseño base (dos plataformas sin tocar) se
                    // respetan: separarlas alarga el recorrido y dispara la dificultad
                    // (N3). Lo que el generador toca o agrega sí debe dejar aire.
                    const bothDesigned = baseKeys.has(this._platformKey(a)) && baseKeys.has(this._platformKey(b));
                    const stacked = xOverlap > 10 && vGap < STACK_GAP && !bothDesigned;
                    const slit = Math.abs(a.y - b.y) < 50 && xOverlap <= 10 && -xOverlap < CLEAR_HORIZONTAL;
                    if (!stacked && !slit) continue;

                    const carried = this._carriedBy(cfg, a);
                    const away = a.x < b.x ? -1 : 1;
                    const need = CLEAR_HORIZONTAL + Math.max(xOverlap, 0);
                    const { lo, hi } = this._shiftBounds(a, carried);
                    const dx = Math.max(lo, Math.min(hi, away * need));
                    if (Math.abs(dx) < 4) continue;

                    if (!this._tryMove(cfg, a, carried, dx, 0)) continue;
                    moved = true;
                    changed = true;
                }
            }
            if (!moved) break;
        }

        // Lo que sigue encimado y se puede quitar sin consecuencias, se quita.
        const anchors = this._collectAnchors(cfg);
        for (const a of [...cfg.platforms]) {
            if (!this._isPlayPlatform(a) || !this._isFree(a, anchors, cfg)) continue;

            const stillStacked = cfg.platforms.some((b) => {
                if (a === b || !this._isPlayPlatform(b)) return false;
                const xOverlap = Math.min(right(a), right(b)) - Math.max(left(a), left(b));
                const upper = a.y < b.y ? a : b;
                const lower = a.y < b.y ? b : a;
                return xOverlap > 10 && top(lower) - bottom(upper) < STACK_GAP;
            });
            if (!stillStacked) continue;

            const orphans = [];
            (cfg.pointSpots || []).forEach((spot, i) => { if (this._restsOn(spot.x, spot.y, a)) orphans.push(i); });
            cfg.platforms.splice(cfg.platforms.indexOf(a), 1);
            for (const i of orphans) this._placeSpot(rng, cfg, i);
            changed = true;
        }
        return changed;
    }

    // Reparto de las plataformas de juego por el escenario: cuadrícula de
    // DIST_COLS × DIST_ROWS celdas (sobre el área jugable, sin piso ni paredes).
    distribution(cfg) {
        const xs = (WORLD.width - 104) / DIST_COLS;
        const ys = (FLOOR_TOP - 90) / DIST_ROWS;
        const cells = new Set();
        const cols = new Array(DIST_COLS).fill(0);
        const rows = new Array(DIST_ROWS).fill(0);
        let left = 0;
        let right = 0;

        for (const p of cfg.platforms || []) {
            if (!this._isPlayPlatform(p) || p.y > FLOOR_TOP - 20) continue;
            const c = Math.max(0, Math.min(DIST_COLS - 1, Math.floor((p.x - 52) / xs)));
            const r = Math.max(0, Math.min(DIST_ROWS - 1, Math.floor((p.y - 90) / ys)));
            cells.add(`${c},${r}`);
            cols[c]++;
            rows[r]++;
            if (p.x < WORLD.width / 2 - 60) left++;
            else if (p.x > WORLD.width / 2 + 60) right++;
        }

        return {
            occupied: cells.size,
            emptyCols: cols.filter((n) => n === 0).length,
            emptyRows: rows.filter((n) => n === 0).length,
            balance: Math.abs(left - right)
        };
    }

    // Un candidato debe repartirse tan bien como el base (descontando lo que
    // sale de quitar plataformas): ninguna franja vacía y sin cargarse a un lado.
    _distributionOk(cfg, baseDistribution) {
        const d = this.distribution(cfg);
        return d.emptyCols <= baseDistribution.emptyCols && d.emptyRows <= baseDistribution.emptyRows &&
            d.occupied >= Math.min(baseDistribution.occupied, DIST_MIN_CELLS) &&
            d.balance <= Math.max(baseDistribution.balance, 2);
    }

    // Reubica las gemas (flotan ~70 px sobre una plataforma: se alcanzan saltando).
    // En N3 también las coloca sobre plataformas móviles para forzar su uso.
    _relocateGems(rng, cfg) {
        const gems = cfg.gems || [];
        if (gems.length === 0) return false;

        const surfaces = this._surfaces(cfg, this.requireMovingPlatform).filter(
            (s) => s.w >= 100 && s.y < FLOOR_TOP - 60);
        let moved = 0;

        gems.forEach((gem, index) => {
            for (let tries = 0; tries < 14; tries++) {
                const surface = rng.pick(surfaces);
                const x = Math.round(rng.range(Math.max(left(surface) + 20, 100), Math.min(right(surface) - 20, WORLD.width - 100)));
                const y = top(surface) - rng.int(60, 90);
                if (y < 70) continue;
                const free = !(cfg.pointSpots || []).some((sp) => Math.hypot(sp.x - x, sp.y - y) < 100) &&
                    !gems.some((g, i) => i !== index && Math.hypot(g.x - x, g.y - y) < 160) &&
                    Math.hypot(cfg.goal.x - x, cfg.goal.y - y) > 110 &&
                    Math.hypot(cfg.spawn.x - x, cfg.spawn.y - y) > 140 &&
                    (cfg.powerUps || []).every((u) => Math.hypot(u.x - x, u.y - y) > 60) &&
                    this._hasHeadroom(cfg, x, y, 40) &&
                    // Las gemas sobre móviles son deseables en N3: no las excluya
                    // de la ruta del móvil.
                    (this.requireMovingPlatform || !(cfg.movingPlatforms || []).some((m) => this._insideMoverRoute(m, x, y, 45)));
                if (!free) continue;

                gems[index] = { x, y };
                moved++;
                break;
            }
        });
        return moved > 0;
    }

    // Reubica la salida sobre otra superficie. Los spots y gemas que quedan
    // pegados a la nueva posición se corren (en vez de descartar la posición):
    // en niveles muy cargados como N2 casi ningún lugar quedaba libre.
    _relocateGoal(rng, cfg) {
        // La salida se queda a una altura parecida a la del diseño base: mover la
        // meta de arriba a abajo (o al revés) cambia demasiado la dificultad.
        const baseY = this._ctx().baseConfig?.goal?.y;
        const surfaces = this._surfaces(cfg).filter((s) => s.w >= 110 &&
            (baseY === undefined || Math.abs(top(s) - GOAL_HEIGHT_ABOVE_TOP - baseY) <= this.goalYTolerance));
        if (surfaces.length === 0) return false;
        for (let tries = 0; tries < 24; tries++) {
            const surface = rng.pick(surfaces);
            const x = Math.round(rng.range(Math.max(left(surface) + 40, 110), Math.min(right(surface) - 40, WORLD.width - 110)));
            const y = top(surface) - GOAL_HEIGHT_ABOVE_TOP;
            if (Math.hypot(x - cfg.spawn.x, y - cfg.spawn.y) < GOAL_MIN_FROM_SPAWN) continue;
            if ((cfg.trampolines || []).some((t) => Math.abs(t.x - x) < t.w / 2 + 80 && Math.abs(t.y - y) < 110)) continue;
            if ((cfg.hazards || []).some((h) => Math.abs(h.x - x) < h.w / 2 + 45 && Math.abs(h.y - y) < 60)) continue;
            if ((cfg.powerUps || []).some((u) => Math.hypot(u.x - x, u.y - y) < 70)) continue;
            if ((cfg.portals || []).some((u) => Math.hypot(u.x - x, u.y - y) < 90)) continue;
            if ((cfg.movingPlatforms || []).some((m) => this._insideMoverRoute(m, x, y, 50))) continue;
            if (!this._hasHeadroom(cfg, x, y, 50)) continue;

            const previous = cfg.goal;
            cfg.goal = { x, y };

            // Lo que quedó encimado se reubica; si no hay lugar, se prueba otra posición.
            let blocked = false;
            (cfg.pointSpots || []).forEach((s, i) => {
                if (!blocked && Math.hypot(s.x - x, s.y - y) < GOAL_MIN_FROM_SPOT && !this._placeSpot(rng, cfg, i)) blocked = true;
            });
            for (const g of cfg.gems || []) {
                if (Math.hypot(g.x - x, g.y - y) < 80) blocked = true;
            }
            if (blocked) {
                cfg.goal = previous;
                continue;
            }
            return true;
        }
        return false;
    }

    // Momento didáctico: al menos un punto debe estar al alcance directo del
    // spawn (suelo o primera plataforma), sin exigir combos de salto al empezar.
    _ensureFirstSpotNearSpawn(rng, cfg) {
        const spots = cfg.pointSpots || [];
        if (spots.length === 0) return false;

        const JUMP_RISE = 117.6;
        const PLAYER_HALF_H = 24;
        const NEAR_X = 220;

        const alreadyNear = spots.some((sp) =>
            Math.abs(sp.x - cfg.spawn.x) <= NEAR_X &&
            sp.y >= FLOOR_TOP - 24 - JUMP_RISE - 30 &&
            sp.y <= FLOOR_TOP - 24 + 30);
        if (alreadyNear) return false;

        // Intenta poner un punto en el suelo cerca del spawn, o sobre la
        // plataforma más cercana que esté a un salto.
        const surfaces = this._surfaces(cfg).filter((s) =>
            Math.abs(s.x - cfg.spawn.x) <= s.w / 2 + NEAR_X && s.y <= FLOOR_TOP - 20);
        for (const surface of surfaces) {
            const x = Math.round(rng.range(
                Math.max(left(surface) + 30, cfg.spawn.x - NEAR_X),
                Math.min(right(surface) - 30, cfg.spawn.x + NEAR_X)));
            const y = top(surface) - 24;
            const free = !(cfg.gems || []).some((g) => Math.hypot(g.x - x, g.y - y) < 60) &&
                Math.hypot(cfg.goal.x - x, cfg.goal.y - y) > 60 &&
                this._hasHeadroom(cfg, x, y, 48);
            if (free) {
                spots[0] = { x, y };
                return true;
            }
        }
        return false;
    }

    // ------------------------------------------------------------------
    // Utilidades de geometría
    // ------------------------------------------------------------------

    // Superficies horizontales donde puede apoyarse un spot o la salida:
    // piso y plataformas finas (no paredes ni columnas). Con includeMovers, las
    // plataformas móviles cuentan como superficie (N3: foco en móviles).
    _surfaces(cfg, includeMovers = false) {
        const statics = (cfg.platforms || []).filter((p) => p.w >= 90 && (p.h <= 60) && p.w > p.h);
        if (!includeMovers) return statics;
        const movers = (cfg.movingPlatforms || []).filter((m) => m.w >= 90 && (m.h ?? 20) <= 60);
        return [...statics, ...movers];
    }

    _spotIsFree(cfg, x, y, ignoreIndex, allowOnMovers = false) {
        const near = (list, r) => (list || []).some((e) => Math.hypot(e.x - x, e.y - y) < r);

        if (Math.hypot(cfg.spawn.x - x, cfg.spawn.y - y) < 80) return false;
        if (Math.hypot(cfg.goal.x - x, cfg.goal.y - y) < 80) return false;
        if (near(cfg.gems, 60) || near(cfg.powerUps, 50) || near(cfg.portals, 70)) return false;
        if ((cfg.pointSpots || []).some((s, i) => i !== ignoreIndex && Math.hypot(s.x - x, s.y - y) < 60)) return false;
        if ((cfg.trampolines || []).some((t) => Math.abs(t.x - x) < t.w / 2 + TRAMPOLINE_SPOT_GAP && Math.abs(t.y - y) < 60)) return false;
        if ((cfg.hazards || []).some((h) => Math.abs(h.x - x) < h.w / 2 + 25 && Math.abs(h.y - y) < 60)) return false;
        // Los spots sobre plataformas móviles son deseables en N3: no los excluya
        // de la ruta del móvil a menos que se pida lo contrario.
        if (!allowOnMovers && (cfg.movingPlatforms || []).some((m) => this._insideMoverRoute(m, x, y, 45))) return false;

        return this._hasHeadroom(cfg, x, y, 48);
    }

    // No hay plataformas pegadas encima del punto (se necesita lugar para pararse).
    _hasHeadroom(cfg, x, y, room) {
        return !(cfg.platforms || []).some((p) =>
            x > left(p) - 14 && x < right(p) + 14 && bottom(p) <= y && bottom(p) > y - room);
    }

    _insideMoverRoute(m, x, y, pad) {
        const w = m.w ?? 80;
        const h = m.h ?? 20;
        const dist = m.distance ?? 200;
        const horizontal = (m.axis ?? 'x') === 'x';
        const x1 = (horizontal ? m.x - dist / 2 : m.x) - w / 2 - pad;
        const x2 = (horizontal ? m.x + dist / 2 : m.x) + w / 2 + pad;
        const y1 = (horizontal ? m.y : m.y - dist / 2) - h / 2 - pad - 30;
        const y2 = (horizontal ? m.y : m.y + dist / 2) + h / 2 + pad;
        return x > x1 && x < x2 && y > y1 && y < y2;
    }

    // Una plataforma se puede mutar si es flotante, de tamaño normal y nada
    // (trampolín, pincho, portal, móvil…) depende de su posición.
    _isFree(p, anchors, cfg) {
        if (this._isCorridorMate(cfg, p)) return false;
        if (!(p.h <= 26 && p.w >= 100 && p.w <= 280 && p.y >= 150 && p.y <= 700)) return false;
        if (this._isAnchored(p, anchors)) return false;
        return !(cfg.movingPlatforms || []).some((m) => this._nearMover(p, m));
    }

    // Las plataformas cercanas a la ruta de un móvil forman parte del "cruce"
    // diseñado (distancia de salto contra la ferry/ascensor): no se tocan.
    _nearMover(p, m) {
        // Una "ferry" (móvil horizontal que cruza un vacío en el aire, como en N3)
        // necesita más margen: si se tocan los bordes del cruce el recorrido salía
        // sistemáticamente más largo. Ascensores y móviles a ras del piso (N5)
        // admiten tocar más cerca y así se gana espacio.
        const ferry = (m.axis ?? 'x') === 'x' && m.y < FLOOR_TOP - 120;
        const pad = ferry ? 160 : 110;
        return this._insideMoverRoute(m, p.x, p.y, pad) ||
            (Math.abs(p.x - m.x) < p.w / 2 + (m.distance ?? 200) / 2 + pad - 10 && Math.abs(p.y - m.y) < 40);
    }

    _collectAnchors(cfg) {
        const anchors = [];
        const push = (list, window) => {
            for (const e of list || []) anchors.push({ x: e.x, y: e.y, window });
        };
        push(cfg.trampolines, 26);
        push(cfg.hazards, 26);
        push(cfg.portals, 40);
        push(cfg.powerUps, 26);
        push(cfg.movingPlatforms, 26);
        push(cfg.gems, 70);
        if (cfg.goal) anchors.push({ x: cfg.goal.x, y: cfg.goal.y, window: 70 });
        return anchors;
    }

    _isAnchored(platform, anchors) {
        const t = top(platform);
        for (const a of anchors) {
            if (Math.abs(a.x - platform.x) > platform.w / 2 + 12) continue;
            const above = t - a.y;
            if (above >= -14 && above <= a.window) return true;
        }
        return false;
    }

    _restsOn(x, y, platform) {
        const above = top(platform) - y;
        return Math.abs(x - platform.x) <= platform.w / 2 + 12 && above >= 10 && above <= 48;
    }

    // Ajusta distancia y velocidad de las plataformas móviles existentes para
    // que crucen huecos más grandes o lleguen a más puntos (N3).
    _adjustMovingPlatforms(rng, cfg, intensity) {
        let changed = false;
        for (const m of cfg.movingPlatforms || []) {
            if (!rng.chance(0.5 * intensity)) continue;
            const horizontal = (m.axis ?? 'x') === 'x';
            const maxDist = horizontal ? 300 : 260;
            const newDist = Math.max(120, Math.min(maxDist, Math.round((m.distance ?? 200) * rng.range(0.8, 1.4))));
            const newSpeed = Math.max(60, Math.min(140, Math.round((m.speed ?? 90) * rng.range(0.8, 1.3))));
            const before = { distance: m.distance, speed: m.speed };
            m.distance = newDist;
            m.speed = newSpeed;
            // No puede estorbar a otras plataformas ni quedar sin ruta válida.
            const st = this.structureStats(cfg.platforms);
            const base = this._ctx().baseStructure;
            if (st.overlaps > base.overlaps || st.lowCeilings > base.lowCeilings) {
                m.distance = before.distance;
                m.speed = before.speed;
                continue;
            }
            changed = true;
        }
        return changed;
    }

    // Agrega una plataforma móvil nueva en un lugar útil: cruza un vacío entre
    // dos plataformas o lleva a un punto/gema. Solo para N3. La móvil debe
    // quedar a una altura alcanzable (salto desde abajo o desde el costado),
    // para que el jugador no se quede sin poder subir (que "se caiga").
    _addMovingPlatform(rng, cfg, intensity) {
        const existing = cfg.movingPlatforms || [];
        if (existing.length >= 4) return false;

        const surfaces = this._surfaces(cfg);
        if (surfaces.length < 2) return false;

        const JUMP_RISE = 117.6;
        const PLAYER_HALF_H = 24;

        for (let tries = 0; tries < 30; tries++) {
            const a = rng.pick(surfaces);
            const b = rng.pick(surfaces);
            if (a === b) continue;
            const dx = Math.abs(a.x - b.x);
            const dy = Math.abs(a.y - b.y);
            if (dx < 120 || dx > 320) continue;
            if (dy > 120) continue;

            const axis = dx > dy ? 'x' : 'y';
            const mx = (a.x + b.x) / 2;
            const my = axis === 'x' ? Math.min(a.y, b.y) - 40 : (a.y + b.y) / 2;
            const distance = axis === 'x' ? dx + 80 : dy + 80;

            const candidate = {
                x: Math.round(mx),
                y: Math.round(my),
                w: MOVING_PLATFORM_CONFIG.width,
                h: MOVING_PLATFORM_CONFIG.height,
                distance,
                speed: 90,
                axis,
                color: MOVING_PLATFORM_CONFIG.color,
            };

            // No puede chocar con plataformas estáticas ni con rutas de otros móviles.
            const fits = !cfg.platforms.some((p) =>
                Math.abs(p.x - candidate.x) < (p.w + candidate.w) / 2 + 30 &&
                Math.abs(p.y - candidate.y) < (p.h + candidate.h) / 2 + 30);
            if (!fits) continue;

            // Debe ser alcanzable desde alguna superficie: su borde superior
            // debe estar dentro del alcance del salto (arriba o a la par).
            const topY = candidate.y - candidate.h / 2;
            let reachable = false;
            for (const s of surfaces) {
                const sTop = s.y - s.h / 2;
                const apex = sTop - PLAYER_HALF_H - JUMP_RISE;
                const highestCenter = sTop - PLAYER_HALF_H;
                const canJumpUp = topY >= apex - 12 && topY <= highestCenter + 12 &&
                    Math.abs(candidate.x - s.x) <= s.w / 2 + candidate.w / 2 + 220;
                const canSideJump = Math.abs(topY - sTop) < 40 &&
                    Math.abs(candidate.x - s.x) <= s.w / 2 + candidate.w / 2 + 220;
                if (canJumpUp || canSideJump) { reachable = true; break; }
            }
            if (!reachable) continue;

            // Hay al menos un punto/gema cerca de la ruta para que valga la pena subir.
            const targets = [...(cfg.pointSpots || []), ...(cfg.gems || [])];
            const nearTarget = targets.some((t) =>
                Math.hypot(t.x - candidate.x, t.y - candidate.y) < 140);
            if (!nearTarget) continue;

            cfg.movingPlatforms = cfg.movingPlatforms || [];
            cfg.movingPlatforms.push(candidate);
            return true;
        }
        return false;
    }

    // Solapes entre plataformas y pasillos demasiado bajos (el jugador mide 48).
    // El candidato no puede tener más defectos que el nivel base.
    structureStats(platforms) {
        const inflate = 6;
        let overlaps = 0;
        let lowCeilings = 0;

        for (let i = 0; i < platforms.length; i++) {
            for (let j = i + 1; j < platforms.length; j++) {
                const a = platforms[i];
                const b = platforms[j];
                const overlapX = Math.abs(a.x - b.x) < (a.w + b.w) / 2 + inflate;
                const overlapY = Math.abs(a.y - b.y) < (a.h + b.h) / 2 + inflate;
                if (overlapX && overlapY) { overlaps++; continue; }

                const shareX = Math.min(right(a), right(b)) - Math.max(left(a), left(b));
                if (shareX > 10) {
                    const gap = a.y < b.y ? top(b) - bottom(a) : top(a) - bottom(b);
                    if (gap >= 0 && gap < PLAYER_CLEARANCE) lowCeilings++;
                }
            }
        }
        return { overlaps, lowCeilings };
    }

    structureNoWorse(platforms, baseStats) {
        const s = this.structureStats(platforms);
        return s.overlaps <= baseStats.overlaps && s.lowCeilings <= baseStats.lowCeilings;
    }
}
