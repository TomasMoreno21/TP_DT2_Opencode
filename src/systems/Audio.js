import { WORLD } from '../assets/levels';
import { bus, duck, ensureContext, noise, toggleMute, tone } from './AudioBus';

// Paleta de sonidos del juego (docs/PLAN_FEEL.md §8.2). Único punto de entrada:
// Audio.play('evento', opciones). Todo se sintetiza en AudioBus; no hay assets.

// Escala pentatónica menor sobre Re: la cadena de recolecciones sube como una melodía.
const PENTATONIC = [0, 3, 5, 7, 10];
const ROOT = 293.66;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Frecuencia de la n-ésima recolección de la cadena (1 = primera). Sube dos octavas
// y, si la cadena sigue, oscila entre las notas más altas en vez de subir sin fin.
function chainFreq(chain) {
    let i = Math.max(0, Math.round(chain) - 1);

    if (i > 14) {
        i = 10 + ((i - 10) % 5);
    }

    const semitones = PENTATONIC[i % 5] + 12 * Math.floor(i / 5);

    return ROOT * Math.pow(2, semitones / 12);
}

// Panorama según la posición horizontal (0..WORLD.width), suave para no marear.
const panFor = (x) => (x === undefined ? 0 : clamp((x - (WORLD.width / 2)) / (WORLD.width / 2), -1, 1) * 0.6);

const EVENTS = {
    // Recolección: nota de la escala según la posición en la cadena. Con el combo se
    // le suman armónicos (brillo) para que el timbre "se abra".
    point: ({ chain = 1, combo = 1, x } = {}) => {
        const f = chainFreq(chain);
        const pan = panFor(x);

        tone({ freq: f, endFreq: f * 1.04, type: 'square', duration: 0.11, volume: 0.16, pan, wet: 0.12, filter: { type: 'lowpass', freq: f * 5, endFreq: f * 2 } });
        if (combo >= 2) tone({ freq: f * 2, type: 'sine', duration: 0.1, volume: 0.08, pan });
        if (combo >= 4) tone({ freq: f * 3, type: 'triangle', duration: 0.12, volume: 0.07, pan, wet: 0.2 });
        noise({ duration: 0.02, volume: 0.05, pan, filter: { type: 'highpass', freq: 4500 } });
    },
    gem: ({ x } = {}) => {
        const pan = panFor(x);

        tone({ freq: 880, endFreq: 1760, type: 'sine', duration: 0.2, volume: 0.22, pan, wet: 0.2 });
        tone({ freq: 1320, endFreq: 2640, type: 'triangle', duration: 0.18, volume: 0.1, delay: 0.05, pan, wet: 0.3 });
    },
    bounce: () => tone({ freq: 150, endFreq: 90, type: 'sine', duration: 0.14, volume: 0.3 }),
    perfect: () => {
        tone({ freq: 320, endFreq: 120, type: 'sine', duration: 0.18, volume: 0.32 });
        tone({ freq: 950, endFreq: 1500, type: 'triangle', duration: 0.14, volume: 0.18, delay: 0.04 });
    },
    // El salto al suelo suena más grave que el wall jump; ambos con un soplido de aire.
    jump: ({ kind = 'ground' } = {}) => {
        noise({ duration: 0.06, volume: 0.05, priority: 0, filter: { type: 'highpass', freq: 1500 } });

        return kind === 'wall'
            ? tone({ freq: 420, endFreq: 660, type: 'square', duration: 0.09, volume: 0.11 })
            : tone({ freq: 300, endFreq: 480, type: 'square', duration: 0.08, volume: 0.1 });
    },
    // Aterrizaje: golpe grave más fuerte cuanto más rápida fue la caída (vy en px/s).
    land: ({ vy = 300 } = {}) => {
        const k = clamp(vy / 700, 0.15, 1);

        tone({ freq: 120, endFreq: 48, type: 'sine', duration: 0.12 + 0.1 * k, volume: 0.12 + 0.25 * k, priority: 0 });
        noise({ duration: 0.08 + 0.06 * k, volume: 0.1 * k + 0.03, priority: 0, filter: { type: 'lowpass', freq: 700, endFreq: 180 } });
    },
    // Derrape: fricción corta al invertir la dirección corriendo.
    skid: () => noise({ duration: 0.09, volume: 0.07, priority: 0, filter: { type: 'bandpass', freq: 1900, endFreq: 900, q: 3 } }),
    // Pisada al correr: golpecito seco y bajo, apenas audible para no tapar la música.
    step: () => noise({ duration: 0.035, volume: 0.04, priority: 0, filter: { type: 'bandpass', freq: 380 + Math.random() * 120, q: 1.5 } }),
    // Agarrarse a la pared: roce metálico corto con un golpe grave.
    wallGrab: () => {
        noise({ duration: 0.1, volume: 0.09, priority: 0, filter: { type: 'bandpass', freq: 2600, endFreq: 1400, q: 4 } });
        tone({ freq: 140, endFreq: 90, type: 'triangle', duration: 0.08, volume: 0.12, priority: 0 });
    },
    // El dash volvió a cargarse: ping agudo y breve.
    dashReady: () => tone({ freq: 1180, endFreq: 1560, type: 'sine', duration: 0.07, volume: 0.07, priority: 0 }),
    dash: () => {
        noise({ duration: 0.18, volume: 0.18, filter: { type: 'bandpass', freq: 500, endFreq: 2600, q: 1.2 } });
        tone({ freq: 260, endFreq: 700, type: 'sawtooth', duration: 0.12, volume: 0.14 });
    },
    // Plataforma fragil: crujido al pisarla, derrumbe al caer y chime suave al volver.
    fragileShake: ({ x } = {}) => noise({ duration: 0.25, volume: 0.1, pan: panFor(x), priority: 1, filter: { type: 'bandpass', freq: 700, endFreq: 1500, q: 2 } }),
    fragileFall: ({ x } = {}) => {
        noise({ duration: 0.3, volume: 0.18, pan: panFor(x), priority: 1, filter: { type: 'lowpass', freq: 1800, endFreq: 150 } });
        tone({ freq: 160, endFreq: 50, type: 'triangle', duration: 0.22, volume: 0.16, pan: panFor(x), priority: 1 });
    },
    fragileBack: ({ x } = {}) => tone({ freq: 520, endFreq: 780, type: 'sine', duration: 0.12, volume: 0.08, pan: panFor(x), priority: 0 }),
    portal: () => tone({ freq: 500, endFreq: 1800, type: 'sine', duration: 0.16, volume: 0.14 }),
    shield: () => tone({ freq: 380, endFreq: 760, type: 'sine', duration: 0.18, volume: 0.2 }),
    hit: () => {
        duck(0.3, 400);
        tone({ freq: 200, endFreq: 55, type: 'sawtooth', duration: 0.24, volume: 0.3, priority: 3 });
        tone({ freq: 120, endFreq: 40, type: 'square', duration: 0.2, volume: 0.2, delay: 0.02, priority: 3 });
        noise({ duration: 0.3, volume: 0.28, priority: 3, filter: { type: 'lowpass', freq: 3000, endFreq: 200 } });
    },
    // El combo sube de nivel: arpegio de tres notas, más alto cuanto mayor el multiplicador.
    comboUp: ({ level = 2 } = {}) => {
        const root = { 2: 392, 3: 440, 4: 523, 5: 587 }[level] ?? 392;

        duck(0.6, 220);
        [1, 1.26, 1.5].forEach((ratio, i) => {
            tone({ freq: root * ratio, type: 'triangle', duration: 0.16, volume: 0.2, delay: i * 0.06, wet: 0.25, priority: 2 });
        });
    },
    // El combo se pierde: glissando descendente y apagado.
    comboLost: () => tone({ freq: 520, endFreq: 170, type: 'sawtooth', duration: 0.26, volume: 0.14, filter: { type: 'lowpass', freq: 2200, endFreq: 400 } }),
    // Entra el frenesí (x5): acorde brillante con un riser de ruido.
    frenzy: () => {
        duck(0.35, 520);
        [261.63, 329.63, 392, 523.25].forEach((f) => {
            tone({ freq: f, type: 'sawtooth', duration: 0.5, volume: 0.1, wet: 0.35, priority: 3, filter: { type: 'lowpass', freq: 3500, endFreq: 900 } });
        });
        noise({ duration: 0.3, volume: 0.12, priority: 3, filter: { type: 'highpass', freq: 800, endFreq: 6000 } });
        tone({ freq: 1568, type: 'sine', duration: 0.4, volume: 0.1, delay: 0.08, wet: 0.5, priority: 3 });
    },
    // Disparo en camino: tic agudo ascendente del lado de donde sale.
    warn: ({ x } = {}) => tone({ freq: 1300, endFreq: 1900, type: 'triangle', duration: 0.1, volume: 0.1, pan: panFor(x), priority: 1 }),
    // Intro del nivel: cuenta 3-2-1 ascendente y arranque.
    count: ({ n = 3 } = {}) => tone({ freq: 440 + (3 - n) * 110, type: 'square', duration: 0.11, volume: 0.15, wet: 0.15, priority: 2 }),
    go: () => {
        tone({ freq: 880, type: 'triangle', duration: 0.3, volume: 0.2, wet: 0.3, priority: 2 });
        tone({ freq: 1320, type: 'square', duration: 0.24, volume: 0.1, delay: 0.03, wet: 0.3, priority: 2 });
        noise({ duration: 0.25, volume: 0.1, filter: { type: 'highpass', freq: 600, endFreq: 5000 }, priority: 2 });
    },
    // Cuenta del bono de tiempo: tic que sube de tono con cada segundo sumado.
    tally: ({ k = 0, n = 1 } = {}) => tone({ freq: 600 + (k / Math.max(n, 1)) * 900, type: 'square', duration: 0.04, volume: 0.07, priority: 1 }),
    // Aviso de que al combo le queda poco: tic agudo y suave.
    comboWarn: () => tone({ freq: 880, type: 'sine', duration: 0.05, volume: 0.06, priority: 0 }),
    // Reloj: tic-tac de los últimos segundos y latido de los últimos 5 (los usa J5).
    tick: () => tone({ freq: 1400, type: 'square', duration: 0.03, volume: 0.09, priority: 2 }),
    tickUrgent: () => tone({ freq: 2000, type: 'square', duration: 0.04, volume: 0.12, priority: 2 }),
    heartbeat: () => {
        tone({ freq: 75, endFreq: 38, type: 'sine', duration: 0.16, volume: 0.38, priority: 2 });
        tone({ freq: 70, endFreq: 36, type: 'sine', duration: 0.16, volume: 0.3, delay: 0.15, priority: 2 });
    },
    goalOpen: () => {
        [523, 659, 784].forEach((f, i) => tone({ freq: f, endFreq: f * 1.2, type: 'triangle', duration: 0.16, volume: 0.18, delay: i * 0.09, wet: 0.2, priority: 2 }));
    },
    // Logro desbloqueado: arpegio corto ascendente con destello agudo.
    achievement: () => {
        [659, 784, 988, 1319].forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.14, volume: 0.15, delay: i * 0.07, wet: 0.3, priority: 2 }));
        tone({ freq: 2637, type: 'sine', duration: 0.3, volume: 0.07, delay: 0.28, wet: 0.45, priority: 2 });
    },
    goalReached: () => {
        duck(0.4, 500);
        [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'square', duration: 0.14, volume: 0.14, delay: i * 0.07, wet: 0.2, priority: 2 }));
        tone({ freq: 2093, type: 'triangle', duration: 0.3, volume: 0.1, delay: 0.3, wet: 0.45, priority: 2 });
    },
    victory: () => {
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.2, volume: 0.18, delay: i * 0.1, wet: 0.3, priority: 2 }));
    },
    ui: () => tone({ freq: 440, endFreq: 660, type: 'sine', duration: 0.06, volume: 0.12 }),
    hover: () => tone({ freq: 880, type: 'sine', duration: 0.03, volume: 0.04 })
};

export const Audio = {
    play(name, opts) {
        const handler = EVENTS[name];

        if (handler) {
            handler(opts);
        }
    },

    // Baja la música un instante (la usa J5 junto con los eventos grandes).
    duck,

    toggle() {
        return toggleMute();
    },

    get muted() {
        return bus.muted;
    },

    // Para el overlay de debug.
    get voices() {
        return bus.voices;
    },

    init() {
        ensureContext();
    }
};
