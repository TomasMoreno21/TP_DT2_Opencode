import { EntityFactory } from '../patterns/EntityFactory';

// Materializa un nivel a partir de su declaracion en assets/levels.js.
export class Level {
    // theme: paleta del nivel (assets/themes.js); sin ella se usan los colores de siempre.
    constructor(scene, config, theme = null) {
        this.scene = scene;
        this.config = config;
        this.platforms = scene.physics.add.staticGroup();

        for (const p of config.platforms) {
            const rect = scene.add.rectangle(p.x, p.y, p.w, p.h, p.color);
            rect.setStrokeStyle(2, 0x111122);
            this.platforms.add(rect);
            // Borde neón superior (o lateral en paredes) para legibilidad.
            const isWall = p.h > p.w * 2;
            const edgeColor = isWall ? (theme?.wall ?? 0x9d7bff) : (theme?.accent ?? 0x00d1b2);
            if (isWall) {
                scene.add.rectangle(p.x, p.y, 4, p.h - 4, edgeColor, 0.8);
            } else {
                scene.add.rectangle(p.x, p.y - p.h / 2 + 2, p.w - 4, 4, edgeColor, 0.85);
            }
        }

        this.goal = EntityFactory.createGoal(scene, config.goal.x, config.goal.y, this.theme?.accent);

        this.materializeTrampolines();
        this.materializeMovingPlatforms();
        this.materializeFragilePlatforms();
        this.materializeHazards();
        this.materializePowerUps();
        this.materializePortals();
    }

    // Libera los tweens y timers de las entidades del nivel. Se invoca al reiniciar
    // o cambiar de escena para que los bucles repeat:-1 no sigan escribiendo sobre
    // objetos que ya no existen.
    destroy() {
        this.goal.destroy();

        for (const trampoline of this.trampolineList) {
            trampoline.destroy();
        }

        for (const fragile of this.fragileList) {
            fragile.destroy();
        }

        for (const powerUp of this.powerUpList) {
            powerUp.destroy();
        }

        for (const portal of this.portalList) {
            portal.destroy();
        }
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

    materializeFragilePlatforms() {
        this.fragilePlatforms = this.scene.physics.add.staticGroup();
        this.fragileList = [];

        for (const f of this.config.fragilePlatforms ?? []) {
            const fragile = EntityFactory.createFragilePlatform(this.scene, f);
            this.fragilePlatforms.add(fragile.rect);
            this.fragileList.push(fragile);
        }
    }

    materializeHazards() {
        this.hazards = this.scene.physics.add.staticGroup();
        this.hazardList = [];

        for (const h of this.config.hazards ?? []) {
            const hazard = EntityFactory.createHazard(this.scene, h);
            this.hazards.add(hazard.rect);
            this.hazardList.push(hazard);
        }
    }

    materializePowerUps() {
        this.powerUps = this.scene.physics.add.group();
        this.powerUpList = [];

        for (const p of this.config.powerUps ?? []) {
            const powerUp = EntityFactory.createPowerUp(this.scene, p);
            this.powerUps.add(powerUp.circle);
            this.powerUpList.push(powerUp);
        }
    }

    // Los portales se vinculan por pares consecutivos en la config. Si la cantidad
// es impar, el ultimo queda sin pareja: se descarta para no dejar un portal
// que al pisarlo intenta teletransportar hacia null.
    materializePortals() {
        this.portals = this.scene.physics.add.group();
        this.portalList = [];

        const portalData = this.config.portals ?? [];
        const paired = portalData.length - (portalData.length % 2);

        for (let i = 0; i + 1 < this.portalList.length; i += 2) {
            this.portalList[i].linked = this.portalList[i + 1];
            this.portalList[i + 1].linked = this.portalList[i];
        }
    }
