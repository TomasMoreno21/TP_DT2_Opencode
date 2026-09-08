import { Scene } from 'phaser';
import { HighScore } from '../systems/HighScore';

const COLORS = {
    bgTop: 0x232045,
    bgBottom: 0x141026,
    floor: 0x0f0d1e,
    panel: 0x1b1836,
    panelBorder: 0x2a2a5a,
    teal: '#00d1b2',
    gold: '#ffdd44',
    white: '#ffffff',
    grey: '#cccccc',
    text: '#dddddd'
};

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x16132a);
        this.drawBackground();

        const title = this.add.text(512, 145, 'FAST MOVE', {
            fontFamily: 'Arial Black', fontSize: 80, color: COLORS.teal,
            stroke: '#000000', strokeThickness: 12,
            shadow: { offsetX: 0, offsetY: 6, color: '#004f42', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5);

        this.tweens.add({ targets: title, y: 138, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        this.add.text(512, 228, 'Conseguí la mayor cantidad de puntos en 60 segundos', {
            fontFamily: 'Arial', fontSize: 20, color: COLORS.grey
        }).setOrigin(0.5);

        this.drawControlsPanel();

        this.add.text(512, 510, `Mejor puntaje: ${HighScore.get()}`, {
            fontFamily: 'Arial Black', fontSize: 22, color: COLORS.gold,
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        this.createPlayButton();
    }

    drawBackground () {
        const g = this.add.graphics();
        g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
        g.fillRect(0, 0, 1024, 768);

        g.fillStyle(COLORS.floor, 1);
        g.fillRect(0, 704, 1024, 64);

        g.fillStyle(0x1b1836, 1);
        g.fillRect(120, 678, 220, 26);
        g.fillRect(684, 678, 220, 26);
        g.fillRect(462, 646, 100, 26);

        const spots = [[200, 630], [824, 630], [512, 596], [300, 596], [724, 596]];

        for (const [x, y] of spots) {
            const dot = this.add.circle(x, y, 12, 0x00d1b2, 0.4);
            this.tweens.add({
                targets: dot,
                y: y - 18,
                duration: 1300 + Math.random() * 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    drawControlsPanel () {
        const panel = this.add.graphics();
        panel.fillStyle(COLORS.panel, 1);
        panel.fillRoundedRect(262, 282, 500, 194, 18);
        panel.lineStyle(2, COLORS.panelBorder, 1);
        panel.strokeRoundedRect(262, 282, 500, 194, 18);

        this.add.text(512, 300, 'Controles', {
            fontFamily: 'Arial Black', fontSize: 26, color: COLORS.gold,
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);

        panel.lineStyle(2, COLORS.panelBorder, 1);
        panel.lineBetween(302, 320, 722, 320);

        const rows = [
            ['Mover', 'A / D  o  ← / →'],
            ['Saltar', 'Espacio / W  o  ↑'],
            ['Wall grab', 'Mantené la dirección contra una pared'],
            ['Wall jump', 'Saltá tocando una pared -> lado opuesto']
        ];

        rows.forEach(([action, controls], i) => {
            const y = 346 + i * 32;

            this.add.text(430, y, action, {
                fontFamily: 'Arial', fontSize: 18, color: COLORS.teal, fontStyle: 'bold'
            }).setOrigin(1, 0.5);

            this.add.text(444, y, controls, {
                fontFamily: 'Arial', fontSize: 16, color: COLORS.text,
                wordWrap: { width: 300, useAdvancedWrap: true }, align: 'left'
            }).setOrigin(0, 0.5);
        });
    }

    createPlayButton () {
        if (!this.textures.exists('playButton')) {
            const g = this.add.graphics();
            g.fillStyle(0x00d1b2, 1).fillRoundedRect(0, 0, 280, 80, 20);
            g.lineStyle(5, 0xffffff, 1).strokeRoundedRect(0, 0, 280, 80, 20);
            g.generateTexture('playButton', 280, 80);
            g.destroy();
        }

        const btn = this.add.image(512, 600, 'playButton').setInteractive({ useHandCursor: true });
        const label = this.add.text(512, 600, 'JUGAR', {
            fontFamily: 'Arial Black', fontSize: 34, color: '#00382c'
        }).setOrigin(0.5);

        this.tweens.add({ targets: btn, y: 594, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: label, y: 594, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        btn.on('pointerover', () => {
            btn.setTint(0xccfff5);
            label.setColor('#00150f');
        });

        btn.on('pointerout', () => {
            btn.clearTint();
            label.setColor('#00382c');
        });

        btn.on('pointerdown', () => {
            this.tweens.killTweensOf(btn);
            this.tweens.killTweensOf(label);
            btn.setScale(0.93);
            label.setScale(0.93);
            this.time.delayedCall(140, () => this.scene.start('Game'));
        });
    }
}