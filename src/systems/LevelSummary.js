import { WORLD } from '../assets/levels';

const PANEL_W = 460;
const ROW_H = 36;
const TITLE_H = 72;
const RANK_H = 74;
const PAD = 22;
const ROW_STAGGER = 90;

// Panel de fin de nivel: oscurece la escena y centra una tarjeta con el título, una fila por
// dato (etiqueta a la izquierda, valor a la derecha) que entran de a una, y el rango al final.
export class LevelSummary
{
    constructor (scene)
    {
        this.scene = scene;
    }

    // rows: [{ label, value, color? }]; rank: { label, text, color }.
    show (title, rows, rank)
    {
        const scene = this.scene;
        const cx = WORLD.width / 2;
        const cy = WORLD.height / 2;
        const height = TITLE_H + rows.length * ROW_H + RANK_H + PAD;
        const top = cy - height / 2;

        const fade = (target, delay, props = {}) => {
            target.setScrollFactor(0).setDepth(60).setAlpha(0);
            scene.tweens.add({ targets: target, alpha: 1, duration: 180, delay, ...props });
        };

        const dim = scene.add.rectangle(cx, cy, WORLD.width, WORLD.height, 0x000000, 0.6)
            .setScrollFactor(0).setDepth(58).setAlpha(0);
        const card = scene.add.rectangle(cx, cy, PANEL_W, height, 0x0b0f1a, 0.92)
            .setStrokeStyle(3, 0xffffff, 0.5).setScrollFactor(0).setDepth(59).setAlpha(0);

        scene.tweens.add({ targets: [dim, card], alpha: 1, duration: 220 });

        const heading = scene.add.text(cx, top + TITLE_H / 2 + 4, title, {
            fontFamily: 'Arial Black', fontSize: 30, color: '#00ff88', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        fade(heading, 120);

        rows.forEach((row, i) => {
            const y = top + TITLE_H + i * ROW_H + ROW_H / 2;
            const style = { fontFamily: 'Arial Black', fontSize: 21, color: row.color ?? '#ffffff', stroke: '#000000', strokeThickness: 4 };
            const label = scene.add.text(cx - PANEL_W / 2 + PAD, y, row.label, style).setOrigin(0, 0.5);
            const value = scene.add.text(cx + PANEL_W / 2 - PAD, y, String(row.value), style).setOrigin(1, 0.5);

            fade(label, 300 + i * ROW_STAGGER);
            fade(value, 300 + i * ROW_STAGGER);
        });

        const medal = scene.add.text(cx, top + height - PAD - RANK_H / 2 + 8, `${rank.label}: ${rank.text}`, {
            fontFamily: 'Arial Black', fontSize: 34, color: rank.color, stroke: '#000000', strokeThickness: 7
        }).setOrigin(0.5).setScale(1.6);

        fade(medal, 300 + rows.length * ROW_STAGGER, { scale: 1, duration: 480, ease: 'Bounce.easeOut' });
    }
}
