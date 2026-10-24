import { Audio } from './Audio';

const STYLES = {
    primary: {
        fill: 0x00d1b2, fillActive: 0x3ee8cd, border: 0xffffff, glow: 0x00d1b2,
        text: '#00382c', textActive: '#00150f', font: 38, radius: 22
    },
    secondary: {
        fill: 0x1b1836, fillActive: 0x2a2a5a, border: 0x00d1b2, glow: 0x00d1b2,
        text: '#00d1b2', textActive: '#ffffff', font: 20, radius: 14
    },
    ghost: {
        fill: 0x141026, fillActive: 0x232045, border: 0x3a3a5c, glow: 0x8888cc,
        text: '#aaaacc', textActive: '#ffffff', font: 14, radius: 10
    }
};

// Botón de menú: se dibuja con Graphics (el proyecto no usa sprites) y comparte
// estética en todo el menú. "Activo" = el mouse está encima o tiene el foco del teclado.
export class MenuButton
{
    constructor (scene, { x, y, w, h, label, style = 'secondary', delay = 0, onClick, onHover })
    {
        this.scene = scene;
        this.w = w;
        this.h = h;
        this.style = STYLES[style];
        this.onClick = onClick;
        this.active = false;
        this.pressed = false;

        this.g = scene.add.graphics();
        this.text = scene.add.text(0, 0, label, {
            fontFamily: 'Arial Black', fontSize: this.style.font, color: this.style.text
        }).setOrigin(0.5);

        // inner: escala (hover/press) y flotación; root: posición, entrada y zona de clic.
        this.inner = scene.add.container(0, 0, [this.g, this.text]);
        this.root = scene.add.container(x, y, [this.inner])
            .setSize(w, h)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0);

        this.draw();

        scene.tweens.add({ targets: this.root, alpha: 1, y, duration: 380, delay, ease: 'Cubic.easeOut' });
        this.root.y = y + 18;

        if (style === 'primary') {
            scene.tweens.add({ targets: this.text, y: -3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        this.root.on('pointerover', () => onHover?.());
        this.root.on('pointerdown', () => this.press());
        this.root.on('pointerup', () => { if (this.pressed) { this.release(); this.fire(); } });
        this.root.on('pointerout', () => this.release());
    }

    draw ()
    {
        const { w, h, style, g } = this;
        const hw = w / 2, hh = h / 2;

        g.clear();
        if (this.active) {
            g.fillStyle(style.glow, 0.18).fillRoundedRect(-hw - 8, -hh - 8, w + 16, h + 16, style.radius + 8);
            g.fillStyle(style.glow, 0.12).fillRoundedRect(-hw - 14, -hh - 14, w + 28, h + 28, style.radius + 14);
        }
        g.fillStyle(0x000000, 0.35).fillRoundedRect(-hw, -hh + 5, w, h, style.radius);
        g.fillStyle(this.active ? style.fillActive : style.fill, 1).fillRoundedRect(-hw, -hh, w, h, style.radius);
        g.fillStyle(0xffffff, this.active ? 0.14 : 0.07).fillRoundedRect(-hw + 4, -hh + 3, w - 8, h * 0.42, style.radius - 2);
        g.lineStyle(this.active ? 4 : 3, style.border, 1).strokeRoundedRect(-hw, -hh, w, h, style.radius);

        this.text.setColor(this.active ? style.textActive : style.text);
    }

    setActive (active)
    {
        if (this.active === active) {
            return;
        }

        this.active = active;
        this.draw();
        this.scaleTo(active ? 1.05 : 1);
    }

    scaleTo (scale)
    {
        this.scaleTween?.stop();
        this.scaleTween = this.scene.tweens.add({
            targets: this.inner, scale, duration: 120, ease: 'Back.easeOut'
        });
    }

    press ()
    {
        this.pressed = true;
        this.scaleTween?.stop();
        this.inner.setScale(0.94);
    }

    release ()
    {
        if (!this.pressed) {
            return;
        }

        this.pressed = false;
        this.scaleTo(this.active ? 1.05 : 1);
    }

    fire ()
    {
        Audio.play('ui');
        this.onClick?.();
    }

    setLabel (text, size)
    {
        this.text.setText(text);
        if (size) {
            this.text.setFontSize(size);
        }
    }
}
