import { kineticStep } from './kinematics.js';
import { didCrossStopLine } from './pass-fail.js';
import { createRng, sampleReactionDelay } from './rng.js';

const CROSS_TIME_PRECISION = 4;

function createDelaySampler({ rng_seed, reaction_delay_mean, reaction_delay_std }) {
  const rng = rng_seed === null || rng_seed === undefined ? Math.random : createRng(rng_seed);
  return () => sampleReactionDelay(rng, reaction_delay_mean, reaction_delay_std);
}

export function createVehicleQueue(config) {
  const sampleDelay = createDelaySampler(config);

  return Array.from({ length: config.num_cars }, (_, index) => ({
    id: `car-${index + 1}`,
    position: -config.initial_spacing * (index + 1),
    velocity: 0,
    reactionDelay: sampleDelay(),
    waitRemaining: 0,
    hasStarted: false,
    isTracked: index === config.num_cars - 1,
    crossTime: null,
  })).map((vehicle) => ({
    ...vehicle,
    waitRemaining: vehicle.reactionDelay,
  }));
}

export function getTrackedVehicle(queue) {
  return queue.find((vehicle) => vehicle.isTracked) ?? queue.at(-1) ?? null;
}

export function advanceVehicleQueue(queue, config, { stepStartTime }) {
  const nextQueue = [];

  for (let index = 0; index < queue.length; index += 1) {
    const vehicle = queue[index];
    const leaderBefore = queue[index - 1] ?? null;
    const leaderAfter = nextQueue[index - 1] ?? null;
    const leaderHasStarted = leaderBefore ? leaderBefore.hasStarted : true;

    let waitRemaining = vehicle.waitRemaining;
    if (!vehicle.hasStarted && leaderHasStarted) {
      waitRemaining = Math.max(vehicle.waitRemaining - config.time_step, 0);
    }

    const shouldMove = vehicle.hasStarted || (leaderHasStarted && waitRemaining === 0);
    if (!shouldMove) {
      nextQueue.push({
        ...vehicle,
        waitRemaining,
      });
      continue;
    }

    const gap = leaderBefore ? leaderBefore.position - vehicle.position : Infinity;
    const acceleration = gap > config.initial_spacing ? config.accel : -config.brake;
    const nextKinematics = kineticStep(vehicle, {
      acceleration,
      maxVelocity: config.max_velocity,
      dt: config.time_step,
    });

    let nextPosition = nextKinematics.position;
    let nextVelocity = nextKinematics.velocity;

    if (leaderAfter) {
      const maxPosition = leaderAfter.position - config.initial_spacing;
      if (nextPosition > maxPosition) {
        nextPosition = maxPosition;
        nextVelocity = Math.min(nextVelocity, leaderAfter.velocity);
      }
    }

    let crossTime = vehicle.crossTime;
    if (crossTime === null && didCrossStopLine(vehicle.position, nextPosition)) {
      const distanceToLine = Math.abs(vehicle.position);
      const traveledDistance = Math.abs(nextPosition - vehicle.position);
      const interpolationFactor = traveledDistance === 0 ? 0 : distanceToLine / traveledDistance;
      crossTime = Number(
        (stepStartTime + interpolationFactor * config.time_step).toFixed(CROSS_TIME_PRECISION),
      );
    }

    nextQueue.push({
      ...vehicle,
      position: nextPosition,
      velocity: nextVelocity,
      waitRemaining,
      hasStarted: true,
      crossTime,
    });
  }

  return nextQueue;
}
