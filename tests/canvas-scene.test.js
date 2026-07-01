import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvasScene } from '../src/sim/canvas-scene.js';

test('createCanvasScene: maps the stop line, light state, and tracked car into the viewport', () => {
  const scene = createCanvasScene({
    width: 800,
    height: 240,
    simulation: { phase: 'completed', simTime: 8, lightTimeRemaining: 0 },
    vehicles: [
      { id: 'car-1', position: -4, isTracked: false },
      { id: 'car-2', position: -10, isTracked: true },
    ],
  });

  assert.equal(scene.light.state, 'red');
  assert.ok(scene.stopLineX > 0);
  assert.ok(scene.stopLineX < scene.width);
  assert.equal(scene.vehicles[1].isTracked, true);
  assert.ok(scene.vehicles[0].x > scene.vehicles[1].x);
});

test('createCanvasScene: keeps idle runs red until the simulation starts', () => {
  const scene = createCanvasScene({
    width: 800,
    height: 240,
    simulation: { phase: 'idle', simTime: 0, lightTimeRemaining: 8 },
    vehicles: [{ id: 'car-1', position: -4, isTracked: true }],
  });

  assert.equal(scene.light.state, 'red');
});
