import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
 
const initialNodes = [
  {
    id: 'user-model',
    type: 'schemaNode', // Custom node type to show fields
    data: { 
      label: 'User Model', 
      fields: ['id: int', 'name: str', 'shipping_address: Address'] 
    },
    position: { x: 50, y: 100 },
  },
  {
    id: 'address-model',
    type: 'schemaNode',
    data: { 
      label: 'Address Model', 
      fields: ['street: str', 'city: str'] 
    },
    position: { x: 400, y: 200 },
  },
];
const initialEdges = [
  {
    id: 'e-user-address-ref',
    source: 'user-model',
    // The link originates from the 'shipping_address' field in the User model
    sourceHandle: 'shipping_address', 
    target: 'address-model',
    label: 'has a one-to-one reference',
    animated: true,
  },
];
 
export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
 
  const onNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );
 
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
}