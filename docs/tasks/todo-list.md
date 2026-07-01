# Traffic-sim Tasks

This file lists actionable todos exported from the session task tracker. Use the session SQL (`todos` and `todo_deps`) to update status as you work.

Next ready tasks: canvas-animator, build-deploy

Task completion rule: when you finish a task, update its status in this file before you stop. If the session SQL tracker is populated, keep that status in sync there too.

---

## Task list

1. id: repo-scaffold
   - Title: Scaffold React+Vite repo and CI
   - Description: Create a Vite + React scaffold, add ESLint/Prettier, basic CI job (install, test), initial README and license.
   - Estimate: 2h
   - Status: done
   - Depends on: (none)

2. id: sim-core
   - Title: Simulation core: kinematics & RNG
   - Description: Implement kinematic update loop, reaction-delay sampling (Normal clipped at 0), RNG/seed support, unit tests for update and sampling.
   - Estimate: 4h
   - Status: done
   - Depends on: repo-scaffold

3. id: pass-fail
   - Title: Pass/fail logic and deterministic scenarios
   - Description: Implement stop-line crossing detection, green timer check, and create deterministic unit/integration scenarios that assert pass or fail.
   - Estimate: 2h
   - Status: done
   - Depends on: sim-core

4. id: ui-params
   - Title: UI: parameters panel
   - Description: Build parameter form with inputs for green_duration, reaction_delay_mean/std, max_velocity, accel, brake, initial_spacing, num_cars, time_step, rng_seed; include validation and sensible defaults.
   - Estimate: 3h
   - Status: done
   - Depends on: repo-scaffold

5. id: ui-controls
   - Title: UI controls: Run/Pause/Reset/Seed
   - Description: Implement Run, Pause, Reset buttons, seed input, current sim time and light time remaining display.
   - Estimate: 2h
   - Status: done
   - Depends on: repo-scaffold

6. id: canvas-animator
   - Title: Canvas animator and visuals
   - Description: Render top-down view on Canvas: lane, stop line, traffic light state, vehicles, highlight tracked car; implement animation loop synchronized with sim time.
   - Estimate: 4h
   - Status: pending
   - Depends on: sim-core, ui-controls

7. id: integration-tests
   - Title: Integration & manual smoke tests
   - Description: Write integration tests for the full flow (set params, run, assert pass/fail), and manual smoke test checklist.
   - Estimate: 2h
   - Status: pending
   - Depends on: canvas-animator, sim-core, ui-controls

8. id: docs-examples
   - Title: Docs and example scenarios
   - Description: Add docs/README usage, example parameter presets (pass/fail), and link to intent/spec.
   - Estimate: 1h
   - Status: pending
   - Depends on: integration-tests

9. id: build-deploy
   - Title: Local build and preview script
   - Description: Add build & preview scripts (vite build, vite preview), document how to run locally.
   - Estimate: 1h
   - Status: pending
   - Depends on: repo-scaffold


10. id: gh-pages-hosting
   - Title: GitHub Pages hosting
   - Description: Configure GitHub Pages or GitHub Actions to serve the built site; publish docs and update README with the published URL.
   - Estimate: 1h
   - Status: pending
   - Depends on: build-deploy

---

How to mark a task complete:
- Update the matching `Status:` line in this file so the next agent sees the current state.
- If the session DB is populated, update the SQL row too.

How to mark a task in the session DB as in_progress or done:
- Use the SQL tool to update status, for example:
  UPDATE todos SET status = 'in_progress' WHERE id = 'repo-scaffold';
  UPDATE todos SET status = 'done' WHERE id = 'repo-scaffold';

When a task with dependents is marked done, the next ready tasks will appear in the session query results.

Created from session tasks on 2026-07-01
