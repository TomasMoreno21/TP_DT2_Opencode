import assert from 'node:assert/strict';

// localStorage falso: el módulo corre en node igual que en el navegador.
const mem = new Map();
let broken = false;
globalThis.localStorage = {
    getItem: (k) => {
        if (broken === 'throw') throw new Error('sin acceso');
        return broken === 'json' ? '{{' : (mem.has(k) ? mem.get(k) : null);
    },
    setItem: (k, v) => mem.set(k, String(v))
};

const { ACHIEVEMENTS, evaluateLevel, goldInAllLevels, AchievementStore } = await import('../src/systems/Achievements.js');

// Catálogo.
assert.deepEqual(ACHIEVEMENTS.map((a) => a.id),
    ['noDeaths', 'maxCombo', 'champion', 'gold', 'goldAll', 'airborne', 'speedster', 'collector']);
assert.equal(ACHIEVEMENTS.find((a) => a.id === 'collector').target, 1000);

// Hitos de fin de nivel.
assert.deepEqual(evaluateLevel({ deaths: 0, maxMult: 5, rank: 'gold', remainingRatio: 0.5 }),
    ['noDeaths', 'maxCombo', 'gold', 'speedster']);
assert.deepEqual(evaluateLevel({ deaths: 1, maxMult: 4, rank: 'silver', remainingRatio: 0.49 }), []);
assert.ok(evaluateLevel({ deaths: 1, maxMult: 1, rank: null, remainingRatio: 0.5 }).includes('speedster'));
assert.ok(!evaluateLevel({ deaths: 1, maxMult: 1, rank: null, remainingRatio: 0.499 }).includes('speedster'));

// Oro en todos los niveles.
const all = { 1: 'gold', 2: 'gold', 3: 'gold', 4: 'gold', 5: 'gold' };
assert.equal(goldInAllLevels(all, 5), true);
assert.equal(goldInAllLevels({ ...all, 3: 'silver' }, 5), false);
assert.equal(goldInAllLevels({ 1: 'gold' }, 5), false);

// Almacén: primera vez true, después false.
assert.equal(AchievementStore.unlock('gold'), true);
assert.equal(AchievementStore.unlock('gold'), false);
assert.equal(AchievementStore.has('gold'), true);

// Coleccionista: acumulado, un solo desbloqueo, progreso topado.
assert.equal(AchievementStore.addPoints(999), false);
assert.equal(AchievementStore.addPoints(1), true);
assert.equal(AchievementStore.addPoints(50), false);
assert.deepEqual(AchievementStore.progress('collector'), { value: 1000, target: 1000 });
assert.equal(AchievementStore.progress('gold'), null);

// Valores inválidos no suman.
const before = AchievementStore.points();
for (const bad of [0, -5, NaN, Infinity, '12']) {
    assert.equal(AchievementStore.addPoints(bad), false);
}
assert.equal(AchievementStore.points(), before);

// Almacenamiento roto: sin excepciones y con valores por defecto.
for (const mode of ['throw', 'json']) {
    broken = mode;
    assert.equal(AchievementStore.has('gold'), false);
    assert.equal(AchievementStore.points(), 0);
    assert.doesNotThrow(() => AchievementStore.unlock('x'));
}
broken = false;

console.log('test-achievements: OK');
