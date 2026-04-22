import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import './SchemaTemplateNode.css';

const KIND_META = {
  primitive: { label: 'str',  bg: '#10b981' },
  enum:      { label: 'enum', bg: '#f59e0b' },
  widget:    { label: 'meas', bg: '#6366f1' },
  lookup:    { label: 'ref',  bg: '#8b5cf6' },
  ref:       { label: '→',   bg: '#3b82f6' },
};

const PREVIEW = 6;

function isLight(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 128;
}

export const SchemaTemplateNode = memo(function SchemaTemplateNode({ data, selected }) {
  const [expanded, setExpanded] = useState(false);
  const { className, description, slots = [], isAbstract, color } = data;

  const shown = expanded ? slots : slots.slice(0, PREVIEW);
  const extra = slots.length - PREVIEW;

  const hdrBg    = color ?? (isAbstract ? '#7c3aed' : '#6366f1');
  const hdrColor = isLight(hdrBg) ? '#1e293b' : '#ffffff';

  return (
    <div className={['stn', selected && 'stn--sel', isAbstract && 'stn--abstract'].filter(Boolean).join(' ')}>
      <Handle type="target" position={Position.Top}    id="t" className="stn-h" />
      <Handle type="source" position={Position.Bottom} id="b" className="stn-h" />
      <Handle type="target" position={Position.Left}   id="l" className="stn-h" />
      <Handle type="source" position={Position.Right}  id="r" className="stn-h" />

      <div className="stn-hdr" style={{ background: hdrBg, color: hdrColor }}>
        <span className="stn-name" title={className} style={{ color: hdrColor }}>{className}</span>
        {isAbstract && <span className="stn-tag">abstract</span>}
      </div>

      {description && (
        <div className="stn-desc" title={description}>
          {description.length > 100 ? description.slice(0, 100) + '…' : description}
        </div>
      )}

      <div className="stn-slots">
        {shown.map(slot => {
          const m = KIND_META[slot.slotKind] ?? KIND_META.primitive;
          return (
            <div key={`${slot.slotKind}-${slot.name}`} className="stn-slot">
              <span className="stn-kind" style={{ background: m.bg }}>{m.label}</span>
              <span className={`stn-sname${slot.required ? ' stn-sname--req' : ''}`}>
                {slot.name}
              </span>
              {slot.slotKind === 'ref' && slot.targetClasses?.length > 0 && (
                <span className="stn-tgt" title={slot.targetClasses.join(', ')}>
                  {slot.targetClasses[0]}{slot.targetClasses.length > 1 ? ` +${slot.targetClasses.length - 1}` : ''}
                </span>
              )}
            </div>
          );
        })}

        {!expanded && extra > 0 && (
          <button className="stn-more" onClick={() => setExpanded(true)}>▼ +{extra} more</button>
        )}
        {expanded && slots.length > PREVIEW && (
          <button className="stn-more" onClick={() => setExpanded(false)}>▲ Show less</button>
        )}
        {slots.length === 0 && <div className="stn-empty">no slots</div>}
      </div>
    </div>
  );
});
