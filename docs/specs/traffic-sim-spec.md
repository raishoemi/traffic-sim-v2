# Traffic Simulator — Spec

## Overview
A single-page web app for a hobbyist to set traffic-light and vehicle parameters, run a single trial (optional randomness), and observe an animated 2D top-down view indicating whether a tracked car crosses the stop line before green ends.

## Goals
- Allow configuring: green duration, reaction delay distribution, max velocity, accel/brake, initial spacing, number of cars (default 10).
- Use a simple kinematic car-following model.
- Single-trial runs with optional randomness (seedable).
- Metric units (m, m/s, s).
- Clear pass/fail result and animated visualization.

## Essential Parameters
- num_cars: default 10, adjustable per trial
- green_duration_s: float
- reaction_delay_mean_s, reaction_delay_std_s (std=0 for deterministic)
- max_velocity_mps
- accel_mps2, brake_mps2
- initial_spacing_m (gap between bumper-to-bumper)
- time_step_s (simulation granularity)
- rng_seed (optional)

## Simulation Model
- Each vehicle uses simple kinematic update: position += velocity * dt; velocity += acceleration * dt, bounded by max_velocity and brake limits.
- When leader slows/halts, follower reacts after sampled reaction delay and applies braking/acceleration to maintain spacing.
- Stop line is at x=0; vehicles queued with positive x (e.g., x = stop_line + spacing * index).
- PASS condition: tracked vehicle's front crosses stop line (x <= 0) strictly before green timer expires.
- If RNG enabled, driver reaction delays sampled per-run from Normal(mean, std) clipped at >=0.

## UI / UX
- Parameters panel (left) with labeled inputs and sensible defaults.
- Canvas (center/right) animated top-down view showing road, stop line, traffic light state, and vehicles (tracked car highlighted).
- Controls: Run, Pause, Reset, Seed input (optional).
- After run, prominent Pass / Fail banner with timestamp and summary (time-to-cross or last-position).
- Show current sim time and light time remaining.

## Acceptance Criteria (verifiable)
1. With defaults, clicking Run produces an animation and shows Pass or Fail after simulation ends.
2. Setting rng_seed produces deterministic repeatable runs; leaving seed blank yields variable outcomes when std>0.
3. Default num_cars is 10; user can change it and rerun.
4. Pass condition matches: front crosses stop line before green_duration elapses.
5. Units displayed are metric; inputs accept metric values.
6. Simulation remains responsive for typical runs (10 cars, dt=0.05s) on a modern laptop; UI does not freeze.

## Testing & Verification
- Unit tests for kinematic update and reaction-delay sampling.
- Integration test: deterministic scenario where tracked car should pass given parameter set (assert pass). Another where it should fail.
- Manual smoke test: open app, change a parameter, run, observe animation and pass/fail.

## Non-Goals
- No batch experiments, CSV export, or server-side persistence.
- No advanced car-following models (IDM) in MVP.
- No real-time sliders for mid-run parameter changes.

## Open Questions / Next Decisions
- Concrete default numeric values for accel, brake, max_velocity, reaction delay, and dt (propose defaults in planning step).
- Visual styling preferences (colors, sizes) — keep minimal for MVP.

## Next step
Run planning-and-task-breakdown to split into implementable tasks (UI, simulation core, tests, build). 

Created: 2026-07-01T22:18:xx+03:00
