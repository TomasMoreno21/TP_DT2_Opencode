export class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.comboWindowMs = 3000;
        this.lastCollectionTime = 0;
    }

    scorePoint(value, now) {
        if (this.combo > 0 && now - this.lastCollectionTime > this.comboWindowMs) {
            this.combo = 0;
            this.multiplier = 1;
        }

        this.combo += 1;
        this.lastCollectionTime = now;
        this.multiplier = Math.min(5, 1 + Math.floor(this.combo / 3));

        const gained = value * this.multiplier;
        this.score += gained;
        return gained;
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.lastCollectionTime = 0;
    }
}