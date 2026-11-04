import { WORLD } from '../assets/levels';

export const VOID_CONFIG = {
    startDelayMs: 3000,
    // Cuánto por debajo del borde de la pantalla arranca a verse el vacío.
    edgeInset: 24,
    // Distancia mínima entre el borde superior de la pantalla y el jugador: si trepás más rápido, el escenario te acompaña.
    playerLead: 300,
    color: 0x1a0630,
    edgeColor: 0xff3366,
    glowColor: 0xb0124a,
    depth: 40
};

// El Vacío (nivel final): el escenario sube solo a velocidad constante y su borde inferior mata al
// tocarlo. Si el jugador va más rápido que el escenario, la vista lo sigue (nunca baja).
export class RisingVoid {
    constructor(scene, { worldHeight = WORLD.height, scrollSpeed }) {
        this.scene = scene;
        this.speed = scrollSpeed;
        this.autoTop = worldHeight - WORLD.height;
        this.viewTop = this.autoTop;
        this.top = this.viewTop + WORLD.height - VOID_CONFIG.edgeInset;
        this.elapsedMs = 0;

        const width = WORLD.width + 400;
        this.body = scene.add.rectangle(WORLD.width / 2, this.top + 500, width, 1000, VOID_CONFIG.color, 0.96).setDepth(VOID_CONFIG.depth);
        this.glow = scene.add.rectangle(WORLD.width / 2, this.top - 14, width, 40, VOID_CONFIG.glowColor, 0.35).setDepth(VOID_CONFIG.depth);
        this.edge = scene.add.rectangle(WORLD.width / 2, this.top, width, 4, VOID_CONFIG.edgeColor, 0.95).setDepth(VOID_CONFIG.depth);

        this.pulse = scene.tweens.add({ targets: this.glow, alpha: 0.15, scaleY: 1.8, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Distancia vertical (px) del jugador al borde del vacío: negativa si ya está adentro.
    gapTo(y) {
        return this.top - y;
    }

    // Cuota cumplida: la vista y el borde se quedan donde están (y siguen matando).
    stop() {
        this.stopped = true;
    }

    update(delta, playerY, viewH) {
        if (this.stopped) {
            return;
        }

        this.elapsedMs += delta;

        const scroll = this.elapsedMs > VOID_CONFIG.startDelayMs ? this.speed * delta / 1000 : 0;

        this.autoTop = Math.max(0, Math.min(this.autoTop - scroll, playerY - VOID_CONFIG.playerLead));
        this.viewTop = this.autoTop;
        this.top = this.viewTop + viewH - VOID_CONFIG.edgeInset;
        this.body.y = this.top + 500;
        this.glow.y = this.top - 14;
        this.edge.y = this.top;
    }

    destroy() {
        this.pulse.stop();
        this.pulse.remove();
        this.body.destroy();
        this.glow.destroy();
        this.edge.destroy();
    }
}
