import { LEVEL } from '../assets/level';

export class Level {
    constructor(scene) {
        this.scene = scene;
        this.platforms = scene.physics.add.staticGroup();

        for (const p of LEVEL.platforms) {
            const rect = scene.add.rectangle(p.x, p.y, p.w, p.h, p.color);
            rect.setStrokeStyle(2, 0x111122);
            this.platforms.add(rect);
        }
    }
}