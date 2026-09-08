import { Math as PhaserMath } from 'phaser';
import { LEVEL } from '../assets/level';
import { EntityFactory } from '../patterns/EntityFactory';

export const POINT_SPAWN_CONFIG = {
    initialActive: 2
};

export class PointSpawner {
    constructor(scene) {
        this.scene = scene;
        this.points = EntityFactory.createPoints(scene, LEVEL.pointSpots);

        for (let i = 0; i < POINT_SPAWN_CONFIG.initialActive; i++) {
            this.activateAnother();
        }
    }

    activateAnother() {
        const inactive = this.points.filter((point) => !point.circle.active);

        if (inactive.length === 0) {
            return;
        }

        const next = inactive[PhaserMath.Between(0, inactive.length - 1)];
        next.activate();
    }

    getPointByCircle(circle) {
        return this.points.find((point) => point.circle === circle);
    }
}