const STORAGE_KEYS = { normal: 'fast-move-leaderboard', mods: 'fast-move-leaderboard-mods' };
const NAME_KEY = 'fast-move-last-name';

export const LEADERBOARD_SIZE = 10;
export const NAME_LENGTH = 3;

// Ranking local (Top 10) guardado en el navegador. Cada entrada:
// { id, name, score, levels, combo, victory, date }. Como HighScore, funciona
// sin persistencia si localStorage no está disponible.
export class Leaderboard {
    // Ranking activo ('normal' | 'mods'); Ranking y GameOver lo fijan antes de leer o guardar.
    static mode = 'normal';

    static get key () {
        return STORAGE_KEYS[Leaderboard.mode];
    }

    static get () {
        try {
            const list = JSON.parse(localStorage.getItem(Leaderboard.key));

            if (!Array.isArray(list)) {
                return [];
            }

            return list
                .filter((e) => e && Number.isFinite(e.score) && typeof e.name === 'string')
                .sort((a, b) => b.score - a.score)
                .slice(0, LEADERBOARD_SIZE);
        } catch (error) {
            return [];
        }
    }

    static save (entries) {
        try {
            localStorage.setItem(Leaderboard.key, JSON.stringify(entries));
        } catch (error) {
            // Ignorar: el juego funciona igual sin persistencia.
        }
    }

    static find (id) {
        return Leaderboard.get().find((e) => e.id === id) ?? null;
    }

    // replaceId: entrada de la misma partida que se reemplazaría (no cuenta para el cupo).
    static qualifies (score, replaceId = null) {
        if (score <= 0) {
            return false;
        }

        const others = Leaderboard.get().filter((e) => e.id !== replaceId);

        return others.length < LEADERBOARD_SIZE || score > others[others.length - 1].score;
    }

    // Puesto (1-based) que ocuparía el puntaje; a igualdad queda debajo del existente.
    static positionFor (score, replaceId = null) {
        return 1 + Leaderboard.get().filter((e) => e.id !== replaceId && e.score >= score).length;
    }

    static add ({ name, score, levels, combo, victory }, replaceId = null) {
        const entry = {
            id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            name: Leaderboard.cleanName(name),
            score,
            levels,
            combo,
            victory: Boolean(victory),
            date: Date.now()
        };

        const entries = Leaderboard.get().filter((e) => e.id !== replaceId);
        entries.push(entry);
        entries.sort((a, b) => b.score - a.score);
        Leaderboard.save(entries.slice(0, LEADERBOARD_SIZE));
        Leaderboard.saveName(entry.name);

        return entry;
    }

    static clear () {
        Leaderboard.save([]);
    }

    static cleanName (name) {
        const clean = String(name ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, NAME_LENGTH);

        return clean.padEnd(NAME_LENGTH, 'A');
    }

    static lastName () {
        try {
            return Leaderboard.cleanName(localStorage.getItem(NAME_KEY));
        } catch (error) {
            return 'AAA';
        }
    }

    static saveName (name) {
        try {
            localStorage.setItem(NAME_KEY, name);
        } catch (error) {
            // Ignorar.
        }
    }
}
