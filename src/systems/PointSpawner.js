import { Math as PhaserMath } from 'phaser';
import { EntityFactory } from '../patterns/EntityFactory';

export const POINT_SPAWN_CONFIG = {
    initialActive: 2
};

export class PointSpawner {
    // `deferred`: no activa orbes hasta llamar a begin() (el tutorial los espera).
    constructor(scene, spots, deferred = false) {
        this.scene = scene;
        this.points = EntityFactory.createPoints(scene, spots);

        if (!deferred) {
            this.begin();
        }
    }

    begin() {
        for (let i = 0; i < POINT_SPAWN_CONFIG.initialActive; i++) {
            this.activateAnother();
        }
    }

    activateAnother() {
        const inactive = this.points.filter((point) => !point.circle.active);

        if (inactive.length === 0) {
            return null;
        }

        const next = inactive[PhaserMath.Between(0, inactive.length - 1)];
        next.activate();

        return next;
    }

    getPointByCircle(circle) {
        return this.points.find((point) => point.circle === circle);
    }
}