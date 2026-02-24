// src/pages/IncidentsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Clock,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Search,
  Filter,
  Plus,
  FileText,
  ExternalLink,
  User,
  Zap,
  Database,
  GitBranch,
  Lock,
  Activity,
  Loader,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  fetchIncidents,
  acknowledgeIncident as acknowledgeIncidentAPI,
  resolveIncident as resolveIncidentAPI,
  Incident,
  IncidentStatus,
  IncidentSeverity,
  IncidentServiceError,
  formatTimestamp,
} from '../services/incidentService';

const IncidentsPage: React.FC = () => {
  // ===== STATE MANAGEMENT =====
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentSeverity | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ===== CONNECT TO GLOBAL STORE =====
  const { stats, resolveIncident: resolveIncidentInStore } = useAppStore();

  // ===== FETCH INCIDENTS FROM API =====
  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchIncidents({
        page: currentPage,
        page_size: 20,
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedSeverity !== 'all' && { severity: selectedSeverity }),
      });

      setIncidents(response.incidents);
      setTotalPages(response.total_pages);
      setTotalIncidents(response.total);
    } catch (err) {
      const error = err as IncidentServiceError;
      setError(error.message);
      triggerToast(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ===== LOAD ON MOUNT AND FILTER CHANGES =====
  useEffect(() => {
    loadIncidents();
  }, [currentPage, selectedStatus, selectedSeverity]);

  // ===== CALCULATE STATS =====
  const openIncidents = incidents.filter((i) => i.status === 'open').length;
  const acknowledgedIncidents = incidents.filter((i) => i.status === 'acknowledged').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;
  const mttr = 4.2; // Mock - could be calculated from real data

  // ===== CLIENT-SIDE SEARCH FILTER =====
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // ===== TOAST NOTIFICATION =====
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ===== ACKNOWLEDGE INCIDENT (REAL API) =====
  const handleAcknowledgeIncident = async (id: string) => {
    try {
      setActionLoading(id);
      
      const response = await acknowledgeIncidentAPI(id, {
        acknowledged_by: 'admin@dhcaas.com', // Replace with actual logged-in user email
      });

      // Update local state
      setIncidents(
        incidents.map((incident) =>
          incident.id === id ? response.incident : incident
        )
      );

      triggerToast(`✅ Incident ${id} acknowledged successfully!`);
    } catch (err) {
      const error = err as IncidentServiceError;
      triggerToast(`❌ ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ===== RESOLVE INCIDENT (REAL API) =====
  const handleResolveIncident = async (id: string) => {
    const resolutionNotes = prompt('Enter resolution notes (minimum 10 characters):');
    
    if (!resolutionNotes || resolutionNotes.length < 10) {
      triggerToast('❌ Resolution notes must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(id);

      const response = await resolveIncidentAPI(id, {
        resolved_by: 'admin@dhcaas.com', // Replace with actual logged-in user email
        resolution_notes: resolutionNotes,
      });

      // Update local state
      setIncidents(
        incidents.map((incident) =>
          incident.id === id ? response.incident : incident
        )
      );

      // Update global store
      resolveIncidentInStore();

      triggerToast(`✅ Incident ${id} resolved! Dashboard updated.`);
    } catch (err) {
      const error = err as IncidentServiceError;
      triggerToast(`❌ ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ===== GET SEVERITY BADGE =====
  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-900/30 text-red-400 text-xs font-bold rounded-full border border-red-800">
            <AlertOctagon className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-orange-900/30 text-orange-400 text-xs font-bold rounded-full border border-orange-800">
            <AlertTriangle className="w-3 h-3" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-900/30 text-yellow-400 text-xs font-bold rounded-full border border-yellow-800">
            <AlertTriangle className="w-3 h-3" />
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full border border-blue-800">
            <Activity className="w-3 h-3" />
            LOW
          </span>
        );
    }
  };

  // ===== GET STATUS BADGE =====
  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-3 py-1 bg-red-900/30 text-red-400 text-xs font-bold rounded-full border border-red-800">
            OPEN
          </span>
        );
      case 'acknowledged':
        return (
          <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 text-xs font-bold rounded-full border border-yellow-800">
            ACKNOWLEDGED
          </span>
        );
      case 'resolved':
        return (
          <span className="px-3 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-bold rounded-full border border-emerald-800">
            RESOLVED
          </span>
        );
    }
  };

  // ===== GET CATEGORY ICON =====
  const getCategoryIcon = (source: string) => {
    // Map source to icon
    if (source.includes('lineage')) return <GitBranch className="w-4 h-4 text-gray-500" />;
    if (source.includes('scan')) return <Zap className="w-4 h-4 text-gray-500" />;
    if (source.includes('policy')) return <Lock className="w-4 h-4 text-gray-500" />;
    if (source.includes('quality')) return <CheckCircle className="w-4 h-4 text-gray-500" />;
    if (source.includes('schema')) return <GitBranch className="w-4 h-4 text-gray-500" />;
    return <Database className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertOctagon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Incident Command Center</h1>
              <p className="text-lg text-gray-400 mt-1">Monitor and resolve data quality issues</p>
            </div>
          </div>
          <button
            onClick={() => triggerToast('Opening incident reporter... 📝')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Report Incident
          </button>
        </div>

        {/* ===== KANBAN STATS (4 CARDS) ===== */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/40 border border-red-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                <AlertOctagon className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-sm text-red-300 font-medium">Open</p>
            </div>
            <p className="text-4xl font-bold text-white">{openIncidents}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 border border-yellow-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-yellow-400" />
              </div>
              <p className="text-sm text-yellow-300 font-medium">Acknowledged</p>
            </div>
            <p className="text-4xl font-bold text-white">{acknowledgedIncidents}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border border-emerald-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-300 font-medium">Resolved</p>
            </div>
            <p className="text-4xl font-bold text-white">{resolvedCount}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-sm text-blue-300 font-medium">MTTR</p>
            </div>
            <p className="text-4xl font-bold text-white">{mttr}h</p>
          </div>
        </div>

        {/* ===== SEARCH & FILTER BAR ===== */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search incidents by ID, title, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 outline-none focus:border-purple-600 transition-colors"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as IncidentStatus | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-purple-600 transition-colors cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value as IncidentSeverity | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-purple-600 transition-colors cursor-pointer"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* ===== LOADING STATE ===== */}
        {loading && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-16 text-center">
            <Loader className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading incidents...</p>
          </div>
        )}

        {/* ===== ERROR STATE ===== */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-800 rounded-2xl p-8 text-center">
            <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Incidents</h3>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadIncidents}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ===== INCIDENTS TABLE ===== */}
        {!loading && !error && (
          <>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                      Incident ID
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                      Severity
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                      Description
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                      Assignee
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                      Created
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(incident.source)}
                          <div>
                            <p className="text-sm font-bold text-white">{incident.id}</p>
                            <p className="text-xs text-gray-500">{incident.source}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">{getSeverityBadge(incident.severity)}</td>
                      <td className="py-4 px-6">
                        <div className="max-w-xs">
                          <p className="text-sm font-semibold text-white mb-1">{incident.title}</p>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {incident.description}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {incident.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {incident.assignee
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </span>
                            </div>
                            <span className="text-sm text-white">{incident.assignee}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(incident.status)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {formatTimestamp(incident.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {!incident.acknowledged && incident.status === 'open' && (
                            <button
                              onClick={() => handleAcknowledgeIncident(incident.id)}
                              disabled={actionLoading === incident.id}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Acknowledge Incident"
                            >
                              {actionLoading === incident.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              Acknowledge
                            </button>
                          )}
                          {incident.status !== 'resolved' && (
                            <button
                              onClick={() => handleResolveIncident(incident.id)}
                              disabled={actionLoading === incident.id}
                              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Resolve Incident"
                            >
                              {actionLoading === incident.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Resolve
                            </button>
                          )}
                          <button
                            onClick={() => triggerToast('Opening Root Cause Analysis... 🔍')}
                            className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                            title="View Root Cause Analysis"
                          >
                            <ExternalLink className="w-3 h-3" />
                            RCA
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredIncidents.length === 0 && (
                <div className="text-center py-16">
                  <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400 mb-2">No incidents found</h3>
                  <p className="text-sm text-gray-500">
                    All clear! No active incidents matching your filters.
                  </p>
                </div>
              )}
            </div>

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-400">
                  Showing {filteredIncidents.length} of {totalIncidents} incidents
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
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

export default IncidentsPage;
