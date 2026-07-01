import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceSimulationClock,
  createSimulationClock,
  describeSeedMode,
  pauseSimulationClock,
  startSimulationClock,
} from '../src/sim/controls.js';

test('createSimulationClock: starts idle with full green time remaining', () => {
  assert.deepEqual(createSimulationClock({ greenDuration: 8 }), {
    phase: 'idle',
    simTime: 0,
    lightTimeRemaining: 8,
  });
});

test('startSimulationClock: resumes a paused run without changing time', () => {
  assert.deepEqual(
    startSimulationClock(
      { phase: 'paused', simTime: 1.25, lightTimeRemaining: 6.75 },
      { greenDuration: 8 },
    ),
    {
      phase: 'running',
      simTime: 1.25,
      lightTimeRemaining: 6.75,
    },
  );
});

test('advanceSimulationClock: advances time while the run is active', () => {
  assert.deepEqual(
    advanceSimulationClock(
      { phase: 'running', simTime: 0, lightTimeRemaining: 8 },
      { greenDuration: 8, timeStep: 0.5 },
    ),
    {
      phase: 'running',
      simTime: 0.5,
      lightTimeRemaining: 7.5,
    },
  );
});

test('advanceSimulationClock: clamps at green end and marks the run complete', () => {
  assert.deepEqual(
    advanceSimulationClock(
      { phase: 'running', simTime: 7.9, lightTimeRemaining: 0.1 },
      { greenDuration: 8, timeStep: 0.5 },
    ),
    {
      phase: 'completed',
      simTime: 8,
      lightTimeRemaining: 0,
    },
  );
});

test('pauseSimulationClock: only pauses active runs', () => {
  assert.deepEqual(
    pauseSimulationClock({ phase: 'running', simTime: 1, lightTimeRemaining: 7 }),
    {
      phase: 'paused',
      simTime: 1,
      lightTimeRemaining: 7,
    },
  );

  assert.deepEqual(
    pauseSimulationClock({ phase: 'idle', simTime: 0, lightTimeRemaining: 8 }),
    {
      phase: 'idle',
      simTime: 0,
      lightTimeRemaining: 8,
    },
  );
});

test('describeSeedMode: distinguishes seeded, random, and deterministic runs', () => {
  assert.equal(
    describeSeedMode({ rng_seed: 42, reaction_delay_std: 0.2 }),
    'Seeded run · seed 42',
  );
  assert.equal(
    describeSeedMode({ rng_seed: null, reaction_delay_std: 0.2 }),
    'Randomized run · seed varies',
  );
  assert.equal(
    describeSeedMode({ rng_seed: '', reaction_delay_std: 0.2 }),
    'Randomized run · seed varies',
  );
  assert.equal(
    describeSeedMode({ rng_seed: null, reaction_delay_std: 0 }),
    'Deterministic run · variance disabled',
  );
});
