import { useState, useEffect, useRef } from 'react';
import './ConnectionMenu.css';

/**
 * ConnectionMenu — floating popover shown when a user clicks a ref-slot handle.
 *
 * Presents two sections:
 *   "On canvas"      — existing nodes on the canvas that are valid targets
 *   "Create & connect" — all valid target classes (creates a new node + edge)
 *
 * Shared component: usable by both the editor and (future) explorer.
 *
 * Props:
 *   position         { x, y }  screen coordinates (clientX/Y from click event)
 *   compatibleClasses string[] class names that can be created and connected
 *   compatibleNodes   { id, label }[] existing canvas nodes that are valid targets
 *   onCreateAndConnect (className: string) => void
 *   onConnectExisting  (nodeId: string) => void
 *   onClose            () => void
 */
export function ConnectionMenu({
  position,
  compatibleClasses,
  compatibleNodes,
  onCreateAndConnect,
  onConnectExisting,
  onClose,
}) {
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  // Auto-focus the search input when the menu opens
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const q = search.toLowerCase();
  const filteredClasses = compatibleClasses.filter(c => c.toLowerCase().includes(q));
  const filteredNodes   = compatibleNodes.filter(n => n.label.toLowerCase().includes(q));

  // Clamp position so menu never overflows the viewport
  const MENU_WIDTH  = 260;
  const MENU_OFFSET = 20;
  const left = Math.min(position.x + MENU_OFFSET, window.innerWidth - MENU_WIDTH - 8);
  const top  = position.y - 24; // slight upward offset so handle aligns with first item

  return (
    <div className="cm-panel" style={{ left, top }} onMouseDown={e => e.stopPropagation()}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="cm-header">
        <span className="cm-header__title">Connect slot</span>
        <button className="cm-close nodrag" onClick={onClose} title="Close (Esc)">×</button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="cm-search-wrap">
        <input
          ref={searchRef}
          className="cm-search nodrag nowheel"
          type="text"
          placeholder="Search classes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="cm-body">

        {/* ── On canvas ──────────────────────────────────────────────── */}
        {filteredNodes.length > 0 && (
          <div className="cm-section">
            <div className="cm-section__title">On canvas</div>
            {filteredNodes.map(n => (
              <button
                key={n.id}
                className="cm-item cm-item--existing nodrag"
                onClick={() => { onConnectExisting(n.id); onClose(); }}
                title={n.label}
              >
                <span className="cm-item__dot cm-item__dot--existing" />
                <span className="cm-item__label">{n.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Create & connect ───────────────────────────────────────── */}
        <div className="cm-section">
          <div className="cm-section__title">Create &amp; connect</div>
          {filteredClasses.length === 0 && (
            <div className="cm-empty">No matches</div>
          )}
          {filteredClasses.map(cls => (
            <button
              key={cls}
              className="cm-item cm-item--new nodrag"
              onClick={() => { onCreateAndConnect(cls); onClose(); }}
              title={cls}
            >
              <span className="cm-item__dot cm-item__dot--new" />
              <span className="cm-item__label">{cls}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ── Footer hint ────────────────────────────────────────────── */}
      <div className="cm-hint">
        Or drag the handle dot to connect to an existing node
      </div>

    </div>
  );
}
