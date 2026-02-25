import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Database,
  Table as TableIcon,
} from 'lucide-react';
import { getRules, deleteRule, toggleRuleStatus, DQRule } from '../services/api';
import RuleCreationModal from '../components/RuleCreationModal';

const RulesPage: React.FC = () => {
  const [rules, setRules] = useState<DQRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRules();
      setRules(response.rules);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (rule: DQRule) => {
    setTogglingIds((prev) => new Set(prev).add(rule.id));
    try {
      await toggleRuleStatus(rule.id, !rule.enabled);
      await fetchRules();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to toggle rule status');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(rule.id);
        return next;
      });
    }
  };

  const handleDeleteRule = async (rule: DQRule) => {
    const confirmed = window.confirm(
      `Delete rule "${rule.rule_name}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteRule(rule.id);
      await fetchRules();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete rule');
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getRuleTypeLabel = (ruleType: string) => {
    const labels: Record<string, string> = {
      not_null: 'Not Null',
      regex_match: 'Regex Match',
      numeric_range: 'Numeric Range',
      string_length: 'String Length',
      allowed_values: 'Allowed Values',
    };
    return labels[ruleType] || ruleType;
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Data Quality Rules
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Define and manage validation rules for your data sources
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRules}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#131B2C] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-black/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Total Rules
            </p>
            <p className="text-3xl font-bold text-white">{rules.length}</p>
          </div>
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Enabled
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              {rules.filter((r) => r.enabled).length}
            </p>
          </div>
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Disabled
            </p>
            <p className="text-3xl font-bold text-slate-400">
              {rules.filter((r) => !r.enabled).length}
            </p>
          </div>
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Critical
            </p>
            <p className="text-3xl font-bold text-red-400">
              {rules.filter((r) => r.severity === 'critical').length}
            </p>
          </div>
        </div>

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

        {loading ? (
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-2xl p-20 flex flex-col items-center justify-center gap-4 shadow-lg shadow-black/20">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-[#131B2C] border border-dashed border-[#1E293B] rounded-2xl p-20 flex flex-col items-center justify-center gap-5 text-center shadow-lg shadow-black/20">
            <div className="w-20 h-20 bg-[#0F172A] border border-[#1E293B] rounded-2xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                No rules configured
              </h3>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Create your first data quality rule to start validating your data against business constraints.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-purple-500/30 mt-2"
            >
              <Plus className="w-4 h-4" />
              Create Your First Rule
            </button>
          </div>
        ) : (
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-2xl overflow-hidden shadow-lg shadow-black/20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0F172A] border-b border-[#1E293B]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Rule Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Last Run
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-[#1E293B]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{rule.rule_name}</p>
                          {rule.description && (
                            <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Database className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-300 font-medium">{rule.connector_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TableIcon className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-400 font-mono">
                              {rule.table_name}.{rule.column_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-md text-xs font-medium">
                          {getRuleTypeLabel(rule.rule_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 border rounded-md text-xs font-semibold uppercase ${getSeverityBadgeClass(rule.severity)}`}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          disabled={togglingIds.has(rule.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#131B2C] disabled:opacity-50 ${
                            rule.enabled ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">{formatDate(rule.last_executed_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rule Creation Modal */}
        <RuleCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchRules();
            setIsCreateModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default RulesPage;
