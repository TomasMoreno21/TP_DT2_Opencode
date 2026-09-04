export const POINT_CONFIG = {
    radius: 12,
    color: 0xffdd44,
    value: 10
};

export class Point {
    constructor(scene, x, y) {
        this.scene = scene;
        this.value = POINT_CONFIG.value;

        this.circle = scene.add.circle(x, y, POINT_CONFIG.radius, POINT_CONFIG.color);
        this.circle.setStrokeStyle(2, 0xffffff);

        scene.physics.add.existing(this.circle, true);

        this.deactivate();
    }

    activate() {
        this.circle.setActive(true).setVisible(true);
        this.circle.body.enable = true;
    }

    deactivate() {
        this.circle.setActive(false).setVisible(false);
        this.circle.body.enable = false;
    }
}