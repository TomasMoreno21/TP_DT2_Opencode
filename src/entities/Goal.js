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
        this.isOpen = false;
        this.pulse = null;

        this.frame = scene.add.rectangle(x, y, GOAL_CONFIG.width, GOAL_CONFIG.height,
            GOAL_CONFIG.lockedColor, GOAL_CONFIG.lockedAlpha);
        this.frame.setStrokeStyle(3, 0x9a94c8);

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

        this.pulse = this.scene.tweens.add({
            targets: [this.frame, this.label],
            alpha: GOAL_CONFIG.pulseMinAlpha,
            duration: GOAL_CONFIG.pulseDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}
