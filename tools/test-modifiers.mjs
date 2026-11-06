import assert from 'node:assert/strict';

const { MODIFIERS, rollModifiers, bonusOf, applyToConfig } = await import('../src/systems/Modifiers.js');

const withSpikes = { durationSeconds: 40, quota: 10, hazards: [{ x: 1, y: 1, w: 100 }, { x: 2, y: 2, w: 100, restMs: 1700 }] };
const noSpikes = { durationSeconds: 60, quota: 10, hazards: [] };

// Pinchos rápidos solo sale si el mapa tiene pinchos.
for (let i = 0; i < 500; i++) {
    assert.ok(!rollModifiers(noSpikes).includes('fastSpikes'));
}

// Siempre 1 o 2, distintos, y nunca un par que se anula; ~5 % de dos.
const CLASH = [['shortClock', 'highGoal'], ['noDash', 'slowDash'], ['fog', 'fleeting'], ['fog', 'singlePoint']];
let twos = 0;
const N = 20000;
for (let i = 0; i < N; i++) {
    const ids = rollModifiers(withSpikes);
    assert.ok(ids.length === 1 || ids.length === 2);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(!CLASH.some(([a, b]) => ids.includes(a) && ids.includes(b)));
    ids.forEach((id) => assert.ok(MODIFIERS[id]));
    if (ids.length === 2) twos++;
}
assert.ok(Math.abs(twos / N - 0.05) < 0.01, `dos modificadores: ${twos / N}`);

// rng inyectado: 0 → primer modificador y, con 0 < 0.05, también un segundo.
assert.deepEqual(rollModifiers(withSpikes, () => 0), ['shortClock', 'slowDash']);
assert.deepEqual(rollModifiers(withSpikes, () => 0.99), ['fog']);

// Bonus y efectos.
assert.ok(Math.abs(bonusOf(['noDash', 'fog']) - 0.45) < 1e-9);
assert.equal(applyToConfig(withSpikes, ['shortClock']).durationSeconds, 26);
assert.equal(withSpikes.durationSeconds, 40); // no muta el original
assert.equal(applyToConfig(withSpikes, ['highGoal']).quota, 14);
const fast = applyToConfig(withSpikes, ['fastSpikes']).hazards;
assert.deepEqual(fast.map((h) => h.restMs), [390, 510]); // 1300 por defecto y 1700 propio, ×0,3
assert.equal(withSpikes.hazards[0].restMs, undefined);

console.log('test-modifiers OK');
