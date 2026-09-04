export const TIMER_CONFIG = {
    duration: 60
};

export class GameTimer {
    constructor(scene, onComplete = null) {
        this.scene = scene;
        this.durationMs = TIMER_CONFIG.duration * 1000;
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
}