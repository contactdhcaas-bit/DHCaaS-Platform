// src/pages/DataQualityPage.tsx
import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  Database,
  Shield,
  Target,
  AlertTriangle,
  Filter,
  Search,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface QualityKPI {
  id: string;
  name: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
  icon: any;
  color: string;
  bgGradient: string;
}

interface RuleFailure {
  id: string;
  ruleName: string;
  category: string;
  failedRows: number;
  totalRows: number;
  impact: 'high' | 'medium' | 'low';
  dataSource: string;
  lastChecked: Date;
  status: 'active' | 'resolved';
}

const DataQualityPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Quality KPIs
  const qualityKPIs: QualityKPI[] = [
    {
      id: 'completeness',
      name: 'Completeness',
      value: 98.5,
      status: 'excellent',
      description: 'Rows with no missing values',
      icon: CheckCircle2,
      color: 'text-green-400',
      bgGradient: 'from-green-900/30 to-green-900/5',
    },
    {
      id: 'validity',
      name: 'Validity',
      value: 92.0,
      status: 'good',
      description: 'Data matching expected formats',
      icon: Shield,
      color: 'text-blue-400',
      bgGradient: 'from-blue-900/30 to-blue-900/5',
    },
    {
      id: 'uniqueness',
      name: 'Uniqueness',
      value: 99.9,
      status: 'excellent',
      description: 'No duplicate records',
      icon: Target,
      color: 'text-purple-400',
      bgGradient: 'from-purple-900/30 to-purple-900/5',
    },
    {
      id: 'timeliness',
      name: 'Timeliness',
      value: 100.0,
      status: 'excellent',
      description: 'Data freshness',
      icon: Clock,
      color: 'text-cyan-400',
      bgGradient: 'from-cyan-900/30 to-cyan-900/5',
    },
  ];

  // Overall Quality Score
  const overallScore = qualityKPIs.reduce((sum, kpi) => sum + kpi.value, 0) / qualityKPIs.length;

  // Rule Failures
  const [ruleFailures] = useState<RuleFailure[]>([
    {
      id: '1',
      ruleName: 'Email Format Check',
      category: 'Validity',
      failedRows: 120,
      totalRows: 15000,
      impact: 'medium',
      dataSource: 'MongoDB Production',
      lastChecked: new Date(Date.now() - 30 * 60 * 1000),
      status: 'active',
    },
    {
      id: '2',
      ruleName: 'Negative Price Check',
      category: 'Validity',
      failedRows: 5,
      totalRows: 8500,
      impact: 'high',
      dataSource: 'PostgreSQL Users',
      lastChecked: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '3',
      ruleName: 'Missing Required Fields',
      category: 'Completeness',
      failedRows: 230,
      totalRows: 15000,
      impact: 'high',
      dataSource: 'MongoDB Production',
      lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '4',
      ruleName: 'Duplicate Customer IDs',
      category: 'Uniqueness',
      failedRows: 12,
      totalRows: 15000,
      impact: 'low',
      dataSource: 'MySQL Customer DB',
      lastChecked: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'active',
    },
    {
      id: '5',
      ruleName: 'Stale Data Records',
      category: 'Timeliness',
      failedRows: 0,
      totalRows: 15000,
      impact: 'low',
      dataSource: 'MongoDB Production',
      lastChecked: new Date(Date.now() - 10 * 60 * 1000),
      status: 'resolved',
    },
    {
      id: '6',
      ruleName: 'Invalid Phone Numbers',
      category: 'Validity',
      failedRows: 85,
      totalRows: 15000,
      impact: 'medium',
      dataSource: 'PostgreSQL Users',
      lastChecked: new Date(Date.now() - 45 * 60 * 1000),
      status: 'active',
    },
  ]);

  // Trend data (Last 30 days)
  const trendData = [
    { date: 'Jan 3', score: 94.2, completeness: 96.5, validity: 89.5, uniqueness: 99.8, timeliness: 100 },
    { date: 'Jan 6', score: 95.1, completeness: 97.0, validity: 90.2, uniqueness: 99.8, timeliness: 100 },
    { date: 'Jan 9', score: 94.8, completeness: 96.8, validity: 90.0, uniqueness: 99.7, timeliness: 100 },
    { date: 'Jan 12', score: 95.5, completeness: 97.5, validity: 90.8, uniqueness: 99.8, timeliness: 100 },
    { date: 'Jan 15', score: 96.0, completeness: 97.8, validity: 91.2, uniqueness: 99.8, timeliness: 100 },
    { date: 'Jan 18', score: 96.3, completeness: 98.0, validity: 91.5, uniqueness: 99.9, timeliness: 100 },
    { date: 'Jan 21', score: 96.8, completeness: 98.2, validity: 91.8, uniqueness: 99.9, timeliness: 100 },
    { date: 'Jan 24', score: 97.2, completeness: 98.3, validity: 92.0, uniqueness: 99.9, timeliness: 100 },
    { date: 'Jan 27', score: 97.4, completeness: 98.4, validity: 92.0, uniqueness: 99.9, timeliness: 100 },
    { date: 'Jan 30', score: 97.6, completeness: 98.5, validity: 92.0, uniqueness: 99.9, timeliness: 100 },
  ];

  // Get relative time
  const getRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Get status badge
  const getStatusBadge = (status: 'excellent' | 'good' | 'warning' | 'critical') => {
    const badges = {
      excellent: 'bg-green-500/20 text-green-400 border-green-500/30',
      good: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return badges[status];
  };

  // Get impact badge
  const getImpactBadge = (impact: 'high' | 'medium' | 'low') => {
    const badges = {
      high: 'bg-red-500/20 text-red-400',
      medium: 'bg-orange-500/20 text-orange-400',
      low: 'bg-gray-500/20 text-gray-400',
    };
    return badges[impact];
  };

  // Filter rules
  const filteredRules = ruleFailures.filter(rule => {
    const matchesSearch = 
      rule.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.dataSource.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesImpact = filterImpact === 'all' || rule.impact === filterImpact;
    const matchesStatus = filterStatus === 'all' || rule.status === filterStatus;
    
    return matchesSearch && matchesImpact && matchesStatus;
  });

  // Stats
  const stats = {
    totalRules: ruleFailures.length,
    activeFailures: ruleFailures.filter(r => r.status === 'active').length,
    resolvedIssues: ruleFailures.filter(r => r.status === 'resolved').length,
    highImpact: ruleFailures.filter(r => r.impact === 'high' && r.status === 'active').length,
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Data Quality Dashboard</h1>
            <p className="text-gray-400">Monitor and improve your data quality metrics</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-all">
              <Calendar className="w-4 h-4" />
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Overall Quality Score */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-purple-900/10 border border-purple-500/30 rounded-2xl p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-2">
                Overall Data Quality Score
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-6xl font-bold text-white">
                  {overallScore.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1.5 text-green-400">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-semibold">+2.3%</span>
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Across all quality dimensions
              </div>
            </div>

            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-900/50">
              <Database className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        {/* Quality KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {qualityKPIs.map((kpi) => {
            const Icon = kpi.icon;
            
            return (
              <div
                key={kpi.id}
                className={`relative overflow-hidden bg-gradient-to-br ${kpi.bgGradient} border border-gray-800 rounded-2xl p-6 group hover:border-purple-500/30 transition-all`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gray-900/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${kpi.color}`} />
                    </div>
                    
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(kpi.status)}`}>
                      {kpi.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-4xl font-bold text-white mb-1">
                    {kpi.value}%
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">
                    {kpi.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {kpi.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quality Trend Chart */}
        <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Quality Score Trends</h2>
            <p className="text-sm text-gray-400">Historical quality metrics over the last 30 days</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} domain={[85, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="completeness"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                name="Completeness"
              />
              <Line
                type="monotone"
                dataKey="validity"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Validity"
              />
              <Line
                type="monotone"
                dataKey="uniqueness"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 4 }}
                name="Uniqueness"
              />
              <Line
                type="monotone"
                dataKey="timeliness"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 4 }}
                name="Timeliness"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-5">
            <div className="text-3xl font-bold text-white mb-1">{stats.totalRules}</div>
            <div className="text-sm text-gray-400">Total Quality Rules</div>
          </div>

          <div className="bg-[#0B1120] border border-orange-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-orange-400 mb-1">{stats.activeFailures}</div>
            <div className="text-sm text-gray-400">Active Failures</div>
          </div>

          <div className="bg-[#0B1120] border border-green-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-green-400 mb-1">{stats.resolvedIssues}</div>
            <div className="text-sm text-gray-400">Resolved Issues</div>
          </div>

          <div className="bg-[#0B1120] border border-red-500/30 rounded-xl p-5">
            <div className="text-3xl font-bold text-red-400 mb-1">{stats.highImpact}</div>
            <div className="text-sm text-gray-400">High Impact Issues</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules..."
                className="w-full pl-12 pr-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
              />
            </div>

            {/* Impact Filter */}
            <select
              value={filterImpact}
              onChange={(e) => setFilterImpact(e.target.value)}
              className="px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
            >
              <option value="all">All Impact Levels</option>
              <option value="high">High Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="low">Low Impact</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Rule Failures Table */}
        <div className="bg-[#0B1120] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Quality Rule Failures</h2>
            <p className="text-sm text-gray-400 mt-1">Specific rules that failed validation</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Failed Rows
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Data Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Last Checked
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-5 h-5 ${rule.impact === 'high' ? 'text-red-400' : rule.impact === 'medium' ? 'text-orange-400' : 'text-gray-400'}`} />
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {rule.ruleName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{rule.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {rule.failedRows.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          of {rule.totalRows.toLocaleString()} ({((rule.failedRows / rule.totalRows) * 100).toFixed(2)}%)
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getImpactBadge(rule.impact)}`}>
                        {rule.impact.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{rule.dataSource}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{getRelativeTime(rule.lastChecked)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {rule.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRules.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <div className="text-gray-500 font-medium">No rule failures found</div>
                <div className="text-xs text-gray-600 mt-1">All quality checks passed</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataQualityPage;
