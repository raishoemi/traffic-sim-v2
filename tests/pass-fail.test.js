import test from 'node:test';
import assert from 'node:assert/strict';
import {
  didCrossStopLine,
  isPassBeforeGreenEnds,
  simulatePassFailScenario,
} from '../src/sim/pass-fail.js';

test('didCrossStopLine: detects crossing when a segment reaches or passes the line', () => {
  assert.equal(didCrossStopLine(1, -0.2), true);
  assert.equal(didCrossStopLine(-1, 0), true);
  assert.equal(didCrossStopLine(-1, 0.2), true);
});

test('didCrossStopLine: no crossing when remaining on one side', () => {
  assert.equal(didCrossStopLine(-1, -2), false);
  assert.equal(didCrossStopLine(2, 1), false);
});

test('isPassBeforeGreenEnds: crossing strictly before green end passes', () => {
  assert.equal(isPassBeforeGreenEnds(2.99, 3), true);
});

test('isPassBeforeGreenEnds: crossing exactly at green end fails', () => {
  assert.equal(isPassBeforeGreenEnds(3, 3), false);
});

test('simulatePassFailScenario: deterministic pass scenario', () => {
  const result = simulatePassFailScenario({
    initialPosition: -5,
    initialVelocity: 2,
    acceleration: 0,
    maxVelocity: 10,
    dt: 0.5,
    greenDuration: 4,
  });

  assert.equal(result.crossed, true);
  assert.equal(result.passed, true);
  assert.equal(result.crossTime, 2.5);
});

test('simulatePassFailScenario: deterministic fail scenario', () => {
  const result = simulatePassFailScenario({
    initialPosition: -10,
    initialVelocity: 2,
    acceleration: 0,
    maxVelocity: 10,
    dt: 0.5,
    greenDuration: 4,
  });

  assert.equal(result.passed, false);
});
