/**
 * Save and load schema view state as .view.json files.
 */

/**
 * Trigger a browser download of the current schema view.
 *
 * @param {import('@xyflow/react').Node[]} nodes
 * @param {import('@xyflow/react').Edge[]} edges
 * @param {Set<string>} visibleClasses
 * @param {string} schemaId
 * @param {boolean} frozen
 * @param {boolean} showInheritance
 * @param {boolean} showRelations
 */
export function saveSchemaView(nodes, edges, visibleClasses, schemaId, frozen, showInheritance = true, showRelations = true, colorOverrides = new Map()) {
  const edgeWaypoints = edges
    .filter(e => e.data?.waypoints?.length > 0)
    .map(e => ({ id: e.id, waypoints: e.data.waypoints }));

  const colorObj = colorOverrides.size > 0
    ? Object.fromEntries(colorOverrides)
    : undefined;

  const state = {
    version: 1,
    type: 'schema-view',
    schemaId,
    frozenLayout: frozen,
    showInheritance,
    showRelations,
    visibleClasses: [...visibleClasses],
    hiddenEdgeIds: edges.filter(e => e.hidden).map(e => e.id),
    nodes: nodes.filter(n => !n.hidden).map(n => ({ id: n.id, position: n.position })),
    ...(edgeWaypoints.length > 0 && { edgeWaypoints }),
    ...(colorObj && { colorOverrides: colorObj }),
  };
  const text = JSON.stringify(state, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${schemaId}-schema-view.view.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse a loaded .view.json and return patches to apply to the current schema
 * nodes/edges.
 *
 * @param {object} viewJson  – parsed JSON from the .view.json file
 * @returns {{ positionMap: Map<string,{x,y}>, hiddenEdgeIds: Set<string>, visibleClasses: Set<string>, frozenLayout: boolean }}
 */
export function parseSchemaView(viewJson) {
  if (viewJson.version !== 1 || viewJson.type !== 'schema-view') {
    throw new Error('Invalid view file: expected version:1 type:schema-view');
  }
  const colorOverrides = viewJson.colorOverrides
    ? new Map(Object.entries(viewJson.colorOverrides))
    : null;

  return {
    positionMap:     new Map((viewJson.nodes ?? []).map(n => [n.id, n.position])),
    hiddenEdgeIds:   new Set(viewJson.hiddenEdgeIds ?? []),
    visibleClasses:  new Set(viewJson.visibleClasses ?? []),
    frozenLayout:    viewJson.frozenLayout    ?? false,
    showInheritance: viewJson.showInheritance ?? true,
    showRelations:   viewJson.showRelations   ?? true,
    colorOverrides,
  };
}
