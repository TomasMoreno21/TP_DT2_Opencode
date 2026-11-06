// Iris entre niveles: la pantalla se cierra (o se abre) en un círculo sobre el jugador.
// Va en la cámara de interfaz (scrollFactor 0 y depth >= UI_DEPTH de Game.js), así no sufre el zoom.
// `getPos` devuelve la posición del jugador en pantalla; se lee en cada cuadro porque la cámara lo sigue.
const R = 256;
const DEPTH = 200;
const MIN_SCALE = 0.02;

function ensureTexture(scene) {
    if (scene.textures.exists('irisHole')) {
        return;
    }

    const tex = scene.textures.createCanvas('irisHole', R * 2, R * 2);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(R, R, R * 0.8, R, R, R);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, R * 2, R * 2);
    ctx.globalCompositeOperation = 'destination-out';
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, R * 2, R * 2);
    tex.refresh();
}

function run(scene, getPos, ms, closing, color, onDone) {
    ensureTexture(scene);

    const W = scene.scale.width;
    const H = scene.scale.height;
    const img = scene.add.image(0, 0, 'irisHole').setScrollFactor(0).setDepth(DEPTH).setTint(color);
    const g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    // Escala con la que el hueco ya cubre la pantalla desde cualquier punto.
    const full = Math.hypot(W, H) / (R * 0.8) + 0.2;
    const t = { e: 0 };

    const draw = () => {
        const { x, y } = getPos();
        const e = closing ? 1 - t.e : t.e;
        const s = MIN_SCALE + (full - MIN_SCALE) * e * e;
        const half = R * s;

        img.setPosition(x, y).setScale(s);
        g.clear().fillStyle(color, 1);
        g.fillRect(0, 0, W, Math.max(0, y - half));
        g.fillRect(0, y + half, W, Math.max(0, H - (y + half)));
        g.fillRect(0, y - half, Math.max(0, x - half), half * 2);
        g.fillRect(x + half, y - half, Math.max(0, W - (x + half)), half * 2);
    };

    draw();
    scene.tweens.add({
        targets: t,
        e: 1,
        duration: ms,
        ease: 'Cubic.easeInOut',
        onUpdate: draw,
        onComplete: () => {
            if (closing) {
                img.setVisible(false);
                g.clear().fillStyle(color, 1).fillRect(0, 0, W, H);
            } else {
                img.destroy();
                g.destroy();
            }

            onDone?.();
        }
    });
}

export const Iris = {
    close: (scene, getPos, ms, color, onDone) => run(scene, getPos, ms, true, color, onDone),
    open: (scene, getPos, ms, color) => run(scene, getPos, ms, false, color)
};
