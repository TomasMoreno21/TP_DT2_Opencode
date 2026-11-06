// Textos del juego. Español por defecto; los demás idiomas vienen de Traducila
// ({ key: texto en español, translate }) y se buscan por el texto ya armado.
// Uso: Lang.t('play') o Lang.t('best', { v: 123 }).
import { GameObjects } from 'phaser';
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
        mod_slowDash: 'Dash lento',
        mod_singlePoint: 'Un solo punto',
        mod_highGoal: 'Meta alta',
        mod_moon: 'Luna',
        mod_noDash: 'Sin dash',
        mod_fleeting: 'Orbes efímeros',
        mod_fastSpikes: 'Pinchos rápidos',
        mod_fog: 'Niebla',
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
        langTitle: 'Idioma',
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

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Por idioma: una entrada por frase (las más largas primero) y un regex que las
// busca todas dentro del texto. Los números de una clave valen para cualquier
// número ("Te faltaron 1 de la meta" sirve para "Te faltaron 20 de la meta").
function buildDict (words)
{
    const entries = [];

    for (const { key, translate: out } of words) {
        entries.push({ key, out });

        // "Tiempo total:" también vale sin los dos puntos.
        if (key.endsWith(':') && out.endsWith(':')) {
            entries.push({ key: key.slice(0, -1), out: out.slice(0, -1) });
        }
    }

    entries.sort((a, b) => b.key.length - a.key.length);

    for (const entry of entries) {
        const pieces = entry.key.split(/\d+/).map(escapeRegex);

        entry.source = pieces.join('(\\d+)');
        entry.full = new RegExp(`^${entry.source}$`, 'iu');
        entry.outParts = entry.out.split(/\d+/);
        entry.numbers = pieces.length - 1;
    }

    const regex = new RegExp(`(?<![\\p{L}\\d])(?:${entries.map((e) => e.source.replace(/\(\\d\+\)/g, '\\d+')).join('|')})(?![\\p{L}\\d])`, 'giu');

    return { entries, regex };
}

const letters = (s) => (s.match(/\p{L}/gu) ?? []).length;

// Arma la traducción de una frase encontrada, pasando los números tal cual.
function render (entry, found)
{
    const match = entry.full.exec(found);

    if (entry.outParts.length - 1 !== entry.numbers) {
        return entry.out;
    }

    return entry.outParts.map((part, i) => part + (i < entry.numbers ? match[i + 1] : '')).join('');
}

const TRANSLATIONS = {
    en: buildDict(enData.data.words)
};

// Reemplaza cada frase conocida dentro del texto ya armado ("Mejor puntaje: 405",
// "NIVEL 3/5"); lo que no está en el diccionario queda en español.
const cache = new Map();

function translate (lang, text)
{
    const cacheKey = `${lang}|${text}`;

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const { entries, regex } = TRANSLATIONS[lang];
    let covered = 0;

    const replaced = text.replace(regex, (found) => {
        const entry = entries.find((e) => e.key === found) ?? entries.find((e) => e.full.test(found));
        const out = render(entry, found);
        const isUpper = found === found.toUpperCase() && found !== found.toLowerCase();

        covered += letters(found);

        return isUpper ? out.toUpperCase() : out;
    });

    // Si solo se reconoció una palabra suelta de una oración larga, se deja entera
    // en español: mejor eso que una frase mezclada ("las plataformas Fragile caen...").
    const result = covered * 10 >= letters(text) * 7 ? replaced : text;

    cache.set(cacheKey, result);

    return result;
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
    },

    // Traduce un texto ya armado (sin buscar claves de STRINGS).
    text (text)
    {
        return this.current === 'es' || typeof text !== 'string' ? text : translate(this.current, text);
    }
};

// Todo texto de Phaser pasa por el diccionario: así ninguna pantalla se queda sin
// traducir aunque el texto esté escrito a mano en el código.
export function hookPhaserText ()
{
    const proto = GameObjects.Text.prototype;

    if (proto.langHooked) {
        return;
    }

    const original = proto.setText;

    proto.setText = function (value)
    {
        const out = Array.isArray(value) ? value.map((v) => Lang.text(v)) : Lang.text(value);

        return original.call(this, out);
    };

    proto.langHooked = true;
}
