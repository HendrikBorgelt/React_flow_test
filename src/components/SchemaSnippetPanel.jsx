import { useMemo, useRef, useState } from 'react';
import './SchemaSnippetPanel.css';

const PALETTE = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#22c55e',
  '#f97316', '#ec4899', '#eab308', '#ef4444',
  '#3b82f6', '#14b8a6', '#a78bfa', '#64748b',
];

export function SchemaSnippetPanel({
  schema,
  visibleClasses,
  onVisibilityChange,
  showInheritance,
  showRelations,
  onEdgeKindToggle,
  layoutFrozen,
  onResetLayout,
  onToggleFreeze,
  onSaveView,
  onLoadView,
  onModeSwitch,
  classOriginMap,
  originColors,
  nodeColorOverrides,
  onColorChange,
  onRevertColors,
  onResetColors,
  prevColorOverrides,
}) {
  const [open,           setOpen]           = useState(true);
  const [listOpen,       setListOpen]       = useState(true);
  const [search,         setSearch]         = useState('');
  const [colorPickerFor, setColorPickerFor] = useState(null); // class name or null
  const fileRef = useRef(null);

  const allClasses = useMemo(() => {
    const defs = schema.$defs ?? {};
    return Object.keys(defs)
      .filter(n => defs[n]?.type === 'object' && !Array.isArray(defs[n].enum))
      .sort();
  }, [schema]);

  const q        = search.trim().toLowerCase();
  const filtered = q ? allClasses.filter(c => c.toLowerCase().includes(q)) : allClasses;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => {
      try { onLoadView(JSON.parse(ev.target.result)); }
      catch (err) { alert(`Cannot load view: ${err.message}`); }
    };
    reader.readAsText(file);
  };

  const resolveSwatchColor = (cls) =>
    nodeColorOverrides?.get(cls)
    ?? originColors?.get(classOriginMap?.get(cls))
    ?? '#6366f1';

  if (!open) {
    return (
      <aside className="ssp ssp--col">
        <button className="ssp-tog" onClick={() => setOpen(true)} title="Expand sidebar">▶</button>
        <button className="ssp-modebtn" onClick={onModeSwitch} title="Switch to Data View">📄</button>
      </aside>
    );
  }

  return (
    <aside className="ssp" onClick={() => colorPickerFor && setColorPickerFor(null)}>
      <input
        ref={fileRef} type="file" accept=".view.json,application/json"
        style={{ display: 'none' }} onChange={handleFile}
      />

      {/* ── Header ─────────────────────────────────────── */}
      <div className="ssp-head">
        <span className="ssp-title">Schema View</span>
        <div className="ssp-head-right">
          <button className="ssp-modebtn" onClick={onModeSwitch} title="Switch to Data View">
            Data ↔
          </button>
          <button className="ssp-tog ssp-tog--r" onClick={() => setOpen(false)} title="Collapse sidebar">◀</button>
        </div>
      </div>

      {/* ── View file controls ─────────────────────────── */}
      <div className="ssp-group">
        <div className="ssp-row2">
          <button className="ssp-btn" onClick={onSaveView}>Save View</button>
          <button className="ssp-btn" onClick={() => fileRef.current?.click()}>Load View</button>
        </div>
      </div>

      {/* ── Layout controls ────────────────────────────── */}
      <div className="ssp-group">
        <div className="ssp-group-label">Layout</div>
        <div className="ssp-row2">
          <button
            className="ssp-btn"
            onClick={onResetLayout}
            disabled={layoutFrozen}
            title={layoutFrozen ? 'Unfreeze layout first' : 'Re-run Dagre auto-layout'}
          >
            Reset Layout
          </button>
          <button
            className={`ssp-btn${layoutFrozen ? ' ssp-btn--on' : ''}`}
            onClick={onToggleFreeze}
            title={layoutFrozen ? 'Click to allow re-layout' : 'Click to freeze current positions'}
          >
            {layoutFrozen ? '🔒 Frozen' : '🔓 Freeze'}
          </button>
        </div>
      </div>

      {/* ── Color controls ─────────────────────────────── */}
      <div className="ssp-group">
        <div className="ssp-group-label">Colors</div>
        <div className="ssp-row2">
          <button
            className="ssp-btn"
            onClick={onRevertColors}
            disabled={!prevColorOverrides}
            title="Undo last color change"
          >
            ↩ Revert
          </button>
          <button
            className="ssp-btn"
            onClick={onResetColors}
            title="Reset all colors to auto (by YAML origin)"
          >
            Reset all
          </button>
        </div>
      </div>

      {/* ── Edge type toggles ──────────────────────────── */}
      <div className="ssp-group">
        <div className="ssp-group-label">Edge types</div>
        <label className="ssp-chk">
          <input type="checkbox" checked={showInheritance} onChange={() => onEdgeKindToggle('inheritance')} />
          <span className="ssp-dot" style={{ background: '#8b5cf6' }} />
          Inheritance (is_a)
        </label>
        <label className="ssp-chk">
          <input type="checkbox" checked={showRelations} onChange={() => onEdgeKindToggle('relation')} />
          <span className="ssp-dot" style={{ background: '#3b82f6' }} />
          Relations (slots)
        </label>
      </div>

      {/* ── Class visibility list ──────────────────────── */}
      <div className="ssp-section">
        <button className="ssp-sec-hdr" onClick={() => setListOpen(o => !o)}>
          <span className={`ssp-chev${listOpen ? ' ssp-chev--open' : ''}`}>▸</span>
          Classes
          <span className="ssp-count">{visibleClasses.size}&thinsp;/&thinsp;{allClasses.length}</span>
        </button>

        {listOpen && (
          <>
            <div className="ssp-sw">
              <input
                className="ssp-search" type="search" placeholder="Search classes…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="ssp-bulk">
              <button className="ssp-sm" onClick={() => onVisibilityChange(new Set(allClasses))}>All</button>
              <button className="ssp-sm" onClick={() => onVisibilityChange(new Set())}>None</button>
            </div>
            <div className="ssp-list">
              {filtered.map(cls => {
                const swatchColor  = resolveSwatchColor(cls);
                const isOverridden = nodeColorOverrides?.has(cls);
                const pickerOpen   = colorPickerFor === cls;

                return (
                  <div key={cls} className="ssp-cls-wrap">
                    <label className="ssp-cls">
                      <input
                        type="checkbox"
                        checked={visibleClasses.has(cls)}
                        onChange={() => {
                          const next = new Set(visibleClasses);
                          next.has(cls) ? next.delete(cls) : next.add(cls);
                          onVisibilityChange(next);
                        }}
                      />
                      <span
                        className={`ssp-swatch${isOverridden ? ' ssp-swatch--custom' : ''}`}
                        style={{ background: swatchColor }}
                        title={isOverridden
                          ? 'Custom color — click to change'
                          : `Auto (${classOriginMap?.get(cls) ?? '?'}) — click to override`}
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setColorPickerFor(pickerOpen ? null : cls); }}
                      />
                      <span className="ssp-cname">{cls}</span>
                    </label>

                    {/* Inline color picker popup */}
                    {pickerOpen && (
                      <div className="ssp-cpicker" onClick={e => e.stopPropagation()}>
                        <div className="ssp-cpicker__grid">
                          {PALETTE.map(c => (
                            <button
                              key={c}
                              className={`ssp-cpicker__chip${nodeColorOverrides?.get(cls) === c ? ' active' : ''}`}
                              style={{ background: c }}
                              title={c}
                              onClick={() => { onColorChange(cls, c); setColorPickerFor(null); }}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          className="ssp-cpicker__custom"
                          value={nodeColorOverrides?.get(cls) ?? swatchColor}
                          onInput={e => onColorChange(cls, e.target.value)}
                          title="Custom color"
                        />
                        {isOverridden && (
                          <button
                            className="ssp-cpicker__reset"
                            onClick={() => { onColorChange(cls, null); setColorPickerFor(null); }}
                          >
                            Reset to auto
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
