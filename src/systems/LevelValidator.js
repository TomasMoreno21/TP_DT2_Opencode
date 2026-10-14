import { PLAYER_CONFIG } from '../entities/Player.js';
import { WORLD } from '../assets/levels.js';
import { TRAMPOLINE_CONFIG } from '../entities/Trampoline.js';

const DT = 1 / 60;
const HW = PLAYER_CONFIG.width / 2;
const HH = PLAYER_CONFIG.height / 2;
const SPEED = PLAYER_CONFIG.speed;
const JUMP_V = Math.abs(PLAYER_CONFIG.jumpVelocity);
const WALL_JUMP_V = Math.abs(PLAYER_CONFIG.wallJumpYVelocity);
const GRAVITY = 900;
const MAX_FRAMES = 2400;

function buildPlatforms(config) {
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
    return plats;
}

function overlaps(px, py, plat) {
    return px + HW > plat.x1 && px - HW < plat.x2 && py + HH > plat.y1 && py - HH < plat.y2;
}

function moveBody(state, platforms) {
    let { x, y, vx, vy } = state;
    x += vx * DT;
    x = Math.min(WORLD.width - HW, Math.max(HW, x));

    for (const plat of platforms) {
        if (!overlaps(x, y, plat)) continue;
        if (vy <= 0 && y - HH < plat.y2 && y + HH > plat.y1) {
            if (vx < 0) x = plat.x2 + HW;
            if (vx > 0) x = plat.x1 - HW;
        }
    }

    y += vy * DT;
    let grounded = false;

    for (const plat of platforms) {
        if (!overlaps(x, y, plat)) continue;
        if (vy > 0 && y + HH >= plat.y1 && y + HH <= plat.y2 + 6) {
            y = plat.y1 - HH;
            vy = 0;
            grounded = true;
        } else if (vy < 0 && y - HH <= plat.y2 && y - HH >= plat.y1 - 6) {
            y = plat.y2 + HH;
            vy = 0;
        }
    }

    y = Math.min(WORLD.height - HH, Math.max(HH, y));

    return { x, y, vx, vy, grounded };
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

export class LevelValidator {
    constructor() {
        this.maxFrames = MAX_FRAMES;
    }

    near(visited, x, y, dx, dy) {
        let best = Infinity;
        for (const s of visited) {
            if (Math.abs(s.x - x) <= dx && Math.abs(s.y - y) <= dy && s.depth < best) {
                best = s.depth;
            }
        }
        return best;
    }

    explore(config) {
        const platforms = buildPlatforms(config);
        const start = { x: config.spawn.x, y: config.spawn.y, vx: 0, vy: 0 };
        const queue = [{ state: moveBody(start, platforms), depth: 0 }];
        const seen = new Set();
        const visited = [];

        while (queue.length > 0) {
            const { state, depth } = queue.shift();
            if (depth > this.maxFrames) continue;
            const key = `${Math.round(state.x)},${Math.round(state.y)},${state.grounded ? 1 : 0}`;
            if (seen.has(key)) continue;
            seen.add(key);
            visited.push({ ...state, depth });

            const wall = touchingWall(state, platforms);
            const moves = [];

            for (const vx of [-SPEED, 0, SPEED]) {
                moves.push({ vx, jump: false, wallJump: false });
                if (state.grounded) {
                    moves.push({ vx, jump: true, wallJump: false });
                } else if (wall === 'left' && vx === -SPEED) {
                    moves.push({ vx, jump: false, wallJump: true });
                } else if (wall === 'right' && vx === SPEED) {
                    moves.push({ vx, jump: false, wallJump: true });
                }
            }

            for (const m of moves) {
                let vy = state.grounded ? 0 : state.vy + GRAVITY * DT;
                if (m.jump) vy = -JUMP_V;
                if (m.wallJump) vy = -WALL_JUMP_V;
                const next = moveBody({ x: state.x, y: state.y, vx: m.vx, vy }, platforms);
                if (next.grounded && m.wallJump) continue;
                queue.push({ state: next, depth: depth + 1 });
            }

            queue.push({
                state: moveBody({ x: state.x, y: state.y, vx: 0, vy: state.grounded ? 0 : state.vy + GRAVITY * DT }, platforms),
                depth: depth + 1
            });
        }

        return visited;
    }

    validate(config) {
        const visited = this.explore(config);
        const spots = (config.pointSpots || []).map((s, i) => ({
            index: i,
            x: s.x,
            y: s.y,
            frames: this.near(visited, s.x, s.y, 40, 40)
        }));
        const goal = this.near(visited, config.goal.x, config.goal.y, 48, 64);
        const reachableSpots = spots.filter((s) => Number.isFinite(s.frames));
        const badSpots = spots.filter((s) => !Number.isFinite(s.frames));

        const worstFrames = reachableSpots.length ? Math.max(...reachableSpots.map((s) => s.frames)) : 0;
        const pathLengthFrames = worstFrames;

        return {
            ok: Number.isFinite(goal) && badSpots.length === 0,
            goalOk: Number.isFinite(goal),
            goalFrames: goal,
            spotsTotal: spots.length,
            spotsOk: reachableSpots.length,
            spotsBad: badSpots,
            pathLengthFrames,
            visitedCount: visited.length
        };
    }
}