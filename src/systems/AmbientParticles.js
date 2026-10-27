import { WORLD } from '../assets/levels';

// Partículas ambientales del tema (themes.js → ambient): motas que suben, bajan o flotan detrás
// de las plataformas. Es un pool fijo de círculos que se reciclan; sin emisores ni texturas.
const DEPTH = -8.9;

export class AmbientParticles
{
    constructor (scene, ambient)
    {
        this.cfg = ambient;
        this.items = [];

        for (let i = 0; i < ambient.count; i++) {
            const dot = scene.add.circle(0, 0, ambient.size * (0.6 + Math.random() * 0.8), ambient.color, ambient.alpha)
                .setScrollFactor(0).setDepth(DEPTH);

            this.items.push({
                dot,
                x: Math.random() * WORLD.width,
                y: Math.random() * WORLD.height,
                speed: 0.6 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // time: ms de juego; deltaMs: lo que pasó desde el frame anterior; still: reducir movimiento.
    update (time, deltaMs, still)
    {
        const { dy, sway } = this.cfg;

        for (const p of this.items) {
            if (!still) {
                p.y += dy * p.speed * (deltaMs / 1000);

                if (p.y < -8) p.y = WORLD.height + 8;
                else if (p.y > WORLD.height + 8) p.y = -8;
            }

            const swayX = still ? 0 : Math.sin(time / 1000 + p.phase) * sway;

            p.dot.setPosition(p.x + swayX, p.y);
        }
    }
}
