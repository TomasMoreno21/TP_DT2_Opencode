import { LEVELS } from '../assets/levels';
import { LevelGenerator } from './LevelGenerator';

// Arma la campaña de una semilla sin congelar el menú: cada nivel se genera en
// un Web Worker (en paralelo, hasta uno por nivel) y, si los workers no están
// disponibles, fallan o tardan demasiado, se cae a generar ese nivel en el
// hilo principal individualmente (sin bloquear a los demás).
// El resultado de cada semilla se cachea (volver al menú no la regenera).
const MAX_WORKERS = 5;
// Un nivel que no responde en este tiempo se considera perdido: se hace fallback
// al hilo principal para no quedar colgados para siempre.
const WORKER_TIMEOUT_MS = 8000;

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

        // Timeout: si el worker no responde en WORKER_TIMEOUT_MS, rechazamos para
        // poder hacer fallback al hilo principal sin quedar colgados.
        const timer = setTimeout(() => {
            if (pending.has(id)) {
                pending.delete(id);
                clearTimeout(timer);
                reject(new Error(`worker timeout nivel ${levelIndex + 1}`));
            }
        }, WORKER_TIMEOUT_MS);

        // Limpiar el timer si el worker responde primero.
        const originalResolve = resolve;
        const originalReject = reject;
        pending.set(id, {
            resolve: (v) => { clearTimeout(timer); originalResolve(v); },
            reject: (e) => { clearTimeout(timer); originalReject(e); }
        });
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
    // Cada nivel se genera de forma independiente: si uno falla o tarda, los
    // demás siguen y ese nivel se genera en el hilo principal.
    build(seed) {
        if (!cache.has(seed)) {
            const promise = Promise.all(LEVELS.map((_, index) =>
                generateLevelInWorker(seed, index).catch(() =>
                    new LevelGenerator().generateLevelFor(index + 1, seed, LEVELS[index])
                )
            ))
                .catch(() => new LevelGenerator().generateCampaign(seed, LEVELS));
            cache.set(seed, promise);
        }

        return cache.get(seed);
    }
};
