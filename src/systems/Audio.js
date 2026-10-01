const MUTE_KEY = 'fast-move-muted';

let context = null;
let master = null;
let muted = load();

function load() {
    try {
        return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
        return false;
    }
}

function save() {
    try {
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
        // localStorage no disponible: se ignora.
    }
}

function ensureContext() {
    if (!context) {
        const Ctx = window.AudioContext || window.webkitAudioContext;

        if (!Ctx) {
            return null;
        }

        context = new Ctx();
        master = context.createGain();
        master.gain.value = muted ? 0 : 1;
        master.connect(context.destination);
    }

    if (context.state === 'suspended') {
        context.resume();
    }

    return context;
}

function tone({ freq = 440, endFreq = null, type = 'square', duration = 0.12, volume = 0.25, delay = 0 }) {
    if (muted) {
        return;
    }

    const ctx = ensureContext();

    if (!ctx) {
        return;
    }

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(freq, 1), start);

    if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), start + duration);
    }

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
}

const EVENTS = {
    point: ({ combo = 1 } = {}) => {
        const p = 420 + Math.min(combo, 5) * 70;
        tone({ freq: p, endFreq: p * 1.6, type: 'square', duration: 0.09, volume: 0.16 });
    },
    gem: () => tone({ freq: 880, endFreq: 1760, type: 'sine', duration: 0.2, volume: 0.22 }),
    bounce: () => tone({ freq: 150, endFreq: 90, type: 'sine', duration: 0.14, volume: 0.3 }),
    perfect: () => {
        tone({ freq: 320, endFreq: 120, type: 'sine', duration: 0.18, volume: 0.32 });
        tone({ freq: 950, endFreq: 1500, type: 'triangle', duration: 0.14, volume: 0.18, delay: 0.04 });
    },
    // El salto al suelo suena mas grave que el wall jump, para distinguirlos al oido.
    jump: ({ kind = 'ground' } = {}) => (kind === 'wall'
        ? tone({ freq: 420, endFreq: 660, type: 'square', duration: 0.09, volume: 0.11 })
        : tone({ freq: 300, endFreq: 480, type: 'square', duration: 0.08, volume: 0.1 })),
    dash: () => tone({ freq: 260, endFreq: 700, type: 'sawtooth', duration: 0.12, volume: 0.14 }),
    portal: () => tone({ freq: 500, endFreq: 1800, type: 'sine', duration: 0.16, volume: 0.14 }),
    shield: () => tone({ freq: 380, endFreq: 760, type: 'sine', duration: 0.18, volume: 0.2 }),
    hit: () => {
        tone({ freq: 200, endFreq: 55, type: 'sawtooth', duration: 0.24, volume: 0.3 });
        tone({ freq: 120, endFreq: 40, type: 'square', duration: 0.2, volume: 0.2, delay: 0.02 });
    },
    goalOpen: () => {
        [523, 659, 784].forEach((f, i) => tone({ freq: f, endFreq: f * 1.2, type: 'triangle', duration: 0.16, volume: 0.18, delay: i * 0.09 }));
    },
    goalReached: () => {
        [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'square', duration: 0.14, volume: 0.14, delay: i * 0.07 }));
    },
    victory: () => {
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.2, volume: 0.18, delay: i * 0.1 }));
    },
    ui: () => tone({ freq: 440, endFreq: 660, type: 'sine', duration: 0.06, volume: 0.12 })
};

export const Audio = {
    play(name, opts) {
        const handler = EVENTS[name];

        if (handler) {
            handler(opts);
        }
    },

    toggle() {
        muted = !muted;
        save();

        if (master) {
            master.gain.value = muted ? 0 : 1;
        }

        return muted;
    },

    get muted() {
        return muted;
    },

    init() {
        ensureContext();
    }
};