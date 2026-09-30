export const PORTAL_CONFIG = {
    width: 46,
    height: 70,
    color: 0x9d7bff,
    brightColor: 0xffffff,
    chargeMs: 350,
    coolingMs: 800,
    velocityScale: 0.8,
    maxVelocityX: 260,
    maxVelocityY: 320
};

// Portal vinculado a otro: al pisarlo, carga un aviso (G4) y luego teletransporta
// al poral destino conservando parte del impulso (M4).
export class Portal {
    constructor(scene, data) {
        this.scene = scene;
        this.x = data.x;
        this.y = data.y;
        this.linked = null;

        this.sensor = scene.add.rectangle(this.x, this.y, PORTAL_CONFIG.width, PORTAL_CONFIG.height, 0x000000, 0);
        this.sensor.setVisible(false);

        scene.physics.add.existing(this.sensor);
        this.body = this.sensor.body;
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);

        this.ring = scene.add.ellipse(this.x, this.y, PORTAL_CONFIG.width, PORTAL_CONFIG.height, PORTAL_CONFIG.color, 0.22);
        this.ring.setStrokeStyle(3, PORTAL_CONFIG.color);
        this.inner = scene.add.ellipse(this.x, this.y, PORTAL_CONFIG.width - 16, PORTAL_CONFIG.height - 22, PORTAL_CONFIG.color, 0.35);
        this.gate = scene.add.rectangle(this.x, this.y, PORTAL_CONFIG.width, 4, PORTAL_CONFIG.brightColor, 0.5);

        this.status = 'idle';
        this.chargeUntil = 0;
        this.coolingUntil = 0;

        this.breatheTween = scene.tweens.add({
            targets: [this.ring, this.inner],
            scaleY: 1.06,
            scaleX: 0.94,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // Inicia el aviso de activación si está disponible.
    beginCharge() {
        const now = this.scene.time.now;

        if (this.status !== 'idle' || now < this.coolingUntil) {
            return false;
        }

        this.status = 'charging';
        this.chargeUntil = now + PORTAL_CONFIG.chargeMs;

        this.stopTelegraph();
        this.ring.setFillStyle(0xffffff, 0.5);
        this.inner.setFillStyle(0xffffff, 0.6);
        this.gate.setFillStyle(0xffffff, 0.9);
        this.ring.setScale(1.25, 1.25);
        this.inner.setScale(1.25, 1.25);

        this.telegraphTween = this.scene.tweens.add({
            targets: [this.ring, this.inner],
            alpha: 0.45,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 120,
            yoyo: true,
            repeat: PORTAL_CONFIG.chargeMs / 120,
            ease: 'Sine.easeInOut'
        });

        return true;
    }

    stopTelegraph() {
        if (this.telegraphTween) {
            this.telegraphTween.stop();
            this.telegraphTween = null;
        }

        this.ring.setAlpha(1);
        this.inner.setAlpha(1);
        this.ring.setFillStyle(PORTAL_CONFIG.color, 0.22);
        this.inner.setFillStyle(PORTAL_CONFIG.color, 0.35);
        this.gate.setFillStyle(PORTAL_CONFIG.brightColor, 0.5);
        this.ring.setScale(1);
        this.inner.setScale(1);
    }

    cancelCharge() {
        if (this.status !== 'charging') {
            return;
        }

        this.status = 'idle';
        this.stopTelegraph();
    }

    get isCharged() {
        return this.status === 'charging' && this.scene.time.now >= this.chargeUntil;
    }

    // Ejecuta el salto al portal vinculado, conservando parte del impulso.
    teleport(playerRect) {
        const vx = Math.max(-PORTAL_CONFIG.maxVelocityX, Math.min(PORTAL_CONFIG.maxVelocityX, playerRect.body.velocity.x * PORTAL_CONFIG.velocityScale));
        const vy = Math.max(-PORTAL_CONFIG.maxVelocityY, Math.min(PORTAL_CONFIG.maxVelocityY, playerRect.body.velocity.y * PORTAL_CONFIG.velocityScale));

        playerRect.body.reset(this.linked.x, this.linked.y - playerRect.height / 2, vx, vy);

        this.status = 'idle';
        this.stopTelegraph();
        this.linked.coolingUntil = this.scene.time.now + PORTAL_CONFIG.coolingMs;
    }

    destroy() {
        if (this.breatheTween) {
            this.breatheTween.stop();
            this.breatheTween.remove();
        }

        this.stopTelegraph();
        this.sensor.destroy();
        this.ring.destroy();
        this.inner.destroy();
        this.gate.destroy();
    }
}