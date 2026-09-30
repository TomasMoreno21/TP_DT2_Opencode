export const PROJECTILE_CONFIG = {
    radius: 8,
    color: 0xff4455,
    homingColor: 0xff8822,
    ricochetColor: 0xffcc00,
    rastraColor: 0xff66aa,
    homingDurationMs: 500,
    homingSpeed: 90,
    minStraightSpeed: 90,
    maxSpeed: 360,
    acceleration: 500,
    ricochetMaxLifeMs: 8000,
    rastraTrailEveryMs: 90,
    rastraTrailLifeMs: 320
};

const HOMING_DURATION_RASTRA = PROJECTILE_CONFIG.homingDurationMs * 0.7;

class StandardBehavior {
    constructor(projectile) {
        this.phase = 'homing';
        this.homingTimer = 0;
        this.projectile = projectile;
    }

    update(deltaMs) {
        const p = this.projectile;

        if (this.phase === 'homing') {
            this.homingTimer += deltaMs;

            const dx = p.target.x - p.circle.x;
            const dy = p.target.y - p.circle.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0) {
                p.circle.body.setVelocity(dx / dist * PROJECTILE_CONFIG.homingSpeed, dy / dist * PROJECTILE_CONFIG.homingSpeed);
            }

            if (this.homingTimer >= PROJECTILE_CONFIG.homingDurationMs) {
                this.phase = 'line';
                p.circle.setFillStyle(PROJECTILE_CONFIG.color);

                const v = p.circle.body.velocity;
                const length = Math.hypot(v.x, v.y) || 1;

                p.direction.x = v.x / length;
                p.direction.y = v.y / length;
                p.speed = PROJECTILE_CONFIG.homingSpeed;
            }
        } else {
            p.speed = Math.min(p.maxSpeed, p.speed + p.acceleration * (deltaMs / 1000));
            p.circle.body.setVelocity(p.direction.x * p.speed, p.direction.y * p.speed);
        }
    }
}

class RicochetBehavior {
    constructor(projectile) {
        this.phase = 'homing';
        this.homingTimer = 0;
        this.projectile = projectile;
    }

    update(deltaMs) {
        const p = this.projectile;

        if (this.phase === 'homing') {
            this.homingTimer += deltaMs;

            const dx = p.target.x - p.circle.x;
            const dy = p.target.y - p.circle.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0) {
                p.circle.body.setVelocity(dx / dist * PROJECTILE_CONFIG.homingSpeed, dy / dist * PROJECTILE_CONFIG.homingSpeed);
            }

            if (this.homingTimer >= PROJECTILE_CONFIG.homingDurationMs) {
                this.phase = 'ricochet';
                p.circle.setFillStyle(PROJECTILE_CONFIG.ricochetColor);
                p.circle.body.setCollideWorldBounds(true);
                p.circle.body.setBounce(1, 1);

                const v = p.circle.body.velocity;
                const length = Math.hypot(v.x, v.y) || 1;

                p.direction.x = v.x / length;
                p.direction.y = v.y / length;
                p.speed = PROJECTILE_CONFIG.homingSpeed;
                p.expireAt = p.spawnTime + PROJECTILE_CONFIG.ricochetMaxLifeMs;
            }
        } else {
            p.speed = Math.min(p.maxSpeed, p.speed + p.acceleration * (deltaMs / 1000));
            p.circle.body.setVelocity(p.direction.x * p.speed, p.direction.y * p.speed);
        }
    }
}

class RastraBehavior {
    constructor(projectile) {
        this.phase = 'homing';
        this.homingTimer = 0;
        this.trailTimer = 0;
        this.projectile = projectile;
    }

    update(deltaMs) {
        const p = this.projectile;

        if (this.phase === 'homing') {
            this.homingTimer += deltaMs;

            const dx = p.target.x - p.circle.x;
            const dy = p.target.y - p.circle.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0) {
                p.circle.body.setVelocity(dx / dist * PROJECTILE_CONFIG.homingSpeed, dy / dist * PROJECTILE_CONFIG.homingSpeed);
            }

            if (this.homingTimer >= HOMING_DURATION_RASTRA) {
                this.phase = 'line';
                p.circle.setFillStyle(PROJECTILE_CONFIG.rastraColor);

                const v = p.circle.body.velocity;
                const length = Math.hypot(v.x, v.y) || 1;

                p.direction.x = v.x / length;
                p.direction.y = v.y / length;
                p.speed = PROJECTILE_CONFIG.homingSpeed;
            }
        } else {
            p.speed = Math.min(p.maxSpeed, p.speed + p.acceleration * (deltaMs / 1000));
            p.circle.body.setVelocity(p.direction.x * p.speed, p.direction.y * p.speed);

            this.trailTimer += deltaMs;

            if (this.trailTimer >= PROJECTILE_CONFIG.rastraTrailEveryMs) {
                this.trailTimer = 0;
                this.spawnTrail();
            }
        }
    }

    spawnTrail() {
        const p = this.projectile;
        const ember = p.scene.add.circle(p.circle.x, p.circle.y, PROJECTILE_CONFIG.radius * 0.7, PROJECTILE_CONFIG.rastraColor, 0.5);

        p.scene.tweens.add({
            targets: ember,
            alpha: 0,
            scale: 0,
            duration: PROJECTILE_CONFIG.rastraTrailLifeMs,
            ease: 'Quad.easeOut',
            onComplete: () => ember.destroy()
        });

        p.trail.push(ember);
    }
}

const BEHAVIORS = {
    standard: (projectile) => new StandardBehavior(projectile),
    ricochet: (projectile) => new RicochetBehavior(projectile),
    rastra: (projectile) => new RastraBehavior(projectile)
};

export class Projectile {
    constructor(scene, x, y, target, speedMultiplier = 1, variant = 'standard') {
        this.scene = scene;
        this.target = target;
        this.spawnTime = scene.time.now;
        this.expireAt = 0;
        this.isAbsorbed = false;
        this.variant = variant;

        this.circle = scene.add.circle(x, y, PROJECTILE_CONFIG.radius, PROJECTILE_CONFIG.homingColor);
        this.circle.setStrokeStyle(2, 0xffc0c0);

        scene.physics.add.existing(this.circle);

        this.maxSpeed = PROJECTILE_CONFIG.maxSpeed * speedMultiplier;
        this.acceleration = PROJECTILE_CONFIG.acceleration;
        this.speed = PROJECTILE_CONFIG.minStraightSpeed;
        this.direction = { x: 0, y: 0 };
        this.trail = [];

        const factory = BEHAVIORS[variant] ?? BEHAVIORS.standard;
        this.behavior = factory(this);
    }

    update(deltaMs) {
        this.behavior.update(deltaMs);
    }

    get isExpired() {
        return this.expireAt > 0 && this.scene.time.now >= this.expireAt;
    }

    isOutOfBounds(margin = 40) {
        const ricochet = this.variant === 'ricochet';

        if (ricochet) {
            return this.isExpired;
        }

        return this.circle.x < -margin || this.circle.x > this.scene.scale.width + margin ||
            this.circle.y < -margin || this.circle.y > this.scene.scale.height + margin;
    }

    destroy() {
        for (const ember of this.trail) {
            ember.destroy();
        }

        this.trail = [];
        this.circle.destroy();
    }
}