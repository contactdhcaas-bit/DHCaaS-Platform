// src/pages/ConnectorsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  getConnectors,
  testConnector,
  deleteConnector,
  Connector,
  TestConnectionResponse,
} from '../services/api';
import AddConnectorModal from '../components/AddConnectorModal';

const ConnectorsPage: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    connectorId: string;
    result: TestConnectionResponse;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchConnectors();
  }, []);

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getConnectors();
      setConnectors(response.connectors);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch connectors');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (connector: Connector) => {
    setTestingIds((prev) => new Set(prev).add(connector.id));
    setTestResult(null);
    try {
      const result = await testConnector(connector.id);
      setTestResult({ connectorId: connector.id, result });
      await fetchConnectors();
      setTimeout(() => {
        setTestResult((prev) =>
          prev?.connectorId === connector.id ? null : prev
        );
      }, 6000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Test failed');
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev);
        next.delete(connector.id);
        return next;
      });
    }
  };

  const handleDelete = async (connector: Connector) => {
    const confirmed = window.confirm(
      `Delete connector "${connector.name}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await deleteConnector(connector.id);
      await fetchConnectors();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Delete failed');
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'postgres' ? 'PostgreSQL' : 'MySQL';
  };

  const getTypeAccent = (type: string) => {
    return type === 'postgres'
      ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
      : 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F172A] text-slate-400 text-xs font-medium border border-[#1E293B]">
          <Clock className="w-3 h-3" />
          Not Tested
        </span>
      );
    }
    if (status === 'success') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
          <CheckCircle className="w-3 h-3" />
          Connected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/30">
        <XCircle className="w-3 h-3" />
        Failed
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Cloud Connectors
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage and test your database connections
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchConnectors}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#131B2C] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-black/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              Add Connector
            </button>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Total Connectors
            </p>
            <p className="text-3xl font-bold text-white">{connectors.length}</p>
          </div>
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Connected
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              {connectors.filter((c) => c.last_test_status === 'success').length}
            </p>
          </div>
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Failed
            </p>
            <p className="text-3xl font-bold text-red-400">
              {connectors.filter((c) => c.last_test_status === 'error').length}
            </p>
          </div>
        </div>

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-red-500/10">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-sm font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── TEST RESULT TOAST ── */}
        {testResult && (
          <div
            className={`border rounded-xl p-4 flex items-start gap-3 shadow-lg ${
              testResult.result.status === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10'
                : 'bg-red-500/10 border-red-500/30 shadow-red-500/10'
            }`}
          >
            {testResult.result.status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  testResult.result.status === 'success'
                    ? 'text-emerald-300'
                    : 'text-red-300'
                }`}
              >
                {testResult.result.status === 'success'
                  ? 'Connection Successful'
                  : 'Connection Failed'}
              </p>
              <p className="text-slate-400 text-xs mt-1 truncate">
                {testResult.result.message}
              </p>
              <p className="text-slate-500 text-xs mt-1.5">
                Latency: {testResult.result.latency_ms}ms
                {testResult.result.details?.hint && (
                  <span className="ml-2">· {testResult.result.details.hint}</span>
                )}
              </p>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── LOADING STATE ── */}
        {loading ? (
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-2xl p-20 flex flex-col items-center justify-center gap-4 shadow-lg shadow-black/20">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading connectors...</p>
          </div>
        ) : connectors.length === 0 ? (

          /* ── EMPTY STATE ── */
          <div className="bg-[#131B2C] border border-dashed border-[#1E293B] rounded-2xl p-20 flex flex-col items-center justify-center gap-5 text-center shadow-lg shadow-black/20">
            <div className="w-20 h-20 bg-[#0F172A] border border-[#1E293B] rounded-2xl flex items-center justify-center">
              <Database className="w-10 h-10 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                No connectors configured
              </h3>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Add your first database connector to start running data quality checks against your production systems.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/30 mt-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Connector
            </button>
          </div>
        ) : (

          /* ── CONNECTORS GRID ── */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {connectors.map((connector) => (
              <div
                key={connector.id}
                className="bg-[#131B2C] border border-[#1E293B] hover:border-indigo-500/30 rounded-2xl p-6 transition-all shadow-lg shadow-black/20 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#0F172A] border border-[#1E293B] rounded-xl flex items-center justify-center">
                      <Database className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight mb-1.5">
                        {connector.name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getTypeAccent(
                          connector.type
                        )}`}
                      >
                        {getTypeLabel(connector.type)}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(connector.last_test_status)}
                </div>

                {/* Connection Info */}
                <div className="space-y-0 mb-5">
                  <div className="flex items-center justify-between py-3 border-t border-[#1E293B]">
                    <span className="text-slate-400 text-xs font-medium">Host</span>
                    <span className="text-white text-xs font-mono font-semibold">
                      {connector.config.host}:{connector.config.port}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-[#1E293B]">
                    <span className="text-slate-400 text-xs font-medium">Database</span>
                    <span className="text-white text-xs font-mono font-semibold">
                      {connector.config.database}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-[#1E293B]">
                    <span className="text-slate-400 text-xs font-medium">Last Tested</span>
                    <span className="text-slate-400 text-xs font-medium">
                      {formatDate(connector.last_tested_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => handleTestConnection(connector)}
                    disabled={testingIds.has(connector.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {testingIds.has(connector.id) ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Test Connection
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(connector)}
                    className="px-4 py-2.5 bg-[#0F172A] hover:bg-red-500/10 border border-[#1E293B] hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Connector Modal */}
      <AddConnectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchConnectors}
      />
    </div>
  );
};

export default ConnectorsPage;
