import assert from 'node:assert/strict';
import { rankThresholds, rankFor, TIME_BONUS_PER_SECOND } from '../src/systems/Rank.js';

// Umbrales: escalan con la meta del nivel y crecen bronce < plata < oro.
const t12 = rankThresholds(12);
assert.deepEqual(t12, { bronze: 240, silver: 420, gold: 600 });
assert.ok(rankThresholds(16).gold > t12.gold);

// Rango por puntaje: justo debajo y justo en cada umbral.
assert.equal(rankFor(0, t12), null);
assert.equal(rankFor(239, t12), null);
assert.equal(rankFor(240, t12), 'bronze');
assert.equal(rankFor(419, t12), 'bronze');
assert.equal(rankFor(420, t12), 'silver');
assert.equal(rankFor(599, t12), 'silver');
assert.equal(rankFor(600, t12), 'gold');
assert.equal(rankFor(9999, t12), 'gold');

// Una meta sin combo (12 puntos x10) con 20 s sobrantes alcanza bronce por el bono.
assert.equal(rankFor(12 * 10 + 20 * TIME_BONUS_PER_SECOND, t12), null);
assert.equal(rankFor(12 * 10 + 25 * TIME_BONUS_PER_SECOND, t12), 'bronze');
console.log('test-rank: OK');
