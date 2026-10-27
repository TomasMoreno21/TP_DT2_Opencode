import { WORLD } from '../assets/levels';
// Resplandor suave sobre los bordes luminosos de las plataformas fijas, del color del tema.
// Se dibuja una vez; en frenesí late con el beat de la música (se vuelve a dibujar solo
// cuando la intensidad cambia lo suficiente).
export class PlatformGlow {
    constructor(scene, level, theme) {
        this.theme = theme;
        this.rects = level.platforms.getChildren().map((r) => ({
            x: r.x, y: r.y, w: r.displayWidth, h: r.displayHeight,
            wall: r.displayHeight > r.displayWidth * 2
        }));
        this.g = scene.add.graphics().setDepth(0.05);
        this.level = -1;
        this.draw(1);
    }

    draw(k) {
        const { g, theme } = this;

        g.clear();

        for (const r of this.rects) {
            if (r.wall) {
                // Pared: franja hacia el interior del mapa.
                const dir = r.x < (WORLD.width / 2) ? 1 : -1;
                const edge = r.x + dir * (r.w / 2);

                g.fillStyle(theme.wall, 0.07 * k).fillRect(dir > 0 ? edge : edge - 10, r.y - r.h / 2, 10, r.h);
                g.fillStyle(theme.wall, 0.12 * k).fillRect(dir > 0 ? edge : edge - 4, r.y - r.h / 2, 4, r.h);
                continue;
            }

            // Plataforma: halo sobre el borde superior en tres capas.
            const top = r.y - r.h / 2;

            g.fillStyle(theme.accent, 0.06 * k).fillRect(r.x - r.w / 2, top - 12, r.w, 12);
            g.fillStyle(theme.accent, 0.1 * k).fillRect(r.x - r.w / 2, top - 7, r.w, 7);
            g.fillStyle(theme.accent, 0.16 * k).fillRect(r.x - r.w / 2, top - 3, r.w, 3);
        }
    }

    // pulse: latido de la música (0..1) solo en frenesí; 0 el resto del tiempo.
    update(pulse) {
        const k = Math.round((1 + pulse * 1.2) * 8) / 8;

        if (k !== this.level) {
            this.level = k;
            this.draw(k);
        }
    }
}
