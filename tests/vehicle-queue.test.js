import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceVehicleQueue,
  createVehicleQueue,
  getTrackedVehicle,
} from '../src/sim/vehicle-queue.js';

test('createVehicleQueue: creates a seeded queue and tracks the last car', () => {
  const queue = createVehicleQueue({
    num_cars: 3,
    initial_spacing: 7.5,
    reaction_delay_mean: 0.7,
    reaction_delay_std: 0,
    rng_seed: 42,
  });

  assert.equal(queue.length, 3);
  assert.deepEqual(
    queue.map(({ position, reactionDelay, isTracked }) => ({
      position,
      reactionDelay,
      isTracked,
    })),
    [
      { position: -7.5, reactionDelay: 0.7, isTracked: false },
      { position: -15, reactionDelay: 0.7, isTracked: false },
      { position: -22.5, reactionDelay: 0.7, isTracked: true },
    ],
  );
});

test('getTrackedVehicle: returns null when no tracked car exists', () => {
  assert.equal(
    getTrackedVehicle([{ id: 'car-1', position: -1, velocity: 0, isTracked: false }]),
    null,
  );
});

test('advanceVehicleQueue: lead car reacts first and followers wait for the queue to start moving', () => {
  const config = {
    num_cars: 2,
    initial_spacing: 8,
    reaction_delay_mean: 0.1,
    reaction_delay_std: 0,
    rng_seed: 7,
    accel: 2,
    brake: 4,
    max_velocity: 10,
    time_step: 0.05,
  };

  let queue = createVehicleQueue(config);
  queue = advanceVehicleQueue(queue, config, { stepStartTime: 0 });

  assert.equal(queue[0].hasStarted, false);
  assert.equal(queue[0].velocity, 0);
  assert.equal(queue[1].waitRemaining, 0.1);

  queue = advanceVehicleQueue(queue, config, { stepStartTime: 0.05 });

  assert.equal(queue[0].hasStarted, true);
  assert.equal(queue[0].velocity, 0.1);
  assert.equal(queue[1].hasStarted, false);
  assert.equal(queue[1].waitRemaining, 0.1);

  queue = advanceVehicleQueue(queue, config, { stepStartTime: 0.1 });

  assert.equal(queue[1].waitRemaining, 0.05);
  assert.ok(queue[1].position < queue[0].position);
});

test('advanceVehicleQueue: preserves tracked car crossing time', () => {
  const config = {
    num_cars: 1,
    initial_spacing: 0.5,
    reaction_delay_mean: 0,
    reaction_delay_std: 0,
    rng_seed: 1,
    accel: 10,
    brake: 4,
    max_velocity: 10,
    time_step: 0.5,
  };

  let queue = createVehicleQueue(config);
  queue = advanceVehicleQueue(queue, config, { stepStartTime: 0 });
  queue = advanceVehicleQueue(queue, config, { stepStartTime: 0.5 });

  const tracked = getTrackedVehicle(queue);

  assert.equal(tracked.crossTime, 0.6);
  assert.equal(tracked.position, 2);
});
