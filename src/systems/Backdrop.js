const W = 1024;
const FLOOR_TOP = 712;
const TEX_W = 1152; // más ancho que la pantalla para poder desplazarlo con el parallax

// Generador pseudoaleatorio con semilla: las siluetas son siempre las mismas por tema.
function rng(seed) {
    let a = seed >>> 0;

    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Cordillera lejana: una sola polilínea quebrada rellena hasta abajo.
function drawRidge(g, rand, color) {
    const pts = [{ x: 0, y: 300 }];

    for (let x = 0; x <= TEX_W; x += 48) {
        pts.push({ x, y: 300 - (70 + rand() * 110) });
    }

    pts.push({ x: TEX_W, y: 300 });
    g.fillStyle(color, 0.55).fillPoints(pts, true);
}

// Ciudad en primer plano lejano: torres de distinto ancho con ventanas encendidas.
function drawTowers(g, rand, color, window) {
    let x = 0;

    while (x < TEX_W) {
        const w = 36 + Math.floor(rand() * 40);
        const h = 50 + Math.floor(rand() * 150);

        g.fillStyle(color, 0.85).fillRect(x, 300 - h, w, h);

        for (let wy = 300 - h + 8; wy < 292; wy += 14) {
            for (let wx = x + 6; wx < x + w - 8; wx += 12) {
                if (rand() < 0.18) {
                    g.fillStyle(window, 0.35).fillRect(wx, wy, 4, 6);
                }
            }
        }

        x += w + 6 + Math.floor(rand() * 18);
    }
}

// Fondo en capas con parallax (docs/PLAN_FEEL.md §9, V-1): cielo con degradado del tema,
// cordillera y ciudad lejanas, grilla que late con el beat y estrellas. Las capas siguen la
// posición del jugador entre un 4 y un 10 %, y todo se genera con Graphics (sin assets).
export class Backdrop {
    constructor(scene, theme) {
        this.scene = scene;
        this.theme = theme;

        // Cielo y horizonte.
        const sky = scene.add.graphics().setScrollFactor(0).setDepth(-10);

        sky.fillGradientStyle(theme.bgTop, theme.bgTop, theme.bgBottom, theme.bgBottom, 1);
        sky.fillRect(0, 0, W, 768);
        sky.fillStyle(theme.accent, 0.18).fillRect(0, FLOOR_TOP - 4, W, 3);
        sky.fillStyle(0xffdd44, 0.08).fillRect(0, FLOOR_TOP, W, 8);

        // Siluetas lejanas (texturas generadas una vez por tema).
        this.far = this.skyline('far', theme, (g, rand) => drawRidge(g, rand, theme.far), 7)
            .setDepth(-9.6);
        this.mid = this.skyline('mid', theme, (g, rand) => drawTowers(g, rand, theme.mid, theme.accent), 19)
            .setDepth(-9.3);

        // Grilla: se dibuja una vez y late cambiando su alpha con el beat.
        this.grid = scene.add.graphics().setScrollFactor(0).setDepth(-9.2);
        this.grid.lineStyle(1, theme.accent, 1);
        for (let y = 64; y < 768; y += 64) {
            this.grid.lineBetween(0, y, W, y);
        }
        for (let x = 64; x < W; x += 64) {
            this.grid.lineBetween(x, 0, x, FLOOR_TOP);
        }
        this.grid.setAlpha(0.06);

        // Estrellas.
        if (!scene.textures.exists('neon-star')) {
            const sg = scene.make.graphics({ x: 0, y: 0, add: false });

            sg.fillStyle(0xffffff, 1).fillCircle(8, 12, 2);
            sg.fillStyle(0x00d1b2, 0.9).fillCircle(34, 30, 1.6);
            sg.fillStyle(0xffdd44, 0.9).fillCircle(52, 10, 1.4);
            sg.fillStyle(0xffffff, 0.7).fillCircle(22, 48, 1.2);
            sg.generateTexture('neon-star', 64, 64);
            sg.destroy();
        }

        this.stars = scene.add.tileSprite(512, 384, W, 768, 'neon-star')
            .setScrollFactor(0).setDepth(-9).setAlpha(0.85);
        scene.tweens.add({ targets: this.stars, alpha: 0.55, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    skyline(layer, theme, draw, seed) {
        const key = `skyline-${layer}-${theme.key}`;
        const { scene } = this;

        if (!scene.textures.exists(key)) {
            const g = scene.make.graphics({ x: 0, y: 0, add: false });

            draw(g, rng(seed));
            g.generateTexture(key, TEX_W, 300);
            g.destroy();
        }

        return scene.add.image(512, FLOOR_TOP, key).setOrigin(0.5, 1).setScrollFactor(0);
    }

    // playerX: posición del jugador; pulse: latido de la música (0..1).
    update(time, playerX, pulse) {
        const offset = playerX - 512;
        const still = this.scene.camFx?.reduceMotion;

        this.far.x = 512 - (still ? 0 : offset * 0.04);
        this.mid.x = 512 - (still ? 0 : offset * 0.07);
        this.stars.tilePositionX = (still ? 0 : offset * 0.1);
        this.stars.tilePositionY = time * 0.006;
        this.grid.setAlpha(0.06 + 0.1 * pulse);
    }
}
