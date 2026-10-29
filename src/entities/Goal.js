export const GOAL_CONFIG = {
    width: 76,
    height: 72,
    radius: 38,
    lockedColor: 0x9a94c8,
    lockedLabel: 'SALIDA',
    lockedLabelColor: '#c9c4e8',
    openColor: 0x00d1b2, // color por defecto (punto)
    openLabel: 'SALIENDO',
    openLabelColor: '#00ff88',
    arms: 3,
    segments: 26,
    lockedSpin: 0.7,
    openSpin: 2.8
};

const lerpColor = (a, b, k) => {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;

    return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
};

// Salida del nivel: un portal con vórtice. Cerrada gira lento y apagada; al cumplirse
// la meta se enciende en verde, gira rápido y absorbe puntos de luz hacia el centro.
export class Goal {
    constructor(scene, x, y, themeColor) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.isOpen = false;
        this.pulse = null;

        // Usar color del tema si se proporciona, sino el por defecto
        const goalOpenColor = themeColor || GOAL_CONFIG.openColor;
        const goalOpenLabelColor = themeColor 
            ? '#00ff88'  // texto blanco sobre color oscuro
            : '#00ff88';

        // El cuerpo físico (estático) solo detecta el overlap con el jugador; no se ve.
        this.frame = scene.add.rectangle(x, y, GOAL_CONFIG.width, GOAL_CONFIG.height, 0xffffff, 0);
        scene.physics.add.existing(this.frame, true);

        this.swirl = scene.add.graphics().setDepth(0.04);
        this.label = scene.add.text(x, y + GOAL_CONFIG.radius + 14, GOAL_CONFIG.lockedLabel, {
            fontFamily: 'Arial Black', fontSize: 12, color: GOAL_CONFIG.lockedLabelColor,
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.angle = 0;
        this.speed = GOAL_CONFIG.lockedSpin;
        this.openK = 0;
        this.lastTime = null;
        this.openColor = goalOpenColor;
        this.openLabelColor = goalOpenLabelColor;

    // Se llama cada frame desde Game.update: avanza el giro y vuelve a dibujar el vórtice.
    update(time) {
        const dt = this.lastTime === null ? 0.016 : Math.min((time - this.lastTime) / 1000, 0.05);
        const { x, y } = this;
        const R = GOAL_CONFIG.radius;
        const { arms, segments } = GOAL_CONFIG;

        this.lastTime = time;
        this.speed += ((this.isOpen ? GOAL_CONFIG.openSpin : GOAL_CONFIG.lockedSpin) - this.speed) * 0.06;
        this.openK += ((this.isOpen ? 1 : 0) - this.openK) * 0.08;
        this.angle += this.speed * dt;

        const color = lerpColor(this.openColor, GOAL_CONFIG.openColor, this.openK);
        const strength = 0.55 + 0.45 * this.openK;
        const g = this.swirl.clear();

        // Resplandor de fondo.
        g.fillStyle(color, 0.08 + 0.1 * this.openK).fillCircle(x, y, R + 8);
        g.fillStyle(color, 0.1 + 0.12 * this.openK).fillCircle(x, y, R * 0.7);

        // Brazos en espiral: más gruesos y brillantes cerca del centro.
        for (let a = 0; a < arms; a++) {
            const base = this.angle + (a * Math.PI * 2) / arms;
            let px = x, py = y;

            for (let i = 1; i <= segments; i++) {
                const u = i / segments;
                const r = 3 + u * (R - 3);
                const ang = base + r * 0.11;
                const cx = x + Math.cos(ang) * r;
                const cy = y + Math.sin(ang) * r;

                g.lineStyle(4 - 2.6 * u, color, (0.8 - 0.65 * u) * strength).lineBetween(px, py, cx, cy);
                px = cx;
                py = cy;
            }
        }

        // Puntos de luz que se absorben hacia el centro (solo con la salida abierta).
        if (this.openK > 0.3) {
            const t = time / 1000;

            for (let j = 0; j < 8; j++) {
                const u = (t * 0.55 + j / 8) % 1;
                const r = 3 + (1 - u) * (R - 3);
                const ang = -this.angle * 1.3 + j * 0.85 + (1 - u) * 2.2;

                g.fillStyle(0xffffff, 0.85 * u * this.openK).fillCircle(x + Math.cos(ang) * r, y + Math.sin(ang) * r, 2.2);
            }
        }

        // Núcleo y aro exterior (el aro late al abrirse).
        g.fillStyle(0xffffff, 0.35 + 0.4 * this.openK).fillCircle(x, y, 4 + 2 * this.openK);
        g.lineStyle(3, color, 0.5 * strength + 0.3 * this.openK)
            .strokeCircle(x, y, R + 3 + this.openK * 2 * Math.sin(time / 160));
    }

    open() {
        if (this.isOpen) {
            return;
        }

        this.isOpen = true;
        this.label.setColor(this.openLabelColor).setText(GOAL_CONFIG.openLabel);

        // Onda expansiva al encenderse.
        const wave = this.scene.add.circle(this.x, this.y, GOAL_CONFIG.radius).setFillStyle(0xffffff, 0);
        wave.setStrokeStyle(5, 0xffffff, 0.9);
        this.scene.tweens.add({
            targets: wave,
            scale: 2.6,
            alpha: 0,
            duration: 550,
            ease: 'Quad.easeOut',
            onComplete: () => wave.destroy()
        });

        this.pulse = this.scene.tweens.add({
            targets: this.label,
            alpha: 0.5,
            duration: 380,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // El pulso tiene repeat:-1: hay que detenerlo explícitamente al reiniciar el nivel
    // o seguiría pulsando sobre objetos ya destruidos.
    stopPulse() {
        if (this.pulse) {
            this.pulse.stop();
            this.pulse.remove();
            this.pulse = null;
        }
    }

    destroy() {
        this.stopPulse();
        this.frame.destroy();
        this.swirl.destroy();
        this.label.destroy();
    }
}
