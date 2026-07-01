import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PARAMETERS,
  PARAMETER_FIELDS,
  createParameterDraft,
  validateParameterDraft,
} from '../src/params.js';

test('DEFAULT_PARAMETERS: provides sensible defaults for every required field', () => {
  assert.deepEqual(DEFAULT_PARAMETERS, {
    green_duration: 8,
    reaction_delay_mean: 0.7,
    reaction_delay_std: 0.2,
    max_velocity: 13.4,
    accel: 2.5,
    brake: 4.5,
    initial_spacing: 7.5,
    num_cars: 10,
    time_step: 0.05,
    rng_seed: '',
  });
});

test('PARAMETER_FIELDS: covers each editable parameter exactly once', () => {
  assert.deepEqual(
    PARAMETER_FIELDS.map((field) => field.name),
    Object.keys(DEFAULT_PARAMETERS),
  );
});

test('createParameterDraft: stringifies defaults and preserves overrides', () => {
  assert.deepEqual(createParameterDraft({ num_cars: 12, rng_seed: '42' }), {
    green_duration: '8',
    reaction_delay_mean: '0.7',
    reaction_delay_std: '0.2',
    max_velocity: '13.4',
    accel: '2.5',
    brake: '4.5',
    initial_spacing: '7.5',
    num_cars: '12',
    time_step: '0.05',
    rng_seed: '42',
  });
});

test('validateParameterDraft: accepts the default draft and parses numbers', () => {
  const result = validateParameterDraft(createParameterDraft());

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.values, {
    green_duration: 8,
    reaction_delay_mean: 0.7,
    reaction_delay_std: 0.2,
    max_velocity: 13.4,
    accel: 2.5,
    brake: 4.5,
    initial_spacing: 7.5,
    num_cars: 10,
    time_step: 0.05,
    rng_seed: null,
  });
});

test('validateParameterDraft: rejects invalid required, range, and seed inputs', () => {
  const result = validateParameterDraft({
    green_duration: '',
    reaction_delay_mean: '-1',
    reaction_delay_std: '-0.1',
    max_velocity: 'fast',
    accel: '0',
    brake: '0',
    initial_spacing: '0',
    num_cars: '1.5',
    time_step: '0',
    rng_seed: 'abc',
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.values, {});
  assert.deepEqual(result.errors, {
    green_duration: 'Green duration is required.',
    reaction_delay_mean: 'Reaction delay mean must be 0 or greater.',
    reaction_delay_std: 'Reaction delay std. dev. must be 0 or greater.',
    max_velocity: 'Max velocity must be a valid number.',
    accel: 'Acceleration must be greater than 0.',
    brake: 'Braking must be greater than 0.',
    initial_spacing: 'Initial spacing must be greater than 0.',
    num_cars: 'Number of cars must be a whole number.',
    time_step: 'Time step must be greater than 0.',
    rng_seed: 'RNG seed must be a whole number.',
  });
});
