// Textos del juego. Español por defecto; los demás idiomas vienen de Traducila
// ({ key: texto en español, translate }) y se buscan por el texto ya armado.
// Uso: Lang.t('play') o Lang.t('best', { v: 123 }).
import enData from '../assets/translations_en.json';

const LANG_KEY = 'fastMoveLang';

const STRINGS = {
    es: {
        subtitle: 'Completá los {n} niveles juntando la meta de puntos de cada uno',
        best: 'Mejor puntaje: {v}',
        rankLabel: 'RANGO',
        rank_bronze: 'BRONCE',
        rank_silver: 'PLATA',
        rank_gold: 'ORO',
        rank_none: '—',
        timeBonus: 'TIEMPO +{v}',
        sumTotalTime: 'Tiempo total',
        sumScore: 'Puntos',
        sumTime: 'Bono de tiempo',
        sumMods: 'Modificadores',
        sumCombo: 'Combo máximo',
        sumDeaths: 'Muertes',
        ranksMenu: 'Rangos',
        play: 'JUGAR',
        hudScore: 'PUNTOS',
        hudQuota: 'META {c}/{q}',
        hudLevel: 'NIVEL {c}/{t}',
        hudAir: 'VOLANDO x{n}',
        hudExit: 'SALIDA',
        introLevel: 'NIVEL {n}',
        introGo: '¡YA!',
        mod_shortClock: 'Reloj corto',
        mod_burst: 'Ráfaga',
        mod_slowDash: 'Dash lento',
        mod_fragileCombo: 'Combo frágil',
        mod_singlePoint: 'Un solo punto',
        mod_highGoal: 'Meta alta',
        modBonus: 'MODIFICADORES +{v}',
        optModifiers: 'Modo modificadores',
        tabNormal: 'NORMAL',
        tabMods: 'MODIFICADORES',
        introTipFragile: 'Las plataformas frágiles caen al pisarlas: no te quedes quieto',
        introTipHazard: 'Los pinchos tiemblan antes de salir: cruzá cuando se retraen o agarrá el escudo',
        introTipVoid: 'El escenario sube solo: no te quedes abajo. Juntá los orbes y la salida aparece',
        optionsBtn: 'OPCIONES',
        optionsTitle: 'OPCIONES',
        optReduceFlash: 'Reducir destellos',
        optReduceMotion: 'Reducir movimiento',
        optHint: 'Se aplica desde la próxima partida',
        overMissing: 'Te faltaron {n} de la meta',
        overTipHit: 'Consejo: el dash (Shift) te hace invulnerable un instante',
        overTipTime: 'Consejo: encadená puntos sin frenar para llegar a la meta a tiempo',
        streak5: '¡RACHA!',
        streak10: '¡IMPARABLE!',
        streakFrenzy: '¡FRENESÍ!',
        rankingBtn: 'RANKING',
        rankingTitle: 'RANKING LOCAL',
        rankingEmpty: 'Todavía no hay puntajes. ¡Sé el primero!',
        rankingBack: 'VOLVER',
        rankingClear: 'BORRAR',
        rankingClearSure: '¿SEGURO? OTRO CLIC',
        colName: 'NOMBRE',
        colScore: 'PUNTAJE',
        colLevels: 'NIVELES',
        colCombo: 'COMBO',
        colDate: 'FECHA',
        entryTitle: '¡ENTRASTE AL TOP 10!',
        entryPlace: 'Puesto #{p} · {s} puntos',
        entryPrompt: 'Ingresá tus iniciales',
        entryHint: '↑ ↓ cambian la letra · ← → mueven · Enter confirma',
        entryOk: 'ACEPTAR',
        entryContinue: 'CONTINUAR',
        continueBtn: 'CONTINUAR',
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
        tutMove: 'Movete',
        tutJump: 'Saltá',
        tutGrab: 'Mantené contra una pared',
        tutWallJump: 'Colgado de la pared, saltá',
        tutDash: 'Hacé un dash',
        tutOr: 'o',
        tutOk: '¡Bien!',
        tutDone: '¡Listo! Ya sabés moverte',
        tutSkip: 'T = saltar tutorial',
        prTitle: 'Práctica: {m}',
        prExit: 'Ahora andá a la salida',
        prRetry: 'Casi, ¡probá de nuevo!',
        prSkip: 'Enter = saltar práctica',
        prDone: '¡Práctica lista!',
        coachHazard: 'Tip: los pinchos tiemblan antes de salir. Cruzá cuando se retraen o usá el dash',
        coachVoid: 'Tip: no frenes. Usá el dash (SHIFT) para los saltos largos',
        coachProjectile: 'Tip: el círculo rojo avisa de dónde sale la bola. El dash te hace invulnerable',
        coachTime: 'Tip: andá por los puntos cercanos primero.',
        tutorialBtn: 'TUTORIAL',
        tutorialTitle: 'Tutorial e insignias',
        tutorialOn: 'Tutorial activado',
        tutorialOff: 'Tutorial desactivado',
        tutorialReset: 'Reiniciar tutorial',
        pauseTitle: 'PAUSA',
        pauseResume: 'CONTINUAR',
        pauseNew: 'OTRO NIVEL',
        pauseMenu: 'MENÚ',
        pauseGenerating: 'Generando...',
        pauseHint: 'ESC = continuar',
        badgesTitle: 'Insignias',
        badgeNew: 'Insignia: {n}',
        badge_wallJump: 'Wall jump',
        badge_dash: 'Dash',
        badge_perfect: 'Rebote perfecto',
        badge_shield: 'Escudo salvador',
        badge_void: 'Escapaste del Vacío',
        achievementsBtn: 'LOGROS',
        achievementsTitle: 'Logros',
        achNew: 'Logro: {n}',
        ach_noDeaths: 'Sin caídas',
        ach_noDeaths_desc: 'Completá un nivel sin morir',
        ach_maxCombo: 'Al máximo',
        ach_maxCombo_desc: 'Llegá a x5 de combo',
        ach_champion: 'Campeón',
        ach_champion_desc: 'Completá la campaña',
        ach_gold: 'Medalla de oro',
        ach_gold_desc: 'Rango oro en un nivel',
        ach_goldAll: 'Oro total',
        ach_goldAll_desc: 'Rango oro en todos los niveles',
        ach_airborne: 'Volando',
        ach_airborne_desc: 'Cadena aérea de 5',
        ach_speedster: 'Velocista',
        ach_speedster_desc: 'Llegá con la mitad del tiempo',
        ach_collector: 'Coleccionista',
        ach_collector_desc: 'Sumá 1000 puntos',
    }
};

// Mapa por idioma: clave en minúsculas -> traducción.
const TRANSLATIONS = {
    en: new Map(enData.data.words.map((w) => [w.key.toLowerCase(), w.translate]))
};

function translate (lang, text)
{
    const map = TRANSLATIONS[lang];
    const lower = text.toLowerCase();
    let out = map.get(lower);

    if (out === undefined) {
        // Claves que terminan en ':' valen como prefijo ("Mejor puntaje: 120").
        for (const [key, value] of map) {
            if (key.endsWith(':') && lower.startsWith(key)) {
                out = value + text.slice(key.length);
                break;
            }
        }
    }

    if (out === undefined) {
        return text;
    }

    const isUpper = text === text.toUpperCase() && text !== text.toLowerCase();

    return isUpper ? out.toUpperCase() : out;
}

export const Lang = {
    current: 'es',

    init ()
    {
        try {
            const saved = localStorage.getItem(LANG_KEY);

            if (saved && (STRINGS[saved] || TRANSLATIONS[saved])) {
                this.current = saved;
            }
        } catch {
            this.current = 'es';
        }
    },

    set (lang)
    {
        if (!STRINGS[lang] && !TRANSLATIONS[lang]) {
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
        let text = STRINGS.es[key] ?? key;

        for (const [name, value] of Object.entries(vars)) {
            text = text.replace(`{${name}}`, value);
        }

        return this.current === 'es' ? text : translate(this.current, text);
    }
};
