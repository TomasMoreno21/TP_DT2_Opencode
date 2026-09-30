export class ScoreManager {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.comboWindowMs = 3000;
        this.lastCollectionTime = 0;
        this.collected = 0;
        this.quota = 8;
        this.airStreak = 0;
        this.airBonusPerStep = 10;
    }

    setQuota(quota) {
        this.quota = quota;
    }

    get quotaMet() {
        return this.collected >= this.quota;
    }

    // Combo compartido por puntos y gemas. countQuota controla si la recolección
    // suma a la meta; airborne acumula la cadena "sin pies en el suelo" (M6).
    addValue(value, now, countQuota, airborne) {
        if (this.combo > 0 && now - this.lastCollectionTime > this.comboWindowMs) {
            this.combo = 0;
            this.multiplier = 1;
        }

        this.combo += 1;
        this.lastCollectionTime = now;
        this.multiplier = Math.min(5, 1 + Math.floor(this.combo / 3));

        const gained = value * this.multiplier;
        this.score += gained;

        if (countQuota) {
            this.collected += 1;
        }

        let airBonus = 0;

        if (airborne) {
            this.airStreak += 1;
            airBonus = this.airStreak * this.airBonusPerStep;
            this.score += airBonus;
        } else {
            this.airStreak = 0;
        }

        return { gained, airBonus };
    }

    scorePoint(value, now, { airborne = false } = {}) {
        return this.addValue(value, now, true, airborne);
    }

    // Las gemas (M5) no cuentan para la quota: suman puntos y dan tiempo extra.
    scoreGem(value, now, { airborne = false } = {}) {
        return this.addValue(value, now, false, airborne);
    }

    resetAirStreak() {
        this.airStreak = 0;
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.multiplier = 1;
        this.lastCollectionTime = 0;
        this.collected = 0;
        this.quota = 8;
        this.airStreak = 0;
    }
}