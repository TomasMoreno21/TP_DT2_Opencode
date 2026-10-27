import { WORLD } from '../assets/levels';
import { RANK_COLORS } from './Rank';
import { Lang } from './Texts';

const RADIUS = 26;
const GAP = 84;
const POP_STAGGER = 140;

// Resumen de la campaña en la pantalla de victoria: una medalla por nivel (color del rango
// logrado, gris si no llegó al bronce) y debajo el tiempo total y el combo máximo.
// run: { ranks: [rank|null], seconds, maxCombo } (lo arma Game en el registry).
export class CampaignSummary
{
    constructor (scene)
    {
        this.scene = scene;
    }

    show (run, levelCount, y)
    {
        const scene = this.scene;
        const cx = WORLD.width / 2;
        const x0 = cx - ((levelCount - 1) * GAP) / 2;

        for (let i = 0; i < levelCount; i++) {
            const rank = run.ranks[i] ?? null;
            const color = rank ? RANK_COLORS[rank] : 0x3a3a4a;
            const x = x0 + i * GAP;
            const disc = scene.add.circle(x, y, RADIUS, color).setStrokeStyle(3, 0xffffff, rank ? 0.9 : 0.25);
            const num = scene.add.text(x, y, String(i + 1), {
                fontFamily: 'Arial Black', fontSize: 24, color: rank ? '#1b1200' : '#777788'
            }).setOrigin(0.5);

            for (const obj of [disc, num]) {
                obj.setScale(0);
                scene.tweens.add({ targets: obj, scale: 1, duration: 320, delay: 500 + i * POP_STAGGER, ease: 'Back.easeOut' });
            }
        }

        const minutes = Math.floor(run.seconds / 60);
        const seconds = String(run.seconds % 60).padStart(2, '0');
        const line = scene.add.text(cx, y + 56, `${Lang.t('sumTotalTime')}: ${minutes}:${seconds}   ·   ${Lang.t('sumCombo')}: x${run.maxCombo}`, {
            fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0);

        scene.tweens.add({ targets: line, alpha: 1, duration: 300, delay: 500 + levelCount * POP_STAGGER });
    }
}
