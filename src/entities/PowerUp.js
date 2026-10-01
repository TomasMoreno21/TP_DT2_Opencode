export const POWERUP_CONFIG = {
    radius: 12,
    color: 0x2dd4ff,
    glowColor: 0x88eeff,
    bobHeight: 6,
    bobDuration: 900,
    respawnMs: 9000
};

// Power-up de escudo: otorga un escudo temporal al jugador.
// Es re-obtenible: reaparece en su posición tras respawnMs.
export class PowerUp {
    constructor(scene, data) {
        this.scene = scene;
        this.x = data.x;
        this.y = data.y;
        this.respawnMs = data.respawnMs ?? POWERUP_CONFIG.respawnMs;
        this.baseY = this.y;

        this.circle = scene.add.circle(this.x, this.y, POWERUP_CONFIG.radius, POWERUP_CONFIG.color);
        this.circle.setStrokeStyle(2, POWERUP_CONFIG.glowColor);
        this.ring = scene.add.circle(this.x, this.y, POWERUP_CONFIG.radius + 7, 0x2dd4ff, 0.15);

        scene.physics.add.existing(this.circle);
        this.body = this.circle.body;
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);

        this.available = true;
        this.respawnTimer = null;

        // Solo se anima la capa visual: el circulo con cuerpo fisico mantiene su
        // posicion fija para no pelearse con el motor y provocar vibracion.
        this.bobTween = scene.tweens.add({
            targets: this.ring,
            y: this.baseY + POWERUP_CONFIG.bobHeight,
            duration: POWERUP_CONFIG.bobDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.pulseTween = scene.tweens.add({
            targets: this.ring,
            scale: 1.25,
            alpha: 0.4,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Detiene los bucles de animación: si no, los tween con repeat:-1 siguen
    // escribiendo sobre objetos invisibles durante todo el resto del nivel.
    stopIdleTweens() {
        for (const tween of [this.bobTween, this.pulseTween]) {
            if (tween) {
                tween.stop();
                tween.remove();
            }
        }

        this.bobTween = null;
        this.pulseTween = null;
    }

    collect() {
        if (!this.available) {
            return false;
        }

        this.available = false;
        this.stopIdleTweens();
        this.circle.setVisible(false);
        this.circle.setActive(false);
        this.body.enable = false;
        this.ring.setVisible(false);

        this.respawnTimer = this.scene.time.delayedCall(this.respawnMs, () => this.respawn());
        return true;
    }

    respawn() {
        this.respawnTimer = null;

        if (this.scene.sys.isActive() === false) {
            return;
        }

        this.available = true;
        this.circle.setVisible(true);
        this.circle.setActive(true);
        this.circle.setScale(0);
        this.body.enable = true;
        this.ring.setVisible(true);

        // Cancelar cualquier tween anterior de entrada para que dos respawns
        // seguidos no se pisen la escala del círculo.
        if (this.respawnTween) {
            this.respawnTween.stop();
            this.respawnTween.remove();
        }

        this.respawnTween = this.scene.tweens.add({
            targets: this.circle,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    destroy() {
        this.stopIdleTweens();

        if (this.respawnTween) {
            this.respawnTween.stop();
            this.respawnTween.remove();
            this.respawnTween = null;
        }

        if (this.respawnTimer) {
            this.respawnTimer.remove(false);
            this.respawnTimer = null;
        }

        this.circle.destroy();
        this.ring.destroy();
    }
}