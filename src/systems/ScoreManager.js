export class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.comboWindowMs = 3000;
        this.lastCollectionTime = 0;
        this.collected = 0;
        this.quota = 8;
    }

    setQuota(quota) {
        this.quota = quota;
    }

    get quotaMet() {
        return this.collected >= this.quota;
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
        this.collected += 1;
        return gained;
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.lastCollectionTime = 0;
        this.collected = 0;
        this.quota = 8;
    }
}