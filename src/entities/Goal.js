export const GOAL_CONFIG = {
    width: 76,
    height: 72,
    lockedColor: 0x4a4270,
    lockedAlpha: 0.45,
    lockedLabel: 'SALIDA',
    lockedLabelColor: '#c9c4e8',
    openColor: 0x00ff88,
    openAlpha: 0.85,
    openLabel: 'SALIENDO',
    openLabelColor: '#00382c',
    pulseMinAlpha: 0.5,
    pulseDuration: 380
};

// Salida del nivel: permanece cerrada hasta que se cumple la quota de puntos.
export class Goal {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.isOpen = false;
        this.pulse = null;

        this.frame = scene.add.rectangle(x, y, GOAL_CONFIG.width, GOAL_CONFIG.height,
            GOAL_CONFIG.lockedColor, GOAL_CONFIG.lockedAlpha);
        this.frame.setStrokeStyle(3, 0x9a94c8);

        // Anillo exterior que rota lento: marca la salida sin assets.
        this.orbit = scene.add.ellipse(x, y, GOAL_CONFIG.width + 24, GOAL_CONFIG.height + 24);
        this.orbit.setStrokeStyle(3, 0x9a94c8, 0.55);
        this.spin = scene.tweens.add({
            targets: this.orbit,
            angle: 360,
            duration: 5000,
            repeat: -1,
            ease: 'Linear'
        });

        this.label = scene.add.text(x, y, GOAL_CONFIG.lockedLabel, {
            fontFamily: 'Arial Black', fontSize: 14, color: GOAL_CONFIG.lockedLabelColor
        }).setOrigin(0.5);

        // Cuerpo estatico: se usa solo para detectar el overlap con el jugador.
        scene.physics.add.existing(this.frame, true);
    }

    open() {
        if (this.isOpen) {
            return;
        }

        this.isOpen = true;

        this.frame.setFillStyle(GOAL_CONFIG.openColor, GOAL_CONFIG.openAlpha);
        this.frame.setStrokeStyle(4, 0xffffff);
        this.label.setColor(GOAL_CONFIG.openLabelColor).setText(GOAL_CONFIG.openLabel);
        this.orbit.setStrokeStyle(4, GOAL_CONFIG.openColor, 0.9);
        this.spin.timeScale = 3;

        // Onda expansiva al abrirse.
        const wave = this.scene.add.ellipse(this.x, this.y, GOAL_CONFIG.width, GOAL_CONFIG.height);
        wave.setStrokeStyle(5, 0xffffff, 0.9);
        this.scene.tweens.add({
            targets: wave,
            scaleX: 2.6,
            scaleY: 2.6,
            alpha: 0,
            duration: 550,
            ease: 'Quad.easeOut',
            onComplete: () => wave.destroy()
        });

        this.pulse = this.scene.tweens.add({
            targets: [this.frame, this.label],
            alpha: GOAL_CONFIG.pulseMinAlpha,
            duration: GOAL_CONFIG.pulseDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // El pulso tiene repeat:-1: hay que detenerlo explicitamente al reiniciar el
    // nivel o seguiria pulsando sobre objetos ya destruidos.
    stopPulse() {
        if (this.pulse) {
            this.pulse.stop();
            this.pulse.remove();
            this.pulse = null;
        }

        if (this.spin) {
            this.spin.stop();
            this.spin.remove();
            this.spin = null;
        }
    }

    destroy() {
        this.stopPulse();
        this.frame.destroy();
        this.orbit.destroy();
        this.label.destroy();
    }
}
