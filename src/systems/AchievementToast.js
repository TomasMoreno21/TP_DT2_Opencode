import { Lang } from './Texts';
import { Audio } from './Audio';

const DEPTH = 41;
const X = 8;
const Y = 128;
const WIDTH = 262;
const HEIGHT = 56;

// Tarjeta de logro fija a la pantalla, bajo el panel de puntaje (arriba a la
// izquierda): no tapa el centro ni los avisos del combo. Los logros que salen
// juntos se encolan y se muestran uno tras otro.
export class AchievementToast {
    constructor(scene) {
        this.scene = scene;
        this.queue = [];
        this.busy = false;

        const panel = scene.add.graphics();
        panel.fillStyle(0x0b0919, 0.88).fillRoundedRect(0, 0, WIDTH, HEIGHT, 14);
        panel.lineStyle(2, 0xffdd44, 1).strokeRoundedRect(0, 0, WIDTH, HEIGHT, 14);

        this.title = scene.add.text(14, 8, '', {
            fontFamily: 'Arial Black', fontSize: '17px', color: '#ffdd44'
        });
        this.detail = scene.add.text(14, 32, '', {
            fontFamily: 'Arial', fontSize: '13px', color: '#d8d8f0'
        });

        this.card = scene.add.container(X, Y, [panel, this.title, this.detail])
            .setScrollFactor(0).setDepth(DEPTH).setVisible(false);
    }

    show(id) {
        this.queue.push(id);

        if (!this.busy) {
            this.next();
        }
    }

    next() {
        const id = this.queue.shift();

        if (!id) {
            this.busy = false;
            return;
        }

        this.busy = true;
        this.title.setText(`★ ${Lang.t('ach_' + id)}`);
        this.detail.setText(Lang.t(`ach_${id}_desc`));
        Audio.play('achievement');

        const still = this.scene.camFx?.reduceMotion;
        const tweens = this.scene.tweens;

        this.card.setVisible(true).setAlpha(still ? 0 : 1).setPosition(still ? X : X - WIDTH - 20, Y);

        tweens.add({
            targets: this.card,
            x: X,
            alpha: 1,
            duration: still ? 150 : 380,
            ease: still ? 'Linear' : 'Back.easeOut',
            onComplete: () => tweens.add({
                targets: this.card,
                alpha: 0,
                delay: 2200,
                duration: 400,
                onComplete: () => {
                    this.card.setVisible(false);
                    this.next();
                }
            })
        });
    }
}
