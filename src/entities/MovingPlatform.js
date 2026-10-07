export const MOVING_PLATFORM_CONFIG = {
    axis: 'x',
    speed: 90,
    distance: 200,
    color: 0x4a3f7a,
    routeColor: 0x6a6aa0,
    width: 80,
    height: 20
};

export class MovingPlatform {
    constructor(scene, data = {}) {
        this.scene = scene;
        this.axis = data.axis ?? MOVING_PLATFORM_CONFIG.axis;
        this.speed = data.speed ?? MOVING_PLATFORM_CONFIG.speed;
        this.width = data.w ?? MOVING_PLATFORM_CONFIG.width;
        this.height = data.h ?? MOVING_PLATFORM_CONFIG.height;
        this.distance = data.distance ?? MOVING_PLATFORM_CONFIG.distance;
        this.direction = 1;

        this.rect = scene.add.rectangle(data.x, data.y, this.width, this.height, data.color ?? MOVING_PLATFORM_CONFIG.color);
        this.rect.setStrokeStyle(2, 0x111122);

        scene.physics.add.existing(this.rect);
        this.body = this.rect.body;
        this.body.setImmovable(true);
        this.body.setAllowGravity(false);
        this.body.setCollideWorldBounds(true);

        // Ruta en coordenadas del body (top-left).
        if (this.axis === 'x') {
            this.start = this.body.x - this.distance / 2;
            this.end = this.body.x + this.distance / 2;
        } else {
            this.start = this.body.y - this.distance / 2;
            this.end = this.body.y + this.distance / 2;
        }

        this.setMovingVelocity();
        this.prevPos = this.axis === 'x' ? this.body.x : this.body.y;
        this.drawRoute();
    }

    setMovingVelocity() {
        const v = this.speed * this.direction;

        if (this.axis === 'x') {
            this.body.setVelocity(v, 0);
        } else {
            this.body.setVelocity(0, v);
        }
    }

    // Devuelve el delta (dx o dy) recorrido en este paso para arrastrar al jugador parado encima.
    update() {
        const pos = this.axis === 'x' ? this.body.x : this.body.y;
        const delta = pos - this.prevPos;
        this.prevPos = pos;

        if (this.direction === 1 && pos >= this.end) {
            this.direction = -1;
            this.setMovingVelocity();
        } else if (this.direction === -1 && pos <= this.start) {
            this.direction = 1;
            this.setMovingVelocity();
        }

        return delta;
    }

    // M2: silueta de la ruta para planificar el salto antes de subirse.
    // start/end son coordenadas del body (top-left), así que la ruta total va
    // de `start` a `end + width|height` (unión real de la cobertura). El eje
    // fijo es el perpendicular: rect.y para horizontal, rect.x para vertical.
    drawRoute() {
        const g = this.scene.add.graphics();
        const horizontal = this.axis === 'x';
        const from = this.start;
        const to = this.end + (horizontal ? this.width : this.height);
        const fixed = horizontal ? this.rect.y : this.rect.x;

        g.lineStyle(2, MOVING_PLATFORM_CONFIG.routeColor, 0.35);
        g.lineBetween(
            horizontal ? from : fixed + 4,
            horizontal ? fixed + 4 : from,
            horizontal ? to : fixed + 4,
            horizontal ? fixed + 4 : to
        );

        for (let t = from; t < to; t += 22) {
            g.fillStyle(MOVING_PLATFORM_CONFIG.routeColor, 0.5);
            if (horizontal) {
                g.fillRect(t, fixed - 4, 8, 5);
            } else {
                g.fillRect(fixed - 4, t, 5, 8);
            }
        }
    }
}