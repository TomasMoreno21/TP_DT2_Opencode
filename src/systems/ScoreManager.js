export class ScoreManager {
    constructor() {
        this.score = 0;
    }

    add(points) {
        this.score += points;
    }

    reset() {
        this.score = 0;
    }
}