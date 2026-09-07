export class FloatingText {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
    }

    show(x, y, text, color = '#ffdd44', fontSize = 20) {
        let label;

        if (this.pool.length > 0) {
            label = this.pool.pop();
            label.setVisible(true).setActive(true);
        } else {
            label = this.scene.add.text(0, 0, '', {
                fontFamily: 'Arial Black', fontSize: `${fontSize}px`, color,
                stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5);
        }

        label.setText(text);
        label.setColor(color);
        label.setFontSize(`${fontSize}px`);
        label.setPosition(x, y);
        label.setAlpha(1);
        label.setScale(0.5);

        this.scene.tweens.add({
            targets: label,
            y: y - 60,
            scale: 1,
            alpha: 0,
            duration: 700,
            ease: 'Quad.easeOut',
            onComplete: () => {
                label.setVisible(false).setActive(false);
                this.pool.push(label);
            }
        });
    }
}