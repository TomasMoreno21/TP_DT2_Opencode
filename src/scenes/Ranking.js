import { Scene } from 'phaser';
import { Leaderboard } from '../systems/Leaderboard';
import { createRankingTable } from '../systems/RankingTable';
import { MenuButton } from '../systems/MenuButton';
import { Audio } from '../systems/Audio';
import { Lang } from '../systems/Texts';

// Pantalla del ranking local, accesible desde el menú.
export class Ranking extends Scene
{
    constructor ()
    {
        super('Ranking');
    }

    init (data)
    {
        this.campaignSeed = data.campaignSeed ?? null;
        this.confirmClear = false;
    }

    create ()
    {
        Lang.init();
        this.cameras.main.setBackgroundColor(0x16132a);

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x232045, 0x232045, 0x141026, 0x141026, 1);
        bg.fillRect(0, 0, 1024, 768);

        this.add.text(512, 52, Lang.t('rankingTitle'), {
            fontFamily: 'Arial Black', fontSize: 44, color: '#ffdd44',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        const entries = Leaderboard.get();
        const table = createRankingTable(this, 512, 100, entries).setAlpha(0);
        this.tweens.add({ targets: table, alpha: 1, y: 96, duration: 350, ease: 'Cubic.easeOut' });

        if (entries.length === 0) {
            this.add.text(512, 330, Lang.t('rankingEmpty'), {
                fontFamily: 'Arial Black', fontSize: 22, color: '#cccccc',
                stroke: '#000000', strokeThickness: 5
            }).setOrigin(0.5);
        }

        this.backButton = new MenuButton(this, {
            x: 512, y: 640, w: 300, h: 64, label: Lang.t('rankingBack'), style: 'primary', delay: 250,
            onClick: () => this.back()
        });
        this.backButton.text.setFontSize(28);
        this.backButton.setActive(true);

        if (entries.length > 0) {
            this.clearButton = new MenuButton(this, {
                x: 884, y: 738, w: 200, h: 34, label: Lang.t('rankingClear'), style: 'ghost', delay: 400,
                onClick: () => this.clear()
            });
        }

        this.input.keyboard.on('keydown-ESC', () => this.back());
        this.input.keyboard.on('keydown-ENTER', () => this.back());
        this.input.keyboard.on('keydown-SPACE', () => this.back());
    }

    // Borrar pide confirmación con un segundo clic.
    clear ()
    {
        if (!this.confirmClear) {
            this.confirmClear = true;
            this.clearButton.setLabel(Lang.t('rankingClearSure'));
            this.time.delayedCall(3000, () => {
                this.confirmClear = false;
                this.clearButton?.text.active && this.clearButton.setLabel(Lang.t('rankingClear'));
            });
            return;
        }

        Leaderboard.clear();
        this.scene.restart({ campaignSeed: this.campaignSeed });
    }

    back ()
    {
        Audio.play('ui');
        this.scene.start('MainMenu', { campaignSeed: this.campaignSeed });
    }
}
