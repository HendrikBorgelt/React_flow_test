import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SchemaNode } from './nodes/SchemaNode';
import { NodePalette } from './components/NodePalette';
import { CanvasControls } from './components/CanvasControls';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsModal, DEFAULT_SETTINGS } from './components/SettingsModal';
import { ExportWarning } from './components/ExportWarning';
import { ValidationBar } from './components/ValidationBar';
import { fromJson } from './loaders/fromJson';
import { toJson } from './loaders/toJson';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { getClassInfo, isSubtypeOf, validateNode } from './schema/schemaUtils';
import schema from './schema/dcat_4c_ap.schema.json';

const nodeTypes = { schemaNode: SchemaNode };

// Pre-filled with data from MaterialSample-001.json for an immediate visual demo
const initialNodes = [
  {
    id: 'ms-001',
    type: 'schemaNode',
    position: { x: 280, y: 60 },
    data: {
      className: 'MaterialSample',
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
  const { screenToFlowPosition, fitView } = useReactFlow();
  const violationCursorRef = useRef(0);
  const fileInputRef = useRef(null);

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
        const { nodes: ns, edges: es } = fromJson(data, schema);
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
      data:     { className, values: {} },
    }]);
  }, [screenToFlowPosition]);

  // ── Create edge with slot name as label ───────────────────────────────────
  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params,
      type:                settings.edgeType,
      animated:            true,
      label:               params.sourceHandle,
      labelStyle:          { fontSize: 10, fill: '#374151', fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
      labelBgStyle:        { fill: '#fff', fillOpacity: 0.85 },
      labelBgPadding:      [4, 2],
      labelBgBorderRadius: 3,
    }, eds));
  }, [settings.edgeType]);

  // ── Only allow connections where the target class is in the slot's targetClasses ──
  const isValidConnection = useCallback((connection) => {
    const { source, sourceHandle, target } = connection;
    if (source === target) return false;
    const srcNode = nodes.find(n => n.id === source);
    const tgtNode = nodes.find(n => n.id === target);
    if (!srcNode || !tgtNode) return false;
    const info = getClassInfo(schema, srcNode.data.className);
    const slot = info?.refSlots.find(s => s.name === sourceHandle);
    return slot?.targetClasses.some(tc => isSubtypeOf(tgtNode.data.className, tc, schema)) ?? false;
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

      {welcomeVisible && <WelcomeScreen onNew={handleNew} onLoad={handleLoad} />}

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
