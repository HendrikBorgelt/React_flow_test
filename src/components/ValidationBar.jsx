import { useMemo, useState } from 'react';
import { getClassInfo, validateNode } from '../schema/schemaUtils';
import { config } from '~config';
const { schema } = config;
import './ValidationBar.css';

// Collect non-required primitive + enum slots that are currently empty
function getRecommendedEmpty(className, values) {
  const info = getClassInfo(schema, className);
  if (!info) return [];
  return [...info.primitiveSlots, ...info.enumSlots]
    .filter(s => {
      if (s.required) return false;
      const v = values[s.name];
      return v === null || v === undefined || v === '';
    })
    .map(s => s.name);
}

export function ValidationBar({ nodes, onNext }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const { reqViolations, totalReq, recViolations, totalRec } = useMemo(() => {
    const reqViolations = [];
    const recViolations = [];
    for (const n of nodes) {
      const v = validateNode(n.data.className, n.data.values ?? {}, schema);
      if (v.length) {
        reqViolations.push({ nodeId: n.id, className: n.data.className, slots: v });
      }
      const rec = getRecommendedEmpty(n.data.className, n.data.values ?? {});
      if (rec.length) {
        recViolations.push({ nodeId: n.id, className: n.data.className, count: rec.length });
      }
    }
    const totalReq = reqViolations.reduce((s, v) => s + v.slots.length, 0);
    const totalRec = recViolations.reduce((s, v) => s + v.count, 0);
    return { reqViolations, totalReq, recViolations, totalRec };
  }, [nodes]);

  const hasReq   = totalReq > 0;
  const hasRec   = totalRec > 0;
  const isClean  = !hasReq && !hasRec;

  // ── Clean state ────────────────────────────────────────────────────────────
  if (isClean) {
    return (
      <div className="vb-anchor">
        <div className="vb-bar vb-bar--valid">
          <span className="vb-valid-icon">✓</span>
          <span>All required fields filled</span>
        </div>
      </div>
    );
  }

  // ── Has issues ─────────────────────────────────────────────────────────────
  return (
    <div className="vb-anchor">
      <div className="vb-wrap">

        {/* Detail popover — appears above the bar */}
        {detailOpen && (
          <div className="vb-popover">
            <div className="vb-popover__title">Validation log</div>

            {reqViolations.length > 0 && (
              <div className="vb-popover__section">
                <div className="vb-popover__section-hdr vb-popover__section-hdr--error">
                  Required fields empty
                </div>
                {reqViolations.map(v => (
                  <div key={v.nodeId} className="vb-popover__item">
                    <span className="vb-popover__class">{v.className}</span>
                    <span className="vb-popover__fields">
                      {v.slots.map(s => s.slotName).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {recViolations.length > 0 && (
              <div className="vb-popover__section">
                <div className="vb-popover__section-hdr vb-popover__section-hdr--warn">
                  Recommended fields empty
                </div>
                <div className="vb-popover__item vb-popover__item--muted">
                  {recViolations.map(v => v.className).join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status bar */}
        <div className="vb-bar">
          {hasReq && (
            <span className="vb-pill vb-pill--error" title="Empty required fields">
              ⚠ {totalReq} required
            </span>
          )}
          {hasRec && (
            <span className="vb-pill vb-pill--opt" title="Empty recommended fields">
              {totalRec} recommended
            </span>
          )}

          <div className="vb-sep" />

          <button
            className={`vb-btn${detailOpen ? ' vb-btn--active' : ''}`}
            onClick={() => setDetailOpen(o => !o)}
            title="Toggle validation log"
          >
            ℹ
          </button>

          {hasReq && (
            <button
              className="vb-btn vb-btn--next"
              onClick={() => { onNext(); setDetailOpen(false); }}
              title="Focus next node with missing required fields"
            >
              → Next error
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
