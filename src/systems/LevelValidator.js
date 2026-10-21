import { PLAYER_CONFIG } from '../entities/Player.js';
import { WORLD } from '../assets/levels.js';
import { TRAMPOLINE_CONFIG } from '../entities/Trampoline.js';
import { PORTAL_CONFIG } from '../entities/Portal.js';
import { moverOffset } from '../entities/MovingPlatform.js';

const DT = 1 / 60;
// El Player se estira al correr (hasta +18 % de ancho, ver applyMotionScale) y
// su cuerpo físico escala con él: se valida con el ancho máximo para no
// aprobar pasillos que solo caben al quedarse quieto.
const HW = (PLAYER_CONFIG.width * 1.18) / 2;
const HH = PLAYER_CONFIG.height / 2;
const SPEED = PLAYER_CONFIG.speed;
const JUMP_V = Math.abs(PLAYER_CONFIG.jumpVelocity);
const WALL_JUMP_V = Math.abs(PLAYER_CONFIG.wallJumpYVelocity);
const WALL_JUMP_X = PLAYER_CONFIG.wallJumpXVelocity;
const GRAVITY = 900;
const MAX_FRAMES = 720;
const MOVER_SAMPLES = 5;
// Modo con tiempo: frames que se agrupan al deduplicar estados cerca de una movil.
const TIME_BUCKET = 15;
const EXTRA_SEARCH_FRAMES = 70;
const PICKUP_DX = 24;
const PICKUP_DY = 32;
const GOAL_DX = 44;
const GOAL_DY = 50;
const PORTAL_CHARGE_FRAMES = Math.ceil((PORTAL_CONFIG.chargeMs / 1000) / DT);
const TRAMPOLINE_PERFECT_HALF = TRAMPOLINE_CONFIG.perfectZoneHalf;

// El validador replica la física del jugador en una grilla de 60 Hz y explora
// con BFS todos los estados alcanzables. Modela plataformas, trampolines
// (rebote base/perfecto con el mismo clamp del techo que Trampoline.bounce),
// portales (solo entrando parado, porque exigen 350 ms de carga) y
// plataformas móviles (como copias estáticas a lo largo de su ruta: asume que
// el jugador puede subirse en el momento justo). Los pinchos y proyectiles no
// bloquean la ruta (son temporales), así que no se modelan.

// El wall jump del Player empuja a 300 px/s lejos de la pared y bloquea otro
// salto 220 ms (13 frames). Volver hacia la pared no es instantáneo: la
// velocidad se invierte a razón de turnAccel (2600 px/s²). Se modela como un
// macro de 13 frames con dos variantes: 'hug' (se vuelve de inmediato hacia la
// pared) y 'away' (se sigue alejando). Sin esto el simulador trepaba paredes
// pegado a ellas, algo imposible en el juego real.
// Dash (Shift): 700 px/s en línea recta con la gravedad apagada durante 170 ms.
// Solo se recarga con el tiempo (900 ms): tocar suelo, trampolín o pared no lo
// resetea (ver Player.update).
const DASH_FRAMES = Math.ceil(PLAYER_CONFIG.dashDurationMs / 1000 / DT);
const DASH_SPEED = PLAYER_CONFIG.dashSpeed;
const DASH_START_STRIDE = 3;
// El dash solo se recarga con el tiempo (Player: no se resetea al tocar nada):
// `dashCd` son los frames que faltan; con 0 se puede usar.
const DASH_COOLDOWN_FRAMES = Math.ceil(PLAYER_CONFIG.dashCooldownMs / 1000 / DT);
// Un dash con la subida a mitad de camino tira por la borda el impulso del salto:
// solo se modela cerca del vértice o cayendo.
const DASH_MIN_VY = -120;

const WALL_JUMP_LOCK_FRAMES = Math.ceil((PLAYER_CONFIG.wallJumpCooldown / 1000) / DT);
const WALL_JUMP_PROFILES = {
    hug: Array.from({ length: WALL_JUMP_LOCK_FRAMES }, (_, k) =>
        Math.max(-SPEED, WALL_JUMP_X - PLAYER_CONFIG.turnAccel * DT * k)),
    away: Array.from({ length: WALL_JUMP_LOCK_FRAMES }, (_, k) =>
        Math.max(SPEED, WALL_JUMP_X - PLAYER_CONFIG.airDecel * DT * k))
};

// Modo con tiempo: cada movil sigue su onda real (con fase) y el BFS avanza
// frame a frame. Devuelve su rectangulo en el frame f y el centro a lo largo del eje.
function timedMover(m) {
    const w = m.w ?? 80;
    const h = m.h ?? 20;
    const dist = m.distance ?? 200;
    const horizontal = (m.axis ?? 'x') === 'x';
    const speed = m.speed ?? 90;
    const phase = m.phase ?? 0;
    const dwell = m.dwell ?? 0;
    const origin = (horizontal ? m.x : m.y) - dist / 2;
    const at = (f) => {
        const c = origin + moverOffset(dist, speed, phase, f * DT, dwell);
        const cx = horizontal ? c : m.x;
        const cy = horizontal ? m.y : c;
        return { x1: cx - w / 2, x2: cx + w / 2, y1: cy - h / 2, y2: cy + h / 2, tall: false, mover: true, c };
    };
    // Caja de toda la ruta con margen: fuera de ella el tiempo no importa.
    const pad = 70;
    const box = horizontal
        ? { x1: m.x - dist / 2 - w / 2 - pad, x2: m.x + dist / 2 + w / 2 + pad, y1: m.y - h / 2 - pad, y2: m.y + h / 2 + pad }
        : { x1: m.x - w / 2 - pad, x2: m.x + w / 2 + pad, y1: m.y - dist / 2 - h / 2 - pad, y2: m.y + dist / 2 + h / 2 + pad };
    // Velocidad (px/s) en el frame f: la misma que MovingPlatform.update fija al body.
    const vel = (f) => (at(f + 1).c - at(f).c) / DT;
    return { at, box, horizontal, vel };
}

function buildPlatforms(config, timed = false) {
    const plats = [];
    for (const p of config.platforms || []) {
        plats.push({
            x1: p.x - p.w / 2,
            x2: p.x + p.w / 2,
            y1: p.y - p.h / 2,
            y2: p.y + p.h / 2,
            tall: p.h >= 120
        });
    }

    for (const t of config.trampolines || []) {
        const h = TRAMPOLINE_CONFIG.height;
        plats.push({
            x1: t.x - t.w / 2,
            x2: t.x + t.w / 2,
            y1: t.y - h / 2,
            y2: t.y + h / 2,
            tall: false,
            tramp: { x: t.x, y: t.y }
        });
    }

    for (const m of timed ? [] : config.movingPlatforms || []) {
        const w = m.w ?? 80;
        const h = m.h ?? 20;
        const dist = m.distance ?? 200;
        const horizontal = (m.axis ?? 'x') === 'x';
        for (let i = 0; i < MOVER_SAMPLES; i++) {
            const off = -dist / 2 + (dist * i) / (MOVER_SAMPLES - 1);
            const cx = horizontal ? m.x + off : m.x;
            const cy = horizontal ? m.y : m.y + off;
            plats.push({
                x1: cx - w / 2,
                x2: cx + w / 2,
                y1: cy - h / 2,
                y2: cy + h / 2,
                tall: false,
                mover: true
            });
        }
    }
    return plats;
}

function overlaps(px, py, plat) {
    return px + HW > plat.x1 && px - HW < plat.x2 && py + HH > plat.y1 && py - HH < plat.y2;
}

function trampolineVy(tramp, px) {
    const perfect = Math.abs(px - tramp.x) <= TRAMPOLINE_PERFECT_HALF;
    const target = perfect ? TRAMPOLINE_CONFIG.perfectVy : TRAMPOLINE_CONFIG.baseVy;
    const maxRise = Math.max(tramp.y - 26, 6);
    return Math.max(target, -Math.sqrt(2 * GRAVITY * maxRise));
}

function moveBody(state, platforms) {
    let { x, y, vx, vy } = state;
    x += vx * DT;
    x = Math.min(WORLD.width - HW, Math.max(HW, x));

    for (const plat of platforms) {
        if (!overlaps(x, y, plat)) continue;
        if (vx < 0) x = plat.x2 + HW;
        else if (vx > 0) x = plat.x1 - HW;
    }

    y += vy * DT;
    let grounded = false;
    let bounced = false;

    for (const plat of platforms) {
        if (!overlaps(x, y, plat)) continue;
        if (vy > 0 && y + HH >= plat.y1 && y + HH <= plat.y2 + 6) {
            y = plat.y1 - HH;
            if (plat.tramp) {
                vy = trampolineVy(plat.tramp, x);
                bounced = true;
            } else {
                vy = 0;
                grounded = true;
            }
        } else if (vy < 0 && y - HH <= plat.y2 && y - HH >= plat.y1 - 6) {
            y = plat.y2 + HH;
            vy = 0;
        }
    }

    y = Math.min(WORLD.height - HH, Math.max(HH, y));

    return { x, y, vx, vy, grounded, bounced };
}

// El dash se recupera al tocar suelo o trampolín (y en el wall jump).
function withDash(next, cd) {
    next.dashCd = Math.max(0, cd - 1);
    return next;
}

function touchingWall(state, platforms) {
    for (const plat of platforms) {
        if (!plat.tall) continue;
        if (state.y + HH <= plat.y1 || state.y - HH >= plat.y2) continue;
        if (Math.abs(state.x - HW - plat.x2) < 3) return 'left';
        if (Math.abs(state.x + HW - plat.x1) < 3) return 'right';
    }
    if (state.x - HW <= HW + 2) return 'left';
    if (state.x + HW >= WORLD.width - HW - 2) return 'right';
    return null;
}

// Granularidad de la deduplicación de estados: celdas de CELL px y buckets de
// velocidad vertical. Más fina = más exacta pero explota el BFS.
const CELL = 4;
const VY_BUCKET = 100;

// Clave numérica (más barata que un string en el Set del BFS).
function stateKey(state, tb = 0) {
    const wj = state.wj ? (state.wj.v === 'hug' ? 1 : 2) * 16 + state.wj.s : 0;
    // Recarga en 6 niveles (0 = lista): un estado con menos espera domina a uno con mas.
    const cdBucket = state.dashCd > 0 ? Math.min(5, 1 + ((state.dashCd - 1) / 11 | 0)) : 0;
    const dash = (state.dash ? 1 + state.dash.s : 0) * 6 + cdBucket;
    const vyBucket = state.grounded ? 0 : Math.round(state.vy / VY_BUCKET) + 12;
    const vxIndex = state.vx < 0 ? 0 : state.vx > 0 ? 2 : 1;
    const cx = Math.round(state.x / CELL);
    const cy = Math.round(state.y / CELL);
    return ((((((cx * 256 + cy) * 2 + (state.grounded ? 1 : 0)) * 32 + vyBucket) * 3 + vxIndex) * 48 + wj) * 80 + dash) * 128 + tb;
}

export class LevelValidator {
    // comfort < 1 reduce velocidad y saltos para exigir margen (un mapa que solo
    // pasa al píxel perfecto no es jugable para una persona).
    // allowHug = true permite trepar una pared repitiendo wall jumps pegado a
    // ella (la variante 'hug' del macro). En el juego real casi nunca sale por
    // el empuje de 300 px/s y el ancho del jugador, así que por defecto el
    // validador es conservador: solo cuenta wall jumps que se alejan de la pared.
    constructor({ comfort = 1, allowHug = false } = {}) {
        this.allowHug = allowHug;
        this.maxFrames = MAX_FRAMES;
        this.comfort = comfort;
    }

    // Problemas de maquetado que no dependen de la física: entidades dentro de
    // plataformas, spawn tapado, spots superpuestos. Las plataformas móviles y
    // los trampolines no cuentan como obstáculo para los spots.
    checkLayout(config) {
        const issues = [];
        const solids = (config.platforms || []).map((p) => ({
            x1: p.x - p.w / 2, x2: p.x + p.w / 2, y1: p.y - p.h / 2, y2: p.y + p.h / 2
        }));

        const inside = (x, y, pad) => solids.some((s) =>
            x > s.x1 - pad && x < s.x2 + pad && y > s.y1 - pad && y < s.y2 + pad);

        const spawn = config.spawn;
        // El spawn puede rozar una plataforma (el motor lo separa); no puede
        // quedar enterrado más de 12 px.
        if (solids.some((s) => spawn.x + HW > s.x1 && spawn.x - HW < s.x2 &&
            spawn.y + HH - 12 > s.y1 && spawn.y - HH + 12 < s.y2)) {
            issues.push('spawn dentro de una plataforma');
        }

        (config.pointSpots || []).forEach((s, i) => {
            if (inside(s.x, s.y, 2)) issues.push(`spot ${i} dentro de una plataforma`);
            if (s.x < 60 || s.x > WORLD.width - 60) issues.push(`spot ${i} contra la pared`);
        });
        (config.gems || []).forEach((g, i) => {
            if (inside(g.x, g.y, 2)) issues.push(`gema ${i} dentro de una plataforma`);
        });
        (config.powerUps || []).forEach((p, i) => {
            if (inside(p.x, p.y, 2)) issues.push(`power-up ${i} dentro de una plataforma`);
        });

        const goal = config.goal;
        if (goal && inside(goal.x, goal.y, 4)) {
            issues.push('salida dentro de una plataforma');
        }

        const spots = config.pointSpots || [];
        for (let i = 0; i < spots.length; i++) {
            for (let j = i + 1; j < spots.length; j++) {
                if (Math.hypot(spots[i].x - spots[j].x, spots[i].y - spots[j].y) < 40) {
                    issues.push(`spots ${i} y ${j} superpuestos`);
                }
            }
        }

        return issues;
    }

    // BFS por frames desde el spawn (o desde `opts.start`). Registra en cada
    // objetivo ({x, y, dx, dy}) el primer frame en que un estado queda a su
    // alcance y corta cuando ya están todos. Con `opts.path` guarda el árbol de
    // padres y devuelve la ruta hasta el primer objetivo alcanzado.
    explore(config, targets, opts = {}) {
        const pending = targets.slice();
        let requiredLeft = pending.filter((t) => !t.optional).length;
        let extraUntil = null;
        const speed = SPEED * this.comfort;
        const jumpV = JUMP_V * this.comfort;
        const wallJumpV = WALL_JUMP_V * this.comfort;
        const wallJumpX = WALL_JUMP_X * this.comfort;
        // opts.timed: las moviles siguen su onda real; el BFS (profundidad = frame)
        // las coloca en cada paso y el jugador parado encima viaja con ellas.
        const timed = opts.timed ?? Boolean(config.timedMovers);
        const movers = timed ? (config.movingPlatforms || []).map(timedMover) : [];
        const staticPlatforms = buildPlatforms(config, timed);
        let cachedFrame = -1;
        let cachedPlatforms = staticPlatforms;
        const platformsAt = (f) => {
            if (!timed) return staticPlatforms;
            if (f !== cachedFrame) {
                cachedFrame = f;
                cachedPlatforms = staticPlatforms.concat(movers.map((m) => m.at(f)));
            }
            return cachedPlatforms;
        };
        const nearMover = (st) => movers.some((m) => st.x > m.box.x1 && st.x < m.box.x2 && st.y > m.box.y1 && st.y < m.box.y2);
        // Arrastra al jugador apoyado sobre una movil (como Game.updateMovingPlatforms).
        const rider = (st, f) => {
            for (const m of movers) {
                const cur = m.at(f);
                if (st.vy < 0 || Math.abs(st.y + HH - cur.y1) > 3 || st.x + HW <= cur.x1 || st.x - HW >= cur.x2) continue;
                return { m, cur };
            }
            return null;
        };
        const carry = (st, f) => {
            const r = rider(st, f);
            if (!r) return st;
            const nxt = r.m.at(f + 1);
            return { ...st, x: st.x + (nxt.x1 - r.cur.x1), y: st.y + (nxt.y1 - r.cur.y1) };
        };
        // opts.startFrame: frame del nivel en el que arranca la busqueda (replanificar en vivo).
        const f0 = opts.startFrame ?? 0;
        const platforms = platformsAt(f0);
        const portals = this.pairPortals(config);
        const wantPath = Boolean(opts.path);
        const start = opts.start ?? { x: config.spawn.x, y: config.spawn.y, vx: 0, vy: 0 };
        const maxFrames = opts.maxFrames ?? this.maxFrames;

        // Cola por buckets de profundidad: los portales saltan varios frames de
        // golpe y una FIFO simple rompería el orden de llegada mínimo.
        const buckets = [];
        const push = (depth, state, parent, move) => {
            (buckets[depth] ??= []).push({ state, parent: wantPath ? parent : null, move });
        };
        // El motor deja al jugador hundido unos px en el suelo: se lo apoya sobre
        // la superficie antes de simular (si no, el choque lateral lo teletransporta).
        const settled = { ...start };
        for (const plat of platforms) {
            if (settled.x + HW > plat.x1 && settled.x - HW < plat.x2 && settled.y + HH > plat.y1 && settled.y + HH - plat.y1 <= 8) {
                settled.y = plat.y1 - HH;
            }
        }
        const root = moveBody(settled, platforms);
        // Si ya está apoyado sobre una superficie arranca "en el suelo" (con vy = 0
        // moveBody no lo marca solo): sin esto no podría saltar el primer frame
        // y se le permitiría un dash aéreo desde el piso.
        if (!root.grounded) {
            root.grounded = platforms.some((plat) => !plat.tramp &&
                root.x + HW > plat.x1 && root.x - HW < plat.x2 && Math.abs(root.y + HH - plat.y1) < 1.5);
        }
        root.dashCd = Math.round(opts.start?.dashCd ?? 0);
        push(0, root, null, null);

        const seen = new Set();
        let visitedCount = 0;
        let found = null;

        for (let depth = 0; depth <= maxFrames && !(wantPath && found) && pending.length > 0 &&
            (extraUntil === null || depth <= extraUntil); depth++) {
            const bucket = buckets[depth];
            if (!bucket) continue;
            buckets[depth] = null;

            for (const node of bucket) {
                let { state } = node;
                const near = timed && nearMover(state);
                const key = stateKey(state, near ? 1 + Math.min(126, Math.floor(depth / TIME_BUCKET)) : 0);
                if (seen.has(key)) continue;
                seen.add(key);
                visitedCount++;

                for (let i = pending.length - 1; i >= 0; i--) {
                    const t = pending[i];
                    if (Math.abs(state.x - t.x) <= t.dx && Math.abs(state.y - t.y) <= t.dy && (!t.standing || state.grounded)) {
                        t.frames = depth;
                        pending.splice(i, 1);
                        if (!t.optional) requiredLeft--;
                        if (!found) found = node;
                    }
                }
                // Con todo lo obligatorio encontrado solo se sigue una ventana corta
                // buscando los objetivos opcionales (plataformas): las que no se
                // alcanzan en ese margen se consideran aisladas.
                if (requiredLeft === 0 && extraUntil === null) extraUntil = depth + EXTRA_SEARCH_FRAMES;
                if (pending.length === 0 || (wantPath && found)) { pending.length = 0; break; }

                // Broad-phase: un paso mueve a lo sumo ~16 px, así que solo importan
                // las plataformas cercanas al estado. En modo con tiempo, las del
                // frame siguiente (el paso termina ahí).
                // Saltar desde una movil hereda su velocidad (Player: platformVelocity).
                let inherit = null;
                if (near) {
                    const r = rider(state, f0 + depth);
                    if (r) {
                        const v = r.m.vel(f0 + depth);
                        inherit = r.m.horizontal ? { x: v, y: 0 } : { x: 0, y: v };
                    }
                    state = carry(state, f0 + depth);
                }
                const stepPlatforms = platformsAt(f0 + depth + 1);
                const local = stepPlatforms.filter((p) => p.x2 > state.x - HW - 14 && p.x1 < state.x + HW + 14 &&
                    p.y2 > state.y - HH - 26 && p.y1 < state.y + HH + 26);
                const gravityVy = state.grounded ? 0 : state.vy + GRAVITY * DT;

                // Macro de wall jump en curso: el movimiento horizontal está fijado.
                if (state.wj) {
                    const { v, s: step, sign } = state.wj;
                    const next = withDash(moveBody({ x: state.x, y: state.y, vx: sign * WALL_JUMP_PROFILES[v][step] * this.comfort, vy: gravityVy }, local), state.dashCd);
                    next.wj = step + 1 < WALL_JUMP_LOCK_FRAMES ? { v, s: step + 1, sign } : null;
                    // 'hug' mantiene la tecla hacia la pared; 'away' hacia afuera.
                    push(depth + 1, next, node, { dir: v === 'hug' ? -sign : sign, jump: false });
                    continue;
                }

                // Macro de dash en curso: línea recta, sin gravedad.
                if (state.dash) {
                    const { dir, s: step } = state.dash;
                    const next = moveBody({ x: state.x, y: state.y, vx: dir * DASH_SPEED * this.comfort, vy: 0 }, local);
                    next.dashCd = Math.max(0, state.dashCd - 1);
                    next.dash = step + 1 < DASH_FRAMES ? { dir, s: step + 1 } : null;
                    push(depth + 1, next, node, { dir, jump: false });
                    continue;
                }

                const wall = touchingWall(state, local);

                for (const dir of [-1, 0, 1]) {
                    const vx = dir * speed;
                    const towardWall = !state.grounded && ((wall === 'left' && dir < 0) || (wall === 'right' && dir > 0));

                    if (towardWall) {
                        // Wall grab del Player: pulsando hacia la pared se queda
                        // colgado (sin gravedad ni velocidad) hasta saltar o soltar.
                        push(depth + 1, { x: state.x, y: state.y, vx: 0, vy: 0, grounded: false, dashCd: Math.max(0, state.dashCd - 1) }, node, { dir, jump: false });
                    } else {
                        push(depth + 1, withDash(moveBody({ x: state.x, y: state.y, vx, vy: gravityVy }, local), state.dashCd), node, { dir, jump: false });
                    }

                    if (state.grounded) {
                        push(depth + 1, withDash(moveBody({ x: state.x, y: state.y, vx: vx + (inherit ? inherit.x : 0), vy: -jumpV + (inherit ? inherit.y : 0) }, local), state.dashCd), node, { dir, jump: true });
                    } else if ((wall === 'left' && dir < 0) || (wall === 'right' && dir > 0)) {
                        const sign = wall === 'left' ? 1 : -1;
                        for (const variant of (this.allowHug ? ['hug', 'away'] : ['away'])) {
                            const next = withDash(moveBody({ x: state.x, y: state.y, vx: sign * wallJumpX, vy: -wallJumpV }, local), state.dashCd);
                            if (next.grounded) continue;
                            next.wj = { v: variant, s: 1, sign };
                            push(depth + 1, next, node, { dir, jump: true });
                        }
                    }
                }

                // Dash: una vez por tramo en el aire. Desde el suelo no se modela (solo
                // sería caminar más rápido) y el inicio se muestrea cada 2 frames:
                // reduce a la mitad el espacio de búsqueda sin cambiar el alcance real
                // más que unos px.
                if (state.dashCd === 0 && !state.grounded && state.vy >= DASH_MIN_VY && depth % DASH_START_STRIDE === 0) {
                    for (const dir of [-1, 1]) {
                        const next = moveBody({ x: state.x, y: state.y, vx: dir * DASH_SPEED * this.comfort, vy: 0 }, local);
                        next.dashCd = DASH_COOLDOWN_FRAMES;
                        next.dash = { dir, s: 1 };
                        push(depth + 1, next, node, { dir, jump: false, dash: true });
                    }
                }

                // Portal: hay que esperar parado dentro del sensor durante la carga.
                if (state.grounded) {
                    for (const portal of portals) {
                        if (Math.abs(state.x - portal.x) < PORTAL_CONFIG.width / 2 + HW &&
                            Math.abs(state.y - portal.y) < PORTAL_CONFIG.height / 2 + HH) {
                            const dest = portal.linked;
                            const landed = withDash(moveBody({ x: dest.x, y: dest.y - HH, vx: 0, vy: 0 }, stepPlatforms), Math.max(0, state.dashCd - PORTAL_CHARGE_FRAMES));
                            push(depth + PORTAL_CHARGE_FRAMES, landed, node, { dir: 0, jump: false, wait: PORTAL_CHARGE_FRAMES });
                        }
                    }
                }
            }
        }

        if (!wantPath) return visitedCount;

        if (!found) return null;
        const moves = [];
        for (let n = found; n && n.move; n = n.parent) {
            // Cada nodo guarda el estado previsto tras ejecutar su movimiento.
            moves.push({ ...n.move, x: n.state.x, y: n.state.y });
        }
        return moves.reverse();
    }

    // Ruta (lista de movimientos de 1 frame) desde un estado real hasta el
    // objetivo, o null. La usa el bot de pruebas de tools/playbot.js.
    findPath(config, start, target, maxFrames = 600, opts = {}) {
        return this.explore(config, [{ ...target, frames: Infinity }], { ...opts, start, path: true, maxFrames });
    }

    // Replica Level.materializePortals: pares consecutivos, el impar se descarta.
    pairPortals(config) {
        const data = config.portals || [];
        const paired = data.length - (data.length % 2);
        const list = data.slice(0, paired).map((p) => ({ x: p.x, y: p.y, linked: null }));
        for (let i = 0; i + 1 < list.length; i += 2) {
            list[i].linked = list[i + 1];
            list[i + 1].linked = list[i];
        }
        return list;
    }

    // ¿Se alcanza la salida en menos de `maxFrames` frames? (busqueda solo de la
    // salida, sin spots ni gemas: el chequeo de atajos de los carriles).
    hasStaticRoute(config, maxFrames) {
        const goal = { x: config.goal.x, y: config.goal.y, dx: GOAL_DX, dy: GOAL_DY, frames: Infinity };
        this.explore(config, [goal], { maxFrames });
        return Number.isFinite(goal.frames);
    }

    // opts.platformTargets: además de spots, gemas y salida, comprueba que se
    // pueda llegar parado sobre cada plataforma flotante (`isolatedPlatforms`
    // lista los índices de las que quedan aisladas). No afecta a `ok`.
    validate(config, opts = {}) {
        const layoutIssues = this.checkLayout(config);
        const mk = (list, dx, dy) => (list || []).map((e, index) => ({
            index, x: e.x, y: e.y, dx, dy, frames: Infinity
        }));
        // Tolerancias de recogida: radio del punto (12) + media caja del jugador,
        // con un margen chico a favor de la seguridad.
        const spots = mk(config.pointSpots, PICKUP_DX, PICKUP_DY);
        const gems = mk(config.gems, PICKUP_DX, PICKUP_DY);
        const goalTarget = { x: config.goal.x, y: config.goal.y, dx: GOAL_DX, dy: GOAL_DY, frames: Infinity };

        const onlyPlatforms = Array.isArray(opts.platformTargets) ? new Set(opts.platformTargets) : null;
        const platformTargets = opts.platformTargets
            ? (config.platforms || []).map((p, index) => ({ p, index }))
                .filter(({ p, index }) => (!onlyPlatforms || onlyPlatforms.has(index)) && p.h <= 26 && p.w >= 60 && p.y < WORLD.floorTop - 40)
                .map(({ p, index }) => ({
                    index,
                    x: p.x,
                    y: p.y - p.h / 2 - HH,
                    dx: Math.max(10, p.w / 2 - 12),
                    dy: 6,
                    standing: true,
                    optional: true,
                    frames: Infinity
                }))
            : [];

        const visitedCount = this.explore(config, [...spots, ...gems, goalTarget, ...platformTargets], { timed: opts.timed });

        const reachableSpots = spots.filter((s) => Number.isFinite(s.frames));
        const badSpots = spots.filter((s) => !Number.isFinite(s.frames));
        const badGems = gems.filter((g) => !Number.isFinite(g.frames));
        const goal = goalTarget.frames;

        const worstFrames = reachableSpots.length ? Math.max(...reachableSpots.map((s) => s.frames)) : 0;
        const meanFrames = reachableSpots.length
            ? reachableSpots.reduce((acc, s) => acc + s.frames, 0) / reachableSpots.length
            : 0;

        return {
            ok: Number.isFinite(goal) && badSpots.length === 0 && badGems.length === 0 && layoutIssues.length === 0,
            goalOk: Number.isFinite(goal),
            goalFrames: goal,
            spotsTotal: spots.length,
            spotsOk: reachableSpots.length,
            spotsBad: badSpots,
            gemsTotal: gems.length,
            gemsBad: badGems,
            layoutIssues,
            isolatedPlatforms: platformTargets.filter((t) => !Number.isFinite(t.frames)).map((t) => t.index),
            pathLengthFrames: worstFrames,
            meanFrames,
            visitedCount
        };
    }
}
