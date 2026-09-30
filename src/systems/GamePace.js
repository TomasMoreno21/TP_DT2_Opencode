// Control del ritmo del mundo físico: congelaciones breves (hitstop) y cámara lenta.
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