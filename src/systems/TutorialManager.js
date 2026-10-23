import { Lang } from './Texts';
import { Audio } from './Audio';

const DONE_KEY = 'fastMoveTutorialDone';
const OFF_KEY = 'fastMoveTutorialOff';
const PRACTICE_KEY = 'fastMoveTutorialPractice';

// Cada paso se completa al HACER la mecánica (no al leer): `detect` recibe el
// manager y devuelve true cuando el jugador la usó. Los eventos se anotan en
// `flags` y se consumen al evaluar el paso actual.
const STEPS = [
    { id: 'move', text: 'tutMove', detect: (t) => t.holdFor('move', Math.abs(t.player.body.velocity.x) > 80, 400) },
    { id: 'jump', text: 'tutJump', detect: (t) => t.consume('jump') },
    { id: 'grab', text: 'tutGrab', detect: (t) => t.holdFor('grab', t.player.wallGrabbing, 150) },
    { id: 'wallJump', text: 'tutWallJump', detect: (t) => t.consume('wallJump') },
    { id: 'dash', text: 'tutDash', detect: (t) => t.consume('dash') }
];

function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function save(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Sin almacenamiento: el progreso vale solo para esta sesión.
    }
}

export const Tutorial = {
    isOff: () => load(OFF_KEY, false) === true,
    setOff: (off) => save(OFF_KEY, off),
    // Micro-práctica por mecánica: se ofrece una sola vez (hecha o salteada).
    wantsPractice: (mech) => !Tutorial.isOff() && !load(PRACTICE_KEY, []).includes(mech),
    markPractice: (mech) => save(PRACTICE_KEY, [...new Set([...load(PRACTICE_KEY, []), mech])]),
    reset: () => { save(DONE_KEY, []); save(PRACTICE_KEY, []); save(OFF_KEY, false); }
};

// Coach al fallar: cuenta las derrotas seguidas por causa (vive mientras dure la
// pestaña, no se guarda) y, al repetirse una dos veces, sugiere qué hacer en el
// siguiente intento. Se reinicia al superar un nivel.
const COACH_HINTS = { hazard: 'coachHazard', projectile: 'coachProjectile', timeout: 'coachTime' };
const coachState = { counts: {}, shownAt: {} };

export const Coach = {
    record(cause) {
        coachState.counts[cause] = (coachState.counts[cause] ?? 0) + 1;
    },
    reset() {
        coachState.counts = {};
        coachState.shownAt = {};
    },
    // Devuelve la clave del hint pendiente (una vez por cada 2 derrotas de la misma causa).
    take() {
        if (Tutorial.isOff()) {
            return null;
        }

        for (const [cause, n] of Object.entries(coachState.counts)) {
            if (n >= 2 && n % 2 === 0 && coachState.shownAt[cause] !== n) {
                coachState.shownAt[cause] = n;
                return COACH_HINTS[cause];
            }
        }

        return null;
    }
};

// Hints que se ganan: muestran solo el paso actual y desaparecen al usarlo.
// Se activa en el nivel 1; los pasos ya hechos en partidas anteriores no se repiten.
export class TutorialManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.flags = {};
        this.held = {};
        this.done = new Set(load(DONE_KEY, []));
        this.queue = STEPS.filter((s) => !this.done.has(s.id));
        this.active = this.queue.length > 0 && !Tutorial.isOff();
        this.advancing = false;

        if (!this.active) {
            return;
        }

        this.box = scene.add.graphics().setScrollFactor(0).setDepth(50);
        this.label = scene.add.text(512, 150, '', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#ffffff',
            stroke: '#000000', strokeThickness: 5, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
        this.sub = scene.add.text(512, 184, '', {
            fontFamily: 'Arial', fontSize: '14px', color: '#9aa4c7'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

        const mark = (name) => () => { this.flags[name] = true; };
        this.onJump = (kind) => { this.flags[kind === 'wall' ? 'wallJump' : 'jump'] = true; };
        this.onDash = mark('dash');
        scene.events.on('player-jump', this.onJump);
        scene.events.on('player-dash', this.onDash);

        this.skipKey = scene.input.keyboard.addKey('T');
        this.skipKey.on('down', () => this.skip());
        scene.events.once('shutdown', () => this.destroy());

        this.render();
    }

    // La condición puede parpadear de a un frame (el wall grab alterna on/off al
    // estar pegado a la pared): se tolera un hueco corto antes de cortar la cuenta.
    holdFor(name, condition, ms, graceMs = 120) {
        const now = this.scene.time.now;

        if (condition) {
            this.held[name] = { since: this.held[name]?.since ?? now, last: now };
        } else if (this.held[name] && now - this.held[name].last > graceMs) {
            this.held[name] = null;
        }

        return Boolean(this.held[name]) && now - this.held[name].since >= ms;
    }

    consume(name) {
        const hit = this.flags[name] === true;
        this.flags[name] = false;
        return hit;
    }

    update() {
        if (!this.active || this.advancing || this.queue.length === 0) {
            return;
        }

        if (this.queue[0].detect(this)) {
            this.complete();
        }
    }

    complete() {
        const step = this.queue.shift();
        this.done.add(step.id);
        save(DONE_KEY, [...this.done]);
        this.advancing = true;
        Audio.play('point', { combo: 3 });
        this.label.setText('✔ ' + Lang.t('tutOk')).setColor('#66ff88');
        this.flags = {};
        this.held = {};

        this.scene.time.delayedCall(700, () => {
            this.advancing = false;
            if (this.queue.length === 0) {
                this.finish();
            } else {
                this.render();
            }
        });
    }

    finish() {
        this.active = false;
        this.scene.floatingText.showBanner(512, 150, Lang.t('tutDone'), '#66ff88', 26);
        this.hide();
    }

    skip() {
        if (!this.active) {
            return;
        }

        Tutorial.setOff(true);
        this.active = false;
        this.hide();
    }

    render() {
        const step = this.queue[0];
        const n = STEPS.length - this.queue.length + 1;

        this.label.setText(Lang.t(step.text)).setColor('#ffffff');
        this.sub.setText(`${n}/${STEPS.length}  ·  ${Lang.t('tutSkip')}`);

        const w = Math.max(this.label.width + 56, 320);
        this.box.clear()
            .fillStyle(0x141026, 0.82).fillRoundedRect(512 - w / 2, 126, w, 80, 14)
            .lineStyle(2, 0x00d1b2, 0.9).strokeRoundedRect(512 - w / 2, 126, w, 80, 14);
    }

    hide() {
        this.box.destroy();
        this.label.destroy();
        this.sub.destroy();
    }

    destroy() {
        this.scene.events.off('player-jump', this.onJump);
        this.scene.events.off('player-dash', this.onDash);
        this.active = false;
    }
}
