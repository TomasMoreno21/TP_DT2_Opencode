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
export class GamePace {
    constructor(scene) {
        this.scene = scene;
        this.world = scene.physics.world;
    }

    hitstop(ms) {
        this.applyWorldTimeScale(0, ms);
    }

    slowmo(ms, factor = 0.4) {
        this.applyWorldTimeScale(factor, ms);
    }

    // scale 0 congela la simulación; cualquier otro valor la ralentiza.
    applyWorldTimeScale(scale, ms) {
        if (scale <= 0) {
            this.world.pause();
        } else {
            this.world.timeScale = scale;
        }

        this.scene.time.delayedCall(ms, () => {
            this.world.timeScale = 1;
            this.world.resume();
        });
    }

    restore() {
        this.world.timeScale = 1;
        this.world.resume();
    }
}