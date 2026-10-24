// Bus de audio (docs/PLAN_FEEL.md §8.1). Todo el sonido del juego pasa por acá:
//
//   fuentes ─► master ─► compresor ─► salida
//   música  ─► musicBus ─► master          (J5; el ducking baja solo la música)
//   fuentes con `wet` ─► reverb ─► master
//
// Ofrece tonos y ruido con filtros y envolvente, panorama estéreo, reverb corta, ducking
// de la música y un límite de voces con prioridades para que, en pleno frenesí, no se
// acumulen decenas de osciladores. Sin assets: todo se sintetiza.
const MUTE_KEY = 'fast-move-muted';
const MAX_VOICES = 24;

let context = null;
let master = null;
let compressor = null;
let musicBus = null;
let reverb = null;
let reverbSend = null;
let noiseBuffer = null;
let muted = load();
let voices = 0;

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

// Respuesta al impulso sintética (ruido que decae): una sala chica, no una catedral.
function makeImpulse(ctx, seconds = 1.1, decay = 2.6) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let c = 0; c < 2; c++) {
        const data = impulse.getChannelData(c);

        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
    }

    return impulse;
}

function makeNoise(ctx) {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    return buffer;
}

export function ensureContext() {
    if (!context) {
        const Ctx = window.AudioContext || window.webkitAudioContext;

        if (!Ctx) {
            return null;
        }

        context = new Ctx();

        master = context.createGain();
        master.gain.value = muted ? 0 : 1;

        compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.2;

        musicBus = context.createGain();
        musicBus.gain.value = 1;

        reverb = context.createConvolver();
        reverb.buffer = makeImpulse(context);
        reverbSend = context.createGain();
        reverbSend.gain.value = 0.5;

        master.connect(compressor);
        compressor.connect(context.destination);
        musicBus.connect(master);
        reverbSend.connect(reverb);
        reverb.connect(master);

        noiseBuffer = makeNoise(context);
    }

    if (context.state === 'suspended') {
        context.resume();
    }

    return context;
}

// Reserva una voz. Con el límite lleno solo entran las de prioridad alta (≥ 2:
// golpes, hitos, muerte); las demás se descartan sin ruido.
function claim(priority) {
    if (voices >= MAX_VOICES && priority < 2) {
        return false;
    }

    voices += 1;

    return true;
}

// Cadena común: gain con envolvente → [filtro] → [pan] → master (y envío a reverb).
function chain(ctx, source, { start, duration, volume, attack = 0.008, filter = null, pan = 0, wet = 0, priority = 1 }) {
    const gain = ctx.createGain();

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    let node = source;

    if (filter) {
        const biquad = ctx.createBiquadFilter();

        biquad.type = filter.type ?? 'lowpass';
        biquad.frequency.setValueAtTime(Math.max(filter.freq, 20), start);
        biquad.Q.value = filter.q ?? 1;

        if (filter.endFreq) {
            biquad.frequency.exponentialRampToValueAtTime(Math.max(filter.endFreq, 20), start + duration);
        }

        node.connect(biquad);
        node = biquad;
    }

    node.connect(gain);
    let out = gain;

    if (pan) {
        const panner = ctx.createStereoPanner();

        panner.pan.value = Math.max(-1, Math.min(1, pan));
        out.connect(panner);
        out = panner;
    }

    out.connect(master);

    if (wet > 0) {
        const send = ctx.createGain();

        send.gain.value = wet;
        out.connect(send);
        send.connect(reverbSend);
    }

    source.onended = () => {
        voices -= 1;
    };
}

// Tono con envolvente. freq→endFreq por rampa exponencial. `filter`: { type, freq, endFreq, q }.
export function tone({ freq = 440, endFreq = null, type = 'square', duration = 0.12, volume = 0.25, delay = 0, attack, filter, pan, wet, priority = 1 }) {
    if (muted) {
        return;
    }

    const ctx = ensureContext();

    if (!ctx || !claim(priority)) {
        return;
    }

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(freq, 1), start);

    if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), start + duration);
    }

    chain(ctx, osc, { start, duration, volume, attack, filter, pan, wet, priority });
    osc.start(start);
    osc.stop(start + duration + 0.02);
}

// Ráfaga de ruido blanco con filtro (whoosh, polvo, impacto, fricción).
export function noise({ duration = 0.12, volume = 0.2, delay = 0, attack, filter, pan, wet, priority = 1 }) {
    if (muted) {
        return;
    }

    const ctx = ensureContext();

    if (!ctx || !claim(priority)) {
        return;
    }

    const start = ctx.currentTime + delay;
    const src = ctx.createBufferSource();

    src.buffer = noiseBuffer;
    src.loop = true;

    chain(ctx, src, { start, duration, volume, attack, filter, pan, wet, priority });
    src.start(start, Math.random() * 1.5);
    src.stop(start + duration + 0.02);
}

// Baja la música (musicBus) un instante: la usan los eventos grandes para que se oigan.
export function duck(amount = 0.45, ms = 160) {
    if (!context || !musicBus) {
        return;
    }

    const now = context.currentTime;

    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(musicBus.gain.value, now);
    musicBus.gain.linearRampToValueAtTime(amount, now + 0.02);
    musicBus.gain.linearRampToValueAtTime(1, now + ms / 1000 + 0.02);
}

export function toggleMute() {
    muted = !muted;
    save();

    if (master) {
        master.gain.value = muted ? 0 : 1;
    }

    return muted;
}

export const bus = {
    get muted() {
        return muted;
    },
    get voices() {
        return voices;
    },
    get context() {
        return context;
    },
    get master() {
        return master;
    },
    get musicBus() {
        return musicBus;
    },
    get maxVoices() {
        return MAX_VOICES;
    }
};
