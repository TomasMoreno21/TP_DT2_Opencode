import { Audio } from './Audio';
import { Lang } from './Texts';
import { MenuButton } from './MenuButton';
import { NAME_LENGTH } from './Leaderboard';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SLOT_GAP = 110;

// Entrada de iniciales estilo arcade: ↑/↓ cambian la letra, ←/→ mueven el cursor,
// se puede tipear directo, Enter confirma. También funciona con el mouse.
export class NameEntry
{
    constructor (scene, { x, y, initial, onConfirm })
    {
        this.scene = scene;
        this.onConfirm = onConfirm;
        this.letters = Array.from({ length: NAME_LENGTH }, (_, i) => initial[i] ?? 'A');
        this.cursor = 0;
        this.done = false;

        this.container = scene.add.container(x, y);
        this.slots = [];

        const startX = -((NAME_LENGTH - 1) * SLOT_GAP) / 2;

        for (let i = 0; i < NAME_LENGTH; i++) {
            const sx = startX + i * SLOT_GAP;
            const letter = scene.add.text(sx, 0, this.letters[i], {
                fontFamily: 'Arial Black', fontSize: 88, color: '#ffffff', stroke: '#000000', strokeThickness: 8
            }).setOrigin(0.5);
            const underline = scene.add.rectangle(sx, 58, 76, 8, 0x00d1b2, 1);
            const up = this.arrow(sx, -72, '▲', () => this.select(i) || this.cycle(1));
            const down = this.arrow(sx, 88, '▼', () => this.select(i) || this.cycle(-1));

            letter.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.select(i));
            this.container.add([letter, underline, up, down]);
            this.slots.push({ letter, underline });
        }

        this.okButton = new MenuButton(scene, {
            x: 0, y: 190, w: 260, h: 60, label: Lang.t('entryOk'), style: 'primary', delay: 150,
            onClick: () => this.confirm()
        });
        this.okButton.text.setFontSize(26);
        this.okButton.setActive(true);
        this.container.add(this.okButton.root);

        this.onKey = (event) => this.handleKey(event);
        scene.input.keyboard.on('keydown', this.onKey);

        // Cursor titilante: el subrayado de la letra activa late.
        this.blink = { v: 1 };
        this.cursorTween = scene.tweens.add({
            targets: this.blink, v: 0.3, duration: 420, yoyo: true, repeat: -1,
            onUpdate: () => this.slots[this.cursor]?.underline.setAlpha(this.blink.v)
        });

        this.refresh();
    }

    arrow (x, y, glyph, onClick)
    {
        return this.scene.add.text(x, y, glyph, {
            fontFamily: 'Arial', fontSize: 26, color: '#00d1b2'
        }).setOrigin(0.5).setPadding(14, 8)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { Audio.play('ui'); onClick(); })
            .on('pointerover', function () { this.setColor('#ffffff'); })
            .on('pointerout', function () { this.setColor('#00d1b2'); });
    }

    select (index)
    {
        this.cursor = index;
        this.refresh();
    }

    cycle (step)
    {
        const i = CHARSET.indexOf(this.letters[this.cursor]);
        this.letters[this.cursor] = CHARSET[(i + step + CHARSET.length) % CHARSET.length];
        this.refresh();
    }

    move (step)
    {
        this.cursor = Math.max(0, Math.min(NAME_LENGTH - 1, this.cursor + step));
        this.refresh();
    }

    handleKey (event)
    {
        if (this.done) {
            return;
        }

        const key = event.key;

        if (key === 'ArrowUp') this.cycle(1);
        else if (key === 'ArrowDown') this.cycle(-1);
        else if (key === 'ArrowLeft') this.move(-1);
        else if (key === 'ArrowRight') this.move(1);
        else if (key === 'Enter') this.confirm();
        else if (key === 'Backspace') {
            this.letters[this.cursor] = 'A';
            this.move(-1);
        } else if (/^[a-z0-9]$/i.test(key)) {
            this.letters[this.cursor] = key.toUpperCase();
            this.move(1);
        } else {
            return;
        }

        Audio.play('ui');
    }

    refresh ()
    {
        this.slots.forEach(({ letter, underline }, i) => {
            letter.setText(this.letters[i]);
            letter.setColor(i === this.cursor ? '#ffdd44' : '#ffffff');
            underline.setFillStyle(i === this.cursor ? 0x00d1b2 : 0x3a3a5c, 1);
            underline.setAlpha(1);
        });
    }

    confirm ()
    {
        if (this.done) {
            return;
        }

        this.done = true;
        this.destroy();
        this.onConfirm(this.letters.join(''));
    }

    destroy ()
    {
        this.scene.input.keyboard.off('keydown', this.onKey);
        this.cursorTween?.stop();
        this.container.destroy();
    }
}
