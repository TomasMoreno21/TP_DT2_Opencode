import assert from 'node:assert/strict';

const { MODIFIERS, rollModifiers, bonusOf, applyToConfig } = await import('../src/systems/Modifiers.js');

const withProj = { durationSeconds: 40, quota: 8, projectiles: { initialInterval: 2000, minInterval: 1200 } };
const noProj = { durationSeconds: 60, quota: 8, projectiles: null };

// Ráfaga solo sale si el mapa tiene proyectiles.
for (let i = 0; i < 500; i++) {
    assert.ok(!rollModifiers(noProj).includes('burst'));
}

// Siempre 1 o 2, distintos, y nunca el par que se anula; ~5 % de dos.
let twos = 0;
const N = 20000;
for (let i = 0; i < N; i++) {
    const ids = rollModifiers(withProj);
    assert.ok(ids.length === 1 || ids.length === 2);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(!(ids.includes('shortClock') && ids.includes('highGoal')));
    ids.forEach((id) => assert.ok(MODIFIERS[id]));
    if (ids.length === 2) twos++;
}
assert.ok(Math.abs(twos / N - 0.05) < 0.01, `dos modificadores: ${twos / N}`);

// rng inyectado: 0 → primer modificador y, con 0 < 0.05, también un segundo.
assert.deepEqual(rollModifiers(withProj, () => 0), ['shortClock', 'burst']);
assert.deepEqual(rollModifiers(withProj, () => 0.99), ['highGoal']);

// Bonus y efectos.
assert.ok(Math.abs(bonusOf(['burst', 'slowDash']) - 0.30) < 1e-9);
const cfg = applyToConfig(withProj, ['shortClock', 'burst']);
assert.equal(cfg.durationSeconds, 30);
assert.equal(cfg.projectiles.initialInterval, 1400);
assert.equal(withProj.durationSeconds, 40); // no muta el original
assert.equal(applyToConfig(withProj, ['highGoal']).quota, 10);

console.log('test-modifiers OK');
