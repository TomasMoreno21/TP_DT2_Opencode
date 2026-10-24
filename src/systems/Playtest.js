import { Metrics, metricsEnabled } from './Metrics';

// Atajos de playtest (solo en desarrollo o con ?playtest=1; ver docs/PLAYTEST_1.md):
//   F9  → copia al portapapeles el resumen de los niveles jugados.
//   F10 → borra el historial (para empezar una sesión limpia).
export function installPlaytest() {
    if (!metricsEnabled()) {
        return;
    }

    const toast = document.createElement('div');

    Object.assign(toast.style, {
        position: 'fixed', left: '50%', bottom: '18px', transform: 'translateX(-50%)', zIndex: '9999',
        padding: '8px 16px', borderRadius: '99px', background: 'rgba(0,0,0,0.85)', color: '#00ff88',
        font: '600 13px system-ui, sans-serif', opacity: '0', transition: 'opacity .2s', pointerEvents: 'none'
    });
    document.body.appendChild(toast);

    const say = (text) => {
        toast.textContent = text;
        toast.style.opacity = '1';
        clearTimeout(say.timer);
        say.timer = setTimeout(() => { toast.style.opacity = '0'; }, 2200);
    };

    window.addEventListener('keydown', async (event) => {
        if (event.key === 'F9') {
            event.preventDefault();

            try {
                await navigator.clipboard.writeText(Metrics.exportText());
                say(`Métricas copiadas (${Metrics.history().length} niveles)`);
            } catch {
                console.log(Metrics.exportText());
                say('No pude copiar: el resumen quedó en la consola');
            }
        } else if (event.key === 'F10') {
            event.preventDefault();
            Metrics.clear();
            say('Historial de métricas borrado');
        }
    });
}
