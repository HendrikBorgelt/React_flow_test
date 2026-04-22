import { useEffect, useMemo, useState } from 'react';
import { listNodeClasses, getClassInfo } from '../schema/schemaUtils';
import { config } from '~config';
const { schema } = config;
import './NodePalette.css';

const TOOLBAR = [
  { id: 'home',     icon: '⌂',  label: 'Home',     title: 'Welcome screen'         },
  { id: 'load',     icon: '↑',  label: 'Load',     title: 'Load JSON or YAML file' },
  { id: 'json',     icon: '{}', label: 'JSON',     title: 'Export as LinkML JSON'  },
  { id: 'yaml',     icon: '≡',  label: 'YAML',     title: 'Export as LinkML YAML'  },
  { id: 'settings', icon: '⚙',  label: 'Settings', title: 'Editor settings'        },
  { id: 'schema',   icon: '◈',  label: 'Schema',   title: 'Switch to Schema View'  },
];

// Build the full ordered sections list once at module level (stable reference).
// "Relevant classes" is always first and is auto-computed; the rest come from config.
const RELEVANT_SECTION = { id: 'relevant', label: 'Relevant classes' };
const EXTRA_SECTIONS   = config.paletteSections ?? [];
const ALL_SECTIONS     = [RELEVANT_SECTION, ...EXTRA_SECTIONS];

const DEFAULT_OPEN = Object.fromEntries(
  ALL_SECTIONS.map(s => [s.id, s.id === 'relevant'])
);

export function NodePalette({
  onAddNode,
  onHome,
  onSaveJson,
  onSaveYaml,
  onSettings,
  onSchemaMode,
  fileInputRef,
  onFileChange,
  importError,
  onDismissError,
}) {
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [classesOpen,  setClassesOpen]  = useState(true);
  const [search,       setSearch]       = useState('');
  const [openSections, setOpenSections] = useState(DEFAULT_OPEN);

  // "Relevant classes" = currently instantiable, non-abstract, non-inline classes
  const relevantClasses = useMemo(
    () => listNodeClasses(schema, config.abstractClasses ?? []),
    []
  );

  // Attach the computed class list to the relevant section
  const sections = useMemo(() => [
    { ...RELEVANT_SECTION, classes: relevantClasses },
    ...EXTRA_SECTIONS,
  ], [relevantClasses]);

  // When search changes: auto-expand sections with matches, collapse empty ones.
  // When cleared: restore defaults.
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setOpenSections(DEFAULT_OPEN);
      return;
    }
    setOpenSections(
      Object.fromEntries(
        sections.map(s => [s.id, s.classes.some(c => c.toLowerCase().includes(q))])
      )
    );
  }, [search, sections]);

  const toggleSection = (id) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const actions = {
    home:     onHome,
    load:     () => fileInputRef.current?.click(),
    json:     onSaveJson,
    yaml:     onSaveYaml,
    settings: onSettings,
    schema:   onSchemaMode,
  };

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
        <button className="np-toggle-btn" onClick={() => setSidebarOpen(true)} title="Expand sidebar">▶</button>
        <div className="np-icon-strip">
          {TOOLBAR.map(t => (
            <button key={t.id} className="np-icon-only" onClick={actions[t.id]} title={t.title}>
              {t.icon}
            </button>
          ))}
        </div>
      </aside>
    );
  }

  // ── Expanded sidebar ─────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();

  return (
    <aside className="np-sidebar">
      {fileInput}

      {/* ── Action toolbar ──────────────────────────────── */}
      <div className="np-toolbar">
        <div className="np-toolbar__btns">
          {TOOLBAR.map(t => (
            <button key={t.id} className="np-toolbar__btn" onClick={actions[t.id]} title={t.title}>
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
        <button className="np-section__hdr" onClick={() => setClassesOpen(o => !o)}>
          <span className={`np-chevron${classesOpen ? ' np-chevron--open' : ''}`}>▸</span>
          Classes
        </button>

        {classesOpen && (
          <>
            {/* Search */}
            <div className="np-search-wrap">
              <input
                className="np-search"
                type="search"
                placeholder="Search all classes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Subsections */}
            <div className="np-subsections">
              {sections.map(section => {
                const matches = q
                  ? section.classes.filter(c => c.toLowerCase().includes(q))
                  : section.classes;

                // Hide sections with no matches while searching
                if (q && matches.length === 0) return null;

                const isOpen = openSections[section.id] ?? false;

                return (
                  <div key={section.id} className="np-sub">
                    <button
                      className="np-sub__hdr"
                      onClick={() => toggleSection(section.id)}
                    >
                      <span className={`np-chevron${isOpen ? ' np-chevron--open' : ''}`}>▸</span>
                      <span className="np-sub__label">{section.label}</span>
                      {q && (
                        <span className="np-sub__badge">
                          {matches.length} / {section.classes.length}
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <ul className="np-list np-list--sub">
                        {matches.map(cls => (
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
