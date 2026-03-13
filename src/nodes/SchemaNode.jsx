import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Handle, NodeResizer, Position, useReactFlow } from '@xyflow/react';
import { getClassInfo, validateNode } from '../schema/schemaUtils';
import schema from '../schema/dcat_4c_ap.schema.json';
import './SchemaNode.css';

// Height constants — must match CSS values (used for source-handle positioning)
const CONN_TITLE_H = 22;   // px — "connections" section title
const CONN_ROW_H   = 24;   // px — each connection label row

const defs = schema.$defs ?? {};

function isQuantitativeClass(className) {
  return 'has_quantity_type' in (defs[className]?.properties ?? {});
}

// ── Collapsible section title ──────────────────────────────────────────────

function SectionTitle({ label, open, onToggle, errorCount = 0 }) {
  return (
    <button className="sn-section__title sn-section__title--toggle" onClick={onToggle}>
      <span className={`sn-chevron${open ? ' sn-chevron--open' : ''}`}>▸</span>
      {label}
      {errorCount > 0 && (
        <span className="sn-section__badge" title={`${errorCount} required field(s) empty`}>
          {errorCount}
        </span>
      )}
    </button>
  );
}

// ── PrimitiveField ────────────────────────────────────────────────────────────

function PrimitiveField({ slot, value, onUpdate, invalid }) {
  const numeric = slot.primitiveType === 'number' || slot.primitiveType === 'integer';
  return (
    <div className="sn-row">
      <label className="sn-label" title={slot.description ?? slot.name}>
        {slot.name}{slot.required && <span className="sn-req">*</span>}
      </label>
      <input
        className={`sn-input nodrag nowheel${invalid ? ' sn-input--invalid' : ''}`}
        type={numeric ? 'number' : 'text'}
        value={value ?? ''}
        placeholder={slot.name}
        onChange={e => onUpdate(e.target.value)}
      />
    </div>
  );
}

// ── EnumField ─────────────────────────────────────────────────────────────────

function EnumField({ slot, value, onUpdate, invalid }) {
  return (
    <div className="sn-row">
      <label className="sn-label" title={slot.description ?? slot.name}>
        {slot.name}{slot.required && <span className="sn-req">*</span>}
      </label>
      <select
        className={`sn-select nodrag${invalid ? ' sn-select--invalid' : ''}`}
        value={value ?? ''}
        onChange={e => onUpdate(e.target.value || null)}
      >
        <option value="">—</option>
        {slot.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}

// ── WidgetField ───────────────────────────────────────────────────────────────

function WidgetField({ slot, values, onUpdate, invalid }) {
  const rows  = values ?? [];
  const quant = isQuantitativeClass(slot.targetClass);
  const empty = quant
    ? { value: '', unit: '', title: '', quantity_type: '' }
    : { value: '', title: '' };

  // Placeholder for has_quantity_type — auto-derived for specific subclasses
  const qtPlaceholder = quant && slot.targetClass !== 'QuantitativeAttribute'
    ? `http://qudt.org/vocab/quantitykind/${slot.targetClass}`
    : 'http://qudt.org/vocab/quantitykind/…';

  const setRow = (i, patch) =>
    onUpdate(rows.map((r, j) => j === i ? { ...r, ...patch } : r));

  return (
    <div className={`sn-widget${invalid && rows.length === 0 ? ' sn-widget--invalid' : ''}`}>
      <div className="sn-widget__name" title={slot.description ?? ''}>
        {slot.name}{slot.required && <span className="sn-req">*</span>}
      </div>

      {rows.map((row, i) => (
        <div key={i} className="sn-widget__entry nodrag">

          {/* Title row */}
          <div className="sn-widget__row">
            <input
              className="sn-input sn-input--wtitle"
              placeholder="label (optional)"
              value={row.title ?? ''}
              onChange={e => setRow(i, { title: e.target.value })}
            />
            <button
              className="sn-btn sn-btn--x nodrag"
              onClick={() => onUpdate(rows.filter((_, j) => j !== i))}
              title="Remove"
            >×</button>
          </div>

          {/* Value + unit row */}
          <div className="sn-widget__row">
            <input
              className="sn-input sn-input--sm"
              type={quant ? 'number' : 'text'}
              placeholder="value"
              value={row.value ?? ''}
              onChange={e => setRow(i, { value: e.target.value })}
            />
            {quant && (
              <input
                className="sn-input sn-input--unit"
                placeholder="unit"
                value={row.unit ?? ''}
                onChange={e => setRow(i, { unit: e.target.value })}
              />
            )}
          </div>

          {/* Quantity type row (quantitative only) */}
          {quant && (
            <div className="sn-widget__row">
              <input
                className="sn-input sn-input--qt"
                placeholder={qtPlaceholder}
                value={row.quantity_type ?? ''}
                onChange={e => setRow(i, { quantity_type: e.target.value })}
              />
            </div>
          )}

        </div>
      ))}

      <button
        className="sn-btn sn-btn--add nodrag"
        onClick={() => onUpdate([...rows, { ...empty }])}
      >+ add</button>
    </div>
  );
}

// ── LookupSection ─────────────────────────────────────────────────────────────
// Renders as bare content (no section wrapper) — caller owns the wrapper.

function LookupSection({ slots, values, onBatchUpdate, invalidSlots }) {
  if (!slots.length) return null;

  const slotNames = slots.map(s => s.name);
  const rows = slotNames.flatMap(sn =>
    (values[sn] ?? []).map((v, i) => ({ slotName: sn, idx: i, value: v ?? '' }))
  );

  const addRow = () => {
    const sn = slotNames[0];
    onBatchUpdate({ [sn]: [...(values[sn] ?? []), ''] });
  };

  const setVal = (sn, idx, val) =>
    onBatchUpdate({ [sn]: (values[sn] ?? []).map((v, i) => i === idx ? val : v) });

  const delRow = (sn, idx) =>
    onBatchUpdate({ [sn]: (values[sn] ?? []).filter((_, i) => i !== idx) });

  const moveRow = (row, newSn) => {
    const val    = (values[row.slotName] ?? [])[row.idx];
    const oldArr = (values[row.slotName] ?? []).filter((_, i) => i !== row.idx);
    const newArr = [...(values[newSn] ?? []), val];
    onBatchUpdate({ [row.slotName]: oldArr, [newSn]: newArr });
  };

  return (
    <>
      {slots.map(s => {
        const isInvalid = invalidSlots.has(s.name);
        const slotRows  = rows.filter(r => r.slotName === s.name);
        return (
          <div key={s.name}>
            {isInvalid && slotRows.length === 0 && (
              <div className="sn-lookup-empty-label">
                <span className="sn-req">*</span> {s.name} is required
              </div>
            )}
          </div>
        );
      })}
      {rows.map((row, i) => (
        <div key={i} className="sn-lookup-row nodrag">
          <input
            className="sn-input sn-input--lookup"
            placeholder="URI or CURIE"
            value={row.value}
            onChange={e => setVal(row.slotName, row.idx, e.target.value)}
          />
          <select
            className="sn-select sn-select--slot nodrag"
            value={row.slotName}
            onChange={e => moveRow(row, e.target.value)}
          >
            {slotNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button
            className="sn-btn sn-btn--x nodrag"
            onClick={() => delRow(row.slotName, row.idx)}
          >×</button>
        </div>
      ))}
      <button className="sn-btn sn-btn--add nodrag" onClick={addRow}>
        + add reference
      </button>
    </>
  );
}

// ── SchemaNode ────────────────────────────────────────────────────────────────

export function SchemaNode({ id, data, selected }) {
  const { updateNodeData, deleteElements } = useReactFlow();
  const deleteNode = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);
  const { className, values = {} } = data;

  const info     = getClassInfo(schema, className);
  const nodeRef  = useRef(null);
  const connsRef = useRef(null);
  const [handleTops, setHandleTops] = useState([]);

  // Sections default to collapsed; only connections is always visible.
  const hasFields  = info && (info.primitiveSlots.length > 0 || info.enumSlots.length > 0);
  const hasMeasure = info && info.widgetSlots.length > 0;
  const hasRefs    = info && info.lookupSlots.length > 0;

  const [open, setOpen] = useState({ fields: false, measurements: false, references: false });
  const toggle = key => setOpen(o => ({ ...o, [key]: !o[key] }));

  // ── Validation ────────────────────────────────────────────────────────────
  const violations   = info ? validateNode(className, values, schema) : [];
  const invalidNames = new Set(violations.map(v => v.slotName));

  const sectionErrors = {
    fields:       violations.filter(v => v.section === 'fields').length,
    measurements: violations.filter(v => v.section === 'measurements').length,
    references:   violations.filter(v => v.section === 'references').length,
  };

  // ── Position source handles aligned with connection label rows ────────────
  useLayoutEffect(() => {
    if (!connsRef.current || !info?.refSlots.length) return;

    const offset = connsRef.current.offsetTop;
    const tops = info.refSlots.map((_, i) =>
      offset + CONN_TITLE_H + i * CONN_ROW_H + CONN_ROW_H / 2
    );

    setHandleTops(prev =>
      prev.length === tops.length && prev.every((t, i) => Math.abs(t - tops[i]) < 1)
        ? prev : tops
    );
  });

  if (!info) return <div className="sn-error">Unknown class: {className}</div>;

  const set = useCallback((slot, val) => {
    updateNodeData(id, { values: { ...values, [slot]: val } });
  }, [id, values, updateNodeData]);

  const batchSet = useCallback((updates) => {
    updateNodeData(id, { values: { ...values, ...updates } });
  }, [id, values, updateNodeData]);

  return (
    <div ref={nodeRef} className={`sn-node${selected ? ' sn-node--selected' : ''}`}>

      <NodeResizer
        isVisible={selected}
        minWidth={280}
        minHeight={80}
        lineStyle={{ borderColor: 'var(--sn-accent)', borderWidth: 1.5 }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, borderColor: 'var(--sn-accent)', background: '#fff' }}
      />

      <Handle
        type="target"
        position={Position.Left}
        className="sn-handle--in"
        style={{ top: 20 }}
      />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="sn-header">
        <span className="sn-header__title">{info.name}</span>
        {violations.length > 0 && (
          <span
            className="sn-header__badge"
            title={`${violations.length} required field(s) empty`}
          >
            {violations.length}
          </span>
        )}
        <button
          className="sn-header__delete nodrag"
          onClick={deleteNode}
          title="Delete node"
        >×</button>
      </div>

      {/* ── Connections (always visible, non-scrollable) ─────────────── */}
      {info.refSlots.length > 0 && (
        <div ref={connsRef} className="sn-connections">
          <div className="sn-section__title">connections</div>
          {info.refSlots.map(s => (
            <div key={s.name} className="sn-conn-row">
              <span className="sn-conn-label" title={s.description ?? s.name}>{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sn-body nowheel">

        {/* ── Fields (primitives + enums) ──────────────────────────────── */}
        {hasFields && (
          <div className="sn-section">
            <SectionTitle
              label="fields"
              open={open.fields}
              onToggle={() => toggle('fields')}
              errorCount={sectionErrors.fields}
            />
            {open.fields && (
              <>
                {info.primitiveSlots.map(s => (
                  <PrimitiveField
                    key={s.name}
                    slot={s}
                    value={values[s.name]}
                    onUpdate={v => set(s.name, v)}
                    invalid={invalidNames.has(s.name)}
                  />
                ))}
                {info.enumSlots.map(s => (
                  <EnumField
                    key={s.name}
                    slot={s}
                    value={values[s.name]}
                    onUpdate={v => set(s.name, v)}
                    invalid={invalidNames.has(s.name)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Measurements (widget slots) ──────────────────────────────── */}
        {hasMeasure && (
          <div className="sn-section">
            <SectionTitle
              label="measurements"
              open={open.measurements}
              onToggle={() => toggle('measurements')}
              errorCount={sectionErrors.measurements}
            />
            {open.measurements && info.widgetSlots.map(s => (
              <WidgetField
                key={s.name}
                slot={s}
                values={values[s.name]}
                onUpdate={v => set(s.name, v)}
                invalid={invalidNames.has(s.name)}
              />
            ))}
          </div>
        )}

        {/* ── References (lookup slots) ────────────────────────────────── */}
        {hasRefs && (
          <div className="sn-section">
            <SectionTitle
              label="references"
              open={open.references}
              onToggle={() => toggle('references')}
              errorCount={sectionErrors.references}
            />
            {open.references && (
              <LookupSection
                slots={info.lookupSlots}
                values={values}
                onBatchUpdate={batchSet}
                invalidSlots={invalidNames}
              />
            )}
          </div>
        )}

      </div>

      {info.refSlots.map((s, i) => (
        <Handle
          key={s.name}
          type="source"
          position={Position.Right}
          id={s.name}
          className="sn-handle--out"
          style={handleTops[i] !== undefined ? { top: handleTops[i] } : {}}
        />
      ))}

    </div>
  );
}
