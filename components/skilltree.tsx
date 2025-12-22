"use client";

import React, { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Edge, 
  Node, 
  useNodesState, 
  useEdgesState, 
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Lock, CheckCircle, PlayCircle } from 'lucide-react';

const nodeDefaults = {
  sourcePosition: Position.Bottom,
  targetPosition: Position.Top,
};

const initialNodes: Node[] = [
  { 
    id: '1', 
    position: { x: 250, y: 0 }, 
    data: { label: 'Intro to React', status: 'completed' }, 
    type: 'input', // Node awal
    ...nodeDefaults 
  },
  { 
    id: '2', 
    position: { x: 100, y: 150 }, 
    data: { label: 'Components', status: 'unlocked' },
    ...nodeDefaults 
  },
  { 
    id: '3', 
    position: { x: 400, y: 150 }, 
    data: { label: 'JSX Syntax', status: 'locked' },
    ...nodeDefaults 
  },
  { 
    id: '4', 
    position: { x: 250, y: 300 }, 
    data: { label: 'Props & State', status: 'locked' },
    ...nodeDefaults 
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
];

export function SkillTree() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = {
    default: ({ data }: any) => {
      let icon = <Lock className="w-4 h-4 text-zinc-400" />;
      let bg = "bg-zinc-100 border-zinc-300";
      
      if (data.status === 'completed') {
        icon = <CheckCircle className="w-4 h-4 text-white" />;
        bg = "bg-green-500 border-green-600 shadow-[0_0_15px_rgba(34,197,94,0.6)]";
      } else if (data.status === 'unlocked') {
        icon = <PlayCircle className="w-4 h-4 text-white" />;
        bg = "bg-blue-600 border-blue-700 animate-pulse";
      }

      return (
        <div className={`px-4 py-2 rounded-lg border-2 shadow-sm min-w-[150px] flex items-center justify-center gap-2 font-bold text-sm ${data.status === 'completed' || data.status === 'unlocked' ? 'text-white' : 'text-zinc-500'} ${bg}`}>
          {icon}
          {data.label}
        </div>
      );
    }
  };

  return (
    <div className="h-[500px] w-full border rounded-xl bg-zinc-50 overflow-hidden">
      <ReactFlow
        nodes={nodes.map(n => ({ ...n, type: 'default' }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}