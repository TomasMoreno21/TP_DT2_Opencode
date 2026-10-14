import { WORLD } from '../assets/levels.js';
import { LevelValidator } from './LevelValidator.js';

const RNG_A = 1664525;
const RNG_C = 1013904223;
const RNG_M = 2 ** 32;

// Fórmula del temporizador derivada del recorrido mínimo verificado.
// El óptimo del validador (BFS) es mucho más rápido que una partida real
// (sin backtracking ni precisión humana), así que se escala y se suma un
// margen por punto de quota que hay que ir a buscar.
export const TIMER_FORMULA = {
    secondsPerOptimal: 20,
    secondsPerQuotaPoint: 0.8,
    floor: 45,
    ceiling: 75
};

function createRng(seed) {
    let s = seed >>> 0;
    return {
        next() {
            s = (Math.imul(s, RNG_A) + RNG_C) >>> 0;
            return s / RNG_M;
        },
        range(min, max) {
            return min + (max - min) * this.next();
        },
        int(min, max) {
            return Math.floor(this.range(min, max + 1));
        }
    };
}

export class LevelGenerator {
    constructor(validator = new LevelValidator()) {
        this.validator = validator;
    }

    generateLevelFor(levelId, seed, baseConfig, attempts = 200) {
        const rng = createRng(seed ^ (levelId * 131542391));
        let best = null;

        for (let i = 0; i < attempts; i++) {
            const candidate = this._mutate(rng, JSON.parse(JSON.stringify(baseConfig)), levelId);
            const res = this.validator.validate(candidate);
            if (res.ok) {
                candidate.durationSeconds = this.deriveTimerSeconds(res.pathLengthFrames, candidate.quota);
                return { config: candidate, res, seed, ok: true };
            }
            if (best === null || res.spotsOk > best.res.spotsOk || (res.spotsOk === best.res.spotsOk && res.pathLengthFrames < best.res.pathLengthFrames)) {
                best = { config: candidate, res, seed, ok: false };
            }
        }

        if (best) {
            best.config.durationSeconds = this.deriveTimerSeconds(best.res.pathLengthFrames, best.config.quota);
            return best;
        }

        const fallback = JSON.parse(JSON.stringify(baseConfig));
        const fres = this.validator.validate(fallback);
        fallback.durationSeconds = this.deriveTimerSeconds(fres.pathLengthFrames, fallback.quota);
        return { config: fallback, res: fres, seed, ok: false };
    }

    generateCampaign(seed, LEVELS) {
        const campaign = [];
        for (let i = 0; i < LEVELS.length; i++) {
            campaign.push(this.generateLevelFor(i + 1, seed, LEVELS[i]));
        }
        return campaign;
    }

    // Mutación mínima del prototipo: solo N1–N2, solo desplazamiento horizontal
    // de plataformas flotantes "libres" (sin trampolín/pincho/portal/goal/móvil
    // encima). Las filas (y) y los tamaños se conservan para no romper el ritmo
    // vertical ni la identidad mecánica. Si aparece solape, se descarta el
    // intento (el generador reintenta con otra deriva).
    _mutate(rng, cfg, id) {
        if (id > 2) {
            return cfg;
        }

        const platforms = cfg.platforms || [];
        const anchors = this._collectAnchors(cfg);

        for (const p of platforms) {
            if (!this._isMovable(p, platforms)) continue;
            if (this._isAnchored(p, anchors)) continue;
            if (rng.next() > 0.6) continue;

            const dir = rng.next() < 0.5 ? -1 : 1;
            const magnitude = rng.int(16, 56);
            const minX = 60 + p.w / 2;
            const maxX = WORLD.width - 60 - p.w / 2;
            const targetX = Math.max(minX, Math.min(maxX, p.x + dir * magnitude));
            const dx = targetX - p.x;

            if (dx === 0) continue;

            // Mover los spots que descansan sobre esta plataforma con ella.
            for (const spot of cfg.pointSpots || []) {
                if (this._restsOn(spot.x, spot.y, p)) {
                    spot.x += dx;
                }
            }

            p.x = targetX;
        }

        if (this._hasOverlap(platforms)) {
            return JSON.parse(JSON.stringify(cfg));
        }

        return cfg;
    }

    _isMovable(p, platforms) {
        return p.h <= 26 && p.w >= 100 && p.w <= 280 && p.y >= 150 && p.y <= 700;
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
        const top = platform.y - platform.h / 2;
        for (const a of anchors) {
            if (Math.abs(a.x - platform.x) > platform.w / 2 + 12) continue;
            const above = top - a.y;
            if (above >= -14 && above <= a.window) return true;
        }
        return false;
    }

    _restsOn(x, y, platform) {
        const top = platform.y - platform.h / 2;
        const above = top - y;
        return Math.abs(x - platform.x) <= platform.w / 2 + 12 && above >= 10 && above <= 48;
    }

    _hasOverlap(platforms) {
        const inflate = 6;
        for (let i = 0; i < platforms.length; i++) {
            for (let j = i + 1; j < platforms.length; j++) {
                const a = platforms[i];
                const b = platforms[j];
                const overlapX = Math.abs(a.x - b.x) < (a.w + b.w) / 2 + inflate;
                const overlapY = Math.abs(a.y - b.y) < (a.h + b.h) / 2 + inflate;
                if (overlapX && overlapY) return true;
            }
        }
        return false;
    }

    deriveTimerSeconds(pathLengthFrames, quota = 0) {
        if (!Number.isFinite(pathLengthFrames) || pathLengthFrames <= 0) return 60;
        const optimalSeconds = pathLengthFrames / 60;
        const raw = optimalSeconds * TIMER_FORMULA.secondsPerOptimal +
            quota * TIMER_FORMULA.secondsPerQuotaPoint;
        return Math.max(TIMER_FORMULA.floor, Math.min(TIMER_FORMULA.ceiling, Math.round(raw)));
    }
}