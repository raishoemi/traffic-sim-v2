import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { CanvasAnimator } from './components/CanvasAnimator.jsx';
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
import { advanceVehicleQueue, createVehicleQueue, getTrackedVehicle } from './sim/vehicle-queue.js';

const DEFAULT_PARAMETER_VALIDATION = validateParameterDraft(createParameterDraft());

if (!DEFAULT_PARAMETER_VALIDATION.isValid) {
  const errorSummary = Object.entries(DEFAULT_PARAMETER_VALIDATION.errors)
    .map(([fieldName, message]) => `${fieldName}: ${message}`)
    .join(', ');
  throw new Error(`Default parameters must stay valid. ${errorSummary}`);
}

const DEFAULT_VALID_PARAMETERS = DEFAULT_PARAMETER_VALIDATION.values;

function formatSeconds(value) {
  return `${value.toFixed(2)} s`;
}

function resolveDisplayedRunConfig(validation, activeRunConfig, phase) {
  if (phase === 'idle' && validation.isValid) {
    return validation.values;
  }

  return activeRunConfig;
}

function App() {
  const [draft, setDraft] = useState(() => createParameterDraft());
  const validation = useMemo(() => validateParameterDraft(draft), [draft]);
  const [activeRunConfig, setActiveRunConfig] = useState(DEFAULT_VALID_PARAMETERS);
  const [simulation, setSimulation] = useState(() =>
    createSimulationClock({ greenDuration: DEFAULT_VALID_PARAMETERS.green_duration }),
  );
  const [vehicleQueue, setVehicleQueue] = useState(() =>
    createVehicleQueue(DEFAULT_VALID_PARAMETERS),
  );
  const [trialResult, setTrialResult] = useState(null);

  useEffect(() => {
    if (simulation.phase !== 'running') {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSimulation((current) => {
        const next = advanceSimulationClock(current, {
          greenDuration: activeRunConfig.green_duration,
          timeStep: activeRunConfig.time_step,
        });
        setVehicleQueue((queue) =>
          advanceVehicleQueue(queue, activeRunConfig, { currentTime: current.simTime }),
        );
        return next;
      });
    }, activeRunConfig.time_step * 1000);

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
    setVehicleQueue(createVehicleQueue(validation.values));
    setTrialResult(null);
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

  const runConfig = resolveDisplayedRunConfig(validation, activeRunConfig, simulation.phase);
  const handleSimulationReset = () => {
    const resetRunConfig = runConfig;
    setActiveRunConfig(resetRunConfig);
    setVehicleQueue(createVehicleQueue(resetRunConfig));
    setTrialResult(null);
    setSimulation(createSimulationClock({ greenDuration: resetRunConfig.green_duration }));
  };

  useEffect(() => {
    if (trialResult) {
      return;
    }

    const trackedVehicle = getTrackedVehicle(vehicleQueue);
    if (!trackedVehicle) {
      return;
    }

    if (trackedVehicle.crossTime !== null) {
      setTrialResult({
        status:
          trackedVehicle.crossTime < activeRunConfig.green_duration ? 'pass' : 'fail',
        crossTime: trackedVehicle.crossTime,
        lastPosition: trackedVehicle.position,
      });
      return;
    }

    if (simulation.phase === 'completed') {
      setTrialResult({
        status: 'fail',
        crossTime: null,
        lastPosition: trackedVehicle.position,
      });
    }
  }, [activeRunConfig.green_duration, simulation.phase, trialResult, vehicleQueue]);

  const isRunDisabled = !validation.isValid && simulation.phase !== 'paused';
  const isPauseDisabled = simulation.phase !== 'running';
  const isResetDisabled = simulation.phase === 'idle' && simulation.simTime === 0;
  const runButtonLabel = simulation.phase === 'paused' ? 'Resume' : 'Run';
  const trackedVehicle = getTrackedVehicle(vehicleQueue);
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
  const resultStatusLabel =
    trialResult?.status === 'pass' ? 'PASS' : trialResult?.status === 'fail' ? 'FAIL' : 'Waiting';
  const resultDetail = trialResult
    ? trialResult.crossTime !== null
      ? `Tracked car crossed the stop line at ${formatSeconds(trialResult.crossTime)}.`
      : `Tracked car ended ${Math.abs(trialResult.lastPosition).toFixed(2)} m before the stop line.`
    : trackedVehicle
      ? 'The blue car is the tracked vehicle for this trial.'
      : 'Run a trial to evaluate the tracked vehicle.';

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Traffic simulator</p>
        <h1>Configure a single traffic-light trial</h1>
        <p className="intro">
          Tune the queue in metric units, run the light, and watch the tracked car try
          to clear the stop line before green ends.
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
              <div className="telemetry-card">
                <dt>Tracked car position</dt>
                <dd>
                  {trackedVehicle ? `${trackedVehicle.position.toFixed(2)} m` : '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="panel visuals-panel" aria-labelledby="visuals-title">
            <div className="panel-header panel-header--stacked">
              <div>
                <h2 id="visuals-title">Animation</h2>
                <p>Queue motion updates on each simulation step; the blue car is tracked.</p>
              </div>
              <p
                className={`status ${trialResult?.status === 'pass' ? 'is-valid' : trialResult ? 'is-invalid' : ''}`.trim()}
                aria-live="polite"
              >
                <span className="status-label">{resultStatusLabel}</span>
                <span className="status-detail">{resultDetail}</span>
              </p>
            </div>

            <CanvasAnimator vehicles={vehicleQueue} simulation={simulation} />
            <div className="canvas-legend" aria-hidden="true">
              <span className="legend-swatch legend-swatch--tracked" />
              <span>Tracked car</span>
              <span className="legend-swatch legend-swatch--queue" />
              <span>Queue vehicles</span>
              <span className="legend-swatch legend-swatch--stop-line" />
              <span>Stop line</span>
            </div>
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
