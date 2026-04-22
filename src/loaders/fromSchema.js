import dagre from 'dagre';
import { getClassInfo } from '../schema/schemaUtils';

const NODE_WIDTH  = 260;
const NODE_HEIGHT = 200;

/**
 * Run Dagre hierarchical layout on a set of nodes/edges.
 * Returns a new nodes array with updated positions.
 * Handles cycles — Dagre is designed for arbitrary directed graphs.
 */
export function applyDagreLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 120, marginx: 40, marginy: 40 });

  nodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach(e => g.setEdge(e.source, e.target, {}, e.id));

  dagre.layout(g);

  return nodes.map(n => {
    const dn = g.node(n.id);
    if (!dn) return n;
    return { ...n, position: { x: dn.x - NODE_WIDTH / 2, y: dn.y - NODE_HEIGHT / 2 } };
  });
}

/**
 * Build a React Flow graph from a compiled LinkML JSON schema plus an
 * inheritance map extracted from the raw YAML source files.
 *
 * Node type is 'schemaTemplateNode' so App can register the custom renderer.
 * Edges carry `data.edgeKind`: 'inheritance' | 'relation'.
 *
 * @param {object}      schema          – compiled JSON Schema ($defs)
 * @param {Map}         inheritanceMap  – Map<childClass, parentClass>
 * @param {Set|null}    visibleClasses  – classes to include (null = all)
 * @param {boolean}     applyLayout     – run Dagre layout on result
 * @param {string[]}    abstractClasses – classes to flag as abstract
 * @returns {{ nodes: object[], edges: object[] }}
 */
export function fromSchema(
  schema,
  inheritanceMap,
  visibleClasses = null,
  applyLayout    = true,
  abstractClasses = [],
) {
  const defs = schema.$defs ?? {};
  const allClasses = Object.keys(defs).filter(name => {
    const def = defs[name];
    return def?.type === 'object' && !Array.isArray(def.enum);
  });

  const visible     = visibleClasses ?? new Set(allClasses);
  const abstractSet = new Set(abstractClasses);

  // ── Nodes ──────────────────────────────────────────────────────────────────
  const nodes = allClasses
    .filter(name => visible.has(name))
    .map(name => {
      const info  = getClassInfo(schema, name);
      const slots = info ? [
        ...info.primitiveSlots.map(s => ({ ...s, slotKind: 'primitive' })),
        ...info.enumSlots.map(s =>    ({ ...s, slotKind: 'enum' })),
        ...info.widgetSlots.map(s =>  ({ ...s, slotKind: 'widget' })),
        ...info.lookupSlots.map(s =>  ({ ...s, slotKind: 'lookup' })),
        ...info.refSlots.map(s =>     ({ ...s, slotKind: 'ref' })),
      ] : [];
      return {
        id:       name,
        type:     'schemaTemplateNode',
        position: { x: 0, y: 0 },
        data:     {
          className:   name,
          description: defs[name].description ?? null,
          slots,
          isAbstract:  abstractSet.has(name),
        },
      };
    });

  // ── Edges ──────────────────────────────────────────────────────────────────
  const edges = [];

  // Inheritance edges — one per (child, parent) pair where both are visible
  for (const [child, parent] of inheritanceMap) {
    if (!visible.has(child) || !visible.has(parent)) continue;
    edges.push({
      id:     `inh--${child}--${parent}`,
      source: child,
      target: parent,
      type:   'schemaEdge',
      data:   { edgeKind: 'inheritance', waypoints: [] },
      style:  { stroke: '#8b5cf6', strokeDasharray: '6 3', strokeWidth: 1.5 },
      markerEnd: { type: 'arrowclosed', color: '#8b5cf6' },
      label:  'is_a',
      labelStyle:         { fontSize: 9, fill: '#8b5cf6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
      labelBgStyle:        { fill: '#fff', fillOpacity: 0.85 },
      labelBgPadding:      [3, 1],
      labelBgBorderRadius: 2,
    });
  }

  // Relation edges — one per unique (source, slotName, target) triple
  const seen = new Set();
  for (const name of allClasses) {
    if (!visible.has(name)) continue;
    const info = getClassInfo(schema, name);
    if (!info) continue;
    for (const slot of info.refSlots) {
      for (const target of slot.targetClasses) {
        if (!visible.has(target)) continue;
        const key = `rel--${name}--${slot.name}--${target}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({
          id:     key,
          source: name,
          target: target,
          type:   'schemaEdge',
          data:   { edgeKind: 'relation', slotName: slot.name, waypoints: [] },
          style:  { stroke: '#3b82f6', strokeWidth: 1.5 },
          markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
          label:  slot.name,
          labelStyle:         { fontSize: 9, fill: '#374151', fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
          labelBgStyle:        { fill: '#fff', fillOpacity: 0.85 },
          labelBgPadding:      [3, 1],
          labelBgBorderRadius: 2,
        });
      }
    }
  }

  const layoutedNodes = applyLayout ? applyDagreLayout(nodes, edges) : nodes;
  return { nodes: layoutedNodes, edges };
}
