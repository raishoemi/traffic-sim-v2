export const DEFAULT_PARAMETERS = {
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
};

export const PARAMETER_FIELDS = [
  {
    name: 'green_duration',
    label: 'Green duration',
    unit: 's',
    type: 'number',
    step: '0.1',
    min: '0.1',
    description: 'How long the light stays green for a single trial.',
  },
  {
    name: 'reaction_delay_mean',
    label: 'Reaction delay mean',
    unit: 's',
    type: 'number',
    step: '0.1',
    min: '0',
    description: 'Average driver delay before responding to the lead car.',
  },
  {
    name: 'reaction_delay_std',
    label: 'Reaction delay std. dev.',
    unit: 's',
    type: 'number',
    step: '0.1',
    min: '0',
    description: 'Random spread in reaction delay; use 0 for deterministic runs.',
  },
  {
    name: 'max_velocity',
    label: 'Max velocity',
    unit: 'm/s',
    type: 'number',
    step: '0.1',
    min: '0.1',
    description: 'Maximum speed any car can reach during the simulation.',
  },
  {
    name: 'accel',
    label: 'Acceleration',
    unit: 'm/s²',
    type: 'number',
    step: '0.1',
    min: '0.1',
    description: 'Acceleration applied while a car is speeding up.',
  },
  {
    name: 'brake',
    label: 'Braking',
    unit: 'm/s²',
    type: 'number',
    step: '0.1',
    min: '0.1',
    description: 'Braking strength used to maintain safe spacing.',
  },
  {
    name: 'initial_spacing',
    label: 'Initial spacing',
    unit: 'm',
    type: 'number',
    step: '0.1',
    min: '0.1',
    description: 'Bumper-to-bumper spacing between queued vehicles.',
  },
  {
    name: 'num_cars',
    label: 'Number of cars',
    unit: 'cars',
    type: 'number',
    step: '1',
    min: '1',
    description: 'How many vehicles start in the queue.',
  },
  {
    name: 'time_step',
    label: 'Time step',
    unit: 's',
    type: 'number',
    step: '0.01',
    min: '0.01',
    description: 'Simulation granularity; smaller steps produce smoother motion.',
  },
  {
    name: 'rng_seed',
    label: 'RNG seed',
    unit: 'optional',
    type: 'number',
    step: '1',
    description: 'Leave blank for different random outcomes when variance is enabled.',
  },
];

export function createParameterDraft(overrides = {}) {
  const merged = { ...DEFAULT_PARAMETERS, ...overrides };

  return Object.fromEntries(
    PARAMETER_FIELDS.map((field) => [field.name, String(merged[field.name] ?? '')]),
  );
}

export function validateParameterDraft(draft) {
  const values = {};
  const errors = {};

  for (const field of PARAMETER_FIELDS) {
    const rawValue = `${draft[field.name] ?? ''}`.trim();

    if (field.name === 'rng_seed') {
      if (rawValue === '') {
        values[field.name] = null;
        continue;
      }

      const parsedSeed = Number(rawValue);
      if (!Number.isInteger(parsedSeed)) {
        errors[field.name] = 'RNG seed must be a whole number.';
        continue;
      }

      values[field.name] = parsedSeed;
      continue;
    }

    if (rawValue === '') {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      errors[field.name] = `${field.label} must be a valid number.`;
      continue;
    }

    if (field.name === 'num_cars') {
      if (!Number.isInteger(numericValue)) {
        errors[field.name] = 'Number of cars must be a whole number.';
        continue;
      }

      if (numericValue <= 0) {
        errors[field.name] = 'Number of cars must be greater than 0.';
        continue;
      }
    } else if (field.name === 'reaction_delay_mean' || field.name === 'reaction_delay_std') {
      if (numericValue < 0) {
        errors[field.name] = `${field.label} must be 0 or greater.`;
        continue;
      }
    } else if (numericValue <= 0) {
      errors[field.name] = `${field.label} must be greater than 0.`;
      continue;
    }

    values[field.name] = numericValue;
  }

  if (Object.keys(errors).length > 0) {
    return {
      isValid: false,
      errors,
      values: {},
    };
  }

  return {
    isValid: true,
    errors,
    values,
  };
}
