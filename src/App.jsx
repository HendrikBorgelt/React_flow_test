import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  reconnectEdge,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SchemaNode } from './nodes/SchemaNode';
import { GhostNode } from './nodes/GhostNode';
import { NodePalette } from './components/NodePalette';
import { CanvasControls } from './components/CanvasControls';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsModal, DEFAULT_SETTINGS } from './components/SettingsModal';
import { ExportWarning } from './components/ExportWarning';
import { ValidationBar } from './components/ValidationBar';
import { fromJson } from './loaders/fromJson';
import { toJson } from './loaders/toJson';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { getClassInfo, getCompatibleClasses, getNodeDisplayLabel, isSubtypeOf, validateNode } from './schema/schemaUtils';
import { ActiveHandleContext } from './shared/ActiveHandleContext';
import { generateDisplayName } from './utils/nodeNames';
// ~config resolves to the active schema's config file at build time
// (set VITE_SCHEMA env var; default: chemdcat)
import { config } from '~config';

const { schema } = config;

const nodeTypes = { schemaNode: SchemaNode, ghostNode: GhostNode };

// Pre-filled with data from MaterialSample-001.json for an immediate visual demo
const initialNodes = [
  {
    id: 'ms-001',
    type: 'schemaNode',
    position: { x: 280, y: 60 },
    data: {
      className:   'MaterialSample',
      displayName: generateDisplayName('MaterialSample'),
      values: {
        id:    'https://example.org/sample/philips-wood-001',
        title: "Philip's Wood Sample",
        has_physical_state: 'SOLID',
        has_mass:        [{ value: '300', unit: 'mg' }],
        has_temperature: [{ value: '20',  unit: '°C' }],
        has_volume:      [{ value: '0.03', unit: 'L' }],
        rdf_type:        ['ENVO:00002040'],
      },
    },
  },
];

const initialEdges = [];

// Map bgVariant string to React Flow BackgroundVariant enum
const BG_VARIANT_MAP = {
  dots:  BackgroundVariant.Dots,
  lines: BackgroundVariant.Lines,
  cross: BackgroundVariant.Cross,
};

export default function App() {
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [exportWarning,  setExportWarning]  = useState(null); // { format, violations }
  const [settings,       setSettings]       = useState(DEFAULT_SETTINGS);
  const [isInteractive,  setIsInteractive]  = useState(true);
  const [minimapOpen,    setMinimapOpen]    = useState(true);
  const [importError,    setImportError]    = useState(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [activeHandle, setActiveHandle] = useState(null); // { nodeId, handleId } | null
  const [ghostNodeId,  setGhostNodeId]  = useState(null); // id of the current ghost node
  const { screenToFlowPosition, fitView } = useReactFlow();
  const violationCursorRef = useRef(0);
  const fileInputRef = useRef(null);
  const originalEdgeRef = useRef(null); // edge displaced by the edge-click ghost flow

  // ── Welcome / load handlers ────────────────────────────────────────────────
  const handleNew = () => {
    setNodes([]);
    setEdges([]);
    setWelcomeVisible(false);
  };

  const handleLoad = ({ nodes: ns, edges: es }) => {
    setNodes(ns);
    setEdges(es);
    setWelcomeVisible(false);
  };

  // ── Export helpers ─────────────────────────────────────────────────────────
  const getExportFilename = (ext) => {
    const tgtIds = new Set(edges.map(e => e.target));
    const root = nodes.find(n => !tgtIds.has(n.id)) ?? nodes[0];
    if (!root) return `instance.${ext}`;
    const base = root.data.values?.id
      ? root.data.values.id.split('/').pop().replace(/[^a-zA-Z0-9_-]/g, '-')
      : root.data.className;
    return `${base}.${ext}`;
  };

  const triggerDownload = (text, filename, mime) => {
    const blob = new Blob([text], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ── Validation helpers ────────────────────────────────────────────────────
  const collectViolations = () =>
    nodes.flatMap(n => {
      const v = validateNode(n.data.className, n.data.values ?? {}, schema);
      if (!v.length) return [];
      return [{ nodeId: n.id, className: n.data.className, slotNames: v.map(x => x.slotName) }];
    });

  // Cycle through nodes that have required-field violations, fitting the view
  const handleNextViolation = useCallback(() => {
    const violating = nodes.filter(
      n => validateNode(n.data.className, n.data.values ?? {}, schema).length > 0
    );
    if (!violating.length) return;
    const idx  = violationCursorRef.current % violating.length;
    violationCursorRef.current = idx + 1;
    fitView({ nodes: [{ id: violating[idx].id }], duration: 450, padding: 0.4 });
  }, [nodes, fitView]);

  const doSaveJson = () => {
    const data = toJson(nodes, edges, schema);
    if (!data) return;
    triggerDownload(JSON.stringify(data, null, 2), getExportFilename('json'), 'application/json');
  };

  const doSaveYaml = () => {
    const data = toJson(nodes, edges, schema);
    if (!data) return;
    triggerDownload(
      yamlDump(data, { indent: 2, lineWidth: 120 }),
      getExportFilename('yaml'),
      'text/yaml',
    );
  };

  const handleSaveJson = () => {
    const violations = collectViolations();
    if (violations.length) { setExportWarning({ format: 'json', violations }); return; }
    doSaveJson();
  };

  const handleSaveYaml = () => {
    const violations = collectViolations();
    if (violations.length) { setExportWarning({ format: 'yaml', violations }); return; }
    doSaveYaml();
  };

  // ── Shared parser: JSON or YAML → plain object ─────────────────────────────
  const parseFile = (text, filename) => {
    const isYaml = /\.(ya?ml)$/i.test(filename);
    return isYaml ? yamlLoad(text) : JSON.parse(text);
  };

  // ── File import ────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = parseFile(ev.target.result, file.name);
        const { nodes: ns, edges: es } = fromJson(data, schema, { abstractClasses: config.abstractClasses, filename: file.name });
        setNodes(ns);
        setEdges(es);
      } catch (err) {
        setImportError(`${file.name}: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // ── Node / edge change handlers ────────────────────────────────────────────
  const onNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)), []
  );
  const onEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)), []
  );

  // ── Add a new node at the current viewport centre ──────────────────────────
  const addNode = useCallback((className) => {
    const position = screenToFlowPosition({
      x: window.innerWidth  / 2,
      y: window.innerHeight / 2,
    });
    const id = `${className.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    setNodes(nds => [...nds, {
      id,
      type:     'schemaNode',
      position,
      data:     { className, displayName: generateDisplayName(className), values: {} },
    }]);
  }, [screenToFlowPosition]);

  // ── Guided connections — helpers defined early (used by onConnect below) ──

  // Shared props for every real (non-ghost) edge
  const realEdgeProps = useCallback((sourceHandle) => ({
    type:                settings.edgeType,
    animated:            true,
    reconnectable:       true,
    label:               sourceHandle,
    labelStyle:          { fontSize: 10, fill: '#374151', fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
    labelBgStyle:        { fill: '#fff', fillOpacity: 0.85 },
    labelBgPadding:      [4, 2],
    labelBgBorderRadius: 3,
  }), [settings.edgeType]);

  // Remove the ghost node/edges and reset guided-connection state.
  // restoreOriginal=true  (default) → cancelled by user; restore displaced original edge.
  // restoreOriginal=false           → user confirmed a new connection; discard original.
  const dismissGhost = useCallback((restoreOriginal = true) => {
    const orig = originalEdgeRef.current;
    originalEdgeRef.current = null;
    setNodes(nds => nds.filter(n => n.type !== 'ghostNode'));
    setEdges(eds => {
      const withoutGhost = eds.filter(e => !e.data?.isGhost);
      return (restoreOriginal && orig) ? [...withoutGhost, orig] : withoutGhost;
    });
    setGhostNodeId(null);
    setActiveHandle(null);
  }, []);

  // ── Create edge with slot name as label ───────────────────────────────────
  // When source is a ghost node, reroute the connection to the real source node.
  const onConnect = useCallback((params) => {
    const srcNode = nodes.find(n => n.id === params.source);
    if (srcNode?.type === 'ghostNode') {
      const realSourceId = srcNode.data.sourceNodeId;
      const slotName     = srcNode.data.slotName;
      setEdges(eds => addEdge({
        id: `${realSourceId}--${slotName}--${params.target}`,
        source: realSourceId, target: params.target, sourceHandle: slotName,
        ...realEdgeProps(slotName),
      }, eds));
      dismissGhost(false);
      return;
    }
    setEdges(eds => addEdge({
      ...params,
      ...realEdgeProps(params.sourceHandle),
    }, eds));
  }, [nodes, realEdgeProps, dismissGhost]);

  // ── Only allow connections where the target class is in the slot's targetClasses ──
  // Ghost node as source: validate against the real source node's slot.
  const isValidConnection = useCallback((connection) => {
    const { source, sourceHandle, target } = connection;
    if (source === target) return false;
    const srcNode = nodes.find(n => n.id === source);
    const tgtNode = nodes.find(n => n.id === target);
    if (!srcNode || !tgtNode) return false;

    if (srcNode.type === 'ghostNode') {
      const realSrc = nodes.find(n => n.id === srcNode.data.sourceNodeId);
      if (!realSrc) return false;
      const info = getClassInfo(schema, realSrc.data.className);
      const slot = info?.refSlots.find(s => s.name === srcNode.data.slotName);
      return slot?.targetClasses.some(tc => isSubtypeOf(tgtNode.data.className, tc, schema)) ?? false;
    }

    const info = getClassInfo(schema, srcNode.data.className);
    const slot = info?.refSlots.find(s => s.name === sourceHandle);
    return slot?.targetClasses.some(tc => isSubtypeOf(tgtNode.data.className, tc, schema)) ?? false;
  }, [nodes]);

  // ── Guided connections ────────────────────────────────────────────────────

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dismissGhost(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissGhost]);

  // Called by SchemaNode when a connection-row label is clicked.
  // Creates a ghost node + ghost edge instead of showing the menu directly.
  const handleHandleClick = useCallback((nodeId, handleId) => {
    // Toggle off if the same slot is clicked again
    if (activeHandle?.nodeId === nodeId && activeHandle?.handleId === handleId) {
      dismissGhost();
      return;
    }
    // Clear existing ghost, restoring any displaced original edge
    const prevOrig = originalEdgeRef.current;
    originalEdgeRef.current = null;
    setNodes(nds => nds.filter(n => n.type !== 'ghostNode'));
    setEdges(eds => {
      const withoutGhost = eds.filter(e => !e.data?.isGhost);
      return prevOrig ? [...withoutGhost, prevOrig] : withoutGhost;
    });
    setGhostNodeId(null);

    const srcNode = nodes.find(n => n.id === nodeId);
    if (!srcNode) return;

    setActiveHandle({ nodeId, handleId });

    const gId = `ghost-${Date.now()}`;
    setGhostNodeId(gId);
    setNodes(nds => [...nds, {
      id:        gId,
      type:      'ghostNode',
      position:  { x: srcNode.position.x + 480, y: srcNode.position.y },
      data:      { slotName: handleId, sourceNodeId: nodeId },
      draggable: true,
      deletable: false,
      selectable: false,
    }]);
    setEdges(eds => [...eds, {
      id:             `ghost-edge-${gId}`,
      source:         nodeId,
      target:         gId,
      sourceHandle:   handleId,
      type:           'straight',
      style:          { strokeDasharray: '6 3', stroke: '#94a3b8', strokeWidth: 1.5 },
      animated:       false,
      selectable:     false,
      deletable:      false,
      data:           { isGhost: true },
    }]);
  }, [activeHandle, nodes, dismissGhost]);

  // Pre-compute which canvas nodes are valid targets + which classes can be created.
  // Ghost nodes are excluded from both lists.
  const compatibleInfo = useMemo(() => {
    if (!activeHandle) return { compatibleNodeIds: new Set(), compatibleClasses: [], compatibleNodes: [] };
    const srcNode = nodes.find(n => n.id === activeHandle.nodeId);
    if (!srcNode) return { compatibleNodeIds: new Set(), compatibleClasses: [], compatibleNodes: [] };
    const classes = getCompatibleClasses(schema, srcNode.data.className, activeHandle.handleId);
    const matching = nodes.filter(n =>
      n.id !== activeHandle.nodeId &&
      n.type !== 'ghostNode' &&
      classes.some(tc => isSubtypeOf(n.data.className, tc, schema))
    );
    return {
      compatibleClasses: classes,
      compatibleNodeIds: new Set(matching.map(n => n.id)),
      compatibleNodes:   matching.map(n => ({ id: n.id, label: getNodeDisplayLabel(n) })),
    };
  }, [activeHandle, nodes]);

  // Create a new node of the chosen class and wire a real edge from the active slot.
  const handleCreateAndConnect = useCallback((className) => {
    if (!activeHandle) return;
    const { nodeId, handleId } = activeHandle;
    const srcNode = nodes.find(n => n.id === nodeId);
    if (!srcNode) return;
    const newId = `${className.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    setNodes(nds => [...nds, {
      id:       newId,
      type:     'schemaNode',
      position: { x: srcNode.position.x + 480, y: srcNode.position.y },
      data:     { className, displayName: generateDisplayName(className), values: {} },
    }]);
    setEdges(eds => addEdge({
      id: `${nodeId}--${handleId}--${newId}`,
      source: nodeId, target: newId, sourceHandle: handleId,
      ...realEdgeProps(handleId),
    }, eds));
    dismissGhost(false);
  }, [activeHandle, nodes, realEdgeProps, dismissGhost]);

  // Connect the active slot to an already-existing canvas node.
  const handleConnectExisting = useCallback((targetNodeId) => {
    if (!activeHandle) return;
    const { nodeId, handleId } = activeHandle;
    setEdges(eds => addEdge({
      id: `${nodeId}--${handleId}--${targetNodeId}`,
      source: nodeId, target: targetNodeId, sourceHandle: handleId,
      ...realEdgeProps(handleId),
    }, eds));
    dismissGhost(false);
  }, [activeHandle, realEdgeProps, dismissGhost]);

  // Context value passed to all SchemaNodes and the GhostNode
  const activeHandleCtxValue = useMemo(() => ({
    activeHandle,
    compatibleNodeIds:  compatibleInfo.compatibleNodeIds,
    compatibleClasses:  compatibleInfo.compatibleClasses,
    compatibleNodes:    compatibleInfo.compatibleNodes,
    onHandleClick:      handleHandleClick,
    onDismissGhost:     dismissGhost,
    onCreateAndConnect: handleCreateAndConnect,
    onConnectExisting:  handleConnectExisting,
  }), [activeHandle, compatibleInfo, handleHandleClick, dismissGhost, handleCreateAndConnect, handleConnectExisting]);

  // Phase-1 reconnect: drag existing edge endpoint to a new target node
  const onReconnect = useCallback((oldEdge, newConnection) => {
    setEdges(eds => reconnectEdge(oldEdge, newConnection, eds));
  }, []);

  // Clicking an existing edge opens the ghost class-box positioned between source and target.
  // The original edge is removed and replaced by two ghost edges (src→ghost, ghost→tgt)
  // so the connection visually "passes through" the ghost node.
  // Cancelling (Escape / X / pane) restores the original edge; confirming discards it.
  const onEdgeClick = useCallback((event, edge) => {
    if (edge.data?.isGhost) return;
    const srcNode = nodes.find(n => n.id === edge.source);
    const tgtNode = nodes.find(n => n.id === edge.target);
    if (!tgtNode) return;

    const slotName = edge.sourceHandle ?? String(edge.label ?? '');

    // Replace any previously stored original edge with the new one
    const prevOrig = originalEdgeRef.current;
    originalEdgeRef.current = edge;

    // Position ghost between source and target, just before the target node
    const ghostX = srcNode
      ? Math.max(srcNode.position.x + 340, tgtNode.position.x - 380)
      : tgtNode.position.x - 380;
    const ghostY = tgtNode.position.y;

    const gId = `ghost-${Date.now()}`;
    setGhostNodeId(gId);
    setActiveHandle({ nodeId: edge.source, handleId: slotName });

    setNodes(nds => [
      ...nds.filter(n => n.type !== 'ghostNode'),
      {
        id:         gId,
        type:       'ghostNode',
        position:   { x: ghostX, y: ghostY },
        data:       { slotName, sourceNodeId: edge.source, startExpanded: true },
        draggable:  true,
        deletable:  false,
        selectable: false,
      },
    ]);

    setEdges(eds => {
      // Remove ghost edges + restore any previous displaced edge + remove the clicked edge
      const base = eds.filter(e => !e.data?.isGhost && e.id !== edge.id);
      const withPrev = prevOrig ? [...base, prevOrig] : base;
      return [
        ...withPrev,
        // Source → Ghost (upstream dashed)
        {
          id:           `ghost-edge-in-${gId}`,
          source:       edge.source,
          target:       gId,
          sourceHandle: slotName,
          type:         'straight',
          style:        { strokeDasharray: '6 3', stroke: '#94a3b8', strokeWidth: 1.5 },
          animated:     false,
          selectable:   false,
          deletable:    false,
          data:         { isGhost: true },
        },
        // Ghost → Target (downstream dashed — shows the existing connection routing through)
        {
          id:           `ghost-edge-out-${gId}`,
          source:       gId,
          target:       edge.target,
          sourceHandle: 'out',
          type:         'straight',
          style:        { strokeDasharray: '4 4', stroke: '#cbd5e1', strokeWidth: 1 },
          animated:     false,
          selectable:   false,
          deletable:    false,
          data:         { isGhost: true },
        },
      ];
    });
  }, [nodes]);

  // ── Settings change — also update existing edges when edgeType changes ─────
  const handleSettingsChange = (next) => {
    setSettings(next);
    if (next.edgeType !== settings.edgeType) {
      setEdges(eds => eds.map(e => ({ ...e, type: next.edgeType })));
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>

      {welcomeVisible && <WelcomeScreen config={config} onNew={handleNew} onLoad={handleLoad} />}

      {/* ── Left sidebar (toolbar + class palette) ── */}
      <NodePalette
        onAddNode={addNode}
        onHome={() => setWelcomeVisible(true)}
        onSaveJson={handleSaveJson}
        onSaveYaml={handleSaveYaml}
        onSettings={() => setSettingsOpen(true)}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        importError={importError}
        onDismissError={() => setImportError(null)}
      />

      {/* ── Canvas ─────────────────────────────────── */}
      <ActiveHandleContext.Provider value={activeHandleCtxValue}>
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          nodesDraggable={isInteractive}
          nodesConnectable={isInteractive}
          elementsSelectable={isInteractive}
          minZoom={settings.minZoom}
          maxZoom={settings.maxZoom}
          snapToGrid={settings.snapToGrid}
          snapGrid={settings.snapGrid}
          defaultEdgeOptions={{ type: settings.edgeType, animated: true }}
          onEdgeClick={onEdgeClick}
          onPaneClick={dismissGhost}
          reconnectRadius={12}
          onReconnect={onReconnect}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background variant={BG_VARIANT_MAP[settings.bgVariant] ?? BackgroundVariant.Dots} />

          {/* Custom zoom / lock / minimap controls */}
          <CanvasControls
            isInteractive={isInteractive}
            onToggleInteractive={() => setIsInteractive(v => !v)}
            minimapOpen={minimapOpen}
            onToggleMinimap={() => setMinimapOpen(v => !v)}
          />

          {/* Collapsible minimap — dark theme so nodes are visible */}
          {minimapOpen && (
            <MiniMap
              nodeColor="#3b82f6"
              maskColor="rgba(15,23,42,0.55)"
              style={{
                background:   '#1e293b',
                borderRadius: '8px',
                border:       '1.5px solid #334155',
              }}
            />
          )}

        </ReactFlow>

        {/* Validation bar — outside ReactFlow to avoid overflow:hidden clipping */}
        <ValidationBar nodes={nodes} onNext={handleNextViolation} />

      </div>
      </ActiveHandleContext.Provider>

      {/* ── Settings modal ─────────────────────────── */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* ── Export warning modal ───────────────────── */}
      {exportWarning && (
        <ExportWarning
          violations={exportWarning.violations}
          format={exportWarning.format}
          onExport={() => {
            exportWarning.format === 'json' ? doSaveJson() : doSaveYaml();
            setExportWarning(null);
          }}
          onCancel={() => setExportWarning(null)}
        />
      )}

    </div>
  );
}
