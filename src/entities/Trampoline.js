export const TRAMPOLINE_CONFIG = {
    height: 4,
    baseVy: -620,
    perfectVy: -900,
    perfectZoneHalf: 30,
    color: 0x8a63d2,
    accentColor: 0xc9b6ff,
    perfectColor: 0xffdd44
};

export class Trampoline {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.config = { ...TRAMPOLINE_CONFIG, ...options };
        this.width = options.w ?? TRAMPOLINE_CONFIG.width;
        this.press = 0;
        this.glow = 0;

        // El rect es solo el cuerpo físico (invisible); lo visible se dibuja en `g`.
        const h = this.config.height;
        this.rect = scene.add.rectangle(x, y, this.width, h, this.config.color).setAlpha(0);
        this.g = scene.add.graphics().setDepth(0.1);
        this.zoneWidth = Math.min(this.config.perfectZoneHalf * 2, this.width - 8);

        // Latido suave para que se lea como "rebota".
        this.idle = scene.tweens.add({
            targets: this, glow: 1, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            onUpdate: () => this.draw()
        });
        this.draw();
    }

    draw() {
        const { g, x, y, width: w, press, glow } = this;
        const { color, accentColor, perfectColor, height } = this.config;
        const left = x - w / 2;
        const top = y - height / 2;
        const base = y + 6; // tope de lo que lo sostiene
        const padY = top - 2 + press * 2.5;
        const padH = 7 - press * 2;

        g.clear();

        // Halo en tres capas, como el de las plataformas.
        g.fillStyle(accentColor, 0.05 + 0.04 * glow).fillRect(left - 4, top - 14, w + 8, 14);
        g.fillStyle(accentColor, 0.09 + 0.05 * glow).fillRect(left - 2, top - 8, w + 4, 8);
        g.fillStyle(accentColor, 0.16 + 0.06 * glow).fillRect(left, top - 4, w, 4);

        // Sombra de contacto sobre el apoyo.
        g.fillStyle(0x000000, 0.35).fillRect(left + 2, base - 1, w - 4, 2);

        // Resorte en zigzag entre la almohadilla y el apoyo (se aplasta al rebotar).
        const coilTop = padY + padH;
        const turns = Math.max(3, Math.round(w / 14));
        const step = (w - 16) / turns;

        g.lineStyle(2, 0x4a3590, 1).beginPath().moveTo(left + 8, base);
        for (let i = 0; i < turns; i++) {
            g.lineTo(left + 8 + step * (i + 0.5), i % 2 ? base : coilTop);
            g.lineTo(left + 8 + step * (i + 1), i % 2 ? coilTop : base);
        }
        g.strokePath();
        g.lineStyle(1, accentColor, 0.45).beginPath().moveTo(left + 8, base - 1);
        for (let i = 0; i < turns; i++) {
            g.lineTo(left + 8 + step * (i + 0.5), i % 2 ? base - 1 : coilTop + 1);
            g.lineTo(left + 8 + step * (i + 1), i % 2 ? coilTop + 1 : base - 1);
        }
        g.strokePath();

        // Postes laterales con remache.
        for (const px of [left, left + w - 5]) {
            g.fillStyle(0x2a1d4d, 1).fillRoundedRect(px, padY + 2, 5, base - padY - 1, 1);
            g.fillStyle(accentColor, 0.7).fillRect(px + 1, padY + 3, 1, base - padY - 4);
        }

        // Almohadilla con volumen: sombra inferior, cuerpo, franjas y brillo superior.
        g.fillStyle(0x3b2a78, 1).fillRoundedRect(left, padY + 1, w, padH, 3);
        g.fillStyle(color, 1).fillRoundedRect(left, padY, w, padH - 2, 3);
        g.fillStyle(0xffffff, 0.08);
        for (let sx = left + 6; sx < left + w - 10; sx += 12) {
            g.fillTriangle(sx, padY + padH - 2, sx + 6, padY + 1, sx + 10, padY + 1);
            g.fillTriangle(sx, padY + padH - 2, sx + 10, padY + 1, sx + 4, padY + padH - 2);
        }
        g.fillStyle(accentColor, 0.95).fillRoundedRect(left + 2, padY, w - 4, 2, 1);
        g.fillStyle(0xffffff, 0.5 + 0.3 * glow).fillRect(left + 5, padY, Math.max(8, w * 0.25), 1);

        // Zona perfecta: franja dorada con brillo, más chevrones que suben y bajan.
        const zx = x - this.zoneWidth / 2;

        g.fillStyle(perfectColor, 0.35 + 0.25 * glow).fillRoundedRect(zx - 2, padY - 3, this.zoneWidth + 4, 5, 2);
        g.fillStyle(perfectColor, 1).fillRoundedRect(zx, padY - 2, this.zoneWidth, 3, 1);
        g.fillStyle(0xffffff, 0.7).fillRect(zx + 2, padY - 2, this.zoneWidth - 4, 1);

        for (let i = 0; i < 2; i++) {
            const cy = padY - 8 - i * 6 - glow * 3;

            g.fillStyle(perfectColor, (0.75 - i * 0.3) * (0.6 + 0.4 * glow));
            g.fillTriangle(x - 6, cy + 3, x, cy - 2, x + 6, cy + 3);
        }
    }

    bounce(player) {
        const perfect = Math.abs(player.x - this.x) <= this.config.perfectZoneHalf;
        const gravity = this.scene.physics.world.gravity.y;
        const maxRise = Math.max(this.y - 26, 6);
        const maxVy = -Math.sqrt(2 * gravity * maxRise);
        const target = perfect ? this.config.perfectVy : this.config.baseVy;
        const vy = Math.max(target, maxVy);
        const tint = perfect ? this.config.perfectColor : this.config.accentColor;

        player.body.setVelocityY(vy);
        this.squash();
        this.scene.burstAt(this.x, this.y - 8, tint);
        this.scene.fx?.ring(this.x, this.y - 4, tint, perfect ? 56 : 38, 220);

        if (perfect && this.scene.floatingText) {
            this.scene.floatingText.show(this.x, this.y - 26, '¡PERFECTO!', '#ffdd44', 16);
        }

        return perfect;
    }

    squash() {
        this.press = 1;
        this.scene.tweens.add({
            targets: this, press: 0, duration: 200, ease: 'Back.easeOut',
            onUpdate: () => this.draw()
        });
    }

    destroy() {
        this.idle?.stop();
        this.g.destroy();
    }
}
