import './ExportWarning.css';

/**
 * Modal shown before export when one or more nodes have empty required fields.
 *
 * Props:
 *   violations  – array of { nodeId, className, slotNames[] }
 *   format      – 'json' | 'yaml'
 *   onExport    – called when user chooses "Export anyway"
 *   onCancel    – called to dismiss without exporting
 */
export function ExportWarning({ violations, format, onExport, onCancel }) {
  return (
    <div
      className="ew-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="ew-card">

        <div className="ew-header">
          <span className="ew-header__icon">⚠</span>
          <h2 className="ew-header__title">Missing required fields</h2>
        </div>

        <p className="ew-body__lead">
          The following node{violations.length > 1 ? 's have' : ' has'} empty required
          fields. The exported {format.toUpperCase()} may fail schema validation.
        </p>

        <ul className="ew-list">
          {violations.map(v => (
            <li key={v.nodeId} className="ew-item">
              <span className="ew-item__class">{v.className}</span>
              <span className="ew-item__fields">
                {v.slotNames.join(', ')}
              </span>
            </li>
          ))}
        </ul>

        <div className="ew-footer">
          <button className="ew-btn ew-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="ew-btn ew-btn--danger" onClick={onExport}>
            Export anyway
          </button>
        </div>

      </div>
    </div>
  );
}
