import { LEVELS } from '../assets/levels.js';
import { LevelGenerator } from '../systems/LevelGenerator.js';

// Genera un nivel de la campaña fuera del hilo principal: validar un mapa
// cuesta ~1 s y bloquearía el menú. CampaignBuilder reparte los niveles entre
// varios workers para que se generen en paralelo.
const generator = new LevelGenerator();

self.onmessage = (event) => {
    const { id, seed, levelIndex, opts } = event.data;
    try {
        postMessage({ id, entry: generator.generateLevelFor(levelIndex + 1, seed, LEVELS[levelIndex], undefined, opts ?? {}) });
    } catch (error) {
        postMessage({ id, error: String(error?.stack ?? error) });
    }
};
