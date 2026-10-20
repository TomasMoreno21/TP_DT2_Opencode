export const MOVING_PLATFORM_CONFIG = {
    axis: 'x',
    speed: 90,
    distance: 200,
    color: 0x4a3f7a,
    routeColor: 0x6a6aa0,
    width: 80,
    height: 20
};

// Posicion (0..distance) a lo largo del eje a los `t` segundos: ida, pausa de
// `dwell` s en la punta, vuelta y pausa. Parte del centro de la ruta yendo hacia
// `end`; `phase` (0..1) la desfasa un ciclo completo. Con dwell = 0 es una onda
// triangular. La usan MovingPlatform y el validador (modo con tiempo), asi que
// el juego y la simulacion no pueden divergir.
export function moverOffset(distance, speed, phase, t, dwell = 0) {
    const travel = distance / speed;
    const cycle = 2 * (travel + dwell);
    let u = (((travel / 2 + phase * cycle + t) % cycle) + cycle) % cycle;
    if (u < travel) return distance * (u / travel);
    u -= travel;
    if (u < dwell) return distance;
    u -= dwell;
    if (u < travel) return distance * (1 - u / travel);
    return 0;
}

export class MovingPlatform {
    constructor(scene, data = {}) {
        this.scene = scene;
        this.axis = data.axis ?? MOVING_PLATFORM_CONFIG.axis;
        this.speed = data.speed ?? MOVING_PLATFORM_CONFIG.speed;
        this.width = data.w ?? MOVING_PLATFORM_CONFIG.width;
        this.height = data.h ?? MOVING_PLATFORM_CONFIG.height;
        this.distance = data.distance ?? MOVING_PLATFORM_CONFIG.distance;
        this.phase = data.phase ?? 0;
        this.dwell = data.dwell ?? 0;
        this.t = 0;

        // La posicion inicial ya incluye la fase (con fase 0 es el centro de la
        // ruta, `data.x|y`). Se fija en el rectangulo: el body se resincroniza
        // desde el en cada preUpdate.
        const shift = moverOffset(this.distance, this.speed, this.phase, 0, this.dwell) - this.distance / 2;
        const horizontal = this.axis === 'x';
        this.rect = scene.add.rectangle(
            data.x + (horizontal ? shift : 0), data.y + (horizontal ? 0 : shift),
            this.width, this.height, data.color ?? MOVING_PLATFORM_CONFIG.color);
        this.rect.setStrokeStyle(2, 0x111122);

        scene.physics.add.existing(this.rect);
        this.body = this.rect.body;
        this.body.setImmovable(true);
        this.body.setAllowGravity(false);
        this.body.setCollideWorldBounds(true);

        // Ruta en coordenadas del body (top-left), desde el centro de ruta sin fase.
        const origin = horizontal ? data.x - this.width / 2 : data.y - this.height / 2;
        this.start = origin - this.distance / 2;
        this.end = origin + this.distance / 2;

        this.prevPos = this.axis === 'x' ? this.body.x : this.body.y;
        this.drawRoute();
    }

    // Cada frame fija la velocidad que lleva el body a la posicion de la formula
    // en el frame siguiente (corrige sola cualquier deriva de la fisica).
    // Devuelve el delta (dx o dy) recorrido desde el frame anterior, para arrastrar
    // al jugador parado encima.
    update(deltaMs = 1000 / 60) {
        const dt = Math.min(deltaMs, 50) / 1000;
        const pos = this.axis === 'x' ? this.body.x : this.body.y;
        const delta = pos - this.prevPos;
        this.prevPos = pos;

        const target = this.start + moverOffset(this.distance, this.speed, this.phase, this.t + dt, this.dwell);
        const v = (target - pos) / dt;
        if (this.axis === 'x') {
            this.body.setVelocity(v, 0);
        } else {
            this.body.setVelocity(0, v);
        }
        this.t += dt;

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