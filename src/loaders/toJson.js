/**
 * toJson — convert a React Flow {nodes, edges} graph back to a
 * LinkML instance JSON object (same format as the source files).
 *
 * Root nodes (not targeted by any edge) each become a top-level object.
 * Child nodes connected via edges are embedded under their parent's ref slot.
 * Nodes referenced from multiple parents are embedded at first occurrence
 * and referenced by plain id string at subsequent occurrences.
 *
 * Note: widget slot objects (measurements) are exported as {value, unit}
 * only — fields like has_quantity_type and title that were not stored in
 * node values are not reconstructed.
 */
import { getClassInfo } from '../schema/schemaUtils';

// ── Unit label → QUDT URI (inverse of fromJson UNIT_MAP) ───────────────────
const REVERSE_UNIT = {
  'mg':    'https://qudt.org/vocab/unit/MilliGM',
  'g':     'https://qudt.org/vocab/unit/GM',
  'kg':    'https://qudt.org/vocab/unit/KiloGM',
  'L':     'https://qudt.org/vocab/unit/L',
  'mL':    'https://qudt.org/vocab/unit/MilliL',
  '°C':    'https://qudt.org/vocab/unit/DEG_C',
  'K':     'https://qudt.org/vocab/unit/K',
  'bar':   'https://qudt.org/vocab/unit/BAR',
  'Pa':    'https://qudt.org/vocab/unit/PA',
  'mol/L': 'https://qudt.org/vocab/unit/MOL-PER-L',
  'mmol':  'https://qudt.org/vocab/unit/MilliMOL',
  'g/mol': 'https://qudt.org/vocab/unit/GM-PER-MOL',
  'g/mL':  'https://qudt.org/vocab/unit/GM-PER-MilliL',
  '%':     'https://qudt.org/vocab/unit/PERCENT',
};

function expandUnit(label) {
  return REVERSE_UNIT[label] ?? label;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * @param {Node[]} nodes   – React Flow nodes (each with data.className, data.values)
 * @param {Edge[]} edges   – React Flow edges (each with source, sourceHandle, target)
 * @param {object} schema  – parsed dcat_4c_ap.schema.json
 * @returns {object|object[]|null}  – LinkML instance JSON, array of roots, or null
 */
export function toJson(nodes, edges, schema) {
  if (!nodes.length) return null;

  // ── Index structures ──────────────────────────────────────────────────────
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // outEdges: nodeId → [{slotName, targetId}]
  const outEdges = new Map();
  for (const edge of edges) {
    if (!outEdges.has(edge.source)) outEdges.set(edge.source, []);
    outEdges.get(edge.source).push({ slotName: edge.sourceHandle, targetId: edge.target });
  }

  // Root nodes: not a target of any edge
  const targetIds = new Set(edges.map(e => e.target));
  const roots = nodes.filter(n => !targetIds.has(n.id));
  // Fall back to all nodes if graph is circular (no clear roots)
  const startNodes = roots.length ? roots : [nodes[0]];

  // ── Recursive serializer ──────────────────────────────────────────────────
  const serialized = new Set();

  function serializeNode(nodeId) {
    const node = nodeById.get(nodeId);
    if (!node) return null;
    serialized.add(nodeId);  // mark before recursing to break cycles

    const { className, values = {} } = node.data;
    const info = getClassInfo(schema, className);

    const obj = { '@type': className };

    if (!info) {
      // Unknown class — output whatever id we have
      if (values.id) obj.id = values.id;
      return obj;
    }

    // id first (conventional placement right after @type)
    if (values.id !== undefined && values.id !== '') obj.id = String(values.id);

    // Primitive & enum slots
    for (const slot of [...info.primitiveSlots, ...info.enumSlots]) {
      if (slot.name === 'id') continue; // already handled above
      const v = values[slot.name];
      if (v === undefined || v === null || v === '') continue;
      // Restore numeric types
      if (slot.primitiveType === 'number' || slot.primitiveType === 'integer') {
        const n = Number(v);
        obj[slot.name] = isNaN(n) ? v : n;
      } else {
        obj[slot.name] = v;
      }
    }

    // Widget slots → [{value, unit?, title?, has_quantity_type?}] with QUDT URIs restored
    for (const slot of info.widgetSlots) {
      const rows = values[slot.name];
      if (!rows?.length) continue;
      // Auto-derive has_quantity_type from targetClass name for specific subclasses
      const autoQt = slot.targetClass && slot.targetClass !== 'QuantitativeAttribute'
        ? `http://qudt.org/vocab/quantitykind/${slot.targetClass}`
        : '';
      const items = rows
        .filter(r => r.value !== '' && r.value !== undefined)
        .map(r => {
          const num = Number(r.value);
          const item = { value: isNaN(num) ? r.value : num };
          if (r.unit) item.unit = expandUnit(r.unit);
          if (r.title) item.title = r.title;
          const qt = r.quantity_type || autoQt;
          if (qt) item.has_quantity_type = qt;
          return item;
        });
      if (items.length) obj[slot.name] = items;
    }

    // Lookup slots → plain string array
    for (const slot of info.lookupSlots) {
      const arr = values[slot.name];
      if (!arr?.length) continue;
      obj[slot.name] = arr;
    }

    // Ref slots → plain URI strings + embedded/referenced child nodes
    for (const slot of info.refSlots) {
      const plainUris = values[slot.name] ?? [];
      const slotEdges = (outEdges.get(nodeId) ?? []).filter(e => e.slotName === slot.name);

      const items = [];
      for (const uri of plainUris) { if (uri) items.push(uri); }
      for (const { targetId } of slotEdges) {
        if (serialized.has(targetId)) {
          // Already embedded elsewhere — reference by instance id
          const tgt = nodeById.get(targetId);
          const tgtId = tgt?.data?.values?.id;
          if (tgtId) items.push(String(tgtId));
        } else {
          const embedded = serializeNode(targetId);
          if (embedded) items.push(embedded);
        }
      }

      if (items.length === 1) obj[slot.name] = items[0];
      else if (items.length > 1) obj[slot.name] = items;
    }

    return obj;
  }

  // Serialize all roots (skip any that were already pulled in as children)
  const results = startNodes
    .filter(n => !serialized.has(n.id))
    .map(n => serializeNode(n.id))
    .filter(Boolean);

  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  return results;
}
