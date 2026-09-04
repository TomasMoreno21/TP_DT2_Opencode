import { Point } from '../entities/Point';
import { LEVEL } from '../assets/level';

export const POINT_SPAWN_CONFIG = {
    rotateInterval: 2500,
    activePerRound: 2
};

export class PointSpawner {
    constructor(scene) {
        this.scene = scene;
        this.points = LEVEL.pointSpots.map((spot) => new Point(scene, spot.x, spot.y));

        this.rotationEvent = scene.time.addEvent({
            delay: POINT_SPAWN_CONFIG.rotateInterval,
            loop: true,
            callback: () => this.rotate()
        });

        this.rotate();
    }

    rotate() {
        this.points.forEach((point) => point.deactivate());

        const shuffled = this.points.slice().sort(() => Math.random() - 0.5);

        for (let i = 0; i < Math.min(POINT_SPAWN_CONFIG.activePerRound, shuffled.length); i++) {
            shuffled[i].activate();
        }
    }

    getPointByCircle(circle) {
        return this.points.find((point) => point.circle === circle);
    }

    destroy() {
        this.rotationEvent.remove();
    }
}