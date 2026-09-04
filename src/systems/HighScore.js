const STORAGE_KEY = 'fast-move-high-score';

export class HighScore {
    static get() {
        try {
            const value = Number(localStorage.getItem(STORAGE_KEY));
            return Number.isFinite(value) ? value : 0;
        } catch (error) {
            return 0;
        }
    }

    static update(score) {
        const best = Math.max(HighScore.get(), score);

        try {
            localStorage.setItem(STORAGE_KEY, String(best));
        } catch (error) {
            // Ignorar: el juego funciona igual sin persistencia.
        }

        return best;
    }
}