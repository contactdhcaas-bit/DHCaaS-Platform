// src/pages/PipelinesPage.tsx
import React, { useState } from 'react';
import {
  Workflow,
  Database,
  ArrowRight,
  Play,
  Plus,
  Cpu,
  Cloud,
  FileCode,
  Lock,
  GitMerge,
  Mail,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Activity,
  Settings,
  Download,
  Upload,
  Filter,
  Search,
} from 'lucide-react';

type TabType = 'design' | 'history';

interface NodeType {
  id: string;
  name: string;
  icon: React.ElementType;
  category: 'source' | 'transform' | 'destination';
  color: string;
}

interface PipelineRun {
  id: string;
  name: string;
  status: 'running' | 'success' | 'failed';
  duration: string;
  trigger: string;
  timestamp: string;
  records: number;
}

interface CanvasNode {
  id: string;
  name: string;
  type: string;
  icon: React.ElementType;
  color: string;
  x: number;
  y: number;
}

const PipelinesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('design');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ===== NODE PALETTE (LEFT PANEL) =====
  const nodePalette: NodeType[] = [
    // Sources
    { id: 's1', name: 'AWS S3', icon: Cloud, category: 'source', color: '#f59e0b' },
    { id: 's2', name: 'MySQL', icon: Database, category: 'source', color: '#3b82f6' },
    { id: 's3', name: 'API Hook', icon: Zap, category: 'source', color: '#8b5cf6' },
    { id: 's4', name: 'File Upload', icon: Upload, category: 'source', color: '#10b981' },

    // Transformations
    { id: 't1', name: 'Data Cleanse', icon: Filter, category: 'transform', color: '#06b6d4' },
    { id: 't2', name: 'PII Masking', icon: Lock, category: 'transform', color: '#ef4444' },
    { id: 't3', name: 'Schema Map', icon: GitMerge, category: 'transform', color: '#8b5cf6' },
    { id: 't4', name: 'Validation', icon: CheckCircle, category: 'transform', color: '#10b981' },

    // Destinations
    { id: 'd1', name: 'Snowflake', icon: Database, category: 'destination', color: '#3b82f6' },
    { id: 'd2', name: 'PowerBI', icon: BarChart3, category: 'destination', color: '#f59e0b' },
    { id: 'd3', name: 'Email Alert', icon: Mail, category: 'destination', color: '#ec4899' },
    { id: 'd4', name: 'Webhook', icon: Zap, category: 'destination', color: '#8b5cf6' },
  ];

  // ===== MOCK CANVAS WORKFLOW (3 NODES CONNECTED) =====
  const canvasNodes: CanvasNode[] = [
    { id: '1', name: 'MySQL Source', type: 'source', icon: Database, color: '#3b82f6', x: 100, y: 150 },
    { id: '2', name: 'PII Masking', type: 'transform', icon: Lock, color: '#ef4444', x: 350, y: 150 },
    { id: '3', name: 'Snowflake', type: 'destination', icon: Database, color: '#3b82f6', x: 600, y: 150 },
  ];

  // ===== PIPELINE RUNS (HISTORY) =====
  const pipelineRuns: PipelineRun[] = [
    {
      id: '1',
      name: 'Customer Data ETL',
      status: 'running',
      duration: '2m 35s',
      trigger: 'Schedule (Daily 2AM)',
      timestamp: '2026-02-04 13:00:00',
      records: 12500,
    },
    {
      id: '2',
      name: 'PII Sanitization Pipeline',
      status: 'success',
      duration: '5m 12s',
      trigger: 'Manual Trigger',
      timestamp: '2026-02-04 12:45:00',
      records: 8400,
    },
    {
      id: '3',
      name: 'Analytics Data Sync',
      status: 'success',
      duration: '3m 08s',
      trigger: 'API Webhook',
      timestamp: '2026-02-04 12:30:00',
      records: 15200,
    },
    {
      id: '4',
      name: 'Data Quality Check',
      status: 'failed',
      duration: '1m 42s',
      trigger: 'Schedule (Hourly)',
      timestamp: '2026-02-04 12:00:00',
      records: 0,
    },
    {
      id: '5',
      name: 'Export to PowerBI',
      status: 'success',
      duration: '4m 55s',
      trigger: 'Manual Trigger',
      timestamp: '2026-02-04 11:30:00',
      records: 9800,
    },
  ];

  // ===== TOAST NOTIFICATION =====
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ===== RUN PIPELINE ACTION =====
  const handleRunPipeline = (name: string) => {
    triggerToast(`Pipeline "${name}" triggered successfully! 🚀`);
  };

  // ===== STATUS BADGE =====
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-blue-900/30 text-blue-400 text-xs font-medium rounded-full border border-blue-800">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Running
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-medium rounded-full border border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-400 text-xs font-medium rounded-full border border-red-800">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* ===== HEADER ===== */}
      <div className="bg-gray-800 border-b border-gray-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Workflow className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Data Workflow Automation</h1>
              <p className="text-sm text-gray-400 mt-1">Design, deploy, and monitor ETL pipelines</p>
            </div>
          </div>
          <button
            onClick={() => triggerToast('Opening pipeline designer... ✨')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Create New Pipeline
          </button>
        </div>
      </div>

      {/* ===== TABS NAVIGATION ===== */}
      <div className="bg-gray-800 border-b border-gray-700 px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('design')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
              activeTab === 'design'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Cpu className="w-5 h-5" />
            Design Canvas
            {activeTab === 'design' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
              activeTab === 'history'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            Run History
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1: DESIGN CANVAS */}
        {activeTab === 'design' && (
          <>
            {/* LEFT PANEL: NODE PALETTE */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
              <div className="p-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Component Library
                </h2>

                {/* Sources */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2">Data Sources</h3>
                  <div className="space-y-2">
                    {nodePalette
                      .filter((n) => n.category === 'source')
                      .map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-3 px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded-lg cursor-move transition-colors border border-gray-700"
                        >
                          {React.createElement(node.icon, {
                            className: 'w-5 h-5',
                            style: { color: node.color },
                          })}
                          <span className="text-sm text-white">{node.name}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Transformations */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2">Transformations</h3>
                  <div className="space-y-2">
                    {nodePalette
                      .filter((n) => n.category === 'transform')
                      .map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-3 px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded-lg cursor-move transition-colors border border-gray-700"
                        >
                          {React.createElement(node.icon, {
                            className: 'w-5 h-5',
                            style: { color: node.color },
                          })}
                          <span className="text-sm text-white">{node.name}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Destinations */}
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2">Destinations</h3>
                  <div className="space-y-2">
                    {nodePalette
                      .filter((n) => n.category === 'destination')
                      .map((node) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-3 px-3 py-2 bg-gray-900 hover:bg-gray-700 rounded-lg cursor-move transition-colors border border-gray-700"
                        >
                          {React.createElement(node.icon, {
                            className: 'w-5 h-5',
                            style: { color: node.color },
                          })}
                          <span className="text-sm text-white">{node.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: CANVAS AREA */}
            <div className="flex-1 bg-gray-950 overflow-auto relative">
              {/* Grid Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Canvas Content */}
              <div className="relative p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Customer Data Pipeline</h2>
                    <p className="text-sm text-gray-400">MySQL → PII Masking → Snowflake</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configure
                    </button>
                    <button
                      onClick={() => handleRunPipeline('Customer Data Pipeline')}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Run Now
                    </button>
                  </div>
                </div>

                {/* SVG Canvas */}
                <svg width="800" height="400" className="mx-auto">
                  {/* Animated Connection Lines */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="9"
                      refY="3"
                      orient="auto"
                      fill="#8b5cf6"
                    >
                      <polygon points="0 0, 10 3, 0 6" />
                    </marker>
                    <style>
                      {`
                        @keyframes flowAnimation {
                          from { stroke-dashoffset: 20; }
                          to { stroke-dashoffset: 0; }
                        }
                        .flow-line {
                          stroke-dasharray: 10 5;
                          animation: flowAnimation 1s linear infinite;
                        }
                      `}
                    </style>
                  </defs>

                  {/* Connection Lines */}
                  <line
                    x1="220"
                    y1="190"
                    x2="330"
                    y2="190"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    markerEnd="url(#arrowhead)"
                    className="flow-line"
                  />
                  <line
                    x1="470"
                    y1="190"
                    x2="580"
                    y2="190"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    markerEnd="url(#arrowhead)"
                    className="flow-line"
                  />

                  {/* Nodes */}
                  {canvasNodes.map((node) => (
                    <g key={node.id}>
                      {/* Node Background */}
                      <rect
                        x={node.x}
                        y={node.y}
                        width="120"
                        height="80"
                        rx="12"
                        fill="#1f2937"
                        stroke={node.color}
                        strokeWidth="2"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />

                      {/* Icon */}
                      <foreignObject x={node.x + 40} y={node.y + 15} width="40" height="40">
                        <div className="flex items-center justify-center">
                          {React.createElement(node.icon, {
                            className: 'w-8 h-8',
                            style: { color: node.color },
                          })}
                        </div>
                      </foreignObject>

                      {/* Label */}
                      <text
                        x={node.x + 60}
                        y={node.y + 70}
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {node.name}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Pipeline Stats */}
                <div className="mt-8 grid grid-cols-4 gap-4">
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-400">Last Run</p>
                    <p className="text-xl font-bold text-white mt-1">5m 12s</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-400">Records Processed</p>
                    <p className="text-xl font-bold text-white mt-1">12,500</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-400">Success Rate</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">98.5%</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <p className="text-sm text-gray-400">Next Run</p>
                    <p className="text-xl font-bold text-white mt-1">2h 15m</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: RUN HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Pipeline Execution History</h2>
                  <p className="text-sm text-gray-400 mt-1">Recent pipeline runs and status</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search pipelines..."
                      className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none focus:border-purple-600 transition-colors"
                    />
                  </div>
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Pipeline Name
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Duration
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Records
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Trigger
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Timestamp
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineRuns.map((run) => (
                      <tr
                        key={run.id}
                        className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Workflow className="w-5 h-5 text-purple-500" />
                            <span className="text-sm font-medium text-white">{run.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">{getStatusBadge(run.status)}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {run.duration}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-300">
                            {run.records.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full">
                            {run.trigger}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-400">{run.timestamp}</span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleRunPipeline(run.name)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Run
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== TOAST NOTIFICATION ===== */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up z-50">
          <CheckCircle className="w-6 h-6" />
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}

      <style>
        {`
          @keyframes slide-up {
            from {
              transform: translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default PipelinesPage;
