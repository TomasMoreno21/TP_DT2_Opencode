import { Scene } from 'phaser';
import { Audio } from '../systems/Audio';
import { Lang } from '../systems/Texts';

// Menú de pausa: corre encima de Game (que queda en pausa) y le delega las acciones.
export class Pause extends Scene
{
    constructor ()
    {
        super('Pause');
    }

    init (data)
    {
        this.gameScene = data.game;
        this.busy = false;
    }

    create ()
    {
        this.add.rectangle(512, 384, 1024, 768, 0x05040d, 0.65);

        const panel = this.add.graphics();
        panel.fillStyle(0x1b1836, 1).fillRoundedRect(332, 190, 360, 380, 18);
        panel.lineStyle(2, 0x00d1b2, 1).strokeRoundedRect(332, 190, 360, 380, 18);

        this.add.text(512, 240, Lang.t('pauseTitle'), {
            fontFamily: 'Arial Black', fontSize: 34, color: '#00d1b2', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.createButton(322, Lang.t('pauseResume'), 0x00d1b2, '#00382c', () => this.resume());

        if (this.gameScene.canRegenerate) {
            this.newLabel = this.createButton(402, Lang.t('pauseNew'), 0x1b1836, '#ffffff', () => this.regenerate(), 0x00d1b2);
        }

        this.createButton(482, Lang.t('pauseMenu'), 0x1b1836, '#cccccc', () => this.toMenu(), 0x9a94c8);

        this.add.text(512, 540, Lang.t('pauseHint'), {
            fontFamily: 'Arial', fontSize: 14, color: '#9aa4c7'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-ESC', () => this.resume());
    }

    resume ()
    {
        if (this.busy) {
            return;
        }

        this.scene.stop();
        this.gameScene.resumeGame();
    }

    regenerate ()
    {
        if (this.busy) {
            return;
        }

        this.busy = true;
        this.newLabel?.setText(Lang.t('pauseGenerating'));
        this.gameScene.regenerateLevel().then(() => this.scene.stop());
    }

    toMenu ()
    {
        if (this.busy) {
            return;
        }

        this.busy = true;
        this.gameScene.scene.start('MainMenu');
        this.scene.stop();
    }

    createButton (y, text, fill, textColor, onClick, border = 0xffffff)
    {
        const key = `pauseBtn${fill.toString(16)}${border.toString(16)}`;

        if (!this.textures.exists(key)) {
            const g = this.add.graphics();
            g.fillStyle(fill, 1).fillRoundedRect(0, 0, 280, 56, 14);
            g.lineStyle(3, border, 1).strokeRoundedRect(0, 0, 280, 56, 14);
            g.generateTexture(key, 280, 56);
            g.destroy();
        }

        const btn = this.add.image(512, y, key).setInteractive({ useHandCursor: true });
        const label = this.add.text(512, y, text, {
            fontFamily: 'Arial Black', fontSize: 22, color: textColor
        }).setOrigin(0.5);

        btn.on('pointerover', () => btn.setScale(1.05));
        btn.on('pointerout', () => btn.setScale(1));
        btn.on('pointerdown', () => {
            Audio.play('ui');
            onClick();
        });

        return label;
    }
}
