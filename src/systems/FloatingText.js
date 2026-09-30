export class FloatingText {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
    }

    show(x, y, text, color = '#ffdd44', fontSize = 20) {
        const label = this.acquire();
        this.animate(label, { x, y, text, color, fontSize, duration: 700, rise: 60 });
    }

    // Aviso que se mantiene en pantalla (nombre del nivel, salida abierta, etc).
    showBanner(x, y, text, color = '#ffffff', fontSize = 32, holdMs = 1100) {
        const label = this.acquire();
        this.animate(label, { x, y, text, color, fontSize, duration: 700 + holdMs, rise: 0 });
    }

    acquire() {
        if (this.pool.length > 0) {
            const label = this.pool.pop();
            return label.setVisible(true).setActive(true);
        }

        return this.scene.add.text(0, 0, '', {
            fontFamily: 'Arial Black', fontSize: '20px', color: '#ffdd44',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
    }

    animate(label, { x, y, text, color, fontSize, duration, rise }) {
        label.setText(text);
        label.setColor(color);
        label.setFontSize(`${fontSize}px`);
        label.setPosition(x, y);
        label.setAlpha(1);
        label.setScale(rise > 0 ? 0.5 : 0.8);

        this.scene.tweens.add({
            targets: label,
            y: y - rise,
            scale: 1,
            alpha: 0,
            duration,
            ease: 'Quad.easeOut',
            onComplete: () => {
                label.setVisible(false).setActive(false);
                this.pool.push(label);
            }
        });
    }
}