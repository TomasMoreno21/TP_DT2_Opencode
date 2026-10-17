// Bot de prueba que JUEGA el juego real (Phaser + física arcade) en el navegador.
// No forma parte del juego: se importa desde la consola del dev server, con un
// hook temporal `window.__game` (ver docs/PLAN.md, sección de niveles aleatorios).
//
//   const bot = await import('/tools/playbot.js');
//   await bot.playLevel(window.__game, { levelIndex: 0, campaign, seed });
//
// Estrategia: control en lazo cerrado. Planifica con LevelValidator.findPath
// desde el estado REAL del jugador hacia el próximo objetivo (gemas, puntos y,
// al cumplir la quota, la salida), ejecuta la ruta frame a frame inyectando
// teclas y replanifica cuando la posición real se desvía de la prevista. El
// tiempo se avanza a mano con game.step (60 Hz fijos), así que un nivel entero
// corre en segundos y sin depender del framerate de la pestaña.
import { LevelValidator } from '/src/systems/LevelValidator.js';

const FRAME_MS = 1000 / 60;
const JUMP_HOLD_FRAMES = 22;
const DEVIATION_X = 26;
const DEVIATION_Y = 34;
const STUCK_FRAMES = 60 * 40;

let clock = 0;

function step(game, n = 1) {
    for (let i = 0; i < n; i++) {
        clock += FRAME_MS;
        game.step(clock, FRAME_MS);
    }
}

function setKeys(player, dir, jump, dash = false) {
    player.keys.A.isDown = dir < 0;
    player.keys.D.isDown = dir > 0;
    player.keys.SPACE.isDown = jump;
    player.dashKey.isDown = dash;
}

function realState(scene) {
    const body = scene.player.body;
    const speed = 260;
    return {
        x: scene.player.rect.x,
        y: scene.player.rect.y,
        vx: Math.max(-speed, Math.min(speed, body.velocity.x)),
        vy: body.blocked.down ? 0 : body.velocity.y,
        grounded: body.blocked.down
    };
}

// Objetivos candidatos: puntos hasta cumplir la quota y luego la salida. Las
// gemas son opcionales (opts.gems): se intentan al final, sin fallar el nivel.
function targets(scene, { gems = false, blocked = new Map(), frame = 0 } = {}) {
    const free = (t) => (blocked.get(`${t.kind}@${t.x},${t.y}`) ?? 0) <= frame;
    const list = [];

    if (scene.scoreManager.quotaMet) {
        const activeGems = gems
            ? scene.level.gemList.filter((g) => g.active).map((g) => ({ kind: 'gem', x: g.x, y: g.y, dx: 20, dy: 26 }))
            : [];
        const pool = activeGems.filter(free);
        if (pool.length) return pool;
        const goal = scene.level.goal;
        return [{ kind: 'goal', x: goal.x, y: goal.y, dx: 26, dy: 36 }];
    }

    for (const point of scene.pointSpawner.points) {
        if (!point.circle.active) continue;
        const t = { kind: 'point', x: point.circle.x, y: point.circle.y, dx: 20, dy: 26 };
        if (free(t)) list.push(t);
    }
    return list;
}

function planBest(validator, config, scene, ctx) {
    const start = realState(scene);
    const failed = [];
    let best = null;

    for (const target of targets(scene, ctx)) {
        let path = validator.findPath(config, start, target);
        if (!path) { failed.push(target); continue; }
        if (path.length === 0) {
            // El simulador ya lo da por alcanzado pero el juego aún no lo
            // registró: se empuja hacia el objetivo.
            const dir = Math.abs(target.x - start.x) < 4 ? 0 : Math.sign(target.x - start.x);
            path = [{ dir, jump: start.grounded && target.y < start.y - 24, x: start.x, y: start.y }];
        }
        if (!best || path.length < best.path.length) best = { path, target };
    }
    return { best, failed };
}

// Juega un nivel. Devuelve { ok, frames, reason, collected, ... }.
export async function playLevel(game, { levelIndex, campaign, seed, comfort = 1, maxFrames = 60 * 150, gems = false }) {
    const validator = new LevelValidator({ comfort });
    const config = campaign[levelIndex].config;

    // El reloj manual continúa desde el del juego: si retrocede, los tweens
    // (p. ej. el vaivén de las gemas) se descontrolan.
    clock = Math.max(clock, performance.now(), game.loop.time ?? 0);
    game.loop.sleep?.();
    for (const sc of game.scene.getScenes(true)) game.scene.stop(sc.scene.key);
    game.scene.start('Game', { levelIndex, completedScore: 0, campaignSeed: seed, campaign });
    step(game, 4);

    const scene = game.scene.getScene('Game');
    // Nada de derrotas: se prueba el recorrido, no la supervivencia.
    scene.player.invulnerableUntil = Infinity;
    scene.timer.durationMs = 1e9;
    // Con el avance manual del reloj los cuerpos de gemas/power-ups empiezan a
    // caer por gravedad (el juego en tiempo real no lo hace): se los fija.
    for (const gem of scene.level.gemList) { gem.body.setAllowGravity(false); gem.body.setVelocity(0, 0); }

    let plan = null;
    let planIndex = 0;
    let jumpHold = 0;
    let waitFrames = 0;
    let lastProgress = 0;
    let lastCollected = 0;
    let replans = 0;
    const unreachable = [];
    const blocked = new Map();   // objetivo -> frame hasta el que se lo evita
    let current = null;          // { tag, since }
    const gemsDone = [];

    for (let frame = 0; frame < maxFrames; frame++) {
        // Cede el hilo de vez en cuando para que la pestaña siga respondiendo.
        // (MessageChannel: los timers se throttlean en pestañas ocultas.)
        if (frame % 120 === 0) {
            globalThis.__botProgress = { levelIndex, frame, replans, collected: scene.scoreManager.collected };
            await new Promise((resolve) => {
                const channel = new MessageChannel();
                channel.port1.onmessage = () => resolve();
                channel.port2.postMessage(0);
            });
        }
        if (scene.levelComplete) {
            setKeys(scene.player, 0, false);
            return { ok: true, frames: frame, replans, collected: scene.scoreManager.collected };
        }
        if (scene.gameEnded) {
            return { ok: false, reason: 'el nivel terminó sin llegar a la salida', frames: frame, replans };
        }

        const collected = scene.scoreManager.collected + (scene.level.gemList.filter((g) => !g.active).length);
        if (collected !== lastCollected) { lastCollected = collected; lastProgress = frame; }
        if (frame - lastProgress > STUCK_FRAMES) {
            const s = realState(scene);
            return {
                ok: false, reason: 'trabado', frames: frame, replans, at: [Math.round(s.x), Math.round(s.y)],
                pending: targets(scene, { gems }).map((t) => `${t.kind}@${t.x},${t.y}`), unreachable
            };
        }

        // Un objetivo que no se logra en 700 frames se aparta un rato (el bot puede
        // estar en un callejón) y se prueba con otro; las gemas, si fallan, solo
        // se registran.
        if (plan && current && current.tag === `${plan.target.kind}@${plan.target.x},${plan.target.y}` && frame - current.since > 700) {
            blocked.set(current.tag, frame + (plan.target.kind === 'gem' ? 1e9 : 1800));
            if (plan.target.kind === 'gem') gemsDone.push(`falló ${current.tag}`);
            plan = null;
            current = null;
        }

        // Seguimiento ESPACIAL de la ruta (no por frame): la inercia real del
        // jugador hace que avance más lento que el simulador, así que el comando
        // que corresponde es el del nodo de la ruta más cercano a su posición
        // real. Los saltos se disparan donde se planificaron, no a tiempo fijo.
        let needPlan = !plan;
        let move = null;
        if (plan && waitFrames === 0) {
            const real = scene.player.rect;
            let bestK = -2;
            let bestD = Infinity;
            const at = (j) => (j < 0 ? plan.start : plan.path[j]);
            for (let j = plan.k; j <= Math.min(plan.path.length - 1, plan.k + 20); j++) {
                const node = at(j);
                const d = Math.hypot(real.x - node.x, (real.y - node.y) * 1.2);
                if (d < bestD - 1.5) {
                    bestD = d;
                    bestK = j;
                } else if (bestK >= -1 && Math.hypot(node.x - at(bestK).x, node.y - at(bestK).y) < 2) {
                    // Nodos consecutivos en el mismo lugar (colgado de una pared):
                    // se avanza hasta el último, que es el que dispara el salto.
                    bestK = j;
                }
            }
            if (bestD > 40 || bestK + 1 >= plan.path.length) {
                needPlan = true;
            } else {
                if (bestK === plan.k) plan.stall++; else plan.stall = 0;
                plan.k = bestK;
                if (plan.stall > 90) needPlan = true;
                else move = plan.path[bestK + 1];
            }
        } else if (plan && waitFrames > 0) {
            move = { dir: 0, jump: false };
        }

        if (needPlan) {
            const { best, failed } = planBest(validator, config, scene, { gems, blocked, frame });
            replans++;
            for (const f of failed) {
                const tag = `${f.kind}@${f.x},${f.y}`;
                if (!unreachable.includes(tag)) unreachable.push(tag);
            }
            if (!best) {
                // Sin ruta posible hacia ningún objetivo: se espera un rato por si
                // el motivo es un móvil o un portal en cooldown, y se reintenta.
                plan = null;
                setKeys(scene.player, 0, false);
                step(game, 20);
                frame += 19;
                continue;
            }
            const real = scene.player.rect;
            plan = { ...best, k: -1, stall: 0, start: { x: real.x, y: real.y } };
            const tag = `${best.target.kind}@${best.target.x},${best.target.y}`;
            if (!current || current.tag !== tag) current = { tag, since: frame };
            if (globalThis.__botTrace) {
                globalThis.__botTrace.push(`f${frame} (${Math.round(real.x)},${Math.round(real.y)}) -> ${best.target.kind}@${best.target.x},${Math.round(best.target.y)} len=${best.path.length}`);
            }
            move = plan.path[0];
        }

        if (move.wait && waitFrames === 0) waitFrames = move.wait;

        let jump = false;
        if (move.jump && jumpHold === 0) jumpHold = JUMP_HOLD_FRAMES + 1;
        if (jumpHold > 0) {
            jumpHold--;
            // Un frame sin tecla antes de cada salto para que cuente como pulsación nueva.
            jump = jumpHold < JUMP_HOLD_FRAMES;
        }

        if (waitFrames > 0) {
            waitFrames--;
            setKeys(scene.player, 0, jump);
            if (waitFrames === 0) plan = null; // tras el portal el estado cambia de golpe
        } else {
            setKeys(scene.player, move.dir, jump, Boolean(move.dash));
        }
        if (globalThis.__botFrames) {
            const b = scene.player.body;
            globalThis.__botFrames.push(`${frame}:${Math.round(scene.player.rect.x)},${Math.round(scene.player.rect.y)} v${Math.round(b.velocity.x)},${Math.round(b.velocity.y)} g${scene.player.wallGrabbing ? 1 : 0} d${move.dir}${jump ? 'J' : ''} k${plan ? plan.k : '-'}`);
        }
        step(game, 1);
    }

    return { ok: false, reason: 'tiempo agotado', frames: maxFrames, replans, pending: targets(scene, { gems }).map((t) => `${t.kind}@${t.x},${t.y}`), unreachable };
}
