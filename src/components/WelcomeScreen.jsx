import { useRef, useState } from 'react';
import msJson from '../examples/MaterialSample-001.json';
import ssJson from '../examples/SubstanceSample-001.json';
import crJson from '../examples/ChemicalReaction-001.json';
import schema from '../schema/dcat_4c_ap.schema.json';
import { fromJson } from '../loaders/fromJson';
import './WelcomeScreen.css';

const EXAMPLES = [
  {
    json:  msJson,
    label: 'MaterialSample',
    title: "Philip's Wood Sample",
    desc:  'Physical sample with mass, temperature, volume & pressure measurements.',
  },
  {
    json:  ssJson,
    label: 'SubstanceSample',
    title: 'CRS-50440',
    desc:  'Chemical substance with InChI, SMILES, molecular formula & molar mass.',
  },
  {
    json:  crJson,
    label: 'ChemicalReaction',
    title: 'CRR-56408 Reaction',
    desc:  'Phosphorylation with starting materials, solvents, temperatures & yield.',
  },
];

export function WelcomeScreen({ onNew, onLoad }) {
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const tryLoad = (json, label) => {
    setError(null);
    try {
      onLoad(fromJson(json, schema));
    } catch (err) {
      setError({ label, message: err.message, stack: err.stack });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected after fixing
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      let json;
      try {
        json = JSON.parse(ev.target.result);
      } catch (parseErr) {
        setError({ label: file.name, message: `Invalid JSON: ${parseErr.message}` });
        return;
      }
      tryLoad(json, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div className="ws-backdrop">
      <div className="ws-card">

        <div className="ws-logo">⬡</div>
        <h1 className="ws-title">Schema Graph Editor</h1>
        <p className="ws-sub">DCAT-AP+ · chem-dcat-ap visual instance editor</p>

        <div className="ws-actions">
          <button className="ws-btn ws-btn--primary" onClick={onNew}>
            + Start from scratch
          </button>
          <button className="ws-btn ws-btn--secondary" onClick={() => fileRef.current.click()}>
            📂 Load from file…
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {error && (
          <div className="ws-error">
            <div className="ws-error__title">Failed to load "{error.label}"</div>
            <div className="ws-error__msg">{error.message}</div>
            {error.stack && (
              <pre className="ws-error__stack">{error.stack}</pre>
            )}
          </div>
        )}

        <div className="ws-divider"><span>or load an example</span></div>

        <div className="ws-examples">
          {EXAMPLES.map(ex => (
            <button
              key={ex.title}
              className="ws-example"
              onClick={() => tryLoad(ex.json, ex.title)}
            >
              <span className="ws-example__badge">{ex.label}</span>
              <span className="ws-example__title">{ex.title}</span>
              <span className="ws-example__desc">{ex.desc}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
