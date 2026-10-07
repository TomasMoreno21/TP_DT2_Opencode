export const POINT_CONFIG = {
    radius: 12,
    color: 0xffdd44,
    value: 10
};

export class Point {
    constructor(scene, x, y) {
        this.scene = scene;
        this.value = POINT_CONFIG.value;
        this.color = POINT_CONFIG.color;
        this.popTween = null;
        this.pulseTween = null;

        this.circle = scene.add.circle(x, y, POINT_CONFIG.radius, POINT_CONFIG.color);
        this.circle.setStrokeStyle(2, 0xffffff);
        // Halo que pulsa: solo visual, el cuerpo físico no se escala.
        this.halo = scene.add.circle(x, y, POINT_CONFIG.radius + 7, POINT_CONFIG.color, 0.22);

        scene.physics.add.existing(this.circle, true);

        this.deactivate();
    }

    activate() {
        this.circle.setActive(true).setVisible(true);
        this.halo.setVisible(true);
        this.circle.body.enable = true;
        // Pop al aparecer + pulso continuo del halo.
        this.stopTweens();
        this.circle.setScale(0.3);
        this.halo.setScale(0.5).setAlpha(0.35);
        this.popTween = this.scene.tweens.add({
            targets: [this.circle, this.halo],
            scale: 1,
            duration: 220,
            ease: 'Back.easeOut'
        });
        this.pulseTween = this.scene.tweens.add({
            targets: this.halo,
            scale: 1.3,
            alpha: 0.12,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 220
        });
    }

    stopTweens() {
        for (const tween of [this.popTween, this.pulseTween]) {
            if (tween) {
                tween.stop();
                tween.remove();
            }
        }

        this.popTween = null;
        this.pulseTween = null;
    }

    deactivate() {
        this.stopTweens();
        this.circle.setActive(false).setVisible(false);
        this.circle.setScale(1);
        this.circle.body.enable = false;
        this.halo.setVisible(false);
    }
}