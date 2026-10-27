import { WORLD } from '../assets/levels';
import { Settings } from './Settings';

const W = WORLD.width;
const H = 768;
const SLANT = 220;

// Cortina diagonal entre niveles (docs/PLAN_FEEL.md §10, S-2). `cover` tapa la pantalla de
// izquierda a derecha y `reveal` la destapa en el mismo sentido, así que cubrir en una
// escena y destapar en la siguiente se ve como un solo barrido. Con "reducir movimiento"
// se reemplaza por un fundido.
export const Wipe = {
    cover(scene, color, ms, onDone) {
        run(scene, color, ms, true, onDone);
    },

    reveal(scene, color, ms) {
        run(scene, color, ms, false);
    }
};

function run(scene, color, ms, covering, onDone) {
    const g = scene.add.graphics().setScrollFactor(0).setDepth(100);

    // Fundido simple.
    if (Settings.reduceMotion) {
        g.fillStyle(color, 1).fillRect(0, 0, W, H).setAlpha(covering ? 0 : 1);
        scene.tweens.add({
            targets: g, alpha: covering ? 1 : 0, duration: ms,
            onComplete: () => { if (!covering) g.destroy(); onDone?.(); }
        });
        return;
    }

    const t = { e: 0 };

    scene.tweens.add({
        targets: t,
        e: 1,
        duration: ms,
        ease: 'Cubic.easeInOut',
        onUpdate: () => {
            // Borde diagonal "/" que avanza de izquierda a derecha.
            const edge = t.e * (W + 2 * SLANT) - SLANT;

            g.clear();
            g.fillStyle(color, 1);

            if (covering) {
                g.fillPoints([{ x: 0, y: 0 }, { x: edge + SLANT, y: 0 }, { x: edge, y: H }, { x: 0, y: H }], true);
            } else {
                g.fillPoints([{ x: edge + SLANT, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: edge, y: H }], true);
            }

            // Filo brillante en el borde de avance.
            g.fillStyle(0xffffff, 0.55).fillPoints([
                { x: edge + SLANT - 8, y: 0 }, { x: edge + SLANT + 2, y: 0 }, { x: edge + 2, y: H }, { x: edge - 8, y: H }
            ], true);
        },
        onComplete: () => {
            if (!covering) g.destroy();
            onDone?.();
        }
    });
}
