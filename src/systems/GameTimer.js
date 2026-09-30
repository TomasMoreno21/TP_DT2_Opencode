export const TIMER_CONFIG = {
    duration: 60
};

export class GameTimer {
    constructor(scene, onComplete = null, durationSeconds = TIMER_CONFIG.duration) {
        this.scene = scene;
        this.durationMs = durationSeconds * 1000;
        this.onComplete = onComplete;
        this.startTime = scene.time.now;
        this.finished = false;
    }

    get remainingSeconds() {
        const elapsed = this.scene.time.now - this.startTime;
        const remaining = this.durationMs - elapsed;
        return Math.ceil(Math.max(remaining, 0) / 1000);
    }

    update() {
        if (this.finished) {
            return;
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
        this.startTime += seconds * 1000;
    }
}