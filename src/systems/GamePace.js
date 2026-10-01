// Control del ritmo del mundo físico: congelaciones breves (hitstop) y cámara lenta.
//
// NO se usa world.timeScale = 0 para el hitstop. Arcade.World.update acumula
// el tiempo y ejecuta los pasos con:
//
//     msPerFrame = this._frameTimeMS * this.timeScale;
//     while (this._elapsed >= msPerFrame) { this._elapsed -= msPerFrame; this.step(delta); }
//
// Con timeScale = 0, msPerFrame vale 0 y el bucle nunca termina: el hilo
// principal se bloquea de forma permanente y el juego se cuelga.
//
// El hitstop usa por eso world.pause()/resume(), que World.update respeta con
// su salida temprana (isPaused) y no depende de esa aritmética. El Clock de la
// escena corre con el delta real del frame y tiene su propio timeScale, así
// que el delayedCall que reanuda el mundo sí se ejecuta.
//
// Los efectos se encolan en vez de solaparse: encadenar hitstop(80) y
// slowmo(700) durante la muerte hace que la cámara lenta empiece cuando
// termina el hitstop, en lugar de que el reanudado del hitstop borre el
// timeScale de la cámara lenta.
export class GamePace {
    constructor(scene) {
        this.scene = scene;
        this.world = scene.physics.world;
        this.queue = [];
        this.pending = null;
    }

    hitstop(ms) {
        this.enqueue({ scale: 0, ms });
    }

    slowmo(ms, factor = 0.4) {
        this.enqueue({ scale: factor, ms });
    }

    // Encola un efecto de ritmo; el siguiente arranca al terminar el actual.
    enqueue(step) {
        this.queue.push(step);

        if (!this.pending) {
            this.runNext();
        }
    }

    runNext() {
        const step = this.queue.shift();

        if (!step) {
            this.applyScale(1);
            return;
        }

        this.applyScale(step.scale);

        this.pending = this.scene.time.delayedCall(step.ms, () => {
            this.pending = null;
            this.runNext();
        });
    }

    // scale 0 congela la simulación; cualquier otro valor la ralentiza.
    applyScale(scale) {
        if (scale <= 0) {
            this.world.pause();
            return;
        }

        this.world.timeScale = scale;
        this.world.resume();
    }

    // Cancela cualquier efecto pendiente y deja el mundo a velocidad normal.
    restore() {
        this.queue.length = 0;

        if (this.pending) {
            this.pending.remove(false);
            this.pending = null;
        }

        this.applyScale(1);
    }
}