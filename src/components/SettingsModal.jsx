import './SettingsModal.css';

// ── Default settings (exported so App.jsx can use them as initial state) ────
export const DEFAULT_SETTINGS = {
  minZoom:    0.1,          // default RF is 0.5; lower = more zoom-out
  maxZoom:    4,
  bgVariant:  'dots',       // 'dots' | 'lines' | 'cross'
  snapToGrid: false,
  snapGrid:   [15, 15],     // [x, y] in px — only used when snapToGrid=true
  edgeType:   'default',    // 'default' (bezier) | 'straight' | 'step' | 'smoothstep'
};

const EDGE_OPTIONS = [
  { value: 'default',     label: 'Bezier (curved)' },
  { value: 'straight',    label: 'Straight' },
  { value: 'step',        label: 'Step (orthogonal)' },
  { value: 'smoothstep',  label: 'Smooth step' },
];

const BG_OPTIONS = [
  { value: 'dots',  label: 'Dots' },
  { value: 'lines', label: 'Lines' },
  { value: 'cross', label: 'Cross' },
];

export function SettingsModal({ settings, onChange, onClose }) {
  const set = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <div className="sm-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sm-card">

        <div className="sm-header">
          <span className="sm-header__icon">⚙</span>
          <h2 className="sm-header__title">Settings</h2>
          <button className="sm-header__close" onClick={onClose} title="Close">×</button>
        </div>

        {/* ── Zoom ─────────────────────────────────────────── */}
        <section className="sm-section">
          <h3 className="sm-section__title">Zoom</h3>

          <div className="sm-row">
            <label className="sm-label">
              Min zoom
              <span className="sm-value">{Math.round(settings.minZoom * 100)}%</span>
            </label>
            <input
              type="range"
              className="sm-slider"
              min={0.05} max={0.5} step={0.05}
              value={settings.minZoom}
              onChange={e => set('minZoom', parseFloat(e.target.value))}
            />
          </div>

          <div className="sm-row">
            <label className="sm-label">
              Max zoom
              <span className="sm-value">{Math.round(settings.maxZoom * 100)}%</span>
            </label>
            <input
              type="range"
              className="sm-slider"
              min={1} max={8} step={0.5}
              value={settings.maxZoom}
              onChange={e => set('maxZoom', parseFloat(e.target.value))}
            />
          </div>
        </section>

        {/* ── Canvas ───────────────────────────────────────── */}
        <section className="sm-section">
          <h3 className="sm-section__title">Canvas</h3>

          <div className="sm-row">
            <label className="sm-label">Background</label>
            <div className="sm-radio-group">
              {BG_OPTIONS.map(opt => (
                <label key={opt.value} className="sm-radio">
                  <input
                    type="radio"
                    name="bgVariant"
                    value={opt.value}
                    checked={settings.bgVariant === opt.value}
                    onChange={() => set('bgVariant', opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="sm-row">
            <label className="sm-label">Snap to grid</label>
            <label className="sm-toggle">
              <input
                type="checkbox"
                checked={settings.snapToGrid}
                onChange={e => set('snapToGrid', e.target.checked)}
              />
              <span className="sm-toggle__track" />
            </label>
          </div>

          {settings.snapToGrid && (
            <div className="sm-row sm-row--sub">
              <label className="sm-label">Grid size (px)</label>
              <input
                type="number"
                className="sm-input-num"
                min={5} max={50} step={5}
                value={settings.snapGrid[0]}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v > 0) set('snapGrid', [v, v]);
                }}
              />
            </div>
          )}
        </section>

        {/* ── Edges ────────────────────────────────────────── */}
        <section className="sm-section">
          <h3 className="sm-section__title">Edges</h3>

          <div className="sm-row">
            <label className="sm-label">Edge style</label>
            <select
              className="sm-select"
              value={settings.edgeType}
              onChange={e => set('edgeType', e.target.value)}
            >
              {EDGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="sm-footer">
          <button
            className="sm-btn sm-btn--ghost"
            onClick={() => onChange(DEFAULT_SETTINGS)}
          >
            Reset to defaults
          </button>
          <button className="sm-btn sm-btn--primary" onClick={onClose}>
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
