/**
 * fromJson — convert a JSON-LD instance document to a React Flow {nodes, edges} graph.
 *
 * Multi-node expansion:
 *   Ref slots whose values are embedded objects (not plain URI strings) are
 *   recursively expanded into child nodes connected via labelled edges.
 *   The resulting graph is laid out as a left-to-right tree using a
 *   leaf-counting algorithm that vertically centres each parent among its
 *   children.
 *
 * Class inference for embedded objects without @type:
 *   The slot's targetClasses list is scored by counting how many of the
 *   object's property keys are valid slots in each candidate class.
 *   The best-scoring concrete class wins.
 *
 * Deduplication:
 *   Objects with the same instance `id` produce a single node; subsequent
 *   references add edges to the already-created node.
 *
 * Options:
 *   maxDepth {number}  – how many levels of ref-slot expansion to perform (default 3)
 */
import { getClassInfo, listNodeClasses } from '../schema/schemaUtils';

// ── Layout constants ───────────────────────────────────────────────────────
const X_STEP      = 580;  // horizontal pixels between depth levels
const LAYOUT_GAP  = 20;   // minimum vertical gap between sibling nodes (px)

// Collapsed node height estimation — must mirror SchemaNode.css values.
// Node structure (connections now at top):
//   [Header ~35px]
//   [Connections: title 22px + N×24px rows + 4px padding  (if N>0)]
//   [Body: 12px padding + each collapsed section title ~29px each]
const HEADER_H         = 35;  // .sn-header
const BODY_PADDING_H   = 12;  // .sn-body padding (6px top + 6px bottom)
const SECTION_HDR_H    = 29;  // per collapsed section: margin 4 + border 1 + padding 2 + title 22
const CONN_SECTION_HDR = 22;  // "CONNECTIONS" title row
const CONN_ROW_H_EST   = 24;  // each connection row
const CONN_BOTTOM_PAD  = 4;   // sn-connections padding-bottom

function estimateCollapsedHeight(className, schema) {
  const info = getClassInfo(schema, className);
  if (!info) return HEADER_H + BODY_PADDING_H;

  const nConn = info.refSlots.length;
  const nSect = (info.primitiveSlots.length > 0 || info.enumSlots.length > 0 ? 1 : 0)
              + (info.widgetSlots.length > 0 ? 1 : 0)
              + (info.lookupSlots.length > 0 ? 1 : 0);

  const connH = nConn > 0 ? CONN_SECTION_HDR + nConn * CONN_ROW_H_EST + CONN_BOTTOM_PAD : 0;
  const bodyH = BODY_PADDING_H + nSect * SECTION_HDR_H;

  return HEADER_H + connH + bodyH;
}

// ── Unit URI → display label ───────────────────────────────────────────────
const UNIT_MAP = {
  'https://qudt.org/vocab/unit/MilliGM':          'mg',
  'https://qudt.org/vocab/unit/GM':               'g',
  'https://qudt.org/vocab/unit/KiloGM':           'kg',
  'https://qudt.org/vocab/unit/L':                'L',
  'https://qudt.org/vocab/unit/MilliL':           'mL',
  'https://qudt.org/vocab/unit/DEG_C':            '°C',
  'http://qudt.org/vocab/unit/DEG_C':             '°C',
  'https://qudt.org/vocab/unit/K':                'K',
  'https://qudt.org/vocab/unit/BAR':              'bar',
  'https://qudt.org/vocab/unit/PA':               'Pa',
  'https://qudt.org/vocab/unit/MOL-PER-L':        'mol/L',
  'https://qudt.org/vocab/unit/MilliMOL':         'mmol',
  'https://qudt.org/vocab/unit/GM-PER-MOL':       'g/mol',
  'https://qudt.org/vocab/unit/GM-PER-MilliL':    'g/mL',
  'https://qudt.org/vocab/unit/PERCENT':          '%',
};

function simplifyUnit(uri) {
  if (!uri) return '';
  if (UNIT_MAP[uri]) return UNIT_MAP[uri];
  return uri.split(/[/#]/).filter(Boolean).pop() ?? uri;
}

// ── Stable React Flow node id from instance id ─────────────────────────────
function makeRfId(instanceId, className) {
  if (instanceId) {
    return instanceId.replace(/[^a-zA-Z0-9-_]/g, '-').slice(-48);
  }
  return `${className.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Extract flat `values` from one JSON object ─────────────────────────────
function extractValues(obj, info) {
  const values = {};

  // Primitive & enum slots (scalars; take first element if array)
  for (const slot of [...info.primitiveSlots, ...info.enumSlots]) {
    const raw = obj[slot.name];
    if (raw === undefined || raw === null) continue;
    values[slot.name] = Array.isArray(raw) ? raw[0] : raw;
  }

  // Widget slots → { value, unit, title, quantity_type } rows
  for (const slot of info.widgetSlots) {
    const raw = obj[slot.name];
    if (!Array.isArray(raw) || !raw.length) continue;
    values[slot.name] = raw.map(item => ({
      value:         String(item.value ?? ''),
      unit:          simplifyUnit(item.unit ?? ''),
      title:         item.title ?? '',
      quantity_type: item.has_quantity_type ?? '',
    }));
  }

  // Lookup slots → plain string array (id / notation)
  for (const slot of info.lookupSlots) {
    const raw = obj[slot.name];
    if (!raw) continue;
    const arr = Array.isArray(raw) ? raw : [raw];
    const extracted = arr
      .map(item =>
        typeof item === 'string' ? item :
        item.id ?? item.notation ?? JSON.stringify(item)
      )
      .filter(Boolean);
    if (extracted.length) values[slot.name] = extracted;
  }

  // Ref slots — store plain-string (URI) refs; objects are handled as child nodes
  for (const slot of info.refSlots) {
    const raw = obj[slot.name];
    if (!raw) continue;
    const arr = Array.isArray(raw) ? raw : [raw];
    const uris = arr.filter(item => typeof item === 'string').filter(Boolean);
    if (uris.length) values[slot.name] = uris;
  }

  return values;
}

// ── Infer class for embedded objects without @type ─────────────────────────
// Score each candidate by how many of the object's keys are known slots.
function inferClass(obj, targetClasses, schema, nodeClassSet) {
  // Prefer concrete classes (those that appear as node classes in the palette)
  const candidates = targetClasses.filter(c => nodeClassSet.has(c));
  const pool = candidates.length ? candidates : targetClasses;
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];

  const defs = schema.$defs ?? {};
  let best = pool[0], bestScore = -1;
  for (const tc of pool) {
    const def = defs[tc];
    if (!def?.properties) continue;
    const known = new Set(Object.keys(def.properties));
    const score = Object.keys(obj).filter(k => known.has(k)).length;
    if (score > bestScore) { bestScore = score; best = tc; }
  }
  return best;
}

// ── Pixel-based tree layout ────────────────────────────────────────────────
// Each node's `slotHeight` = the vertical space it occupies in the layout.
// For leaves: slotHeight = nodeHeight + LAYOUT_GAP.
// For internal nodes: slotHeight = max(sum of children's slotHeights, nodeHeight + LAYOUT_GAP).
// This guarantees siblings never overlap regardless of how tall each node is.

// Pass 1 (bottom-up): compute slotHeight for every node.
function computeSlotHeights(rfId, nodeMap, visited = new Set()) {
  if (visited.has(rfId)) return 0;
  visited.add(rfId);

  const node = nodeMap.get(rfId);
  if (!node) return 0;

  if (!node.childRefs.length) {
    node.slotHeight = node.nodeHeight + LAYOUT_GAP;
    return node.slotHeight;
  }

  const childrenTotal = node.childRefs.reduce(
    (s, { rfId: cId }) => s + computeSlotHeights(cId, nodeMap, new Set(visited)),
    0
  );
  node.slotHeight = Math.max(childrenTotal, node.nodeHeight + LAYOUT_GAP);
  return node.slotHeight;
}

// Pass 2 (top-down): assign x/y positions.
// Each node is vertically centred within its allocated slotHeight.
function layoutSubtree(rfId, depth, yStart, nodeMap, visited = new Set()) {
  if (visited.has(rfId)) return;
  visited.add(rfId);

  const node = nodeMap.get(rfId);
  if (!node) return;

  node.position = {
    x: depth * X_STEP,
    y: yStart + Math.round((node.slotHeight - node.nodeHeight) / 2),
  };

  let y = yStart;
  for (const { rfId: childId } of node.childRefs) {
    layoutSubtree(childId, depth + 1, y, nodeMap, new Set(visited));
    y += nodeMap.get(childId)?.slotHeight ?? 0;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * @param {object} json          – parsed JSON-LD instance (must have `@type`)
 * @param {object} schema        – parsed dcat_4c_ap.schema.json
 * @param {object} [options]
 * @param {number} [options.maxDepth=3]  – max ref-slot expansion depth
 * @returns {{ nodes: Node[], edges: Edge[] }}
 */
export function fromJson(json, schema, { maxDepth = 3 } = {}) {
  const nodeClassSet = new Set(listNodeClasses(schema));

  // Internal tree nodes — will be converted to RF nodes after layout
  // { rfId, className, values, position, childRefs: [{slotName, rfId}] }
  const treeNodes = [];
  const nodeMap   = new Map(); // rfId → treeNode
  const seenInst  = new Map(); // instanceId (string) → rfId

  function process(obj, className, depth) {
    const instanceId = typeof obj.id === 'string' ? obj.id : null;
    const rfId = makeRfId(instanceId, className);

    // Deduplication: already processed this instance
    if (instanceId && seenInst.has(instanceId)) {
      return seenInst.get(instanceId);
    }
    if (instanceId) seenInst.set(instanceId, rfId);

    const info = getClassInfo(schema, className);
    if (!info) {
      // Unknown class — create a minimal node with raw data
      const treeNode = {
        rfId, className, values: { id: obj.id ?? '' },
        position: { x: 0, y: 0 }, childRefs: [],
        nodeHeight: HEADER_H + BODY_PADDING_H, slotHeight: 0,
      };
      treeNodes.push(treeNode);
      nodeMap.set(rfId, treeNode);
      return rfId;
    }

    const values     = extractValues(obj, info);
    const childRefs  = [];
    const nodeHeight = estimateCollapsedHeight(className, schema);
    const treeNode   = { rfId, className, values, position: { x: 0, y: 0 }, childRefs, nodeHeight, slotHeight: 0 };
    treeNodes.push(treeNode);
    nodeMap.set(rfId, treeNode);

    // Recursively expand ref slots (but not beyond maxDepth)
    if (depth < maxDepth) {
      for (const slot of info.refSlots) {
        const raw = obj[slot.name];
        if (!raw) continue;
        const arr = Array.isArray(raw) ? raw : [raw];
        for (const child of arr) {
          // Skip plain URI strings — those are stored in values, not expanded
          if (!child || typeof child === 'string') continue;

          const childClass =
            (typeof child['@type'] === 'string' ? child['@type'] : null) ??
            inferClass(child, slot.targetClasses, schema, nodeClassSet);

          if (!childClass) continue;

          const childRfId = process(child, childClass, depth + 1);
          childRefs.push({ slotName: slot.name, rfId: childRfId });
        }
      }
    }

    return rfId;
  }

  // ── Resolve root class ─────────────────────────────────────────────────
  // 1. @type  — our own JSON-LD export format
  // 2. type   — standard LinkML native YAML/JSON format
  // 3. infer  — score all node classes against the object's keys (best match)
  const className =
    (typeof json['@type'] === 'string' ? json['@type'] : null) ??
    (typeof json['type']  === 'string' ? json['type']  : null) ??
    inferClass(json, [...nodeClassSet], schema, nodeClassSet);

  if (!className) throw new Error(
    'Could not determine the root class. Add a "@type" or "type" field with the LinkML class name.'
  );
  const rootId = process(json, className, 0);

  // ── Layout ─────────────────────────────────────────────────────────────
  computeSlotHeights(rootId, nodeMap);   // pass 1: slot sizes (bottom-up)
  layoutSubtree(rootId, 0, 0, nodeMap); // pass 2: positions  (top-down)

  // ── Flatten to React Flow format ───────────────────────────────────────
  const nodes = treeNodes.map(tn => ({
    id:       tn.rfId,
    type:     'schemaNode',
    position: tn.position,
    data:     { className: tn.className, values: tn.values },
  }));

  const edges = [];
  for (const tn of treeNodes) {
    for (const { slotName, rfId: targetId } of tn.childRefs) {
      edges.push({
        id:                  `${tn.rfId}--${slotName}--${targetId}`,
        source:              tn.rfId,
        target:              targetId,
        sourceHandle:        slotName,
        animated:            true,
        label:               slotName,
        labelStyle:          { fontSize: 10, fill: '#374151', fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
        labelBgStyle:        { fill: '#fff', fillOpacity: 0.85 },
        labelBgPadding:      [4, 2],
        labelBgBorderRadius: 3,
      });
    }
  }

  return { nodes, edges };
}
