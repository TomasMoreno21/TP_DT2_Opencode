import { FEEL } from '../assets/feel.js';

const SCARF_COLOR = 0xff5fa2;
const SCARF_WIDTHS = [6, 5, 3.5];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Aspecto y feedback del jugador: sombra, cara con expresiones, aura por combo, antena,
// bufanda, piecitos, polvo, derrape y estelas de velocidad. Es solo presentación: no
// toca la física ni el cuerpo de colisión (que sigue siendo el rectángulo de Player).
// No importa Phaser, así que Player.js sigue cargándose desde node (validador de niveles).
export class PlayerFx {
    constructor(scene, player, cfg) {
        this.scene = scene;
        this.player = player;
        this.cfg = cfg;

        // La sombra se crea antes que el cuerpo para quedar por debajo de él (y por
        // encima de las plataformas, que se crearon antes).
        this.shadow = scene.add.graphics().setDepth(0);

        this.lookX = 0;
        this.lookY = 0;
        this.nextBlink = 2000;
        this.blinkUntil = 0;
        this.happyUntil = 0;
        this.alertUntil = 0;
        this.nextAlertCheck = 0;
        this.nextRunDust = 0;
        this.nextGhost = 0;
        this.nextSkid = 0;
        this.nextWallSpark = 0;
        this.nextLine = 0;
        this.nextEmber = 0;
        this.antPulse = 1;
        this.ant = { x: 0, y: -13, vx: 0, vy: 0 };
        this.scarf = null;
    }

    // Se llama cuando el cuerpo (player.rect) ya existe.
    attach() {
        const { scene, player } = this;
        const { x, y } = player.rect;

        // Glow neón detrás del cuerpo.
        this.glow = scene.add.rectangle(x, y, this.cfg.width + 14, this.cfg.height + 14, this.cfg.color, 0.16);
        this.glow.setStrokeStyle(2, this.cfg.color, 0.35);
        this.glow.setDepth(-1);

        // Antena, bufanda y piecitos se dibujan en un solo Graphics sobre el cuerpo.
        this.acc = scene.add.graphics().setDepth(0.5);

        // Ojos que miran según el movimiento y la situación.
        this.eyeL = scene.add.circle(x - 7, y - 8, 6, 0xffffff).setDepth(1);
        this.eyeR = scene.add.circle(x + 7, y - 8, 6, 0xffffff).setDepth(1);
        this.pupilL = scene.add.circle(x - 7, y - 8, 2.8, 0x111122).setDepth(2);
        this.pupilR = scene.add.circle(x + 7, y - 8, 2.8, 0x111122).setDepth(2);
        // Cara de texto: >_< al dañarse, ^_^ al recoger, °o° en pánico. Reemplaza a los ojos.
        this.mood = scene.add.graphics().setDepth(3);
        this.face = scene.add.text(x, y - 8, '', {
            fontFamily: 'Arial Black', fontSize: 24, color: '#111122'
        }).setOrigin(0.5).setDepth(3).setVisible(false);

        // Eventos del jugador: se quitan solos al apagarse la escena.
        scene.listen('player-jump', (kind) => this.onJump(kind));
        scene.listen('player-land', (vy) => this.onLand(vy));
        scene.listen('point-collected', () => this.onCollect());
    }

    // Muerte: el cuerpo y todos sus adornos desaparecen y estallan en fragmentos.
    shatter() {
        const rect = this.player.rect;

        this.hidden = true;
        this.scene.fx.shatter(rect.x, rect.y, rect.fillColor ?? this.cfg.color, 16);

        for (const o of [rect, this.glow, this.acc, this.eyeL, this.eyeR, this.pupilL, this.pupilR, this.face, this.mood, this.shadow]) {
            o.setVisible(false);
        }
    }

    update(deltaMs) {
        if (this.hidden) {
            return;
        }

        const dt = Math.min(deltaMs, 50) / 1000;
        const now = this.scene.time.now;
        const speedK = Math.min(Math.abs(this.player.body.velocity.x) / this.cfg.speed, 1);

        this.updateGlow(now, speedK);
        this.updateFace(now, speedK);
        this.updateShadow();
        this.updateAccessories(dt, now, speedK);
        this.updateMotionFx(now, speedK);
    }

    // --- Aura -----------------------------------------------------------------

    // El glow copia el color del cuerpo (combo / wall grab), se estira con la velocidad
    // y crece y late con el multiplicador: en x4 y x5 suelta brasas.
    updateGlow(now, speedK) {
        const { player } = this;
        const rect = player.rect;
        const auraK = (player.multiplier - 1) / 4;
        const pulse = player.multiplier >= 5 ? 1 + 0.07 * Math.sin(now / 110) : 1;
        const grow = (1 + auraK * 0.25) * pulse;

        this.glow.setPosition(rect.x + player.facing * speedK * 6, rect.y);
        this.glow.setScale(rect.scaleX * (1 + speedK * 0.3) * grow, rect.scaleY * grow);

        if (rect.fillColor !== undefined) {
            this.glow.setFillStyle(rect.fillColor, (player.isDashing ? 0.24 : 0.14) + auraK * 0.12);
            this.glow.setStrokeStyle(2, rect.fillColor, 0.3 + auraK * 0.3);
        }

        if (player.multiplier >= 4 && now >= this.nextEmber) {
            this.nextEmber = now + 130;
            this.scene.fx.ember(rect.x + (Math.random() - 0.5) * 26, rect.y - 20, rect.fillColor);
        }
    }

    // --- Cara -----------------------------------------------------------------

    // Proyectil más cercano dentro del radio de alerta, o null (se evalúa cada 100 ms).
    nearestThreat(now) {
        if (now < this.nextAlertCheck) {
            return this.threat ?? null;
        }

        this.nextAlertCheck = now + 100;
        this.threat = null;

        const list = this.scene.projectileManager?.projectiles;
        const { x, y } = this.player.rect;
        let best = FEEL.player.alertDistance;

        for (const projectile of list ?? []) {
            if (!projectile.circle.active) continue;
            const d = Math.hypot(projectile.circle.x - x, projectile.circle.y - y);
            if (d < best) {
                best = d;
                this.threat = projectile.circle;
            }
        }

        return this.threat;
    }

    updateFace(now, speedK) {
        const { player } = this;
        const rect = player.rect;
        const timer = this.scene.timer;
        const hurting = now < player.flinchUntil;
        const happy = now < this.happyUntil;
        const panic = !this.scene.gameEnded && timer && timer.remainingSeconds <= FEEL.player.panicSeconds && timer.remainingSeconds > 0;
        const threat = this.nearestThreat(now);
        const dashing = player.isDashing;

        // Mirada suavizada: hacia el movimiento, o hacia la amenaza si hay una cerca.
        let targetX = clamp(player.body.velocity.x / this.cfg.speed, -1, 1) * 2 + player.facing * 1.5;
        let targetY = clamp(player.body.velocity.y / 460, -1, 1) * 1.5;

        if (threat) {
            targetX = clamp((threat.x - rect.x) / 40, -1, 1) * 2.6;
            targetY = clamp((threat.y - rect.y) / 40, -1, 1) * 2.6;
        }

        this.lookX += (targetX - this.lookX) * 0.18;
        this.lookY += (targetY - this.lookY) * 0.18;

        if (now >= this.nextBlink) {
            this.blinkUntil = now + 140;
            this.nextBlink = now + 1200 + Math.random() * 1500;
        }

        const faceFwd = player.facing * speedK * 6;
        const ex = rect.x + faceFwd;
        const ey = rect.y - 8 * rect.scaleY;
        const jitter = panic ? (Math.random() - 0.5) * 1.6 : 0;

        // Texto que reemplaza a los ojos: daño y alegría tienen prioridad.
        const text = hurting ? '>_<' : '';
        this.face.setText(text).setPosition(ex, ey).setVisible(Boolean(text));

        // Ojos: grandes en alerta y pánico, entornados al dashear, cerrados al parpadear.
        const wide = (threat || panic) ? 1.25 : 1;
        const openY = (now < this.blinkUntil ? 0.08 : (dashing ? 0.5 : 1)) * wide;
        const showEyes = !text && !happy;

        this.drawHappy(happy, now, ex, ey);

        this.eyeL.setPosition(ex - 7 + this.lookX * 0.5 + jitter, ey + this.lookY * 0.5).setScale(wide, openY).setVisible(showEyes);
        this.eyeR.setPosition(ex + 7 + this.lookX * 0.5 + jitter, ey + this.lookY * 0.5).setScale(wide, openY).setVisible(showEyes);
        this.pupilL.setPosition(ex - 7 + this.lookX + jitter, ey + this.lookY).setScale(1, openY).setVisible(showEyes);
        this.pupilR.setPosition(ex + 7 + this.lookX + jitter, ey + this.lookY).setScale(1, openY).setVisible(showEyes);
    }

    // Cara de alegría al recoger: ojos en arco, sonrisa y mejillas, con un saltito al empezar.
    drawHappy(happy, now, ex, ey) {
        const g = this.mood.clear();

        if (!happy) return;

        const k = Math.min(1, (this.happyUntil - now) / FEEL.player.happyMs);
        const pop = Math.max(0, k - 0.6) / 0.4;
        const y = ey - pop * 2;
        const arc = (cx, cy, r, from, to) => g.beginPath().arc(cx, cy, r, from, to).strokePath();

        g.fillStyle(0xff8fb8, 0.9 * Math.min(1, k * 2));
        g.fillEllipse(ex - 13, y + 6, 6, 4).fillEllipse(ex + 13, y + 6, 6, 4);

        g.lineStyle(2.6, 0x111122, 1);
        arc(ex - 7, y + 3, 4.5, Math.PI * 1.1, Math.PI * 1.9);
        arc(ex + 7, y + 3, 4.5, Math.PI * 1.1, Math.PI * 1.9);
        arc(ex, y + 4, 5.5 + pop, Math.PI * 0.15, Math.PI * 0.85);
    }

    // --- Sombra ---------------------------------------------------------------

    // Superficie más cercana debajo de los pies (plataformas fijas, móviles y trampolines).
    groundBelow(x, bottom) {
        const level = this.scene.level;
        let best = Infinity;

        for (const group of [level.platforms, level.movingPlatforms, level.trampolines, level.fragilePlatforms]) {
            if (!group) continue;

            for (const o of group.getChildren()) {
                const top = o.y - o.displayHeight / 2;
                const half = o.displayWidth / 2;

                if (x >= o.x - half && x <= o.x + half && top >= bottom - 8 && top < best) {
                    best = top;
                }
            }
        }

        return best;
    }

    updateShadow() {
        const rect = this.player.rect;
        const bottom = rect.y + (this.cfg.height * rect.scaleY) / 2;
        const ground = this.groundBelow(rect.x, bottom);
        const g = this.shadow.clear();

        if (!Number.isFinite(ground)) {
            return;
        }

        // Cuanto más alto, más chica y más tenue.
        const k = clamp(1 - (ground - bottom) / 420, 0.3, 1);

        g.fillStyle(0x000000, 0.38 * k).fillEllipse(rect.x, ground + 1, 30 * k + 4, 6 * k + 2);
    }

    // --- Antena y bufanda ------------------------------------------

    updateAccessories(dt, now, speedK) {
        const { player } = this;
        const rect = player.rect;
        const vx = player.body.velocity.x;
        const vy = player.body.velocity.y;
        const sx = rect.scaleX;
        const sy = rect.scaleY;
        const fill = rect.fillColor ?? this.cfg.color;
        const g = this.acc.clear();
        const top = rect.y - (this.cfg.height * sy) / 2;

        // Antena con resorte: se queda atrás al correr, sube al caer y se dobla al subir.
        const bx = rect.x + player.facing * 2;
        const by = top;
        const tx = clamp(-vx * 0.03, -12, 12);
        const ty = -13 - clamp(vy / 500, -1, 1) * 5;

        this.ant.vx = (this.ant.vx + (tx - this.ant.x) * 0.35) * 0.65;
        this.ant.vy = (this.ant.vy + (ty - this.ant.y) * 0.35) * 0.65;
        this.ant.x += this.ant.vx;
        this.ant.y += this.ant.vy;
        this.antPulse += (1 - this.antPulse) * 0.18;

        g.lineStyle(2, 0xffffff, 0.9).lineBetween(bx, by, bx + this.ant.x, by + this.ant.y);
        g.fillStyle(fill, 1).fillCircle(bx + this.ant.x, by + this.ant.y, 3.6 * this.antPulse);
        g.lineStyle(1.5, 0xffffff, 1).strokeCircle(bx + this.ant.x, by + this.ant.y, 3.6 * this.antPulse);

        // Bufanda: 4 nodos que siguen al cuello y flamean hacia atrás.
        const ax = rect.x - player.facing * 12 * sx;
        const ay = rect.y + 3 * sy;

        if (!this.scarf) {
            this.scarf = Array.from({ length: 4 }, () => ({ x: ax, y: ay }));
        }

        const back = Math.abs(vx) > 15 ? -Math.sign(vx) : -player.facing;
        const reach = 7 + speedK * 9;

        this.scarf[0].x = ax;
        this.scarf[0].y = ay;
        for (let i = 1; i < this.scarf.length; i++) {
            const prev = this.scarf[i - 1];
            const flutter = Math.sin(now * 0.022 + i * 1.4) * (1 + speedK * 3);
            const wantX = prev.x + back * reach;
            const wantY = prev.y + 3 + clamp(vy * 0.006, -4, 5) + flutter;

            this.scarf[i].x += (wantX - this.scarf[i].x) * 0.4;
            this.scarf[i].y += (wantY - this.scarf[i].y) * 0.4;
        }

        for (let i = 0; i < this.scarf.length - 1; i++) {
            g.lineStyle(SCARF_WIDTHS[i], SCARF_COLOR, 1)
                .lineBetween(this.scarf[i].x, this.scarf[i].y, this.scarf[i + 1].x, this.scarf[i + 1].y);
        }
    }

    // --- Polvo, derrape, estelas y líneas de velocidad ------------------------

    updateMotionFx(now, speedK) {
        const { player, scene } = this;
        const rect = player.rect;
        const fx = scene.fx;
        const vx = player.body.velocity.x;
        const vy = player.body.velocity.y;
        const feetY = rect.y + (this.cfg.height * rect.scaleY) / 2;
        const grounded = player.body.blocked.down;

        // Polvo al correr a buena velocidad.
        if (grounded && speedK > FEEL.player.runDustMinK && now >= this.nextRunDust) {
            this.nextRunDust = now + FEEL.player.runDustEveryMs;
            fx.dustSide(rect.x - Math.sign(vx) * 10, feetY, -Math.sign(vx), 2);
        }

        // Derrape al invertir la dirección corriendo.
        if (player.turning && now >= this.nextSkid) {
            this.nextSkid = now + FEEL.player.skidEveryMs;
            this.scene.events.emit('player-skid');
            fx.spark(rect.x, feetY, 0xffffff, 2, { min: -150, max: -30 });
            fx.dustSide(rect.x, feetY, Math.sign(vx), 2);
        }

        // Pared: chispas al agarrarse.
        if (player.wallGrabbing && now >= this.nextWallSpark) {
            this.nextWallSpark = now + 130;
            const side = player.wallSide === 'left' ? -1 : 1;
            fx.spark(rect.x + side * 16, rect.y + (Math.random() - 0.5) * 30, 0x00ff88, 2);
        }

        // Estela tenue a toda velocidad (el dash tiene la suya, más marcada).
        const fast = Math.abs(vx) > this.cfg.speed * 0.85 || Math.abs(vy) > 520;
        if (fast && !player.isDashing && now >= this.nextGhost) {
            this.nextGhost = now + FEEL.player.speedGhostEveryMs;
            fx.ghost(rect, { alpha: FEEL.player.speedGhostAlpha, ms: 180, stroke: 0 });
        }

        // Líneas de velocidad: al dashear (horizontales) y al caer rápido (verticales).
        if (now >= this.nextLine) {
            if (player.isDashing) {
                this.nextLine = now + 45;
                const dir = player.dashDir;
                for (let i = 0; i < 2; i++) {
                    const y = rect.y + (Math.random() - 0.5) * 44;
                    const x = rect.x - dir * (24 + Math.random() * 12);
                    fx.streak(x, y, x - dir * (40 + Math.random() * 40), y, 0xffffff, 150, 2);
                }
            } else if (speedK > 0.92 && !player.turning) {
                // A tope de velocidad: líneas finas hacia atrás.
                this.nextLine = now + 70;
                const dir = Math.sign(vx);
                const y = rect.y + (Math.random() - 0.5) * 40;
                const x = rect.x - dir * (22 + Math.random() * 10);

                fx.streak(x, y, x - dir * (28 + Math.random() * 28), y, 0xffffff, 120, 1.5, 0.45);
            } else if (vy > 600) {
                this.nextLine = now + 60;
                const x = rect.x + (Math.random() - 0.5) * 36;
                const y = rect.y - 30;
                fx.streak(x, y, x, y - (36 + Math.random() * 30), 0xffffff, 140, 2);
            }
        }
    }

    // --- Eventos --------------------------------------------------------------

    onJump(kind) {
        const rect = this.player.rect;
        const fx = this.scene.fx;
        const feetY = rect.y + (this.cfg.height * rect.scaleY) / 2;

        if (kind === 'wall') {
            const side = this.player.wallSide === 'left' ? -1 : 1;
            fx.spark(rect.x + side * 16, rect.y, 0x00ff88, 6, { min: side > 0 ? 150 : -30, max: side > 0 ? 210 : 30 });
            return;
        }

        fx.dustSide(rect.x - 8, feetY, -1, 2);
        fx.dustSide(rect.x + 8, feetY, 1, 2);
    }

    // vy: velocidad vertical previa al aterrizaje. Cuanto más rápida, más polvo y anillo.
    onLand(vy) {
        if (vy < FEEL.player.landMinVy) {
            return;
        }

        const rect = this.player.rect;
        const fx = this.scene.fx;
        const k = clamp(vy / 700, 0, 1);
        const feetY = rect.y + (this.cfg.height * rect.scaleY) / 2;
        const count = 2 + Math.round(k * 5);

        fx.dustSide(rect.x - 10, feetY, -1, count);
        fx.dustSide(rect.x + 10, feetY, 1, count);

        if (k > 0.7) {
            fx.ring(rect.x, feetY, 0xcfd2ff, 30 + k * 20, 200);
        }
    }

    // Cara feliz y pulso de antena al recoger un punto o gema.
    onCollect() {
        this.happyUntil = this.scene.time.now + FEEL.player.happyMs;
        this.antPulse = 1.7;
    }
}
