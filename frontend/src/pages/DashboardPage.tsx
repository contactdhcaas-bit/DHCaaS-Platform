// src/pages/DashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Shield,
  Database,
  Key,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Activity,
  BarChart3,
  Clock,
  Plus,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import dashboardService, { DashboardStatsResponse } from '../services/dashboardService';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-10 bg-gray-800 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-gray-800 rounded w-1/4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 animate-pulse">
                <div className="h-12 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
            <p className="text-lg text-gray-400 mt-1">
              Welcome back, <span className="text-blue-400">{user?.full_name || stats.user.full_name}</span>
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Scans */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-800/50 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-blue-400" />
              </div>
              <span className="text-xs text-blue-300 font-medium">SCANS</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {dashboardService.formatNumber(stats.stats.total_scans)}
            </p>
            <p className="text-sm text-blue-300">
              {stats.recent_scans.length} in recent activity
            </p>
          </div>

          {/* Active Incidents */}
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-800/50 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <span className="text-xs text-red-300 font-medium">INCIDENTS</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {stats.stats.active_incidents}
            </p>
            <p className="text-sm text-red-300">
              Active incidents
            </p>
          </div>

          {/* Data Sources */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border border-emerald-800/50 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <Database className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="text-xs text-emerald-300 font-medium">SOURCES</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {dashboardService.formatNumber(stats.stats.total_sources)}
            </p>
            <p className="text-sm text-emerald-300">
              Connected sources
            </p>
          </div>

          {/* Total Assets */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-800/50 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-purple-400" />
              </div>
              <span className="text-xs text-purple-300 font-medium">ASSETS</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {dashboardService.formatNumber(stats.stats.total_assets)}
            </p>
            <p className="text-sm text-purple-300">
              Cataloged assets
            </p>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Scans */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-400" />
                Recent Scans
              </h3>
              <span className="text-sm text-gray-400">{stats.recent_scans.length} scans</span>
            </div>
            {stats.recent_scans.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_scans.map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{scan.name}</p>
                      <p className="text-gray-400 text-sm">
                        {dashboardService.formatRelativeTime(scan.created_at)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${dashboardService.getStatusColor(scan.status)}`}>
                      {scan.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No recent scans</p>
              </div>
            )}
          </div>

          {/* Recent Incidents - UPDATED WITH DEBUG LOGGING */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                Recent Incidents
              </h3>
              <span className="text-sm text-gray-400">{stats.recent_incidents.length} incidents</span>
            </div>
            {stats.recent_incidents.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_incidents.map((incident) => {
                  // 🔍 DEBUG: Log incident data
                  console.log('🔍 Incident data:', {
                    id: incident.id,
                    title: incident.title,
                    job_id: incident.job_id,
                    rule_id: incident.rule_id,
                    full_incident_object: incident,
                    full_path: `/violations/${incident.job_id || 'unknown'}/${incident.rule_id || incident.id}`
                  });
                  
                  return (
                    <Link
                      key={incident.id}
                      to={`/violations/${incident.job_id || 'unknown'}/${incident.rule_id || incident.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 hover:border-purple-500/30 transition-all cursor-pointer group border border-transparent">
                        <div className="flex-1">
                          <p className="text-white font-medium mb-1 group-hover:text-purple-400 transition-colors">
                            {incident.title}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {dashboardService.formatRelativeTime(incident.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${dashboardService.getSeverityColor(incident.severity)}`}>
                            {incident.severity}
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <p className="text-gray-400">No incidents - All clear! ✨</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => window.location.href = '/scans/new'}
            className="p-6 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl text-left hover:shadow-xl transition-all group"
          >
            <Activity className="w-8 h-8 text-white mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Run New Scan</h3>
            <p className="text-emerald-100 mb-3">Start a new data quality scan</p>
            <ArrowRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => window.location.href = '/policies'}
            className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl text-left hover:shadow-xl transition-all group"
          >
            <Shield className="w-8 h-8 text-white mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Manage Policies</h3>
            <p className="text-purple-100 mb-3">Configure data quality rules</p>
            <ArrowRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => window.location.href = '/developers'}
            className="p-6 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl text-left hover:shadow-xl transition-all group"
          >
            <Key className="w-8 h-8 text-white mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Developer Portal</h3>
            <p className="text-blue-100 mb-3">Manage API access keys</p>
            <ArrowRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
