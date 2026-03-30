import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useActiveHandle } from '../shared/ActiveHandleContext';
import './GhostNode.css';

/**
 * GhostNode — temporary canvas node for a pending connection.
 *
 * Always renders as an expanded class-box (no collapsed pill state).
 *
 * Data shape: { slotName, sourceNodeId }
 */
export function GhostNode({ data }) {
  const ctx = useActiveHandle();
  const [search,       setSearch]       = useState('');
  const [sectionsOpen, setSectionsOpen] = useState({ onCanvas: false, create: false });
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    ctx?.onDismissGhost?.();
  }, [ctx]);

  const toggleSection = useCallback((key) => {
    setSectionsOpen(s => ({ ...s, [key]: !s[key] }));
  }, []);

  const q = search.toLowerCase();
  const compatibleClasses = ctx?.compatibleClasses ?? [];
  const compatibleNodes   = ctx?.compatibleNodes   ?? [];
  const filteredClasses = compatibleClasses.filter(c => c.toLowerCase().includes(q));
  const filteredNodes   = compatibleNodes.filter(n => n.label.toLowerCase().includes(q));

  // Header height ≈ 32px → handle centre at 16px from top of node
  const headerHandleStyle = { top: 16, transform: 'translateY(-50%)' };

  return (
    <div className="gn-box">

      {/* Handles sit in the header row */}
      <Handle type="target" position={Position.Left}  className="gn-handle--in"  style={headerHandleStyle} />
      <Handle type="source" position={Position.Right} id="out" className="gn-handle--out" style={headerHandleStyle} />

      {/* Header */}
      <div className="gn-box__header">
        <span className="gn-box__slot">{data.slotName}</span>
        <button className="gn-box__dismiss nodrag" onClick={handleDismiss} title="Cancel (Esc)">×</button>
      </div>

      {/* Search */}
      <div className="gn-box__search-wrap nodrag">
        <input
          ref={searchRef}
          className="gn-box__search nodrag nowheel"
          type="text"
          placeholder="Search classes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="gn-box__body nodrag nowheel">

        {/* On canvas — collapsible, first item always visible as peek */}
        {filteredNodes.length > 0 && (
          <div className="gn-box__section">
            <div className="gn-box__section-title gn-box__section-title--toggle nodrag"
                 onClick={() => toggleSection('onCanvas')}>
              <span>On canvas</span>
              <span className="gn-box__chevron">{sectionsOpen.onCanvas ? '▾' : '▸'}</span>
            </div>
            <button
              className="gn-box__item gn-box__item--existing nodrag"
              onClick={() => ctx?.onConnectExisting?.(filteredNodes[0].id)}
              title={filteredNodes[0].label}
            >
              <span className="gn-box__dot gn-box__dot--existing" />
              <span className="gn-box__item-label">{filteredNodes[0].label}</span>
            </button>
            {sectionsOpen.onCanvas && filteredNodes.slice(1).map(n => (
              <button key={n.id} className="gn-box__item gn-box__item--existing nodrag"
                      onClick={() => ctx?.onConnectExisting?.(n.id)} title={n.label}>
                <span className="gn-box__dot gn-box__dot--existing" />
                <span className="gn-box__item-label">{n.label}</span>
              </button>
            ))}
            {!sectionsOpen.onCanvas && filteredNodes.length > 1 && (
              <div className="gn-box__peek-more nodrag" onClick={() => toggleSection('onCanvas')}>
                ▸ {filteredNodes.length - 1} more…
              </div>
            )}
          </div>
        )}

        {/* Create & connect — collapsible, first item always visible as peek */}
        <div className="gn-box__section">
          <div className="gn-box__section-title gn-box__section-title--toggle nodrag"
               onClick={() => toggleSection('create')}>
            <span>Create &amp; connect</span>
            <span className="gn-box__chevron">{sectionsOpen.create ? '▾' : '▸'}</span>
          </div>
          {filteredClasses.length === 0 && <div className="gn-box__empty">No matches</div>}
          {filteredClasses.slice(0, 1).map(cls => (
            <button key={cls} className="gn-box__item gn-box__item--new nodrag"
                    onClick={() => ctx?.onCreateAndConnect?.(cls)} title={cls}>
              <span className="gn-box__dot gn-box__dot--new" />
              <span className="gn-box__item-label">{cls}</span>
            </button>
          ))}
          {sectionsOpen.create && filteredClasses.slice(1).map(cls => (
            <button key={cls} className="gn-box__item gn-box__item--new nodrag"
                    onClick={() => ctx?.onCreateAndConnect?.(cls)} title={cls}>
              <span className="gn-box__dot gn-box__dot--new" />
              <span className="gn-box__item-label">{cls}</span>
            </button>
          ))}
          {!sectionsOpen.create && filteredClasses.length > 1 && (
            <div className="gn-box__peek-more nodrag" onClick={() => toggleSection('create')}>
              ▸ {filteredClasses.length - 1} more…
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
