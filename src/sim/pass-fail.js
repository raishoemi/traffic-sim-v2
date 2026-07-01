import { kineticStep } from './kinematics.js';

/**
 * Detect whether a vehicle crosses the stop line in the current step.
 *
 * @param {number} previousPosition
 * @param {number} nextPosition
 * @param {number} stopLinePosition
 * @returns {boolean}
 */
export function didCrossStopLine(previousPosition, nextPosition, stopLinePosition = 0) {
  const previousOffset = previousPosition - stopLinePosition;
  const nextOffset = nextPosition - stopLinePosition;

  if (previousOffset === 0 && nextOffset === 0) {
    return false;
  }

  return previousOffset === 0 || nextOffset === 0 || previousOffset * nextOffset < 0;
}

/**
 * PASS requires crossing strictly before green ends.
 *
 * @param {number} crossTime
 * @param {number} greenDuration
 * @returns {boolean}
 */
export function isPassBeforeGreenEnds(crossTime, greenDuration) {
  return crossTime < greenDuration;
}

/**
 * Run a deterministic single-vehicle scenario and evaluate pass/fail.
 *
 * @param {{
 *   initialPosition: number,
 *   initialVelocity: number,
 *   acceleration: number,
 *   maxVelocity: number,
 *   dt: number,
 *   greenDuration: number,
 *   stopLinePosition?: number
 * }} params
 * @returns {{ passed: boolean, crossed: boolean, crossTime: number | null, lastPosition: number }}
 */
export function simulatePassFailScenario(params) {
  const {
    initialPosition,
    initialVelocity,
    acceleration,
    maxVelocity,
    dt,
    greenDuration,
    stopLinePosition = 0,
  } = params;

  let time = 0;
  let state = { position: initialPosition, velocity: initialVelocity };

  while (time < greenDuration) {
    const next = kineticStep(state, { acceleration, maxVelocity, dt });
    const nextTime = time + dt;

    if (didCrossStopLine(state.position, next.position, stopLinePosition)) {
      const distanceToLine = state.position - stopLinePosition;
      const traveledDistance = state.position - next.position;
      const interpolationFactor =
        traveledDistance === 0 ? 0 : distanceToLine / traveledDistance;
      const crossTime = time + interpolationFactor * dt;
      const passed = isPassBeforeGreenEnds(crossTime, greenDuration);

      return {
        passed,
        crossed: true,
        crossTime,
        lastPosition: next.position,
      };
    }

    state = next;
    time = nextTime;
  }

  return {
    passed: false,
    crossed: false,
    crossTime: null,
    lastPosition: state.position,
  };
}
