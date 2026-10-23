import assert from 'node:assert';
import { GameTimer } from '../src/systems/GameTimer.js';

const scene = { time: { now: 1000 } };
const t = new GameTimer(scene, null, 10);
t.update();
assert.equal(t.remainingSeconds, 10);

t.paused = true;
t.update(); // la pausa empieza en 1000
scene.time.now = 6000;
t.update();
assert.equal(t.remainingSeconds, 10);

t.paused = false;
scene.time.now = 7000;
t.update();
assert.equal(t.remainingSeconds, 10); // la pausa no gastó tiempo
scene.time.now = 8000;
assert.equal(t.remainingSeconds, 9);
console.log('timer pause ok');
