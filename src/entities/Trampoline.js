export const TRAMPOLINE_CONFIG = {
    height: 12,
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

        const h = this.config.height;
        this.rect = scene.add.rectangle(x, y, this.width, h, this.config.color);
        this.rect.setStrokeStyle(2, this.config.accentColor);

        const zoneWidth = Math.min(this.config.perfectZoneHalf * 2, this.width - 8);
        this.zone = scene.add.rectangle(x, y - h / 2 - 2, zoneWidth, 3, this.config.perfectColor, 0.8);
    }

    bounce(player) {
        const perfect = Math.abs(player.x - this.x) <= this.config.perfectZoneHalf;
        const gravity = this.scene.physics.world.gravity.y;
        const maxRise = Math.max(this.y - 26, 6);
        const maxVy = -Math.sqrt(2 * gravity * maxRise);
        const target = perfect ? this.config.perfectVy : this.config.baseVy;
        const vy = Math.max(target, maxVy);

        player.body.setVelocityY(vy);
        this.squash();
        this.scene.burstAt(this.x, this.y - 8, perfect ? this.config.perfectColor : this.config.accentColor);

        if (perfect && this.scene.floatingText) {
            this.scene.floatingText.show(this.x, this.y - 26, '¡PERFECTO!', '#ffdd44', 16);
        }

        return perfect;
    }

    squash() {
        this.rect.setScale(1, 0.6);
        this.scene.tweens.add({ targets: this.rect, scaleY: 1, duration: 140, ease: 'Quad.easeOut' });
    }
}