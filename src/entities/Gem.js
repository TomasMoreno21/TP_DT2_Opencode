export const GEM_CONFIG = {
    radius: 12,
    value: 25,
    color: 0x66ff88,
    glowColor: 0xaaffbb,
    bonusSeconds: 2,
    bobHeight: 5,
    bobDuration: 800
};

// Gema (M5): vale más que un punto común, da +2 s al timer y no cuenta para la quota.
// Se distingue de los puntos por color y brillo (V4).
export class Gem {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.value = GEM_CONFIG.value;
        this.bonusSeconds = GEM_CONFIG.bonusSeconds;
        this.baseY = y;
        this.active = true;

        this.circle = scene.add.circle(this.x, this.y, GEM_CONFIG.radius, GEM_CONFIG.color);
        this.circle.setStrokeStyle(2, GEM_CONFIG.glowColor);
        this.glow = scene.add.circle(this.x, this.y, GEM_CONFIG.radius + 8, GEM_CONFIG.glowColor, 0.18);
        this.diamond = scene.add.rectangle(this.x, this.y, GEM_CONFIG.radius * 0.7, GEM_CONFIG.radius * 0.7, 0xffffff, 0.65);

        scene.physics.add.existing(this.circle);
        this.body = this.circle.body;
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);

        // Solo se animan las capas visuales: el circulo con cuerpo fisico mantiene
        // su posicion fija para no pelearse con el motor y provocar vibracion.
        this.bobTween = scene.tweens.add({
            targets: [this.glow, this.diamond],
            y: this.baseY + GEM_CONFIG.bobHeight,
            duration: GEM_CONFIG.bobDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.spinTween = scene.tweens.add({
            targets: this.diamond,
            angle: 180,
            duration: 1100,
            repeat: -1,
            ease: 'Linear'
        });

        this.pulseTween = scene.tweens.add({
            targets: this.glow,
            scale: 1.3,
            alpha: 0.3,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    get color() {
        return GEM_CONFIG.color;
    }

    // Detiene los bucles de animación: si no, los tween con repeat:-1 siguen
    // escribiendo sobre objetos invisibles durante todo el resto del nivel.
    stopTweens() {
        for (const tween of [this.bobTween, this.spinTween, this.pulseTween]) {
            if (tween) {
                tween.stop();
                tween.remove();
            }
        }

        this.bobTween = null;
        this.spinTween = null;
        this.pulseTween = null;
    }

    deactivate() {
        this.active = false;
        this.stopTweens();
        this.circle.setVisible(false);
        this.circle.setActive(false);
        this.body.enable = false;
        this.glow.setVisible(false);
        this.diamond.setVisible(false);
    }

    destroy() {
        this.stopTweens();

        this.circle.destroy();
        this.glow.destroy();
        this.diamond.destroy();
    }
}