import { Goal } from '../entities/Goal';
import { Point } from '../entities/Point';
import { Projectile } from '../entities/Projectile';
import { Trampoline } from '../entities/Trampoline';

export class EntityFactory {
    static createPoint(scene, x, y) {
        return new Point(scene, x, y);
    }

    static createPoints(scene, spots) {
        return spots.map((spot) => new Point(scene, spot.x, spot.y));
    }

    static createProjectile(scene, x, y, target, speedMultiplier) {
        return new Projectile(scene, x, y, target, speedMultiplier);
    }

    static createGoal(scene, x, y) {
        return new Goal(scene, x, y);
    }

    static createTrampoline(scene, data) {
        return new Trampoline(scene, data.x, data.y, data);
    }
}
