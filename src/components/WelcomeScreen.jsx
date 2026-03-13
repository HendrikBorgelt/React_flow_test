import { useRef, useState } from 'react';
import { load as yamlLoad } from 'js-yaml';
import { fromJson } from '../loaders/fromJson';
import './WelcomeScreen.css';

/**
 * WelcomeScreen
 *
 * Props
 *   config   – the active schema config (from ~config alias):
 *              { appTitle, appSubtitle, githubUrl, schema, examples[] }
 *   onNew    – called when user clicks "Start from scratch"
 *   onLoad   – called with { nodes, edges } when user loads an example or file
 */
export function WelcomeScreen({ config, onNew, onLoad }) {
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const { appTitle, appSubtitle, githubUrl, schema, examples } = config;

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
    const isYaml = /\.(ya?ml)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      let data;
      try {
        data = isYaml ? yamlLoad(ev.target.result) : JSON.parse(ev.target.result);
      } catch (parseErr) {
        const fmt = isYaml ? 'YAML' : 'JSON';
        setError({ label: file.name, message: `Invalid ${fmt}: ${parseErr.message}` });
        return;
      }
      tryLoad(data, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div className="ws-backdrop">
      <div className="ws-card">

        <div className="ws-logo">⬡</div>
        <h1 className="ws-title">{appTitle}</h1>
        <p className="ws-sub">{appSubtitle}</p>

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
          accept=".json,.yaml,.yml,application/json,text/yaml"
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

        {examples && examples.length > 0 && (
          <>
            <div className="ws-divider"><span>or load an example</span></div>

            <div className="ws-examples">
              {examples.map(ex => (
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
          </>
        )}

        {githubUrl && (
          <div className="ws-footer">
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="ws-footer__link">
              Schema source ↗
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
