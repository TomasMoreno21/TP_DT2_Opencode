import { FEEL } from '../assets/feel.js';

// Reduce las señales dispersas de la partida (reloj, combo, proyectiles, meta) a un
// único valor de tensión T ∈ [0, 1] y lo anuncia como evento `tension` cuando cambia.
// No dibuja ni suena: lo escuchan la música y, más adelante, el ambiente
// (docs/PLAN_FEEL.md §7.1). Los pesos viven en assets/feel.js.
export class TensionDirector {
    constructor(scene) {
        this.scene = scene;
        this.value = 0;
        this.lastEmitted = -1;
    }

    update(deltaMs) {
        const { timer, scoreManager, projectileManager } = this.scene;

        if (!timer || !scoreManager) {
            return;
        }

        const total = Math.max(timer.durationMs / 1000, 1);
        const remaining = timer.remainingSeconds;
        const w = FEEL.tension;

        // Reloj: crece despacio al principio y se dispara hacia el final.
        const time = Math.pow(1 - Math.min(Math.max(remaining / total, 0), 1), 1.4);
        // Combo: emoción tanto como peligro (x1 = 0, x5 = 1).
        const combo = Math.min(Math.max(this.scene.seenMult - 1, 0), 4) / 4;
        // Proyectiles vivos, saturado en 4.
        const projectiles = Math.min((projectileManager?.projectiles.length ?? 0) / 4, 1);
        // Meta cumplida: hay que correr a la salida.
        const quota = scoreManager.quotaMet ? 1 : 0;

        let target = w.wTime * time + w.wCombo * combo + w.wProj * projectiles + w.wQuota * quota;

        if (remaining <= 5) {
            target = 1;
        }

        this.value += (target - this.value) * Math.min(1, (w.smooth * deltaMs) / 16.7);

        if (Math.abs(this.value - this.lastEmitted) >= 0.05) {
            this.lastEmitted = this.value;
            this.scene.events.emit('tension', this.value);
        }
    }
}
