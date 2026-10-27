import { WORLD } from '../assets/levels';
import { Audio } from './Audio';
import { Lang } from './Texts';

const hex = (color) => `#${color.toString(16).padStart(6, '0')}`;

// Tarjeta de inicio de nivel con cuenta 3-2-1 y "¡YA!" (docs/PLAN_FEEL.md §10, S-1).
// Mientras `active` es true el juego está congelado y el reloj todavía no corre: Game salta
// el resto de su update y GameTimer arranca recién en su primer update, ya con el "¡YA!".
// Al reintentar el mismo nivel se muestra solo el "¡YA!" para no demorar.
export class LevelIntro {
    constructor(scene, { name, theme, short = false, tip = null, mods = null }) {
        this.scene = scene;
        this.active = true;
        this.short = short;
        this.color = hex(theme.accent);

        const mid = 330;
        const style = (size, color) => ({
            fontFamily: 'Arial Black', fontSize: size, color, stroke: '#000000', strokeThickness: 8
        });

        this.band = scene.add.rectangle((WORLD.width / 2), mid + (tip ? 16 : 0) + (mods ? 22 : 0), WORLD.width, (tip ? 182 : 150) + (mods ? 44 : 0), 0x000000, 0.55).setScrollFactor(0).setDepth(90).setAlpha(0);
        this.title = scene.add.text((WORLD.width / 2), mid - 28, Lang.t('introLevel', { n: scene.levelIndex + 1 }), style(56, this.color))
            .setOrigin(0.5).setScrollFactor(0).setDepth(91).setAlpha(0);
        this.sub = scene.add.text((WORLD.width / 2), mid + 34, String(name ?? '').toUpperCase(), style(26, '#ffffff'))
            .setOrigin(0.5).setScrollFactor(0).setDepth(91).setAlpha(0);
        // La mecánica nueva del nivel, en una línea (si la tiene).
        this.tip = tip ? scene.add.text((WORLD.width / 2), mid + 72, tip, { fontFamily: 'Arial', fontSize: 20, color: this.color, stroke: '#000000', strokeThickness: 5 })
            .setOrigin(0.5).setScrollFactor(0).setDepth(91).setAlpha(0) : null;
        // Modificadores del nivel, debajo de la tarjeta (modo modificadores).
        this.mods = mods ? scene.add.text((WORLD.width / 2), mid + (tip ? 118 : 84), mods, { fontFamily: 'Arial Black', fontSize: 22, color: '#ffdd44', stroke: '#000000', strokeThickness: 6 })
            .setOrigin(0.5).setScrollFactor(0).setDepth(91).setAlpha(0) : null;
        this.count = scene.add.text((WORLD.width / 2), mid, '', style(110, '#ffffff'))
            .setOrigin(0.5).setScrollFactor(0).setDepth(92).setAlpha(0);
    }

    // onGo: se llama en el "¡YA!", cuando el juego arranca de verdad.
    start(onGo) {
        const { scene } = this;
        const after = (ms, fn) => scene.time.delayedCall(ms, fn);
        let t = 0;

        if (!this.short) {
            // Tarjeta del nivel.
            scene.tweens.add({ targets: [this.band, this.title, this.sub, this.tip, this.mods].filter(Boolean), alpha: 1, duration: 220 });
            this.title.setScale(0.7);
            scene.tweens.add({ targets: this.title, scale: 1, duration: 320, ease: 'Back.easeOut' });
            t = 900;
            scene.tweens.add({ targets: [this.title, this.sub, this.tip, this.mods].filter(Boolean), alpha: 0, duration: 160, delay: t - 160 });

            // Cuenta 3-2-1.
            [3, 2, 1].forEach((n, i) => {
                after(t + i * 420, () => this.pop(String(n), '#ffffff', 420, () => Audio.play('count', { n })));
            });
            t += 3 * 420;
        } else {
            scene.tweens.add({ targets: this.band, alpha: 1, duration: 120 });
        }

        after(t, () => {
            this.pop(Lang.t('introGo'), this.color, 520, () => Audio.play('go'));
            this.active = false;
            onGo?.();
        });

        after(t + 520, () => this.destroy());
    }

    // Número que aparece grande y se achica; `ms` es lo que dura en pantalla.
    pop(text, color, ms, onShow) {
        const { scene } = this;

        onShow?.();
        scene.tweens.killTweensOf(this.count);
        this.count.setText(text).setColor(color).setScale(1.6).setAlpha(1);
        scene.tweens.add({ targets: this.count, scale: 1, duration: 260, ease: 'Back.easeOut' });
        scene.tweens.add({ targets: this.count, alpha: 0, duration: 140, delay: ms - 160 });
    }

    destroy() {
        this.scene.tweens.add({
            targets: this.band, alpha: 0, duration: 160,
            onComplete: () => [this.band, this.title, this.sub, this.tip, this.mods, this.count].forEach((o) => o?.destroy())
        });
    }
}
