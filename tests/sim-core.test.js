import test from 'node:test';
import assert from 'node:assert/strict';
import { kineticStep } from '../src/sim/kinematics.js';
import { createRng, sampleReactionDelay } from '../src/sim/rng.js';

// ---------------------------------------------------------------------------
// kinematics
// ---------------------------------------------------------------------------

test('kineticStep: advances position by velocity * dt', () => {
  const state = { position: 10, velocity: 2 };
  const next = kineticStep(state, { acceleration: 0, maxVelocity: 10, dt: 0.5 });
  assert.equal(next.position, 11);
});

test('kineticStep: increases velocity by acceleration * dt', () => {
  const state = { position: 0, velocity: 0 };
  const next = kineticStep(state, { acceleration: 4, maxVelocity: 10, dt: 0.5 });
  assert.equal(next.velocity, 2);
});

test('kineticStep: velocity is clamped to maxVelocity', () => {
  const state = { position: 0, velocity: 9 };
  const next = kineticStep(state, { acceleration: 10, maxVelocity: 10, dt: 1 });
  assert.equal(next.velocity, 10);
});

test('kineticStep: velocity is clamped at 0 (cannot go negative)', () => {
  const state = { position: 5, velocity: 1 };
  const next = kineticStep(state, { acceleration: -10, maxVelocity: 10, dt: 1 });
  assert.equal(next.velocity, 0);
});

test('kineticStep: position uses pre-step velocity for the update', () => {
  // position should advance by the velocity at the start of the step
  const state = { position: 0, velocity: 3 };
  const next = kineticStep(state, { acceleration: 2, maxVelocity: 100, dt: 1 });
  assert.equal(next.position, 3);  // 0 + 3*1
  assert.equal(next.velocity, 5);  // 3 + 2*1
});

test('kineticStep: returns a new object (immutable)', () => {
  const state = { position: 1, velocity: 1 };
  const next = kineticStep(state, { acceleration: 0, maxVelocity: 10, dt: 1 });
  assert.notEqual(next, state);
});

// ---------------------------------------------------------------------------
// RNG / seed
// ---------------------------------------------------------------------------

test('createRng: same seed produces same sequence', () => {
  const rng1 = createRng(42);
  const rng2 = createRng(42);
  const seq1 = [rng1(), rng1(), rng1()];
  const seq2 = [rng2(), rng2(), rng2()];
  assert.deepEqual(seq1, seq2);
});

test('createRng: different seeds produce different sequences', () => {
  const rng1 = createRng(1);
  const rng2 = createRng(2);
  const v1 = rng1();
  const v2 = rng2();
  assert.notEqual(v1, v2);
});

test('createRng: values are in [0, 1)', () => {
  const rng = createRng(7);
  for (let i = 0; i < 100; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1, `Expected [0,1) but got ${v}`);
  }
});

// ---------------------------------------------------------------------------
// reaction-delay sampling
// ---------------------------------------------------------------------------

test('sampleReactionDelay: std=0 always returns mean', () => {
  const rng = createRng(1);
  for (let i = 0; i < 20; i++) {
    const v = sampleReactionDelay(rng, 0.8, 0);
    assert.equal(v, 0.8);
  }
});

test('sampleReactionDelay: result is always >= 0 (clipped)', () => {
  // Use a large std to provoke negative draws
  const rng = createRng(99);
  for (let i = 0; i < 200; i++) {
    const v = sampleReactionDelay(rng, 0.1, 5);
    assert.ok(v >= 0, `Expected >= 0 but got ${v}`);
  }
});

test('sampleReactionDelay: same seed + same params is deterministic', () => {
  const rng1 = createRng(55);
  const rng2 = createRng(55);
  const v1 = sampleReactionDelay(rng1, 0.5, 0.2);
  const v2 = sampleReactionDelay(rng2, 0.5, 0.2);
  assert.equal(v1, v2);
});

test('sampleReactionDelay: with std>0 values vary across draws', () => {
  const rng = createRng(33);
  const draws = new Set();
  for (let i = 0; i < 10; i++) {
    draws.add(sampleReactionDelay(rng, 1.0, 0.3));
  }
  assert.ok(draws.size > 1, 'Expected varied draws with std>0');
});
