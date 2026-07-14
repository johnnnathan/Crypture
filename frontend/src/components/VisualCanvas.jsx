import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

export default function VisualCanvas({ circuit, tick }) {
  // Convert Rust state to React Flow nodes/edges
  const { nodes, edges } = useMemo(() => {
    const data = JSON.parse(circuit.to_json());
    
    const flowNodes = data.nodes.map((node, idx) => ({
      id: node.id.toString(),
      data: { label: `${node.name} (${node.op_type})` },
      position: { x: 250, y: 50 + (idx * 150) },
      style: { background: '#1e293b', color: '#fff', border: '1px solid #3b82f6', borderRadius: '8px' }
    }));

    const flowEdges = data.connections.map(([from, to], idx) => ({
      id: `e-${idx}`,
      source: from.toString(),
      target: to.toString(),
      animated: true,
      style: { stroke: '#3b82f6' }
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [circuit, tick]);

  return (
    <div className="h-full w-full">
      <ReactFlow nodes={nodes} edges={edges} dark>
        <Background color="#333" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}