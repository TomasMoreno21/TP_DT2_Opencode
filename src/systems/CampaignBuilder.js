import { LEVELS } from '../assets/levels';
import { LevelGenerator } from './LevelGenerator';

// Arma la campaña de una semilla sin congelar el menú: cada nivel se genera en
// un Web Worker (en paralelo, hasta uno por nivel) y, si los workers no están
// disponibles o fallan, se cae a generarla en el hilo principal.
// El resultado de cada semilla se cachea (volver al menú no la regenera).
const MAX_WORKERS = 5;
const cache = new Map();
const pending = new Map();
let pool = null;
let nextId = 1;

function createPool() {
    if (typeof Worker === 'undefined') {
        return null;
    }

    const size = Math.max(1, Math.min(MAX_WORKERS, (navigator.hardwareConcurrency ?? 2) - 1));
    const workers = [];

    try {
        for (let i = 0; i < size; i++) {
            const worker = new Worker(new URL('../workers/campaignWorker.js', import.meta.url), { type: 'module' });
            worker.onmessage = (event) => {
                const { id, entry, error } = event.data;
                const job = pending.get(id);
                pending.delete(id);

                if (job) {
                    if (error) {
                        job.reject(new Error(error));
                    } else {
                        job.resolve(entry);
                    }
                }
            };
            worker.onerror = (event) => {
                console.warn('[FastMove] un worker de campaña falló:', event.message);
                pool = null;

                for (const job of pending.values()) {
                    job.reject(new Error(event.message));
                }
                pending.clear();
            };
            workers.push(worker);
        }
    } catch (error) {
        console.warn('[FastMove] sin Web Worker:', error);
        return null;
    }

    return workers;
}

function generateLevelInWorker(seed, levelIndex, opts = {}) {
    pool ??= createPool();

    if (!pool) {
        return Promise.reject(new Error('sin workers'));
    }

    return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        pool[levelIndex % pool.length].postMessage({ id, seed, levelIndex, opts });
    });
}

export const CampaignBuilder = {
    // Genera un único nivel (índice base 0) para una semilla, sin cachear: lo usa
    // el reintento tras perder, que reemplaza ese nivel por uno nuevo.
    // opts.assist: muertes seguidas en ese nivel (el mapa sale más fácil y espacioso).
    buildLevel(seed, levelIndex, opts = {}) {
        return generateLevelInWorker(seed, levelIndex, opts)
            .catch(() => new LevelGenerator().generateLevelFor(levelIndex + 1, seed, LEVELS[levelIndex], undefined, opts));
    },

    // Devuelve una promesa con la campaña de `seed` (un elemento por nivel).
    build(seed) {
        if (!cache.has(seed)) {
            const promise = Promise.all(LEVELS.map((_, index) => generateLevelInWorker(seed, index)))
                .catch(() => new LevelGenerator().generateCampaign(seed, LEVELS));
            cache.set(seed, promise);
        }

        return cache.get(seed);
    }
};
