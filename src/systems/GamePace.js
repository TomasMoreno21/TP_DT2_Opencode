// Control del ritmo del mundo físico: congelaciones breves (hitstop) y cámara lenta.
//
// world.timeScale solo afecta al stepping de la física (msPerFrame =
// _frameTimeMS * timeScale). El Clock de la escena (scene.time) corre con el
// delta real del frame y tiene su propio timeScale, así que delayedCall sigue
// ejecutándose aunque el mundo esté detenido. Por eso el hitstop se restaura
// desde el reloj de Phaser y no hace falta un temporizador externo.
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

    applyWorldTimeScale(scale, ms) {
        this.world.timeScale = scale;

        this.scene.time.delayedCall(ms, () => {
            this.world.timeScale = 1;
        });
    }

    restore() {
        this.world.timeScale = 1;
    }
}