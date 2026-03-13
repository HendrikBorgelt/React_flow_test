import { useState, useMemo } from 'react';
import { listNodeClasses, getClassInfo } from '../schema/schemaUtils';
import schema from '../schema/dcat_4c_ap.schema.json';
import './NodePalette.css';

const TOOLBAR = [
  { id: 'home',     icon: '⌂',  label: 'Home',     title: 'Welcome screen'              },
  { id: 'load',     icon: '↑',  label: 'Load',     title: 'Load JSON or YAML file'      },
  { id: 'json',     icon: '{}', label: 'JSON',     title: 'Export as LinkML JSON'        },
  { id: 'yaml',     icon: '≡',  label: 'YAML',     title: 'Export as LinkML YAML'        },
  { id: 'settings', icon: '⚙',  label: 'Settings', title: 'Editor settings'              },
];

export function NodePalette({
  onAddNode,
  onHome,
  onSaveJson,
  onSaveYaml,
  onSettings,
  fileInputRef,
  onFileChange,
  importError,
  onDismissError,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [classesOpen, setClassesOpen] = useState(true);
  const [search, setSearch] = useState('');

  const classes  = useMemo(() => listNodeClasses(schema), []);
  const filtered = useMemo(
    () => classes.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [classes, search]
  );

  const actions = {
    home:     onHome,
    load:     () => fileInputRef.current?.click(),
    json:     onSaveJson,
    yaml:     onSaveYaml,
    settings: onSettings,
  };

  // File input must always stay in the DOM so the ref remains valid
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".json,.yaml,.yml,application/json,text/yaml"
      style={{ display: 'none' }}
      onChange={onFileChange}
    />
  );

  // ── Collapsed strip ──────────────────────────────────────────────────────
  if (!sidebarOpen) {
    return (
      <aside className="np-sidebar np-sidebar--collapsed">
        {fileInput}
        <button
          className="np-toggle-btn"
          onClick={() => setSidebarOpen(true)}
          title="Expand sidebar"
        >▶</button>
        <div className="np-icon-strip">
          {TOOLBAR.map(t => (
            <button
              key={t.id}
              className="np-icon-only"
              onClick={actions[t.id]}
              title={t.title}
            >
              {t.icon}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  // ── Expanded sidebar ─────────────────────────────────────────────────────
  return (
    <aside className="np-sidebar">
      {fileInput}

      {/* ── Action toolbar ──────────────────────────────── */}
      <div className="np-toolbar">
        <div className="np-toolbar__btns">
          {TOOLBAR.map(t => (
            <button
              key={t.id}
              className="np-toolbar__btn"
              onClick={actions[t.id]}
              title={t.title}
            >
              <span className="np-toolbar__icon">{t.icon}</span>
              <span className="np-toolbar__label">{t.label}</span>
            </button>
          ))}
        </div>
        <button
          className="np-toggle-btn np-toggle-btn--collapse"
          onClick={() => setSidebarOpen(false)}
          title="Collapse sidebar"
        >◀</button>
      </div>

      {/* ── Import error ────────────────────────────────── */}
      {importError && (
        <div className="np-error" onClick={onDismissError} title="Click to dismiss">
          ⚠ {importError}
        </div>
      )}

      {/* ── Classes section ─────────────────────────────── */}
      <div className="np-section">
        <button
          className="np-section__hdr"
          onClick={() => setClassesOpen(o => !o)}
        >
          <span className={`np-chevron${classesOpen ? ' np-chevron--open' : ''}`}>▸</span>
          Classes
        </button>

        {classesOpen && (
          <>
            <div className="np-search-wrap">
              <input
                className="np-search"
                type="search"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <ul className="np-list">
              {filtered.map(cls => (
                <li
                  key={cls}
                  className="np-item"
                  title={getClassInfo(schema, cls)?.description ?? cls}
                  onClick={() => onAddNode(cls)}
                >
                  {cls}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
