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
        tutSkip: 'T = saltar tutorial',
        prTitle: 'Práctica: {m}',
        prTrampoline: 'Trampolines',
        prHazard: 'Pinchos y escudo',
        prPortal: 'Portales',
        prHintTrampoline: 'Pisá el centro del trampolín: rebote más alto. Juntá el punto de arriba',
        prHintHazard: 'Los pinchos tiemblan antes de salir. Agarrá el escudo o cruzá cuando se retraen',
        prHintPortal: 'Quedate sobre el portal un instante: te lleva arriba. Juntá el punto',
        prExit: 'Ahora andá a la salida',
        prRetry: 'Casi, ¡probá de nuevo!',
        prSkip: 'Enter = saltar práctica',
        prDone: '¡Práctica lista!',
        coachHazard: 'Tip: los pinchos tiemblan antes de salir. Cruzá cuando se retraen o usá el dash',
        coachProjectile: 'Tip: el círculo rojo avisa de dónde sale la bola. El dash te hace invulnerable',
        coachTime: 'Tip: andá por los puntos cercanos primero.',
        tutorialBtn: 'TUTORIAL',
        tutorialTitle: 'Tutorial e insignias',
        tutorialOn: 'Tutorial activado',
        tutorialOff: 'Tutorial desactivado',
        tutorialReset: 'Reiniciar tutorial',
        badgesTitle: 'Insignias',
        badgeNew: 'Insignia: {n}',
        badge_wallJump: 'Wall jump',
        badge_dash: 'Dash',
        badge_perfect: 'Rebote perfecto',
        badge_shield: 'Escudo salvador',
        badge_portal: 'Portal',
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
        tutSkip: 'T = skip tutorial',
        prTitle: 'Practice: {m}',
        prTrampoline: 'Trampolines',
        prHazard: 'Spikes and shield',
        prPortal: 'Portals',
        prHintTrampoline: 'Land on the trampoline center for a higher bounce. Grab the top point',
        prHintHazard: 'Spikes shake before they pop out. Grab the shield or cross when they retract',
        prHintPortal: 'Stay on the portal for a moment: it takes you up. Grab the point',
        prExit: 'Now head to the exit',
        prRetry: 'Close, try again!',
        prSkip: 'Enter = skip practice',
        prDone: 'Practice done!',
        coachHazard: 'Tip: spikes shake before they pop out. Cross when they retract or use the dash',
        coachProjectile: 'Tip: the red circle warns where the ball comes from. Dash makes you invulnerable',
        coachTime: 'Tip: grab the nearby points first.',
        tutorialBtn: 'TUTORIAL',
        tutorialTitle: 'Tutorial and badges',
        tutorialOn: 'Tutorial on',
        tutorialOff: 'Tutorial off',
        tutorialReset: 'Reset tutorial',
        badgesTitle: 'Badges',
        badgeNew: 'Badge: {n}',
        badge_wallJump: 'Wall jump',
        badge_dash: 'Dash',
        badge_perfect: 'Perfect bounce',
        badge_shield: 'Saving shield',
        badge_portal: 'Portal',
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
