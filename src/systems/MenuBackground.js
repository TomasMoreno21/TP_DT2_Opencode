import { WORLD } from '../assets/levels';
import { Settings } from './Settings';

const W = WORLD.width;
const GROUND_Y = 704;

// Capas de ciudad: color, alto mínimo/máximo de los edificios, ancho, cantidad de ventanas
// encendidas y profundidad de parallax (px que se desplaza con el mouse).
const CITY_LAYERS = [
    { color: 0x1d1a3d, minH: 120, maxH: 230, minW: 50, maxW: 90, windows: 0, depth: 6 },
    { color: 0x181533, minH: 90, maxH: 190, minW: 60, maxW: 110, windows: 14, depth: 12 },
    { color: 0x110e24, minH: 50, maxH: 130, minW: 70, maxW: 130, windows: 16, depth: 22 }
];

const STAR_LAYERS = [
    { count: 22, size: 1.2, alpha: 0.35, depth: 4 },
    { count: 14, size: 1.8, alpha: 0.5, depth: 9 },
    { count: 8, size: 2.6, alpha: 0.65, depth: 16 }
];

// Fondo del menú: cielo con luna, estrellas, ciudad nocturna en tres capas con parallax,
// motas flotantes, estrellas fugaces y el suelo con las gemas. Todo con Graphics (el
// proyecto no usa sprites). "Reducir movimiento" apaga fugaces, motas y titileos.
export class MenuBackground
{
    constructor (scene)
    {
        this.scene = scene;
        this.still = Settings.reduceMotion;
        // { layer, depth } que MainMenu.update() desplaza siguiendo al mouse.
        this.parallaxLayers = [];

        this.drawSky();
        this.drawMoon();
        STAR_LAYERS.forEach((cfg) => this.addStars(cfg));
        CITY_LAYERS.forEach((cfg) => this.addCity(cfg));
        this.drawGround();
        this.addMotes();

        if (!this.still) {
            this.scheduleShootingStar(1500);
        }
    }

    drawSky ()
    {
        const g = this.scene.add.graphics();
        g.fillGradientStyle(0x2b2657, 0x2b2657, 0x141026, 0x141026, 1);
        g.fillRect(0, 0, W, 768);
        // Resplandor del horizonte detrás de la ciudad.
        g.fillStyle(0x00d1b2, 0.05).fillEllipse((WORLD.width / 2), GROUND_Y, 1100, 360);
        g.fillStyle(0x6a4cff, 0.05).fillEllipse((WORLD.width / 2), GROUND_Y, 800, 220);
    }

    drawMoon ()
    {
        const x = 846, y = 118;
        const halo = this.scene.add.circle(x, y, 74, 0xbfd8ff, 0.07);
        this.scene.add.circle(x, y, 52, 0xbfd8ff, 0.1);
        const moon = this.scene.add.circle(x, y, 32, 0xeaf2ff, 0.92);
        this.scene.add.circle(x - 9, y - 6, 7, 0xc7d6f0, 0.55);
        this.scene.add.circle(x + 10, y + 9, 5, 0xc7d6f0, 0.5);

        if (!this.still) {
            this.scene.tweens.add({ targets: halo, scale: 1.12, alpha: 0.12, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        return moon;
    }

    addStars ({ count, size, alpha, depth })
    {
        const layer = this.scene.add.container(0, 0);

        for (let i = 0; i < count; i++) {
            const star = this.scene.add.circle(Math.random() * W, 20 + Math.random() * 520, size, 0xffffff, alpha);

            layer.add(star);

            if (!this.still) {
                this.scene.tweens.add({
                    targets: star, alpha: alpha * 0.25, duration: 900 + Math.random() * 1400,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 1200
                });
            }
        }
        this.parallaxLayers.push({ layer, depth });
    }

    // Una fila de edificios más ancha que la pantalla (el parallax la corre unos px) con
    // ventanas encendidas que titilan y azoteas con antena en algunos.
    addCity ({ color, minH, maxH, minW, maxW, windows, depth })
    {
        const layer = this.scene.add.container(0, 0);
        const g = this.scene.add.graphics();
        const lit = [];
        let x = -50;

        g.fillStyle(color, 1);
        while (x < W + 50) {
            const w = minW + Math.random() * (maxW - minW);
            const h = minH + Math.random() * (maxH - minH);

            g.fillRect(x, GROUND_Y - h, w, h + 4);
            if (Math.random() < 0.35) {
                g.fillRect(x + w / 2 - 1, GROUND_Y - h - 22, 2, 22);
            }
            if (windows) {
                for (let i = 0; i < 4 && lit.length < windows; i++) {
                    if (Math.random() < 0.6) {
                        lit.push({ x: x + 8 + Math.random() * (w - 20), y: GROUND_Y - h + 10 + Math.random() * Math.max(10, h - 30) });
                    }
                }
            }
            x += w + 2 + Math.random() * 8;
        }
        layer.add(g);

        lit.forEach(({ x: wx, y: wy }) => {
            const color = Math.random() < 0.7 ? 0xffdd88 : 0x7ff0e0;
            const win = this.scene.add.rectangle(wx, wy, 5, 7, color, 0.55);

            layer.add(win);
            if (!this.still && Math.random() < 0.5) {
                this.scene.tweens.add({
                    targets: win, alpha: 0.12, duration: 1200 + Math.random() * 2600,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 2000
                });
            }
        });
        this.parallaxLayers.push({ layer, depth });
    }

    drawGround ()
    {
        const ground = this.scene.add.graphics();

        ground.fillStyle(0x0f0d1e, 1).fillRect(0, GROUND_Y, W, 64);
        ground.fillStyle(0x1b1836, 1);
        ground.fillRect((WORLD.width / 2 + -392), 678, 220, 26);
        ground.fillRect((WORLD.width / 2 + 172), 678, 220, 26);
        ground.fillRect((WORLD.width / 2 + -50), 678, 100, 26);
        // Filo de luz sobre las plataformas.
        ground.fillStyle(0x00d1b2, 0.35);
        ground.fillRect((WORLD.width / 2 + -392), 678, 220, 2);
        ground.fillRect((WORLD.width / 2 + 172), 678, 220, 2);
        ground.fillRect((WORLD.width / 2 + -50), 678, 100, 2);

        [[(WORLD.width / 2 + -312), 650], [(WORLD.width / 2 + 312), 650], [(WORLD.width / 2), 650], [(WORLD.width / 2 + -392), 650], [(WORLD.width / 2 + 392), 650]].forEach(([x, y]) => {
            const glow = this.scene.add.circle(x, y, 22, 0x00d1b2, 0.1);
            const dot = this.scene.add.circle(x, y, 12, 0x00d1b2, 0.45);

            if (!this.still) {
                this.scene.tweens.add({
                    targets: [dot, glow], y: y - 18, duration: 1300 + Math.random() * 900,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
                this.scene.tweens.add({ targets: glow, scale: 1.4, alpha: 0.03, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }
        });
    }

    // Motas teal que suben lento y se desvanecen.
    addMotes ()
    {
        if (this.still) {
            return;
        }

        for (let i = 0; i < 18; i++) {
            const mote = this.scene.add.circle(Math.random() * W, 0, 1.5 + Math.random() * 1.5, 0x00d1b2, 0);
            const rise = () => {
                mote.setPosition(Math.random() * W, 560 + Math.random() * 140);
                this.scene.tweens.add({
                    targets: mote, y: mote.y - 200 - Math.random() * 160, x: mote.x + (Math.random() - 0.5) * 80,
                    alpha: { from: 0.5, to: 0 }, duration: 4000 + Math.random() * 4000, ease: 'Sine.easeOut',
                    onComplete: rise
                });
            };

            this.scene.time.delayedCall(Math.random() * 4000, rise);
        }
    }

    scheduleShootingStar (delay)
    {
        this.scene.time.delayedCall(delay, () => {
            this.shootingStar();
            this.scheduleShootingStar(3500 + Math.random() * 4500);
        });
    }

    shootingStar ()
    {
        const x = 100 + Math.random() * 600;
        const y = 30 + Math.random() * 180;
        const streak = this.scene.add.rectangle(x, y, 70, 2, 0xffffff, 0.9).setAngle(28).setDepth(0);

        this.scene.tweens.add({
            targets: streak, x: x + 260, y: y + 140, alpha: 0, scaleX: 0.3, duration: 700, ease: 'Quad.easeIn',
            onComplete: () => streak.destroy()
        });
    }

    // Llamado cada frame por MainMenu.update(): las capas siguen al mouse.
    follow (pointer)
    {
        const nx = pointer.x / W - 0.5;
        const ny = pointer.y / 768 - 0.5;
        const k = this.still ? 0 : 0.06;

        for (const { layer, depth } of this.parallaxLayers) {
            layer.x += (-nx * depth - layer.x) * k;
            layer.y += (-ny * depth * 0.5 - layer.y) * k;
        }
    }
}
