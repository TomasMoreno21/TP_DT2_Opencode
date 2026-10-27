import { Math as PhaserMath } from 'phaser';
import { EntityFactory } from '../patterns/EntityFactory';

export const POINT_SPAWN_CONFIG = {
    initialActive: 2,
    // Distancia mínima entre un punto nuevo y los que ya están activos (si no hay ninguno tan lejos, el más lejano).
    minGap: 320
};

export class PointSpawner {
    // `deferred`: no activa orbes hasta llamar a begin() (el tutorial los espera).
    constructor(scene, spots, deferred = false, initialActive = POINT_SPAWN_CONFIG.initialActive) {
        this.scene = scene;
        this.initialActive = initialActive;
        this.points = EntityFactory.createPoints(scene, spots);

        if (!deferred) {
            this.begin();
        }
    }

    begin() {
        for (let i = 0; i < this.initialActive; i++) {
            this.activateAnother();
        }
    }

    activateAnother() {
        const inactive = this.points.filter((point) => !point.circle.active);

        if (inactive.length === 0) {
            return null;
        }

        const active = this.points.filter((point) => point.circle.active);
        const gapTo = (point) => Math.min(Infinity, ...active.map((a) => PhaserMath.Distance.Between(a.circle.x, a.circle.y, point.circle.x, point.circle.y)));
        const far = inactive.filter((point) => gapTo(point) >= POINT_SPAWN_CONFIG.minGap);
        const pool = far.length ? far : [inactive.reduce((best, point) => (gapTo(point) > gapTo(best) ? point : best))];
        const next = pool[PhaserMath.Between(0, pool.length - 1)];
        next.activate();

        return next;
    }

    getPointByCircle(circle) {
        return this.points.find((point) => point.circle === circle);
    }
}