// Opciones de accesibilidad (docs/PLAN_FEEL.md §8.4), guardadas en el navegador:
// - reduceFlash: apaga destellos de pantalla y el borde de frenesí que respira.
// - reduceMotion: apaga sacudidas, zoom, parallax y cambia el wipe por un fundido.
const KEY = 'fast-move-options';

export const Settings = {
    reduceFlash: false,
    reduceMotion: false,
    // Modo modificadores (GDD §9): cada nivel sortea modificadores y el ranking es aparte.
    modifiers: false,

    load() {
        try {
            const saved = JSON.parse(localStorage.getItem(KEY));

            if (saved) {
                this.reduceFlash = Boolean(saved.reduceFlash);
                this.reduceMotion = Boolean(saved.reduceMotion);
                this.modifiers = Boolean(saved.modifiers);
            }
        } catch {
            // Sin almacenamiento o dato dañado: se usan los valores por defecto.
        }
    },

    set(name, value) {
        this[name] = value;

        try {
            localStorage.setItem(KEY, JSON.stringify({ reduceFlash: this.reduceFlash, reduceMotion: this.reduceMotion, modifiers: this.modifiers }));
        } catch {
            // Las opciones valen solo para esta sesión.
        }
    }
};

Settings.load();
