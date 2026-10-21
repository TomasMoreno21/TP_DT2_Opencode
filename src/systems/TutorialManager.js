import { Lang } from './Texts';
import { Audio } from './Audio';

const DONE_KEY = 'fastMoveTutorialDone';
const OFF_KEY = 'fastMoveTutorialOff';

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
    reset: () => { save(DONE_KEY, []); save(OFF_KEY, false); }
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

    holdFor(name, condition, ms) {
        this.held[name] = condition ? (this.held[name] ?? this.scene.time.now) : null;
        return this.held[name] !== null && this.scene.time.now - this.held[name] >= ms;
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
