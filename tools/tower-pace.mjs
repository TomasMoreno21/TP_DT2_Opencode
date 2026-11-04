import { buildTower, STYLES } from '../src/systems/TowerLevel.js';
import { ALL_LEVELS as LEVELS } from '../src/assets/levels.js';

// Ritmo de la torre: tiempo mínimo que pide cada salto (cinemática del juego) contra el tiempo que da el
// escenario al subir (subida / velocidad). holgura = tiempo dado / tiempo pedido; < 1 es imposible de seguir
// sin ir adelantado. Uso: node tools/tower-pace.mjs [semillas=200] [velocidad=la de TowerLevel]
const SEEDS = Number(process.argv[2] ?? 200);
const G = 900;
const G_FALL = G * 1.35;
const V_JUMP = 500;
const V_BOUNCE = 620;
const V_RUN = 420;
const ACCEL = 600;
const V_CARRY = 250;
const LAND = 0.18;
const PAD = 0.3;
const SPIKE_WAIT = 0.4;

const vertical = (rise, v0) => {
    const apex = (v0 * v0) / (2 * G);
    const t = v0 / G + Math.sqrt((2 * Math.max(apex - rise, 0)) / G_FALL);

    return t;
};
// Tiempo para cubrir d px horizontalmente partiendo con V_CARRY y acelerando hasta V_RUN.
const horizontal = (d) => {
    const tAcc = (V_RUN - V_CARRY) / ACCEL;
    const dAcc = V_CARRY * tAcc + 0.5 * ACCEL * tAcc * tAcc;

    return d <= dAcc ? (-V_CARRY + Math.sqrt(V_CARRY * V_CARRY + 2 * ACCEL * d)) / ACCEL : tAcc + (d - dAcc) / V_RUN;
};

const byStyle = {};
let speed = null;

for (let seed = 1; seed <= SEEDS; seed++) {
    const cfg = buildTower(seed, LEVELS[4]);

    speed = Number(process.argv[3] ?? cfg.scrollSpeed);

    cfg.tower.main.forEach((m, i, list) => {
        const prev = list[i - 1];

        if (!prev) return;

        const v0 = prev.tramp ? V_BOUNCE : V_JUMP;
        let t = Math.max(vertical(m.rise, v0), horizontal(Math.max(m.gap, 0) + 30)) + LAND;

        if (prev.tramp) t += PAD;
        if (m.kind === 'spike') t += SPIKE_WAIT;
        // Más allá del alcance corriendo hace falta el dash (cuenta el tiempo de reacción del botón).
        if (m.gap > 290) t += 0.1;

        (byStyle[m.style] ??= []).push((m.rise / speed) / t);
    });
}

const pct = (a, p) => [...a].sort((x, y) => x - y)[Math.floor(a.length * p)];
const all = Object.values(byStyle).flat();

console.log(`velocidad ${speed} px/s, ${SEEDS} semillas`);

for (const [name, a] of Object.entries(byStyle)) {
    console.log(`${name.padEnd(9)} pasos ${String(a.length).padStart(5)} | holgura media ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2)} | p10 ${pct(a, 0.1).toFixed(2)} | min ${Math.min(...a).toFixed(2)} | < 1.0: ${(100 * a.filter((x) => x < 1).length / a.length).toFixed(1)} %`);
}

console.log(`TOTAL     media ${(all.reduce((x, y) => x + y, 0) / all.length).toFixed(2)} | p10 ${pct(all, 0.1).toFixed(2)} | < 1.0: ${(100 * all.filter((x) => x < 1).length / all.length).toFixed(1)} %`);
void STYLES;
