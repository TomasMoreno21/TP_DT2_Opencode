export const TIMER_CONFIG = {
    duration: 60
};

export class GameTimer {
    constructor(scene, onComplete = null, durationSeconds = TIMER_CONFIG.duration) {
        this.scene = scene;
        this.durationMs = durationSeconds * 1000;
        this.onComplete = onComplete;
        // En el primer nivel tras cargar la pestaña, create corre con el reloj
        // de la escena en 0: fijar startTime ahí comería la edad de la pestaña.
        // Se difiere al primer update, cuando el reloj ya está sincronizado.
        this.startTime = null;
        this.pendingBonusMs = 0;
        this.finished = false;
    }

    get remainingSeconds() {
        if (this.startTime === null) {
            return Math.ceil(this.durationMs / 1000);
        }

        const elapsed = this.scene.time.now - this.startTime;
        const remaining = this.durationMs - elapsed;
        return Math.ceil(Math.max(remaining, 0) / 1000);
    }

    update() {
        if (this.finished) {
            return;
        }

        if (this.startTime === null) {
            this.startTime = this.scene.time.now + this.pendingBonusMs;
            this.pendingBonusMs = 0;
        }

        if (this.remainingSeconds <= 0) {
            this.finished = true;
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    // Suma tiempo al reloj: se adelanta startTime para que el elapsedSea menor.
    addSeconds(seconds) {
        const bonus = seconds * 1000;

        // Si llega antes del primer update (recogido en el mismo frame de
        // entrada), queda pendiente para fijarse junto al inicio del reloj.
        if (this.startTime === null) {
            this.pendingBonusMs += bonus;
            return;
        }

        this.startTime += bonus;
    }
}