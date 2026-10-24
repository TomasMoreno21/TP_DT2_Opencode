import { FEEL } from '../assets/feel';

// Efectos de partículas con pool: un emisor por color, creado la primera vez y
// reutilizado en cada ráfaga. Antes cada ráfaga creaba un emisor nuevo que nunca se
// destruía (30 ráfagas = 30 emisores vivos). Una instancia por escena: se crea en
// create() y los emisores caen con la escena al apagarse.
export class Fx {
    constructor(scene) {
        this.scene = scene;
        this.emitters = new Map();
    }

    // Ráfaga radial de partículas del color indicado.
    burst(x, y, color = 0xffdd44, count = FEEL.fx.burstCount) {
        this.emitterFor(color).explode(count, x, y);
    }

    emitterFor(color) {
        let emitter = this.emitters.get(color);

        if (!emitter) {
            emitter = this.scene.add.particles(0, 0, 'particle', {
                speed: { min: 60, max: 220 },
                angle: { min: 0, max: 360 },
                scale: { start: 1, end: 0 },
                lifespan: FEEL.fx.burstLifespan,
                emitting: false,
                tint: color
            });
            this.emitters.set(color, emitter);
        }

        return emitter;
    }

    // Cantidad de emisores vivos (lo muestra el overlay de debug).
    get emitterCount() {
        return this.emitters.size;
    }
}
