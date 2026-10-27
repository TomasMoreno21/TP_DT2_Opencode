import { WORLD } from '../assets/levels';
import { Lang } from './Texts';
import { Audio } from './Audio';

const DONE_KEY = 'fastMoveTutorialDone';
const OFF_KEY = 'fastMoveTutorialOff';
const PRACTICE_KEY = 'fastMoveTutorialPractice';

// Cada paso se completa al HACER la mecánica (no al leer): `detect` recibe el
// manager y devuelve true cuando el jugador la usó. Los eventos se anotan en
// `flags` y se consumen al evaluar el paso actual.
// `keys` son grupos de teclas alternativas que se dibujan como teclas en el panel.
const STEPS = [
    { id: 'move', text: 'tutMove', keys: [['A', 'D'], ['←', '→']], detect: (t) => t.holdFor('move', Math.abs(t.player.body.velocity.x) > 80, 400) },
    { id: 'jump', text: 'tutJump', keys: [['ESPACIO'], ['W'], ['↑']], detect: (t) => t.consume('jump') },
    { id: 'grab', text: 'tutGrab', keys: [['←', '→']], detect: (t) => t.holdFor('grab', t.player.wallGrabbing, 150) },
    { id: 'wallJump', text: 'tutWallJump', keys: [['ESPACIO']], detect: (t) => t.consume('wallJump') },
    { id: 'dash', text: 'tutDash', keys: [['SHIFT']], detect: (t) => t.consume('dash') }
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
// El panel vive en la franja del piso (y 712-768): ahi nunca hay juego, asi no
// tapa plataformas, puntos ni el titulo del nivel.
const PANEL_Y = 740;
const PANEL_W = 680;
const PANEL_H = 46;
const TEAL = 0x00d1b2;
const GREEN = 0x66ff88;

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

        // Entra deslizandose desde abajo.
        this.root = scene.add.container((WORLD.width / 2), PANEL_Y + 70).setScrollFactor(0).setDepth(50);
        this.bg = scene.add.graphics().setScrollFactor(0);
        this.dots = scene.add.graphics().setScrollFactor(0);
        this.content = scene.add.container(0, 0).setScrollFactor(0);
        this.skipText = scene.add.text(PANEL_W / 2 - 18, 0, Lang.t('tutSkip'), {
            fontFamily: 'Arial', fontSize: '13px', color: '#9aa4c7'
        }).setOrigin(1, 0.5).setScrollFactor(0);
        this.root.add([this.bg, this.dots, this.content, this.skipText]);
        scene.tweens.add({ targets: this.root, y: PANEL_Y, duration: 420, ease: 'Back.easeOut' });

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
        this.flags = {};
        this.held = {};

        // Confirmacion: borde verde, texto de logro y un pequeno golpe de escala.
        this.drawBg(GREEN);
        this.drawDots();
        this.content.removeAll(true);
        this.content.setScale(1);
        this.content.x = 0;
        this.content.add(this.scene.add.text(0, 0, '✔ ' + Lang.t('tutOk'), this.labelStyle('#66ff88')).setOrigin(0.5).setScrollFactor(0));
        this.scene.tweens.add({ targets: this.root, scale: 1.05, duration: 140, yoyo: true, ease: 'Sine.easeOut' });

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
        this.scene.floatingText.showBanner((WORLD.width / 2), 200, Lang.t('tutDone'), '#66ff88', 26);
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

    labelStyle(color) {
        return { fontFamily: 'Arial Black', fontSize: '19px', color, stroke: '#000000', strokeThickness: 4 };
    }

    drawBg(border) {
        this.bg.clear()
            .fillStyle(0x141026, 0.9).fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 12)
            .lineStyle(2, border, 0.95).strokeRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, 12);
    }

    // Un punto por paso: hecho (lleno), actual (blanco con aro) y pendiente (tenue).
    drawDots() {
        const current = STEPS.length - this.queue.length;
        this.dots.clear();
        STEPS.forEach((step, i) => {
            const x = -PANEL_W / 2 + 26 + i * 16;
            if (i < current) {
                this.dots.fillStyle(TEAL, 1).fillCircle(x, 0, 5);
            } else if (i === current && this.queue.length > 0) {
                this.dots.fillStyle(0xffffff, 1).fillCircle(x, 0, 5).lineStyle(2, TEAL, 1).strokeCircle(x, 0, 8);
            } else {
                this.dots.lineStyle(2, 0x4a4a7a, 1).strokeCircle(x, 0, 5);
            }
        });
    }

    // Tecla dibujada (cara + sombra): devuelve su ancho para encadenar la fila.
    addKeycap(g, x, text) {
        const label = this.scene.add.text(0, 0, text, { fontFamily: 'Arial Black', fontSize: '15px', color: '#e8ecff' })
            .setOrigin(0.5).setScrollFactor(0);
        const w = Math.max(30, label.width + 18);
        g.fillStyle(0x1d2147, 1).fillRoundedRect(x, -13, w, 28, 6);
        g.fillStyle(0x363d78, 1).fillRoundedRect(x, -14, w, 25, 6);
        g.lineStyle(2, 0x8a96e6, 1).strokeRoundedRect(x, -14, w, 25, 6);
        label.setPosition(x + w / 2, -2);
        this.content.add(label);
        return w;
    }

    // Fila centrada en la zona libre entre los puntos y el aviso de salteo:
    // teclas (alternativas separadas por "o") y el nombre de la accion.
    render() {
        const step = this.queue[0];
        this.drawBg(TEAL);
        this.drawDots();
        this.content.removeAll(true);

        const g = this.scene.add.graphics().setScrollFactor(0);
        this.content.add(g);
        let x = 0;

        step.keys.forEach((group, gi) => {
            if (gi > 0) {
                const or = this.scene.add.text(x + 10, 0, Lang.t('tutOr'), { fontFamily: 'Arial', fontSize: '14px', color: '#9aa4c7' })
                    .setOrigin(0.5).setScrollFactor(0);
                this.content.add(or);
                x += 24;
            }
            group.forEach((key, ki) => {
                x += this.addKeycap(g, x, key) + (ki < group.length - 1 ? 6 : 0);
            });
        });

        x += 20;
        const label = this.scene.add.text(x, 0, Lang.t(step.text), this.labelStyle('#ffffff')).setOrigin(0, 0.5).setScrollFactor(0);
        this.content.add(label);

        // Centrado en el espacio entre los puntos (izq.) y "T = saltar" (der.).
        // Si una traduccion lo hace mas ancho que el hueco (~440 px), se achica.
        const total = x + label.width;
        const fit = Math.min(1, 440 / total);
        this.content.setScale(fit);
        this.content.x = -12 - (total * fit) / 2;
    }

    hide() {
        if (!this.root) {
            return;
        }

        const root = this.root;
        this.root = null;
        this.scene.tweens.add({
            targets: root, y: PANEL_Y + 70, alpha: 0, duration: 300, ease: 'Sine.easeIn',
            onComplete: () => root.destroy()
        });
    }

    destroy() {
        this.scene.events.off('player-jump', this.onJump);
        this.scene.events.off('player-dash', this.onDash);
        this.active = false;
    }
}
