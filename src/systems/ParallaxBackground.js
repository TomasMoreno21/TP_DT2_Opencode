import { WORLD } from '../assets/levels';

// Capas de parallax: cielo, siluetas lejanas, partículas/estrellas
// Cada capa se mueve a distinto velocidad según la posición horizontal del jugador.
export class ParallaxBackground {
    constructor(scene, worldWidth, player) {
        this.scene = scene;
        this.worldWidth = worldWidth;
        this.player = player;
        this.layers = [];

        // Capa 1: cielo oscuro degradado (más lento, 4%)
        this.layer1 = scene.add.graphics();
        this.layer1.setScrollFactor(0);
        this.layer1.setDepth(-10);
        this.layers.push({ gfx: this.layer1, speed: 0.04 });

        // Capa 2: siluetas de montañas/distantes (velocidad media, 6%)
        this.layer2 = scene.add.graphics();
        this.layer2.setScrollFactor(0);
        this.layer2.setDepth(-5);
        this.layers.push({ gfx: this.layer2, speed: 0.06 });

        // Capa 3: estrellas/píxeles brillantes (más rápido, 8-10%)
        this.layer3 = scene.add.graphics();
        this.layer3.setScrollFactor(0);
        this.layer3.setDepth(0);
        this.layers.push({ gfx: this.layer3, speed: 0.09 });

        this.update();
    }

    update() {
        const px = this.player ? this.player.rect.x : this.worldWidth / 2;
        const progress = px / this.worldWidth;

        // Limpiar y redibujar todas las capas
        this.layers.forEach(({ gfx, speed }) => {
            gfx.clear();

            // Posición base del desplazamiento basada en la posición del jugador
            const offset = -progress * this.worldWidth * speed;

            if (gfx === this.layer1) {
                // Capa 1: cielo degradado de azul oscuro a negro
                const c1 = 0x0a0a20;
                const c2 = 0x000010;
                const lerpK = speed; // Usar speed como factor de mezcla simple
                const r = (c1 >> 16) + ((c2 >> 16) - (c1 >> 16)) * lerpK;
                const g = ((c1 >> 8) & 0xff) + (((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * lerpK;
                const b = (c1 & 0xff) + ((c2 & 0xff) - (c1 & 0xff)) * lerpK;
                const color = `0x${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

                gfx.fillStyle(color, 1);
                gfx.fillRect(0, 0, this.worldWidth, 768);
            } else if (gfx === this.layer2) {
                // Capa 2: siluetas triangulares de montañas distantes
                gfx.fillStyle(0x1a1a30, 0.8);
                gfx.fillRect(0, 0, this.worldWidth, 768);

                // Dibujar algunas siluetas simples
                gfx.fillStyle(0x2d2d50, 0.5);
                for (let i = 0; i < 5; i++) {
                    const sx = (this.worldWidth / 5) * i + offset * 0.5;
                    const sy = 100 + i * 80;
                    const sw = this.worldWidth / 6;
                    const sh = 50;
                    gfx.fillTriangle(sx, sy + sh, sx + sw / 2, sy, sx + sw, sy + sh);
                }
            } else if (gfx === this.layer3) {
                // Capa 3: puntos de estrella parpadeantes
                gfx.fillStyle(0xffffff, 0.3);
                gfx.fillRect(0, 0, this.worldWidth, 768);

                // Algunas estrellas fugaces
                gfx.fillStyle(0xffdd44, 0.5);
                for (let i = 0; i < 8; i++) {
                    const sx = 100 + (i * 70 + offset * 2) % (this.worldWidth - 200);
                    const sy = 50 + Math.sin(progress * 2 + i) * 30;
                    gfx.fillCircle(sx, sy, 2);
                }
            }
        });
    }
}