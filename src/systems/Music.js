import { FEEL } from '../assets/feel.js';
import { bus, ensureContext, noise, resetMusicFilter, sweepMusicFilter, tone } from './AudioBus';

// Música procedural por capas (docs/PLAN_FEEL.md §8.3): synthwave oscuro en menor,
// generado en tiempo real con el reloj de WebAudio. Un scheduler con lookahead (un
// temporizador que solo despierta cada 25 ms; el tiempo exacto sale del reloj de audio)
// agenda 16 pasos por compás. Las capas entran y salen con el combo, la tensión y el
// reloj; el tempo sube con la tensión. Cada nivel tiene su tonalidad y progresión.
const LAYERS = ['base', 'rhythm', 'arp', 'lead', 'pressure'];
const LOOKAHEAD = 0.14;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const lerp = (a, b, k) => a + (b - a) * k;

// tonic: nota MIDI de la tónica; prog: desplazamientos de la fundamental por compás.
const TRACKS = {
    menu: { tonic: 57, bpm: [92, 92], prog: [0, 8, 3, 7], calm: true },
    level0: { tonic: 57, bpm: [108, 124], prog: [0, 8, 3, 10], calm: false }, // La menor
    level1: { tonic: 62, bpm: [120, 138], prog: [0, 5, 8, 7], calm: false } // Re menor
};

const BASS = [0, 0, 12, 0, 0, 12, 7, 0];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 2, 1];
const CHORD = [0, 3, 7, 12];
const LEAD_STEPS = [0, 3, 6, 8, 10, 13];
const LEAD_MOTIFS = [[12, 15, 19, 24, 19, 15], [12, 12, 15, 17, 19, 15], [12, 19, 24, 22, 19, 17], [15, 19, 22, 24, 22, 19]];

let current = null;

function stepDuration(track) {
    const [lo, hi] = track.def.bpm;
    const bpm = lerp(lo, hi, Math.min(Math.max(track.tension, 0), 1)) * (track.pressure ? 1.06 : 1);

    return 60 / bpm / 4;
}

// Qué capas suenan según el estado. En el menú solo la base, más tenue.
function applyLayers(track) {
    const { def, tension, mult, frenzy, pressure } = track;
    const calm = def.calm;

    track.on = {
        base: true,
        rhythm: !calm && (tension > 0.25 || mult >= 2),
        arp: !calm && mult >= 3,
        lead: !calm && frenzy,
        pressure: !calm && pressure
    };

    const ctx = bus.context;

    if (!ctx) {
        return;
    }

    for (const name of LAYERS) {
        const target = track.on[name] ? (name === 'base' && calm ? 0.55 : 1) : 0;

        track.layers[name].gain.setTargetAtTime(target, ctx.currentTime, 0.3);
    }
}

// Agenda las notas del paso `step` del compás `bar` a la hora de audio `t`.
function scheduleStep(track, t) {
    const ctx = bus.context;
    const { def, step, bar, on, tension } = track;
    const sd = stepDuration(track);
    const delay = Math.max(t - ctx.currentTime, 0);
    const root = def.tonic + def.prog[bar % 4];
    const dest = (name) => track.layers[name];

    // Base: pad al inicio del compás y bajo en corcheas (negras en el menú).
    if (step === 0) {
        for (const off of [0, 3, 7]) {
            tone({ freq: midi(root + 12 + off), type: 'sawtooth', duration: sd * 15.5, volume: 0.035, delay, attack: sd * 5, filter: { type: 'lowpass', freq: 1100, q: 0.7 }, dest: dest('base') });
        }
        tone({ freq: midi(root - 12), type: 'triangle', duration: sd * 15.5, volume: 0.06, delay, attack: sd * 3, dest: dest('base') });
    }

    const bassStep = def.calm ? step % 8 === 0 : step % 2 === 0;

    if (bassStep) {
        const note = root - 12 + (def.calm ? 0 : BASS[(step / 2) % 8]);

        tone({ freq: midi(note), type: 'sawtooth', duration: sd * 1.8, volume: 0.1, delay, filter: { type: 'lowpass', freq: 520, q: 1.5 }, dest: dest('base') });
        tone({ freq: midi(note - 12), type: 'sine', duration: sd * 1.8, volume: 0.14, delay, dest: dest('base') });
    }

    // Ritmo: bombo en negras, hi-hat a contratiempo, caja con tensión alta.
    if (on.rhythm) {
        if (step % 4 === 0) {
            tone({ freq: 160, endFreq: 42, type: 'sine', duration: 0.2, volume: 0.55, delay, dest: dest('rhythm') });
        }
        if (step % 4 === 2) {
            noise({ duration: 0.045, volume: 0.09, delay, filter: { type: 'highpass', freq: 7000 }, dest: dest('rhythm') });
        } else if (tension > 0.7 && step % 2 === 1) {
            noise({ duration: 0.03, volume: 0.04, delay, filter: { type: 'highpass', freq: 8000 }, dest: dest('rhythm') });
        }
        if (tension > 0.6 && (step === 4 || step === 12)) {
            noise({ duration: 0.13, volume: 0.17, delay, filter: { type: 'bandpass', freq: 1800 }, dest: dest('rhythm') });
            tone({ freq: 190, endFreq: 120, type: 'triangle', duration: 0.09, volume: 0.1, delay, dest: dest('rhythm') });
        }
    }

    // Arpegio en semicorcheas sobre el acorde del compás.
    if (on.arp) {
        tone({ freq: midi(root + 12 + CHORD[ARP[step] % 4]), type: 'sawtooth', duration: sd * 1.4, volume: 0.05, delay, wet: 0.15, filter: { type: 'lowpass', freq: 2400, endFreq: 700, q: 2 }, dest: dest('arp') });
    }

    // Melodía brillante del frenesí.
    if (on.lead) {
        const idx = LEAD_STEPS.indexOf(step);

        if (idx >= 0) {
            const note = root + LEAD_MOTIFS[bar % 4][idx];

            tone({ freq: midi(note), type: 'square', duration: sd * 2.2, volume: 0.06, delay, wet: 0.3, filter: { type: 'lowpass', freq: 4200 }, dest: dest('lead') });
            tone({ freq: midi(note) * 1.004, type: 'sawtooth', duration: sd * 2.2, volume: 0.035, delay, wet: 0.3, dest: dest('lead') });
        }
    }

    // Presión de los últimos segundos: pulso y riser de ruido por compás.
    if (on.pressure) {
        if (step % 2 === 0) {
            tone({ freq: midi(root + 24), type: 'sine', duration: 0.07, volume: 0.07, delay, dest: dest('pressure') });
        }
        if (step === 0) {
            noise({ duration: sd * 16, volume: 0.07, delay, attack: sd * 14, filter: { type: 'highpass', freq: 500, endFreq: 6000 }, dest: dest('pressure') });
        }
    }
}

function tick(track) {
    const ctx = bus.context;

    if (!ctx || track.retired) {
        return;
    }

    // Sin gesto del usuario el contexto sigue suspendido: no se agenda nada.
    if (ctx.state !== 'running') {
        track.nextTime = ctx.currentTime + 0.05;
        return;
    }

    if (track.nextTime < ctx.currentTime - 0.1) {
        track.nextTime = ctx.currentTime + 0.05;
    }

    while (track.nextTime < ctx.currentTime + LOOKAHEAD) {
        scheduleStep(track, track.nextTime);
        track.nextTime += stepDuration(track);
        track.step += 1;

        if (track.step === 16) {
            track.step = 0;
            track.bar += 1;
        }
    }
}

function build(key) {
    const ctx = ensureContext();
    const def = TRACKS[key];

    if (!ctx || !def) {
        return null;
    }

    const trackGain = ctx.createGain();

    trackGain.gain.setValueAtTime(0, ctx.currentTime);
    trackGain.gain.linearRampToValueAtTime(FEEL.music.volume, ctx.currentTime + FEEL.music.fadeInMs / 1000);
    trackGain.connect(bus.musicBus);

    const layers = {};

    for (const name of LAYERS) {
        layers[name] = ctx.createGain();
        layers[name].gain.value = 0;
        layers[name].connect(trackGain);
    }

    const track = {
        key, def, trackGain, layers, on: {},
        step: 0, bar: 0, nextTime: ctx.currentTime + 0.08,
        tension: 0, mult: 1, frenzy: false, pressure: false, retired: false, timer: null
    };

    track.timer = setInterval(() => tick(track), 25);
    applyLayers(track);

    return track;
}

// Apaga una pista con fundido y libera sus nodos y su temporizador.
function retire(track, ms) {
    const ctx = bus.context;

    track.retired = true;

    if (ctx) {
        track.trackGain.gain.cancelScheduledValues(ctx.currentTime);
        track.trackGain.gain.setValueAtTime(track.trackGain.gain.value, ctx.currentTime);
        track.trackGain.gain.linearRampToValueAtTime(0, ctx.currentTime + ms / 1000);
    }

    setTimeout(() => {
        clearInterval(track.timer);
        track.trackGain.disconnect();
    }, ms + 200);
}

export const Music = {
    // Empieza (o cambia a) una pista; si ya suena esa misma, sigue sin cortes.
    play(key) {
        if (current && current.key === key && !current.retired) {
            return;
        }

        if (current) {
            retire(current, FEEL.music.fadeOutMs);
        }

        resetMusicFilter();
        current = build(key);
    },

    stop(ms = FEEL.music.fadeOutMs) {
        if (current) {
            retire(current, ms);
            current = null;
        }
    },

    // Golpe de muerte: el filtro cierra el mundo y la música se apaga.
    die() {
        if (current) {
            sweepMusicFilter(220, FEEL.music.dieMs * 0.65);
            retire(current, FEEL.music.dieMs);
            current = null;
        }
    },

    // Vuelve al estado inicial (nivel nuevo o reintento): sin combo, frenesí ni presión.
    reset() {
        if (current) {
            Object.assign(current, { tension: 0, mult: 1, frenzy: false, pressure: false });
            applyLayers(current);
        }
    },

    setTension(value) {
        if (current) {
            current.tension = value;
            applyLayers(current);
        }
    },

    setCombo(mult) {
        if (current && current.mult !== mult) {
            current.mult = mult;
            applyLayers(current);
        }
    },

    setFrenzy(on) {
        if (current && current.frenzy !== on) {
            current.frenzy = on;
            applyLayers(current);
        }
    },

    setPressure(on) {
        if (current && current.pressure !== on) {
            current.pressure = on;
            applyLayers(current);
        }
    },

    // Para el overlay de debug.
    get status() {
        if (!current) {
            return 'sin música';
        }

        const bpm = Math.round(60 / stepDuration(current) / 4);
        const layers = LAYERS.filter((name) => current.on[name]).join('+');

        return `${current.key} · ${bpm} bpm · compás ${current.bar} · ${layers}`;
    }
};
