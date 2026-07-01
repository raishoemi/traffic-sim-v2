import { useMemo, useState } from 'react';
import './App.css';
import {
  createParameterDraft,
  DEFAULT_PARAMETERS,
  PARAMETER_FIELDS,
  validateParameterDraft,
} from './params.js';

function App() {
  const [draft, setDraft] = useState(() => createParameterDraft());
  const validation = useMemo(() => validateParameterDraft(draft), [draft]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleReset = () => {
    setDraft(createParameterDraft(DEFAULT_PARAMETERS));
  };

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
        <form className="panel parameter-panel" aria-labelledby="parameters-title">
          <div className="panel-header">
            <div>
              <h2 id="parameters-title">Parameters</h2>
              <p>Defaults are tuned for an MVP run with 10 queued vehicles.</p>
            </div>
            <button type="button" className="secondary-button" onClick={handleReset}>
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

        <aside className="panel summary-panel" aria-labelledby="summary-title">
          <h2 id="summary-title">Current setup</h2>
          <p className={`status ${validation.isValid ? 'is-valid' : 'is-invalid'}`}>
            {validation.isValid
              ? 'Ready for the next simulation controls task.'
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
