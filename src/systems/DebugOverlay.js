import { bus } from './AudioBus';
import { Music } from './Music';

// Overlay de debug solo para desarrollo: F3 lo muestra u oculta. Lee la instancia del
// juego expuesta en window.__game (main.js, solo en DEV) y se refresca 4 veces por segundo.
export function installDebugOverlay(game) {
    // Instancias reales del audio, para medirlas desde la consola en desarrollo.
    window.__audio = { bus, Music };

    const box = document.createElement('pre');

    Object.assign(box.style, {
        position: 'fixed', top: '8px', left: '8px', margin: '0', padding: '8px 10px', zIndex: '9999',
        font: '12px/1.4 ui-monospace, Consolas, monospace', color: '#00ff88', background: 'rgba(0,0,0,0.72)',
        borderRadius: '6px', pointerEvents: 'none', display: 'none', whiteSpace: 'pre'
    });
    document.body.appendChild(box);

    const render = () => {
        const active = game.scene.getScenes(true);
        const lines = [`FPS ${Math.round(game.loop.actualFps)}  (F3 oculta)`];

        for (const scene of active) {
            const list = scene.children.list;
            const emitters = list.filter((o) => o.type === 'ParticleEmitter').length;

            lines.push(`${scene.scene.key}: objetos ${list.length} · emisores ${emitters} · tweens ${scene.tweens.getTweens().length}`);

            if (scene.scene.key === 'Game') {
                lines.push(`música: ${Music.status} · tensión ${scene.tension ? scene.tension.value.toFixed(2) : '-'}`);
                lines.push(`audio: voces ${bus.voices}/${bus.maxVoices}${bus.muted ? ' (silenciado)' : ''}`);
                if (scene.fx) lines.push(`${scene.fx.stats} · bloom ${scene.camFx.bloomActive ? 'sí' : 'no'}`);
                lines.push(`listeners dash ${scene.events.listenerCount('player-dash')} · salto ${scene.events.listenerCount('player-jump')}`);

                const sm = scene.scoreManager;
                if (sm) {
                    lines.push(`combo ${sm.combo} (x${sm.multiplier}) · cadena aérea ${sm.airStreak} · ventana ${Math.round(sm.comboRemaining(scene.time.now) * 100)}%`);
                }
            }
        }

        box.textContent = lines.join('\n');
    };

    // F4: prueba el bloom de pantalla completa (filtro de Phaser 4) sobre la escena de juego.
    window.addEventListener('keydown', (event) => {
        if (event.key !== 'F4') return;

        const scene = game.scene.getScene('Game');

        if (scene?.camFx) {
            event.preventDefault();
            scene.camFx.setBloom(!scene.camFx.bloomActive);
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'F3') {
            event.preventDefault();
            box.style.display = box.style.display === 'none' ? 'block' : 'none';
            if (box.style.display === 'block') render();
        }
    });

    setInterval(() => {
        if (box.style.display !== 'none') render();
    }, 250);
}
