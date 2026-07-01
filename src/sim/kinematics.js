/**
 * Advance a vehicle's kinematic state by one time step.
 *
 * @param {{ position: number, velocity: number }} state
 * @param {{ acceleration: number, maxVelocity: number, dt: number }} params
 * @returns {{ position: number, velocity: number }}
 */
export function kineticStep(state, params) {
  const { position, velocity } = state;
  const { acceleration, maxVelocity, dt } = params;

  const newPosition = position + velocity * dt;
  const newVelocity = Math.min(Math.max(velocity + acceleration * dt, 0), maxVelocity);

  return { position: newPosition, velocity: newVelocity };
}
