// src/pages/DataLineagePage.tsx
import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  Database,
  FileCode,
  Table,
  BarChart3,
  Shield,
  AlertCircle,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  X,
  Clock,
  User,
  ExternalLink,
  Activity,
} from 'lucide-react';

type NodeType = 'source' | 'etl' | 'table' | 'consumer';

interface LineageNode {
  id: string;
  label: string;
  type: NodeType;
  qualityScore: number;
  hasPII: boolean;
  owner: string;
  lastScan: string;
  x: number;
  y: number;
}

interface LineageEdge {
  id: string;
  source: string;
  target: string;
}

interface ApiLineageNode {
  id: string;
  label: string;
  type: string;
  qualityScore?: number | null;
  hasPII?: boolean | null;
  owner?: string | null;
  lastScan?: string | null;
  x?: number;
  y?: number;
}

interface LineageApiResponse {
  nodes: ApiLineageNode[];
  edges: LineageEdge[];
}

const DataLineagePage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<LineageNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [highlightPII, setHighlightPII] = useState(false);

  const [allNodes, setAllNodes] = useState<LineageNode[]>([]);
  const [edges, setEdges] = useState<LineageEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateLayout = (nodes: ApiLineageNode[]): LineageNode[] => {
    return nodes.map((n) => {
      const typeKey = (n.type as NodeType) || 'table';
      return {
        id: n.id,
        label: n.label ?? 'Unknown',
        type: typeKey,
        qualityScore: n.qualityScore ?? 0,
        hasPII: Boolean(n.hasPII),
        owner: n.owner ?? 'Unknown Owner',
        lastScan: n.lastScan ?? '',
        x: n.x ?? 100,
        y: n.y ?? 100,
      };
    });
  };

  useEffect(() => {
    const fetchLineageData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/v1/lineage');
        if (!response.ok) {
          throw new Error(`Failed to load lineage: ${response.status}`);
        }

        const data: LineageApiResponse = await response.json();
        const nodesWithLayout = calculateLayout(data.nodes || []);

        setAllNodes(nodesWithLayout);
        setEdges(data.edges || []);
        
        console.log('Loaded nodes:', nodesWithLayout.length);
        console.log('Loaded edges:', data.edges.length);
      } catch (err: any) {
        console.error('Failed to fetch lineage', err);
        setError(err.message ?? 'Failed to fetch lineage data');
      } finally {
        setLoading(false);
      }
    };

    fetchLineageData();
  }, []);

  const getFilteredNodes = (): LineageNode[] => {
    let filtered = allNodes;

    if (showOnlyIssues) {
      filtered = filtered.filter((n) => n.qualityScore < 90);
    }

    if (highlightPII) {
      filtered = filtered.filter((n) => n.hasPII);
    }

    return filtered;
  };

  const displayedNodes = showOnlyIssues || highlightPII ? getFilteredNodes() : allNodes;
  const displayedNodeIds = new Set(displayedNodes.map((n) => n.id));

  // Get connected nodes for focus mode
  const getConnectedNodeIds = (nodeId: string): Set<string> => {
    const connected = new Set<string>([nodeId]);
    
    edges.forEach(edge => {
      if (edge.source === nodeId) {
        connected.add(edge.target);
      }
      if (edge.target === nodeId) {
        connected.add(edge.source);
      }
    });
    
    return connected;
  };

  const connectedNodeIds = hoveredNode ? getConnectedNodeIds(hoveredNode.id) : null;

  const getHealthColor = (score: number): string => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'source':
        return Database;
      case 'etl':
        return FileCode;
      case 'table':
        return Table;
      case 'consumer':
        return BarChart3;
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (score >= 70) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 10, 150));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 10, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const healthyCount = allNodes.filter((n) => n.qualityScore >= 90).length;
  const warningCount = allNodes.filter((n) => n.qualityScore >= 70 && n.qualityScore < 90).length;
  const criticalCount = allNodes.filter((n) => n.qualityScore < 70).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <GitBranch className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Data Lineage</h1>
              <p className="text-gray-400 mt-1">Track data flow across your ecosystem</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all hover:shadow-lg flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters
            </button>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Export View
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-700 bg-red-900/40 px-4 py-2 text-sm text-red-200 animate-pulse">
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-4 rounded-xl border border-indigo-700 bg-indigo-900/40 px-4 py-2 text-sm text-indigo-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              Loading lineage...
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 transition-all hover:shadow-lg hover:border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Assets</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold">{allNodes.length}</div>
          </div>

          <div className="bg-gray-800 border border-emerald-700/50 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Healthy</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{healthyCount}</div>
          </div>

          <div className="bg-gray-800 border border-yellow-700/50 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Warning</span>
              <AlertCircle className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
          </div>

          <div className="bg-gray-800 border border-red-700/50 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Critical</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowOnlyIssues(!showOnlyIssues)}
            className={`px-4 py-2 rounded-xl border transition-all ${
              showOnlyIssues
                ? 'bg-red-600 border-red-500 shadow-lg shadow-red-500/30'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
            }`}
          >
            Show Only Issues
          </button>
          <button
            onClick={() => setHighlightPII(!highlightPII)}
            className={`px-4 py-2 rounded-xl border transition-all ${
              highlightPII
                ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/30'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Highlight PII
          </button>

          <div className="flex-1" />

          <button
            onClick={handleZoomOut}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all hover:scale-110"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-colors"
          >
            {zoomLevel}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all hover:scale-110"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-all hover:scale-110"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <div className="relative overflow-hidden" style={{ height: '600px' }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1000 900"
              style={{ transform: `scale(${zoomLevel / 100})`, transition: 'transform 0.3s ease' }}
            >
              <defs>
                <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                </linearGradient>

                <linearGradient id="sourceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>

                <marker
                  id="arrowhead"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="auto"
                  fill="#8b5cf6"
                >
                  <polygon points="0 0, 12 6, 0 12" />
                </marker>

                <filter id="edgeGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="nodeShadow">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.4" />
                </filter>

                <filter id="strongShadow">
                  <feDropShadow dx="0" dy="6" stdDeviation="12" floodOpacity="0.6" />
                </filter>

                <style>
                  {`
                    @keyframes dash-draw {
                      0% { 
                        stroke-dashoffset: 40; 
                      }
                      100% { 
                        stroke-dashoffset: 0; 
                      }
                    }
                    
                    @keyframes pulse-glow {
                      0%, 100% {
                        opacity: 0.6;
                        filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.4));
                      }
                      50% {
                        opacity: 1;
                        filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.8));
                      }
                    }
                    
                    @keyframes pulse-badge {
                      0%, 100% {
                        opacity: 0.8;
                        transform: scale(1);
                      }
                      50% {
                        opacity: 1;
                        transform: scale(1.05);
                      }
                    }

                    @keyframes heartbeat {
                      0%, 100% {
                        transform: scale(1);
                      }
                      25% {
                        transform: scale(1.05);
                      }
                      50% {
                        transform: scale(1);
                      }
                    }
                    
                    .flow-path {
                      stroke-dasharray: 10 10;
                      animation: dash-draw 2s linear infinite;
                    }
                    
                    .node-group {
                      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                      cursor: pointer;
                    }
                    
                    .node-group:hover {
                      transform: scale(1.08);
                    }
                    
                    .node-hovered {
                      filter: url(#strongShadow);
                    }
                    
                    .node-dimmed {
                      opacity: 0.3;
                      transition: opacity 0.3s ease;
                    }
                    
                    .edge-dimmed {
                      opacity: 0.15;
                      transition: opacity 0.3s ease;
                    }
                    
                    .pii-badge {
                      animation: pulse-badge 2.5s ease-in-out infinite;
                    }

                    .source-node {
                      animation: heartbeat 3s ease-in-out infinite;
                      transform-origin: center;
                    }

                    .source-glow {
                      animation: pulse-glow 3s ease-in-out infinite;
                    }
                  `}
                </style>
              </defs>

              {edges.map((edge) => {
                const fromNode = allNodes.find((n) => n.id === edge.source);
                const toNode = allNodes.find((n) => n.id === edge.target);
                
                if (!fromNode || !toNode) {
                  return null;
                }

                const isHighlighted =
                  displayedNodeIds.has(fromNode.id) && displayedNodeIds.has(toNode.id);

                const isInFocus = !connectedNodeIds || 
                  (connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target));

                const startX = fromNode.x + 120;
                const startY = fromNode.y + 35;
                const endX = toNode.x;
                const endY = toNode.y + 35;
                
                const cp1X = startX + 120;
                const cp1Y = startY;
                const cp2X = endX - 120;
                const cp2Y = endY;

                const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

                return (
                  <g key={edge.id} className={!isInFocus ? 'edge-dimmed' : ''}>
                    <path
                      d={pathData}
                      stroke="#1f2937"
                      strokeWidth="7"
                      fill="none"
                      opacity="0.4"
                    />
                    
                    <path
                      d={pathData}
                      stroke={isHighlighted ? 'url(#edgeGradient)' : '#4b5563'}
                      strokeWidth={isHighlighted ? '3.5' : '2.5'}
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      opacity={isHighlighted ? '1' : '0.5'}
                      className={isHighlighted ? 'flow-path' : ''}
                      filter={isHighlighted ? 'url(#edgeGlow)' : 'none'}
                    />
                    
                    {isHighlighted && isInFocus && (
                      <path
                        d={pathData}
                        stroke="#8b5cf6"
                        strokeWidth="1.5"
                        fill="none"
                        opacity="0.7"
                        style={{
                          filter: 'blur(5px)',
                        }}
                      />
                    )}
                  </g>
                );
              })}

              {displayedNodes.map((node) => {
                const Icon = getNodeIcon(node.type);
                const healthColor = getHealthColor(node.qualityScore);
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const isInFocus = !connectedNodeIds || connectedNodeIds.has(node.id);
                const isSourceNode = node.type === 'source';

                return (
                  <g
                    key={node.id}
                    className={`node-group ${isHovered ? 'node-hovered' : ''} ${!isInFocus ? 'node-dimmed' : ''} ${isSourceNode ? 'source-node' : ''}`}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {(isSelected || isHovered) && (
                      <rect
                        width="132"
                        height="82"
                        x="-6"
                        y="-6"
                        rx="16"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        opacity="0.6"
                        className={isSourceNode ? 'source-glow' : ''}
                        style={{
                          filter: 'blur(10px)',
                        }}
                      />
                    )}

                    <rect
                      className="node-rect"
                      width="120"
                      height="70"
                      rx="12"
                      fill={isSourceNode ? 'url(#sourceGradient)' : '#1f2937'}
                      stroke={isSelected || isHovered ? '#8b5cf6' : '#374151'}
                      strokeWidth={(isSelected || isHovered) ? '3' : '2'}
                      filter="url(#nodeShadow)"
                    />

                    <rect 
                      width="120" 
                      height="4" 
                      rx="12" 
                      fill={healthColor}
                      style={{
                        filter: `drop-shadow(0 0 6px ${healthColor})`,
                      }}
                    />

                    <foreignObject x="10" y="15" width="24" height="24">
                      <div className="flex items-center justify-center">
                        {React.createElement(Icon, {
                          className: 'w-6 h-6',
                          style: { 
                            color: isSourceNode ? '#ffffff' : healthColor,
                            filter: `drop-shadow(0 0 3px ${isSourceNode ? '#ffffff' : healthColor})`,
                          },
                        })}
                      </div>
                    </foreignObject>

                    <text
                      x="40"
                      y="30"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="600"
                      style={{
                        textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                      }}
                    >
                      {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
                    </text>

                    <text 
                      x="10" 
                      y="63" 
                      fill="#9ca3af" 
                      fontSize="10"
                      fontWeight="600"
                    >
                      {node.qualityScore}%
                    </text>

                    {node.hasPII && (
                      <g className="pii-badge">
                        <rect 
                          x="88" 
                          y="52" 
                          width="28" 
                          height="14" 
                          rx="7" 
                          fill="#ef4444"
                          style={{
                            filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.7))',
                          }}
                        />
                        <text 
                          x="95" 
                          y="62" 
                          fill="#ffffff" 
                          fontSize="8" 
                          fontWeight="bold"
                        >
                          PII
                        </text>
                      </g>
                    )}

                    <rect
                      width="120"
                      height="70"
                      rx="12"
                      fill="transparent"
                      stroke="transparent"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {selectedNode && (
          <div className="fixed right-0 top-0 h-full w-96 bg-gray-800 border-l border-gray-700 shadow-2xl z-50 overflow-y-auto animate-slide-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Asset Details</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-all hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {React.createElement(getNodeIcon(selectedNode.type), {
                      className: 'w-8 h-8',
                      style: { color: getHealthColor(selectedNode.qualityScore) },
                    })}
                    <div>
                      <h4 className="font-semibold">{selectedNode.label}</h4>
                      <p className="text-sm text-gray-400 capitalize">{selectedNode.type}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Quality Score</span>
                    {getHealthIcon(selectedNode.qualityScore)}
                  </div>
                  <div className="text-2xl font-bold mb-2">{selectedNode.qualityScore}%</div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${selectedNode.qualityScore}%`,
                        backgroundColor: getHealthColor(selectedNode.qualityScore),
                        boxShadow: `0 0 10px ${getHealthColor(selectedNode.qualityScore)}`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm bg-gray-900 p-3 rounded-lg">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Owner:</span>
                    <span className="font-medium">{selectedNode.owner}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm bg-gray-900 p-3 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">Last Scan:</span>
                    <span className="font-medium">{selectedNode.lastScan}</span>
                  </div>
                  {selectedNode.hasPII && (
                    <div className="flex items-center gap-3 text-sm bg-red-900/30 border border-red-700 p-3 rounded-lg">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium">Contains PII Data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataLineagePage;
