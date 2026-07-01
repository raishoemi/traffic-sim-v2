export function createSimulationClock({ greenDuration }) {
  return {
    phase: 'idle',
    simTime: 0,
    lightTimeRemaining: greenDuration,
  };
}

export function startSimulationClock(clock, { greenDuration }) {
  if (clock.phase === 'paused') {
    return {
      ...clock,
      phase: 'running',
    };
  }

  return {
    phase: 'running',
    simTime: 0,
    lightTimeRemaining: greenDuration,
  };
}

export function pauseSimulationClock(clock) {
  if (clock.phase !== 'running') {
    return clock;
  }

  return {
    ...clock,
    phase: 'paused',
  };
}

export function advanceSimulationClock(clock, { greenDuration, timeStep }) {
  if (clock.phase !== 'running') {
    return clock;
  }

  const simTime = Math.min(clock.simTime + timeStep, greenDuration);
  const lightTimeRemaining = Math.max(greenDuration - simTime, 0);

  return {
    phase: simTime >= greenDuration ? 'completed' : 'running',
    simTime,
    lightTimeRemaining,
  };
}

export function describeSeedMode({ rng_seed, reaction_delay_std }) {
  if (rng_seed !== null && rng_seed !== undefined && rng_seed !== '') {
    return `Seeded run · seed ${rng_seed}`;
  }

  if (reaction_delay_std > 0) {
    return 'Randomized run · seed varies';
  }

  return 'Deterministic run · variance disabled';
}
