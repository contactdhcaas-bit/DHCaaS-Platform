import React, { useState, useCallback, useRef, DragEvent } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import {
  Database,
  FileUp,
  Cloud,
  Eraser,
  Copy,
  FileText,
  Save,
  Play,
  Trash2,
  Download,
  Filter,
  GitMerge,
  Sparkles,
  Settings,
  Zap,
} from 'lucide-react';

// Node Types Configuration
const nodeTypes = {
  sources: [
    { id: 'source-s3', label: 'S3 Bucket', icon: Cloud, color: 'from-blue-500 to-cyan-500' },
    { id: 'source-file', label: 'File Upload', icon: FileUp, color: 'from-purple-500 to-pink-500' },
    { id: 'source-db', label: 'Database', icon: Database, color: 'from-green-500 to-emerald-500' },
  ],
  transforms: [
    { id: 'transform-clean', label: 'Clean Nulls', icon: Eraser, color: 'from-orange-500 to-red-500' },
    { id: 'transform-dedup', label: 'Remove Duplicates', icon: Copy, color: 'from-yellow-500 to-amber-500' },
    { id: 'transform-rename', label: 'Rename Column', icon: FileText, color: 'from-pink-500 to-rose-500' },
    { id: 'transform-filter', label: 'Filter Rows', icon: Filter, color: 'from-indigo-500 to-purple-500' },
    { id: 'transform-merge', label: 'Merge Data', icon: GitMerge, color: 'from-teal-500 to-cyan-500' },
  ],
  destinations: [
    { id: 'dest-db', label: 'Database', icon: Database, color: 'from-green-500 to-emerald-500' },
    { id: 'dest-csv', label: 'CSV Export', icon: Download, color: 'from-blue-500 to-indigo-500' },
    { id: 'dest-api', label: 'API Endpoint', icon: Zap, color: 'from-purple-500 to-pink-500' },
  ],
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

const PipelineBuilderPage: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [pipelineName, setPipelineName] = useState('Untitled Pipeline');
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#8B5CF6',
            },
            style: {
              strokeWidth: 2,
              stroke: '#8B5CF6',
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('label');
      const color = event.dataTransfer.getData('color');

      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type: 'default',
        position,
        data: {
          label: (
            <div className={`px-4 py-3 bg-gradient-to-r ${color} rounded-lg shadow-xl border-2 border-white/20`}>
              <div className="text-white font-semibold text-sm">{label}</div>
              <div className="text-white/70 text-xs mt-1">{type.split('-')[0]}</div>
            </div>
          ),
          nodeType: type,
          config: {},
        },
        style: {
          background: 'transparent',
          border: 'none',
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: DragEvent, nodeType: string, label: string, color: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('label', label);
    event.dataTransfer.setData('color', color);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleSavePipeline = async () => {
    setIsSaving(true);
    const pipeline = {
      name: pipelineName,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
    };
    console.log('Saving pipeline:', pipeline);
    // TODO: API call to save pipeline
    setTimeout(() => {
      setIsSaving(false);
      alert('Pipeline saved successfully!');
    }, 1000);
  };

  const handleRunPipeline = async () => {
    setIsRunning(true);
    console.log('Running pipeline with nodes:', nodes, 'and edges:', edges);
    // TODO: API call to execute pipeline
    setTimeout(() => {
      setIsRunning(false);
      alert('Pipeline execution started!');
    }, 2000);
  };

  const handleClearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 flex">
      {/* Left Sidebar - Node Palette */}
      <div className="w-80 bg-white/5 backdrop-blur-2xl border-r border-white/10 p-6 overflow-y-auto custom-scrollbar">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Pipeline Builder
          </h2>
          <p className="text-gray-400 text-sm">Drag & drop nodes to build your ETL pipeline</p>
        </div>

        {/* Pipeline Name Input */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Pipeline Name</label>
          <input
            type="text"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Source Nodes */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4" />
            Sources
          </h3>
          <div className="space-y-2">
            {nodeTypes.sources.map((node) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.id}
                  draggable
                  onDragStart={(e) => onDragStart(e as any, node.id, node.label, node.color)}
                  whileHover={{ scale: 1.05, x: 5 }}
                  className={`p-3 bg-gradient-to-r ${node.color} rounded-lg cursor-move shadow-lg border border-white/20 flex items-center gap-3 group`}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="text-white font-medium text-sm">{node.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Transform Nodes */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Transforms
          </h3>
          <div className="space-y-2">
            {nodeTypes.transforms.map((node) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.id}
                  draggable
                  onDragStart={(e) => onDragStart(e as any, node.id, node.label, node.color)}
                  whileHover={{ scale: 1.05, x: 5 }}
                  className={`p-3 bg-gradient-to-r ${node.color} rounded-lg cursor-move shadow-lg border border-white/20 flex items-center gap-3 group`}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="text-white font-medium text-sm">{node.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Destination Nodes */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4" />
            Destinations
          </h3>
          <div className="space-y-2">
            {nodeTypes.destinations.map((node) => {
              const Icon = node.icon;
              return (
                <motion.div
                  key={node.id}
                  draggable
                  onDragStart={(e) => onDragStart(e as any, node.id, node.label, node.color)}
                  whileHover={{ scale: 1.05, x: 5 }}
                  className={`p-3 bg-gradient-to-r ${node.color} rounded-lg cursor-move shadow-lg border border-white/20 flex items-center gap-3 group`}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="text-white font-medium text-sm">{node.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{pipelineName}</h1>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
              {nodes.length} Nodes • {edges.length} Connections
            </span>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearCanvas}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSavePipeline}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
            >
              {isSaving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Save className="w-4 h-4" />
                </motion.div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Pipeline
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRunPipeline}
              disabled={isRunning || nodes.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Play className="w-5 h-5" />
                </motion.div>
              ) : (
                <Play className="w-5 h-5" />
              )}
              Run Pipeline
            </motion.button>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => setSelectedNode(node)}
            fitView
            className="bg-slate-950"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#8B5CF6" />
            <Controls className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg" />
            
            <Panel position="top-center" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2">
              <span className="text-white text-sm font-medium">
                💡 Drag nodes from the sidebar and connect them to build your pipeline
              </span>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      <style>{`
        .react-flow__node {
          cursor: grab;
        }
        .react-flow__node:active {
          cursor: grabbing;
        }
        .react-flow__edge-path {
          stroke-width: 2;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
      `}</style>
    </div>
  );
};

export default PipelineBuilderPage;
