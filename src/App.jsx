import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  createParameterDraft,
  DEFAULT_PARAMETERS,
  PARAMETER_FIELDS,
  validateParameterDraft,
} from './params.js';
import {
  advanceSimulationClock,
  createSimulationClock,
  describeSeedMode,
  pauseSimulationClock,
  startSimulationClock,
} from './sim/controls.js';

const DEFAULT_VALID_PARAMETERS = validateParameterDraft(createParameterDraft()).values;

function formatSeconds(value) {
  return `${value.toFixed(2)} s`;
}

function App() {
  const [draft, setDraft] = useState(() => createParameterDraft());
  const validation = useMemo(() => validateParameterDraft(draft), [draft]);
  const [activeRunConfig, setActiveRunConfig] = useState(DEFAULT_VALID_PARAMETERS);
  const [simulation, setSimulation] = useState(() =>
    createSimulationClock({ greenDuration: DEFAULT_VALID_PARAMETERS.green_duration }),
  );

  useEffect(() => {
    if (simulation.phase !== 'running') {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSimulation((current) =>
        advanceSimulationClock(current, {
          greenDuration: activeRunConfig.green_duration,
          timeStep: activeRunConfig.time_step,
        }),
      );
    }, Math.max(activeRunConfig.time_step * 1000, 16));

    return () => window.clearInterval(timerId);
  }, [activeRunConfig.green_duration, activeRunConfig.time_step, simulation.phase]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleRestoreDefaults = () => {
    setDraft(createParameterDraft(DEFAULT_PARAMETERS));
  };

  const handleRun = () => {
    if (simulation.phase === 'paused') {
      setSimulation((current) =>
        startSimulationClock(current, { greenDuration: activeRunConfig.green_duration }),
      );
      return;
    }

    if (!validation.isValid) {
      return;
    }

    setActiveRunConfig(validation.values);
    setSimulation(
      startSimulationClock(
        createSimulationClock({ greenDuration: validation.values.green_duration }),
        { greenDuration: validation.values.green_duration },
      ),
    );
  };

  const handlePause = () => {
    setSimulation((current) => pauseSimulationClock(current));
  };

  const handleSimulationReset = () => {
    const nextConfig =
      simulation.phase === 'idle' && validation.isValid ? validation.values : activeRunConfig;
    setActiveRunConfig(nextConfig);
    setSimulation(createSimulationClock({ greenDuration: nextConfig.green_duration }));
  };

  const runConfig =
    simulation.phase === 'idle' && validation.isValid ? validation.values : activeRunConfig;
  const isRunDisabled = !validation.isValid && simulation.phase !== 'paused';
  const isPauseDisabled = simulation.phase !== 'running';
  const isResetDisabled = simulation.phase === 'idle' && simulation.simTime === 0;
  const runButtonLabel = simulation.phase === 'paused' ? 'Resume' : 'Run';
  const simulationStatus =
    simulation.phase === 'running'
      ? 'Simulation running'
      : simulation.phase === 'paused'
        ? 'Simulation paused'
        : simulation.phase === 'completed'
          ? 'Green window finished'
          : validation.isValid
            ? 'Ready to run'
            : 'Resolve validation errors to enable Run';

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Traffic simulator</p>
        <h1>Configure a single traffic-light trial</h1>
        <p className="intro">
          Set the simulation inputs in metric units before wiring up the run controls
          and animation.
        </p>
      </section>

      <section className="layout">
        <div className="primary-stack">
          <form className="panel parameter-panel" aria-labelledby="parameters-title">
            <div className="panel-header">
              <div>
                <h2 id="parameters-title">Parameters</h2>
                <p>Defaults are tuned for an MVP run with 10 queued vehicles.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={handleRestoreDefaults}
              >
                Restore defaults
              </button>
            </div>

            <div className="field-grid">
              {PARAMETER_FIELDS.map((field) => {
                const error = validation.errors[field.name];
                const hintId = `${field.name}-hint`;
                const errorId = `${field.name}-error`;

                return (
                  <label key={field.name} className="field">
                    <span className="field-label">
                      {field.label}
                      <span className="field-unit">{field.unit}</span>
                    </span>
                    <input
                      name={field.name}
                      type={field.type}
                      inputMode={field.type === 'number' ? 'decimal' : undefined}
                      value={draft[field.name]}
                      onChange={handleChange}
                      min={field.min}
                      step={field.step}
                      aria-invalid={error ? 'true' : 'false'}
                      aria-describedby={error ? `${hintId} ${errorId}` : hintId}
                    />
                    <span id={hintId} className="field-hint">
                      {field.description}
                    </span>
                    {error ? (
                      <span id={errorId} className="field-error" role="alert">
                        {error}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </form>

          <section className="panel controls-panel" aria-labelledby="controls-title">
            <div className="panel-header panel-header--stacked">
              <div>
                <h2 id="controls-title">Simulation controls</h2>
                <p>
                  The seed input lives in Parameters and is applied when you start a new run.
                </p>
              </div>
              <p
                className={`status ${validation.isValid ? 'is-valid' : 'is-invalid'}`}
                aria-live="polite"
              >
                <span className="status-label">{simulationStatus}</span>
                <span className="status-detail">
                  {simulation.phase === 'completed'
                    ? 'Reset or run again with the current validated parameters.'
                    : simulation.phase === 'paused'
                      ? 'Resume to continue the current trial.'
                      : simulation.phase === 'running'
                        ? 'The timer is advancing with the selected simulation step.'
                        : 'Use Run, Pause, and Reset to manage a single trial.'}
                </span>
              </p>
            </div>

            <div className="controls-row">
              <button
                type="button"
                className="primary-button"
                onClick={handleRun}
                disabled={isRunDisabled}
              >
                {runButtonLabel}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handlePause}
                disabled={isPauseDisabled}
              >
                Pause
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleSimulationReset}
                disabled={isResetDisabled}
              >
                Reset
              </button>
            </div>

            <dl className="telemetry-grid">
              <div className="telemetry-card">
                <dt>Current sim time</dt>
                <dd>{formatSeconds(simulation.simTime)}</dd>
              </div>
              <div className="telemetry-card">
                <dt>Light time remaining</dt>
                <dd>{formatSeconds(simulation.lightTimeRemaining)}</dd>
              </div>
              <div className="telemetry-card">
                <dt>Seed mode</dt>
                <dd>{describeSeedMode(runConfig)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="panel summary-panel" aria-labelledby="summary-title">
          <h2 id="summary-title">Current setup</h2>
          <p className={`status ${validation.isValid ? 'is-valid' : 'is-invalid'}`}>
            {validation.isValid
              ? 'Parameters are valid for the next trial.'
              : 'Fix the highlighted values before running a trial.'}
          </p>

          <dl className="summary-list">
            {PARAMETER_FIELDS.map((field) => (
              <div key={field.name} className="summary-row">
                <dt>{field.label}</dt>
                <dd>{draft[field.name] === '' ? '—' : `${draft[field.name]} ${field.unit}`}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>
    </main>
  );
}

export default App;
