// Textos del juego por idioma. Español por defecto; el usuario pasa las
// traducciones oficiales y se agregan como una clave más en STRINGS.
// Uso: Lang.t('play') o Lang.t('best', { v: 123 }).
const LANG_KEY = 'fastMoveLang';

const STRINGS = {
    es: {
        subtitle: 'Completá los {n} niveles juntando la meta de puntos de cada uno',
        best: 'Mejor puntaje: {v}',
        play: 'JUGAR',
        generating: 'Generando niveles...',
        newLevels: 'NUEVOS NIVELES',
        seed: 'Semilla: {n}',
        controls: 'CONTROLES',
        controlsTitle: 'Controles',
        rowMove: 'Mover',
        rowMoveC: 'A / D  o  ← / →',
        rowJump: 'Saltar',
        rowJumpC: 'Espacio / W  o  ↑',
        rowGrab: 'Wall grab',
        rowGrabC: 'Mantené la dirección contra una pared',
        rowWallJump: 'Wall jump',
        rowWallJumpC: 'Saltá tocando una pared -> lado opuesto',
        rowDash: 'Dash',
        rowDashC: 'Shift',
        rowMisc: 'Reintentar / Mute',
        rowMiscC: 'R / M',
        popupHint: 'clic afuera para cerrar',
        lang: 'IDIOMA',
        langTitle: 'Idioma / Language',
        langEs: 'Español',
        langEn: 'English',
        tutMove: 'Movete con A / D  o  ← / →',
        tutJump: 'Saltá con Espacio / W  o  ↑',
        tutGrab: 'Pegate a una pared: mantené la dirección hacia ella',
        tutWallJump: 'Colgado de la pared, saltá para impulsarte',
        tutDash: 'Apretá Shift para hacer un dash',
        tutOk: '¡Bien!',
        tutDone: '¡Listo! Ya sabés moverte',
        tutSkip: 'T = saltar tutorial'
    },
    en: {
        subtitle: 'Clear all {n} levels by hitting each point quota',
        best: 'Best score: {v}',
        play: 'PLAY',
        generating: 'Generating levels...',
        newLevels: 'NEW LEVELS',
        seed: 'Seed: {n}',
        controls: 'CONTROLS',
        controlsTitle: 'Controls',
        rowMove: 'Move',
        rowMoveC: 'A / D  or  ← / →',
        rowJump: 'Jump',
        rowJumpC: 'Space / W  or  ↑',
        rowGrab: 'Wall grab',
        rowGrabC: 'Hold toward a wall',
        rowWallJump: 'Wall jump',
        rowWallJumpC: 'Jump touching a wall -> opposite side',
        rowDash: 'Dash',
        rowDashC: 'Shift',
        rowMisc: 'Retry / Mute',
        rowMiscC: 'R / M',
        popupHint: 'click outside to close',
        lang: 'LANGUAGE',
        langTitle: 'Idioma / Language',
        langEs: 'Español',
        langEn: 'English',
        tutMove: 'Move with A / D  or  ← / →',
        tutJump: 'Jump with Space / W  or  ↑',
        tutGrab: 'Stick to a wall: hold the direction toward it',
        tutWallJump: 'While on the wall, jump to launch yourself',
        tutDash: 'Press Shift to dash',
        tutOk: 'Nice!',
        tutDone: 'Done! You know how to move',
        tutSkip: 'T = skip tutorial'
    }
};

export const Lang = {
    current: 'es',

    init ()
    {
        try {
            const saved = localStorage.getItem(LANG_KEY);

            if (saved && STRINGS[saved]) {
                this.current = saved;
            }
        } catch {
            this.current = 'es';
        }
    },

    set (lang)
    {
        if (!STRINGS[lang]) {
            return;
        }

        this.current = lang;

        try {
            localStorage.setItem(LANG_KEY, lang);
        } catch {
            // Sin almacenamiento: el idioma vale solo para la sesión.
        }
    },

    t (key, vars = {})
    {
        let text = STRINGS[this.current][key] ?? STRINGS.es[key] ?? key;

        for (const [name, value] of Object.entries(vars)) {
            text = text.replace(`{${name}}`, value);
        }

        return text;
    }
};
