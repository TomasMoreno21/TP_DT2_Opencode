import { WORLD } from '../assets/levels.js';
import { LevelValidator } from './LevelValidator.js';

const RNG_A = 1664525;
const RNG_C = 1013904223;
const RNG_M = 2 ** 32;

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
                candidate.durationSeconds = this.deriveTimerSeconds(res.pathLengthFrames);
                return { config: candidate, res, seed, ok: true };
            }
            if (best === null || res.spotsOk > best.res.spotsOk || (res.spotsOk === best.res.spotsOk && res.pathLengthFrames < best.res.pathLengthFrames)) {
                best = { config: candidate, res, seed, ok: false };
            }
        }

        if (best) {
            best.config.durationSeconds = this.deriveTimerSeconds(best.res.pathLengthFrames);
            best.ok = best.res.ok;
            return best;
        }

        const fallback = JSON.parse(JSON.stringify(baseConfig));
        const fres = this.validator.validate(fallback);
        fallback.durationSeconds = this.deriveTimerSeconds(fres.pathLengthFrames);
        return { config: fallback, res: fres, seed, ok: false };
    }

    generateCampaign(seed, LEVELS) {
        const campaign = [];
        for (let i = 0; i < LEVELS.length; i++) {
            const result = this.generateLevelFor(i + 1, seed, LEVELS[i]);
            campaign.push(result);
        }
        return campaign;
    }

    _mutate(rng, cfg, id) {
        // Por ahora no mutamos (prototipo N1–N2): conservamos geometría fija.
        // El contrato permite relajación gradual si no converge; aún no activado.
        return cfg;
    }

    deriveTimerSeconds(pathLengthFrames) {
        if (!Number.isFinite(pathLengthFrames) || pathLengthFrames <= 0) return 60;
        const secs = (pathLengthFrames / 60) * 2.2;
        return Math.max(40, Math.min(80, Math.round(secs)));
    }
}