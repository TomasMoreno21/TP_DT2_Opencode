import { Goal } from '../entities/Goal';
import { Point } from '../entities/Point';
import { Projectile } from '../entities/Projectile';
import { Trampoline } from '../entities/Trampoline';
import { MovingPlatform } from '../entities/MovingPlatform';
import { Hazard } from '../entities/Hazard';
import { PowerUp } from '../entities/PowerUp';
import { Portal } from '../entities/Portal';
import { Gem } from '../entities/Gem';

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

    static createMovingPlatform(scene, data) {
        return new MovingPlatform(scene, data);
    }

    static createHazard(scene, data) {
        return new Hazard(scene, data);
    }

    static createPowerUp(scene, data) {
        return new PowerUp(scene, data);
    }

    static createPortal(scene, data) {
        return new Portal(scene, data);
    }

    static createGem(scene, x, y) {
        return new Gem(scene, x, y);
    }
}
