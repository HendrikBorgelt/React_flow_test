import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SchemaNode } from './nodes/SchemaNode';
import { NodePalette } from './components/NodePalette';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsModal } from './components/SettingsModal';
import { fromJson } from './loaders/fromJson';
import { toJson } from './loaders/toJson';
import { dump as yamlDump } from 'js-yaml';
import { getClassInfo, isSubtypeOf } from './schema/schemaUtils';
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

export default function App() {
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importError, setImportError] = useState(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const toolbarFileRef = useRef(null);

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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleSaveJson = () => {
    const data = toJson(nodes, edges, schema);
    if (!data) return;
    triggerDownload(JSON.stringify(data, null, 2), getExportFilename('json'), 'application/json');
  };

  const handleSaveYaml = () => {
    const data = toJson(nodes, edges, schema);
    if (!data) return;
    triggerDownload(yamlDump(data, { indent: 2, lineWidth: 120 }), getExportFilename('yaml'), 'text/yaml');
  };

  // ── Toolbar file import ────────────────────────────────────────────────────
  const handleToolbarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        const { nodes: ns, edges: es } = fromJson(json, schema);
        setNodes(ns);
        setEdges(es);
      } catch (err) {
        setImportError(`${file.name}: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const onNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)), []
  );
  const onEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)), []
  );

  // ── Add a new node at the current viewport centre ─────────────────────────
  const addNode = useCallback((className) => {
    const position = screenToFlowPosition({
      x: window.innerWidth  / 2,
      y: window.innerHeight / 2,
    });
    const id = `${className.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    setNodes(nds => [...nds, {
      id,
      type: 'schemaNode',
      position,
      data: { className, values: {} },
    }]);
  }, [screenToFlowPosition]);

  // ── Create edge with slot name as label ───────────────────────────────────
  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({
      ...params,
      animated:            true,
      label:               params.sourceHandle,
      labelStyle:          { fontSize: 10, fill: '#374151', fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
      labelBgStyle:        { fill: '#fff', fillOpacity: 0.85 },
      labelBgPadding:      [4, 2],
      labelBgBorderRadius: 3,
    }, eds));
  }, []);

  // ── Only allow connections where the target class is in the slot's targetClasses ──
  const isValidConnection = useCallback((connection) => {
    const { source, sourceHandle, target } = connection;
    if (source === target) return false;                    // no self-loops
    const srcNode = nodes.find(n => n.id === source);
    const tgtNode = nodes.find(n => n.id === target);
    if (!srcNode || !tgtNode) return false;
    const info = getClassInfo(schema, srcNode.data.className);
    const slot = info?.refSlots.find(s => s.name === sourceHandle);
    // Accept if the target class IS one of the expected classes, or is a
    // structural subtype of one of them (handles base-class refs like Entity).
    return slot?.targetClasses.some(tc => isSubtypeOf(tgtNode.data.className, tc, schema)) ?? false;
  }, [nodes]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>

      {welcomeVisible && <WelcomeScreen onNew={handleNew} onLoad={handleLoad} />}

      <NodePalette onAddNode={addNode} />

      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setWelcomeVisible(true)} style={toolbarBtnStyle} title="Home"
                >⌂ Home</button>
                <button onClick={() => toolbarFileRef.current.click()} style={toolbarBtnStyle} title="Load JSON/YAML file"
                >📂 Load</button>
                <button onClick={handleSaveJson} style={toolbarBtnStyle} title="Save as LinkML instance JSON"
                >↓ JSON</button>
                <button onClick={handleSaveYaml} style={toolbarBtnStyle} title="Save as LinkML instance YAML"
                >↓ YAML</button>
                <button onClick={() => setSettingsOpen(true)} style={toolbarBtnStyle} title="Settings"
                >⚙ Settings</button>
              </div>
              {importError && (
                <div style={importErrorStyle} onClick={() => setImportError(null)} title="Click to dismiss">
                  ⚠ {importError}
                </div>
              )}
            </div>
            <input
              ref={toolbarFileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleToolbarFile}
            />
          </Panel>
        </ReactFlow>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

    </div>
  );
}

const importErrorStyle = {
  maxWidth:     '320px',
  padding:      '6px 10px',
  borderRadius: '6px',
  background:   '#fef2f2',
  border:       '1px solid #fca5a5',
  color:        '#b91c1c',
  fontSize:     '11px',
  cursor:       'pointer',
  wordBreak:    'break-word',
};

const toolbarBtnStyle = {
  padding:      '5px 12px',
  border:       '1px solid #e2e8f0',
  borderRadius: '6px',
  background:   '#ffffff',
  color:        '#374151',
  fontSize:     '12px',
  cursor:       'pointer',
  fontFamily:   'ui-sans-serif, system-ui, sans-serif',
  boxShadow:    '0 1px 3px rgba(0,0,0,.08)',
};
