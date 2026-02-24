// src/pages/DataLineagePage.tsx
import React, { useState } from 'react';
import {
  Database,
  GitBranch,
  Search,
  X,
  Clock,
  User,
  Calendar,
  ArrowRight,
  Layers,
  Zap,
  Cloud,
  Server,
  Filter,
} from 'lucide-react';

interface LineageNode {
  id: string;
  name: string;
  type: 'source' | 'process' | 'target';
  icon: any;
  color: string;
  bgColor: string;
  owner: string;
  lastUpdated: Date;
  recordCount?: number;
  description: string;
  connections: string[];
}

const DataLineagePage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Lineage nodes
  const nodes: LineageNode[] = [
    // Sources
    {
      id: 'source-1',
      name: 'MongoDB Production',
      type: 'source',
      icon: Database,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      owner: 'Data Engineering Team',
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
      recordCount: 125430,
      description: 'Primary customer data store',
      connections: ['process-1', 'process-2'],
    },
    {
      id: 'source-2',
      name: 'PostgreSQL Users',
      type: 'source',
      icon: Server,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      owner: 'Marketing Team',
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
      recordCount: 45620,
      description: 'User authentication and profiles',
      connections: ['process-2'],
    },
    {
      id: 'source-3',
      name: 'MySQL Orders',
      type: 'source',
      icon: Database,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      owner: 'Sales Team',
      lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
      recordCount: 89340,
      description: 'E-commerce order transactions',
      connections: ['process-3'],
    },

    // Processes
    {
      id: 'process-1',
      name: 'PII Sanitization',
      type: 'process',
      icon: Zap,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      owner: 'Data Compliance Team',
      lastUpdated: new Date(Date.now() - 15 * 60 * 1000),
      description: 'Masks sensitive customer data',
      connections: ['target-1'],
    },
    {
      id: 'process-2',
      name: 'Data Quality Check',
      type: 'process',
      icon: Layers,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20',
      owner: 'Data Quality Team',
      lastUpdated: new Date(Date.now() - 45 * 60 * 1000),
      description: 'Validates data completeness and accuracy',
      connections: ['target-2'],
    },
    {
      id: 'process-3',
      name: 'ETL Pipeline',
      type: 'process',
      icon: GitBranch,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      owner: 'Data Engineering Team',
      lastUpdated: new Date(Date.now() - 20 * 60 * 1000),
      description: 'Extracts, transforms, and loads data',
      connections: ['target-2', 'target-3'],
    },

    // Targets
    {
      id: 'target-1',
      name: 'Snowflake DWH',
      type: 'target',
      icon: Cloud,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      owner: 'Analytics Team',
      lastUpdated: new Date(Date.now() - 10 * 60 * 1000),
      recordCount: 250000,
      description: 'Enterprise data warehouse',
      connections: [],
    },
    {
      id: 'target-2',
      name: 'Analytics DB',
      type: 'target',
      icon: Database,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20',
      owner: 'Analytics Team',
      lastUpdated: new Date(Date.now() - 25 * 60 * 1000),
      recordCount: 180000,
      description: 'Business intelligence reports',
      connections: [],
    },
    {
      id: 'target-3',
      name: 'Marketing Platform',
      type: 'target',
      icon: Server,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      owner: 'Marketing Team',
      lastUpdated: new Date(Date.now() - 35 * 60 * 1000),
      recordCount: 95000,
      description: 'Customer segmentation and campaigns',
      connections: [],
    },
  ];

  // Filter nodes
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         node.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || node.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group by type
  const sources = filteredNodes.filter(n => n.type === 'source');
  const processes = filteredNodes.filter(n => n.type === 'process');
  const targets = filteredNodes.filter(n => n.type === 'target');

  // Get relative time
  const getRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Handle node click
  const handleNodeClick = (node: LineageNode) => {
    setSelectedNode(node);
  };

  // Render node card
  const renderNode = (node: LineageNode) => {
    const Icon = node.icon;
    const isSelected = selectedNode?.id === node.id;

    return (
      <button
        key={node.id}
        onClick={() => handleNodeClick(node)}
        className={`
          relative w-full p-4 rounded-xl border-2 transition-all text-left
          ${isSelected ? 'border-purple-500 bg-purple-500/10 scale-105' : 'border-gray-700 bg-[#0B1120] hover:border-gray-600'}
        `}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${node.bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${node.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white mb-1 truncate">
              {node.name}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              {node.owner}
            </div>
            {node.recordCount && (
              <div className="text-xs text-gray-500">
                {node.recordCount.toLocaleString()} records
              </div>
            )}
          </div>
        </div>

        {isSelected && (
          <div className="absolute -right-1 -top-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Data Lineage</h1>
          <p className="text-gray-400">Visualize your data flow from source to destination</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-12 pr-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
            >
              <option value="all">All Types</option>
              <option value="source">Sources</option>
              <option value="process">Processes</option>
              <option value="target">Targets</option>
            </select>
          </div>
        </div>

        {/* Lineage Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Lineage Flow */}
          <div className="lg:col-span-3">
            <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Data Flow</h2>
                <p className="text-sm text-gray-400">End-to-end data journey</p>
              </div>

              {/* Flow Columns */}
              <div className="grid grid-cols-3 gap-6">
                {/* Sources Column */}
                <div>
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <Database className="w-5 h-5 text-green-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Sources
                    </h3>
                    <span className="ml-auto text-xs text-gray-500">
                      {sources.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {sources.map(renderNode)}
                  </div>
                </div>

                {/* Arrow Column */}
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4 w-full">
                    {/* Animated connection lines */}
                    <div className="relative w-full h-32">
                      {/* Top line */}
                      <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500/50 via-purple-500/50 to-purple-500/50">
                        <div className="absolute top-0 left-0 w-8 h-0.5 bg-gradient-to-r from-transparent to-purple-500 animate-flowRight" />
                      </div>
                      
                      {/* Middle line */}
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-cyan-500/50">
                        <div className="absolute top-0 left-0 w-8 h-0.5 bg-gradient-to-r from-transparent to-cyan-500 animate-flowRight" style={{ animationDelay: '0.5s' }} />
                      </div>
                      
                      {/* Bottom line */}
                      <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500/50 via-yellow-500/50 to-yellow-500/50">
                        <div className="absolute top-0 left-0 w-8 h-0.5 bg-gradient-to-r from-transparent to-yellow-500 animate-flowRight" style={{ animationDelay: '1s' }} />
                      </div>
                    </div>

                    {/* Processes Column Label */}
                    <div className="flex items-center gap-2 px-2">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Processes
                      </h3>
                      <span className="ml-auto text-xs text-gray-500">
                        {processes.length}
                      </span>
                    </div>

                    {/* Bottom connections */}
                    <div className="relative w-full h-32">
                      {/* Top line */}
                      <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-blue-500/50">
                        <div className="absolute top-0 left-0 w-8 h-0.5 bg-gradient-to-r from-transparent to-blue-500 animate-flowRight" />
                      </div>
                      
                      {/* Middle line */}
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/50 via-indigo-500/50 to-indigo-500/50">
                        <div className="absolute top-0 left-0 w-8 h-0.5 bg-gradient-to-r from-transparent to-indigo-500 animate-flowRight" style={{ animationDelay: '0.5s' }} />
                      </div>
                      
                      {/* Bottom line */}
                      <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500/50 via-pink-500/50 to-pink-500/50">
                        <div className="absolute top-0 left-0 w-8 h-0.5 bg-gradient-to-r from-transparent to-pink-500 animate-flowRight" style={{ animationDelay: '1s' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Targets Column */}
                <div>
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <Cloud className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Targets
                    </h3>
                    <span className="ml-auto text-xs text-gray-500">
                      {targets.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {targets.map(renderNode)}
                  </div>
                </div>
              </div>

              {/* Process Nodes (Center) */}
              <div className="mt-8">
                <div className="grid grid-cols-3 gap-3">
                  {processes.map(renderNode)}
                </div>
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-6 sticky top-6">
              {selectedNode ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Node Details</h2>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Node Icon & Name */}
                  <div className="mb-6">
                    <div className={`w-16 h-16 rounded-xl ${selectedNode.bgColor} flex items-center justify-center mb-4`}>
                      {React.createElement(selectedNode.icon, {
                        className: `w-8 h-8 ${selectedNode.color}`,
                      })}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {selectedNode.name}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${selectedNode.bgColor} ${selectedNode.color}`}>
                      {selectedNode.type.toUpperCase()}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <User className="w-4 h-4" />
                        Owner
                      </div>
                      <div className="text-sm text-white font-medium">
                        {selectedNode.owner}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Clock className="w-4 h-4" />
                        Last Updated
                      </div>
                      <div className="text-sm text-white font-medium">
                        {getRelativeTime(selectedNode.lastUpdated)}
                      </div>
                    </div>

                    {selectedNode.recordCount && (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Database className="w-4 h-4" />
                          Record Count
                        </div>
                        <div className="text-sm text-white font-medium">
                          {selectedNode.recordCount.toLocaleString()}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <GitBranch className="w-4 h-4" />
                        Description
                      </div>
                      <div className="text-sm text-gray-300">
                        {selectedNode.description}
                      </div>
                    </div>

                    {selectedNode.connections.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <ArrowRight className="w-4 h-4" />
                          Connections
                        </div>
                        <div className="space-y-2">
                          {selectedNode.connections.map(connId => {
                            const connNode = nodes.find(n => n.id === connId);
                            if (!connNode) return null;
                            const ConnIcon = connNode.icon;
                            return (
                              <button
                                key={connId}
                                onClick={() => handleNodeClick(connNode)}
                                className="w-full flex items-center gap-2 p-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                <div className={`w-6 h-6 rounded ${connNode.bgColor} flex items-center justify-center`}>
                                  <ConnIcon className={`w-3 h-3 ${connNode.color}`} />
                                </div>
                                <span className="text-xs text-white font-medium truncate">
                                  {connNode.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <GitBranch className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <div className="text-gray-500 font-medium mb-1">No node selected</div>
                  <div className="text-xs text-gray-600">
                    Click on any node to view details
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-6 h-6 text-green-400" />
              <div className="text-2xl font-bold text-white">{sources.length}</div>
            </div>
            <div className="text-sm text-gray-400">Data Sources</div>
          </div>

          <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-purple-400" />
              <div className="text-2xl font-bold text-white">{processes.length}</div>
            </div>
            <div className="text-sm text-gray-400">Active Processes</div>
          </div>

          <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <Cloud className="w-6 h-6 text-blue-400" />
              <div className="text-2xl font-bold text-white">{targets.length}</div>
            </div>
            <div className="text-sm text-gray-400">Target Systems</div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes flowRight {
          0% {
            left: -2rem;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            left: 100%;
            opacity: 0;
          }
        }

        .animate-flowRight {
          animation: flowRight 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default DataLineagePage;
