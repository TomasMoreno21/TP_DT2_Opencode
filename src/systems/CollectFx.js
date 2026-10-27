import { WORLD } from '../assets/levels';
import { FEEL } from '../assets/feel';
import { Audio } from './Audio';
import { Lang } from './Texts';

// Color por multiplicador x1..x5 (coincide con el chip del combo y el cuerpo del jugador).
const COMBO_COLORS = [0xffdd44, 0xffdd44, 0xff8844, 0xff6622, 0xff4455];
const hex = (color) => `#${color.toString(16).padStart(6, '0')}`;

// Feedback de la recolección (docs/PLAN_FEEL.md §6): hitstop que se acorta con el combo,
// onda, chispas, orbe que vuela al puntaje, aparición guiada del punto siguiente, ruta
// luminosa de la cadena, textos con jerarquía, hitos de racha y aviso de combo por
// vencer. Solo presentación: el puntaje y el combo siguen siendo de ScoreManager.
export class CollectFx {
    constructor(scene) {
        this.scene = scene;
        // La ruta va detrás de las plataformas y por encima del fondo.
        this.route = scene.add.graphics().setDepth(-0.5);
        this.points = [];
        this.nextWarn = 0;
    }

    // Un punto recogido. `next`: el punto que se activa a continuación (puede ser null).
    point({ x, y, color, gained, multiplier, chain, next }) {
        const { fx, hud, floatingText, pace, camFx } = this.scene;
        const m = Math.min(Math.max(multiplier, 1), 5);
        const tint = COMBO_COLORS[m - 1];

        // Hitstop corto que se acorta con el combo; en x5 lo reemplaza un punch de zoom.
        const stop = FEEL.hitstop.point[m - 1];

        if (stop > 0) {
            pace.hitstop(stop);
        } else {
            camFx.punch();
        }

        // Onda y chispas: crecen y se ponen más vistosas con el multiplicador.
        fx.ring(x, y, tint, 36 + (m - 1) * 10, FEEL.fx.ringMs);
        fx.spark(x, y, tint, 4 + m * 2);

        // Orbe que vuela al puntaje.
        const target = hud.scoreAnchor;
        fx.orb(x, y, target.x, target.y, tint, {
            onArrive: () => fx.ring(target.x, target.y, tint, 24, 180)
        });

        // Texto: más grande y del color del combo.
        floatingText.show(x, y - 20, `+${gained}`, hex(tint), 20 + (m - 1) * 3);

        // El punto siguiente "nace" con un trazo desde el que se acaba de tomar.
        if (next) {
            fx.streak(x, y, next.circle.x, next.circle.y, color, 110, 1.5, 0.3);
            fx.ring(next.circle.x, next.circle.y, 0xffffff, 22, 200);
        }

        // Ruta luminosa: arranca de cero cuando la cadena se reinicia.
        if (chain <= 1) {
            this.points = [];
        }

        this.points.push({ x, y });
        this.points = this.points.slice(-4);

        // Hitos de racha.
        if (chain === 5 || chain === 10) {
            floatingText.showBanner((WORLD.width / 2), 230, Lang.t(chain === 5 ? 'streak5' : 'streak10'), hex(tint), 34, 450);
        }
    }

    // Una gema: onda verde y orbe que vuela al reloj (+tiempo).
    gem({ x, y, color, gained }) {
        const { fx, hud, floatingText, pace } = this.scene;

        pace.hitstop(FEEL.hitstop.gem);
        fx.ring(x, y, color, 52, FEEL.fx.ringMs);
        fx.spark(x, y, color, 10);

        const target = hud.timerAnchor;
        fx.orb(x, y, target.x, target.y, color, {
            onArrive: () => fx.ring(target.x, target.y, color, 34, 220)
        });

        floatingText.show(x, y - 24, `+${gained}`, hex(color), 22);
    }

    // Se llama cada frame: dibuja la ruta (se apaga con la ventana del combo) y avisa
    // con un tic suave cuando al combo le queda poco.
    update(remaining, multiplier) {
        const g = this.route.clear();

        if (remaining <= 0 || this.points.length < 2) {
            if (remaining <= 0) this.points = [];
            return;
        }

        const color = COMBO_COLORS[Math.min(Math.max(multiplier, 1), 5) - 1];

        g.lineStyle(3, color, 0.5 * remaining);
        g.beginPath();
        g.moveTo(this.points[0].x, this.points[0].y);
        for (const p of this.points.slice(1)) {
            g.lineTo(p.x, p.y);
        }
        g.strokePath();

        g.fillStyle(color, 0.6 * remaining);
        for (const p of this.points) {
            g.fillCircle(p.x, p.y, 4);
        }

        const now = this.scene.time.now;

        if (multiplier > 1 && remaining < 0.25 && now >= this.nextWarn) {
            this.nextWarn = now + 450;
            Audio.play('comboWarn');
        }
    }
}
