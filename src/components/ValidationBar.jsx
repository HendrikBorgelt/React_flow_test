import { useMemo, useState } from 'react';
import { getClassInfo, validateNode } from '../schema/schemaUtils';
import schema from '../schema/dcat_4c_ap.schema.json';
import './ValidationBar.css';

// Count non-required primitive + enum slots that are currently empty
function countOptionalEmpty(className, values) {
  const info = getClassInfo(schema, className);
  if (!info) return 0;
  let n = 0;
  for (const s of [...info.primitiveSlots, ...info.enumSlots]) {
    if (!s.required) {
      const v = values[s.name];
      if (v === null || v === undefined || v === '') n++;
    }
  }
  return n;
}

export function ValidationBar({ nodes, onNext }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const { reqViolations, totalReq, totalOpt } = useMemo(() => {
    const reqViolations = [];
    let totalOpt = 0;
    for (const n of nodes) {
      const v = validateNode(n.data.className, n.data.values ?? {}, schema);
      if (v.length) {
        reqViolations.push({
          nodeId:    n.id,
          className: n.data.className,
          slots:     v,
        });
      }
      totalOpt += countOptionalEmpty(n.data.className, n.data.values ?? {});
    }
    const totalReq = reqViolations.reduce((s, v) => s + v.slots.length, 0);
    return { reqViolations, totalReq, totalOpt };
  }, [nodes]);

  const hasReq = totalReq > 0;
  const isClean = !hasReq && totalOpt === 0;

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

            {totalOpt > 0 && (
              <div className="vb-popover__section">
                <div className="vb-popover__section-hdr vb-popover__section-hdr--warn">
                  Optional fields not filled
                </div>
                <div className="vb-popover__item vb-popover__item--muted">
                  {totalOpt} optional field{totalOpt !== 1 ? 's' : ''} are empty
                  across {nodes.length} node{nodes.length !== 1 ? 's' : ''}.
                  These are not required but improve metadata quality.
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
          {totalOpt > 0 && (
            <span className="vb-pill vb-pill--opt" title="Empty optional fields">
              {totalOpt} optional
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
