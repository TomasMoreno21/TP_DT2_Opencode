// Insignias de aprendizaje: una por mecánica usada por primera vez. Se guardan
// en localStorage y se listan en el popup de Tutorial del menú.
const KEY = 'fastMoveBadges';

export const BADGES = ['wallJump', 'dash', 'perfect', 'shield', 'portal', 'gem'];

function load() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) ?? [];
    } catch {
        return [];
    }
}

export const Badges = {
    has: (id) => load().includes(id),

    // Devuelve true solo la primera vez (para mostrar el aviso).
    unlock(id) {
        const owned = load();

        if (owned.includes(id)) {
            return false;
        }

        try {
            localStorage.setItem(KEY, JSON.stringify([...owned, id]));
        } catch {
            // Sin almacenamiento: el aviso sale, pero no queda guardada.
        }

        return true;
    }
};
