// Modificador Niebla: la pantalla se oscurece salvo un círculo alrededor del jugador.
// Objeto de mundo (no de interfaz): sigue el zoom de la cámara principal.
const RADIUS = 250;
const ALPHA = 0.92;
const DEPTH = 30; // por debajo de la interfaz (UI_DEPTH 38 en Game.js)
const MARGIN = 200; // la cámara puede moverse entre cuadros

export class Fog {
    constructor(scene) {
        this.scene = scene;

        if (!scene.textures.exists('fogHole')) {
            const size = RADIUS * 2;
            const tex = scene.textures.createCanvas('fogHole', size, size);
            const ctx = tex.getContext();
            const grad = ctx.createRadialGradient(RADIUS, RADIUS, RADIUS * 0.4, RADIUS, RADIUS, RADIUS);

            grad.addColorStop(0, 'rgba(8,6,20,0)');
            grad.addColorStop(1, `rgba(8,6,20,${ALPHA})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
            tex.refresh();
        }

        this.hole = scene.add.image(0, 0, 'fogHole').setDepth(DEPTH);
        this.rest = scene.add.graphics().setDepth(DEPTH);
    }

    // Cuatro rectángulos opacos cubren todo lo que la cámara ve fuera del cuadrado del círculo.
    update(x, y) {
        const v = this.scene.cameras.main.worldView;
        const left = v.x - MARGIN;
        const top = v.y - MARGIN;
        const right = v.right + MARGIN;
        const bottom = v.bottom + MARGIN;
        const g = this.rest;

        this.hole.setPosition(x, y);
        g.clear().fillStyle(0x080614, ALPHA);
        g.fillRect(left, top, right - left, Math.max(0, y - RADIUS - top));
        g.fillRect(left, y + RADIUS, right - left, Math.max(0, bottom - (y + RADIUS)));
        g.fillRect(left, y - RADIUS, Math.max(0, x - RADIUS - left), RADIUS * 2);
        g.fillRect(x + RADIUS, y - RADIUS, Math.max(0, right - (x + RADIUS)), RADIUS * 2);
    }
}
