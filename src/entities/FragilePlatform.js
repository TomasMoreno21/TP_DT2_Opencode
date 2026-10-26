export const FRAGILE_CONFIG = {
    height: 20,
    width: 120,
    // Pisada -> caida: temblor de aviso (G4) y la plataforma se desmorona.
    shakeMs: 700,
    // Tiempo caida antes de volver, y parte final en que se ve transluida (aviso).
    respawnMs: 3000,
    ghostMs: 500,
    color: 0x6b4a5e,
    edgeColor: 0xffaa44,
    warnColor: 0xff6644
};

// Plataforma fragil (nivel 3): se desmorona 0,7 s despues de pisarla desde arriba
// y reaparece a los 3 s. Estados: solid -> shaking -> fallen -> ghost -> solid.
// El wall grab (contacto lateral) y un dash por encima no la activan: solo cuenta
// aterrizar sobre ella (ver Game: collider con `canTrigger`).
export class FragilePlatform {
    constructor(scene, data) {
        this.scene = scene;
        this.x = data.x;
        this.y = data.y;
        this.width = data.w ?? FRAGILE_CONFIG.width;
        this.height = data.h ?? FRAGILE_CONFIG.height;
        this.shakeMs = data.shakeMs ?? FRAGILE_CONFIG.shakeMs;
        this.respawnMs = data.respawnMs ?? FRAGILE_CONFIG.respawnMs;
        this.ghostMs = FRAGILE_CONFIG.ghostMs;

        this.state = 'solid';
        this.stateStart = 0;

        this.rect = scene.add.rectangle(this.x, this.y, this.width, this.height, FRAGILE_CONFIG.color);
        this.rect.setStrokeStyle(2, 0x2a1822);
        scene.physics.add.existing(this.rect, true);
        this.body = this.rect.body;

        // Borde superior y grietas: se distinguen de las plataformas seguras de un vistazo.
        this.edge = scene.add.rectangle(this.x, this.y - this.height / 2 + 2, this.width - 4, 4, FRAGILE_CONFIG.edgeColor, 0.9);
        this.cracks = scene.add.graphics();
        this.drawCracks();
    }

    drawCracks() {
        const g = this.cracks;
        const left = this.x - this.width / 2;

        g.clear();
        g.lineStyle(2, 0x2a1822, 0.9);

        for (let i = 1; i < 4; i++) {
            const cx = left + (this.width * i) / 4;
            g.lineBetween(cx, this.y - this.height / 2 + 2, cx - 4, this.y);
            g.lineBetween(cx - 4, this.y, cx + 2, this.y + this.height / 2 - 2);
        }
    }

    get isSolid() {
        return this.state === 'solid' || this.state === 'shaking';
    }

    // Solo se activa desde el estado solido.
    trigger(now) {
        if (this.state !== 'solid') {
            return false;
        }

        this.state = 'shaking';
        this.stateStart = now;
        this.scene.events.emit('fragile-shake', this.x);
        return true;
    }

    // `playerRect`: se usa para no volver a solidificar con el jugador adentro.
    update(now, playerRect) {
        const elapsed = now - this.stateStart;

        if (this.state === 'shaking') {
            const k = Math.min(elapsed / this.shakeMs, 1);
            const tremble = Math.sin(elapsed / 28) * (1 + 3 * k);
            const blink = Math.sin(elapsed / (k > 0.6 ? 45 : 80)) > 0;

            this.rect.x = this.x + tremble;
            this.edge.x = this.x + tremble;
            this.edge.setFillStyle(blink ? 0xffffff : FRAGILE_CONFIG.warnColor, 0.95);
            this.cracks.x = tremble;

            if (elapsed >= this.shakeMs) {
                this.fall(now);
            }
        } else if (this.state === 'fallen') {
            if (elapsed >= this.respawnMs - this.ghostMs) {
                this.state = 'ghost';
                this.rect.setVisible(true).setAlpha(0.25);
                this.edge.setVisible(true).setAlpha(0.25);
                this.cracks.setVisible(true).setAlpha(0.25);
            }
        } else if (this.state === 'ghost') {
            const flick = 0.2 + 0.2 * (Math.sin(elapsed / 60) > 0 ? 1 : 0);

            this.rect.setAlpha(flick);
            this.edge.setAlpha(flick);
            this.cracks.setAlpha(flick);

            if (elapsed >= this.respawnMs && !this.overlaps(playerRect)) {
                this.restore();
            }
        }
    }

    overlaps(rect) {
        if (!rect) {
            return false;
        }

        return Math.abs(rect.x - this.x) < (rect.width + this.width) / 2 &&
            Math.abs(rect.y - this.y) < (rect.height + this.height) / 2;
    }

    fall(now) {
        this.state = 'fallen';
        this.stateStart = now;
        this.body.enable = false;
        this.scene.events.emit('fragile-fall', this.x);

        const parts = [this.rect, this.edge, this.cracks];
        const dust = this.scene.add.rectangle(this.x, this.y, this.width, this.height, FRAGILE_CONFIG.color, 0.9);
        this.scene.tweens.add({
            targets: dust,
            y: this.y + 90,
            alpha: 0,
            angle: 12,
            duration: 380,
            ease: 'Quad.easeIn',
            onComplete: () => dust.destroy()
        });

        for (const part of parts) {
            part.setVisible(false);
        }

        this.rect.x = this.x;
        this.edge.x = this.x;
        this.cracks.x = 0;
    }

    restore() {
        this.state = 'solid';
        this.body.enable = true;
        this.rect.setAlpha(1);
        this.edge.setAlpha(0.9).setFillStyle(FRAGILE_CONFIG.edgeColor, 0.9);
        this.cracks.setAlpha(1);
        this.scene.events.emit('fragile-back', this.x);
    }

    destroy() {
        this.rect.destroy();
        this.edge.destroy();
        this.cracks.destroy();
    }
}
