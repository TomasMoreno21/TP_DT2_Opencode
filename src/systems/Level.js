import { EntityFactory } from '../patterns/EntityFactory';

// Materializa un nivel a partir de su declaracion en assets/levels.js.
export class Level {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.platforms = scene.physics.add.staticGroup();

        for (const p of config.platforms) {
            const rect = scene.add.rectangle(p.x, p.y, p.w, p.h, p.color);
            rect.setStrokeStyle(2, 0x111122);
            this.platforms.add(rect);
        }

        this.goal = EntityFactory.createGoal(scene, config.goal.x, config.goal.y);

        this.materializeTrampolines();
        this.materializeMovingPlatforms();
    }

    materializeTrampolines() {
        this.trampolines = this.scene.physics.add.staticGroup();
        this.trampolineList = [];

        for (const t of this.config.trampolines ?? []) {
            const trampoline = EntityFactory.createTrampoline(this.scene, t);
            this.trampolines.add(trampoline.rect);
            this.trampolineList.push(trampoline);
        }
    }

    materializeMovingPlatforms() {
        this.movingPlatforms = this.scene.physics.add.group();
        this.movingPlatformList = [];

        for (const p of this.config.movingPlatforms ?? []) {
            const platform = EntityFactory.createMovingPlatform(this.scene, p);
            this.movingPlatforms.add(platform.rect);
            this.movingPlatformList.push(platform);
        }
    }
}
