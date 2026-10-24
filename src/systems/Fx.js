import { FEEL } from '../assets/feel';

// Pool mínimo: reutiliza objetos de escena en vez de crear y destruir uno por efecto.
class Pool {
    constructor(factory) {
        this.factory = factory;
        this.free = [];
        this.inUse = 0;
    }

    get() {
        const obj = this.free.pop() ?? this.factory();

        this.inUse += 1;

        return obj.setActive(true).setVisible(true);
    }

    release(obj) {
        obj.setActive(false).setVisible(false);
        this.free.push(obj);
        this.inUse -= 1;
    }
}

// Efectos visuales con pool (ver docs/PLAN_FEEL.md §4): ráfagas, polvo, chispas,
// anillos, estelas y fantasmas. Una instancia por escena: se crea en create() y los
// objetos caen con la escena al apagarse. Antes cada ráfaga creaba un emisor nuevo que
// nunca se destruía.
export class Fx {
    constructor(scene) {
        this.scene = scene;
        this.emitters = new Map();
        this.pools = {
            ghost: new Pool(() => scene.add.rectangle(0, 0, 1, 1, 0xffffff)),
            ring: new Pool(() => scene.add.circle(0, 0, 20).setFillStyle(0xffffff, 0)),
            streak: new Pool(() => scene.add.graphics()),
            orb: new Pool(() => scene.add.circle(0, 0, 7, 0xffffff).setStrokeStyle(2, 0xffffff, 0.8).setScrollFactor(0).setDepth(45))
        };
    }

    // Ráfaga radial de partículas del color indicado.
    burst(x, y, color = 0xffdd44, count = FEEL.fx.burstCount) {
        this.emitterFor('burst', color, {
            speed: { min: 60, max: 220 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: FEEL.fx.burstLifespan
        }).explode(count, x, y);
    }

    // Chispas rápidas y cortas (impactos, derrapes, pared).
    spark(x, y, color = 0xffffff, count = 6, angle = { min: 0, max: 360 }) {
        this.emitterFor('spark', color, {
            speed: { min: 120, max: 280 },
            angle,
            scale: { start: 0.7, end: 0 },
            lifespan: 220
        }).explode(count, x, y);
    }

    // Polvo que sube y se disipa (correr, saltar, aterrizar).
    dust(x, y, count = 5, color = 0xcfd2ff) {
        this.emitterFor('dust', color, {
            speed: { min: 15, max: 70 },
            angle: { min: -165, max: -15 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 320
        }).explode(count, x, y);
    }

    // Polvo que sale hacia un costado (aterrizajes, derrapes). dir: 1 derecha, -1 izquierda.
    dustSide(x, y, dir, count = 4, color = 0xcfd2ff) {
        const base = dir > 0 ? 0 : 180;

        this.emitterFor('dustSide' + dir, color, {
            speed: { min: 40, max: 130 },
            angle: { min: base - 25, max: base + 5 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.55, end: 0 },
            lifespan: 280
        }).explode(count, x, y);
    }

    // Brasas que suben despacio (aura del combo alto).
    ember(x, y, color = 0xffdd44) {
        this.emitterFor('ember', color, {
            speed: { min: 20, max: 55 },
            angle: { min: -110, max: -70 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 520
        }).explode(1, x, y);
    }

    // Anillo que se expande y se desvanece.
    ring(x, y, color = 0xffffff, radius = FEEL.fx.ringRadius, ms = FEEL.fx.ringMs) {
        if (this.pools.ring.inUse >= FEEL.fx.maxRings) {
            return;
        }

        const ring = this.pools.ring.get();

        ring.setPosition(x, y).setScale(0.3).setAlpha(1).setStrokeStyle(3, color, 1);
        this.scene.tweens.add({
            targets: ring,
            scale: radius / 20,
            alpha: 0,
            duration: ms,
            ease: 'Quad.easeOut',
            onComplete: () => this.pools.ring.release(ring)
        });
    }

    // Línea que se desvanece (ruta entre puntos, líneas de velocidad).
    streak(x1, y1, x2, y2, color = 0xffffff, ms = 160, width = 3) {
        if (this.pools.streak.inUse >= FEEL.fx.maxStreaks) {
            return;
        }

        const line = this.pools.streak.get();

        line.clear().lineStyle(width, color, 1).lineBetween(x1, y1, x2, y2).setAlpha(1);
        this.scene.tweens.add({
            targets: line,
            alpha: 0,
            duration: ms,
            onComplete: () => this.pools.streak.release(line)
        });
    }

    // Orbe que viaja en curva hasta un punto de la pantalla (el puntaje, el reloj) y se
    // achica al llegar. Las coordenadas son de pantalla (el HUD no se mueve con la cámara).
    orb(x0, y0, x1, y1, color = 0xffdd44, { ms = 230, onArrive } = {}) {
        if (this.pools.orb.inUse >= FEEL.fx.maxOrbs) {
            onArrive?.();
            return;
        }

        const orb = this.pools.orb.get();
        const cx = (x0 + x1) / 2;
        const cy = Math.min(y0, y1) - 70;
        const t = { p: 0 };

        orb.setPosition(x0, y0).setFillStyle(color, 1).setScale(1).setAlpha(0.95);
        this.scene.tweens.add({
            targets: t,
            p: 1,
            duration: ms,
            ease: 'Quad.easeIn',
            onUpdate: () => {
                const p = t.p;
                const q = 1 - p;

                orb.setPosition(q * q * x0 + 2 * q * p * cx + p * p * x1, q * q * y0 + 2 * q * p * cy + p * p * y1);
                orb.setScale(1 - 0.5 * p);
            },
            onComplete: () => {
                this.pools.orb.release(orb);
                onArrive?.();
            }
        });
    }

    // Copia del objeto que se desvanece (estela del dash y de la velocidad).
    ghost(source, { alpha = 0.5, ms = 220, stroke = 0.4 } = {}) {
        if (this.pools.ghost.inUse >= FEEL.fx.maxGhosts) {
            return;
        }

        const ghost = this.pools.ghost.get();

        ghost.setPosition(source.x, source.y)
            .setSize(source.width, source.height)
            .setScale(source.scaleX, source.scaleY)
            .setFillStyle(source.fillColor ?? 0xffffff, 1)
            .setStrokeStyle(2, 0xffffff, stroke)
            .setDepth(source.depth - 1)
            .setAlpha(alpha);

        this.scene.tweens.add({
            targets: ghost,
            alpha: 0,
            duration: ms,
            onComplete: () => this.pools.ghost.release(ghost)
        });
    }

    // Un emisor por tipo y color, creado la primera vez y reutilizado.
    emitterFor(kind, color, config) {
        const key = `${kind}:${color}`;
        let emitter = this.emitters.get(key);

        if (!emitter) {
            emitter = this.scene.add.particles(0, 0, 'particle', { ...config, emitting: false, tint: color });
            this.emitters.set(key, emitter);
        }

        return emitter;
    }

    // Cantidad de emisores vivos (lo muestra el overlay de debug).
    get emitterCount() {
        return this.emitters.size;
    }

    get stats() {
        const { ghost, ring, streak, orb } = this.pools;

        return `emisores ${this.emitterCount} · fantasmas ${ghost.inUse} · anillos ${ring.inUse} · líneas ${streak.inUse} · orbes ${orb.inUse}`;
    }
}
