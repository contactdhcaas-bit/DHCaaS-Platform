// src/pages/GovernancePage.tsx
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react';

// ===== TYPES =====
interface Policy {
  id: string;
  name: string;
  description?: string;
  rule_type: string;
  threshold: number;
  enabled: boolean;
  severity: string;
  status: string;
  tags: string[];
  target_tables: string[];
  created_at: string;
  updated_at: string;
  violation_count: number;
  last_violation?: string;
}

interface Violation {
  id: string;
  policy_id: string;
  policy_name: string;
  scan_id: string;
  table_name?: string;
  message: string;
  severity: string;
  rule_type: string;
  threshold: number;
  actual_value: number;
  violation_percentage: number;
  detected_at: string;
  resolved: boolean;
}

interface CreatePolicyData {
  name: string;
  description: string;
  rule_type: string;
  threshold: number;
  severity: string;
  enabled: boolean;
  tags: string[];
  target_tables: string[];
}

const RULE_TYPES = [
  { value: 'min_quality_score', label: 'Minimum Quality Score', icon: '📊' },
  { value: 'max_pii_rows', label: 'Maximum PII Rows', icon: '🔒' },
  { value: 'forbidden_columns', label: 'Forbidden Columns', icon: '🚫' },
  { value: 'max_duplicates', label: 'Maximum Duplicates', icon: '🔄' },
  { value: 'max_missing_percentage', label: 'Maximum Missing Data', icon: '❓' },
  { value: 'require_encryption', label: 'Require Encryption', icon: '🔐' },
];

const SEVERITIES = [
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'warning', label: 'Warning', color: 'bg-blue-500' },
  { value: 'info', label: 'Info', color: 'bg-gray-500' },
];

const GovernancePage: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    activePolicies: 0,
    criticalViolations: 0,
    complianceRate: 100,
  });

  // Create Policy Form State
  const [newPolicy, setNewPolicy] = useState<CreatePolicyData>({
    name: '',
    description: '',
    rule_type: 'min_quality_score',
    threshold: 85,
    severity: 'medium',
    enabled: true,
    tags: [],
    target_tables: [],
  });

  // ===== FETCH DATA =====
  useEffect(() => {
    fetchPolicies();
    fetchViolations();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/governance/policies');
      const data = await response.json();
      setPolicies(data);

      // Calculate stats
      const active = data.filter((p: Policy) => p.enabled).length;
      setStats((prev) => ({ ...prev, activePolicies: active }));
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViolations = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/governance/violations?resolved=false');
      const data = await response.json();
      setViolations(data);

      // Calculate critical violations
      const critical = data.filter((v: Violation) => v.severity === 'critical').length;
      setStats((prev) => ({ ...prev, criticalViolations: critical }));

      // Calculate compliance rate (mock - in real app, based on scan history)
      const complianceRate = data.length === 0 ? 100 : Math.max(0, 100 - data.length * 5);
      setStats((prev) => ({ ...prev, complianceRate }));
    } catch (error) {
      console.error('Error fetching violations:', error);
    }
  };

  // ===== CREATE POLICY =====
  const handleCreatePolicy = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/governance/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPolicy),
      });

      if (response.ok) {
        await fetchPolicies();
        setShowCreateModal(false);
        // Reset form
        setNewPolicy({
          name: '',
          description: '',
          rule_type: 'min_quality_score',
          threshold: 85,
          severity: 'medium',
          enabled: true,
          tags: [],
          target_tables: [],
        });
      }
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  // ===== TOGGLE POLICY STATUS =====
  const togglePolicyStatus = async (policyId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/governance/policies/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus }),
      });

      if (response.ok) {
        await fetchPolicies();
      }
    } catch (error) {
      console.error('Error updating policy:', error);
    }
  };

  // ===== DELETE POLICY =====
  const deletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/governance/policies/${policyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPolicies();
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  // ===== SEVERITY BADGE =====
  const getSeverityBadge = (severity: string) => {
    const config = SEVERITIES.find((s) => s.value === severity) || SEVERITIES[2];
    return (
      <span className={`px-2 py-1 ${config.color} text-white text-xs font-bold rounded uppercase`}>
        {config.label}
      </span>
    );
  };

  // ===== RULE TYPE DISPLAY =====
  const getRuleTypeDisplay = (ruleType: string) => {
    const rule = RULE_TYPES.find((r) => r.value === ruleType);
    return rule ? `${rule.icon} ${rule.label}` : ruleType;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Data Governance Console
            </h1>
            <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">
              NEW
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Policy
          </button>
        </div>

        {/* ===== STATS OVERVIEW ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Active Policies */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                Active Policies
              </div>
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stats.activePolicies}
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-500">
              Out of {policies.length} total policies
            </div>
          </div>

          {/* Critical Violations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                Critical Violations
              </div>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {stats.criticalViolations}
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-500">
              {violations.length} total unresolved
            </div>
          </div>

          {/* Compliance Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                Compliance Rate
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats.complianceRate}%
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-500">
              Last 30 days average
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== POLICY MANAGEMENT TABLE ===== */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Active Policies
                </h2>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : policies.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-gray-400">
                    No policies found. Create your first policy to get started.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          Policy Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          Rule Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          Threshold
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          Severity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          Violations
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                      {policies.map((policy) => (
                        <tr key={policy.id} className="hover:bg-slate-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {policy.name}
                            </div>
                            {policy.description && (
                              <div className="text-xs text-slate-500 dark:text-gray-400">
                                {policy.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-gray-300">
                            {getRuleTypeDisplay(policy.rule_type)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {policy.threshold}
                            {policy.rule_type.includes('percentage') ? '%' : ''}
                          </td>
                          <td className="px-6 py-4">{getSeverityBadge(policy.severity)}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => togglePolicyStatus(policy.id, policy.enabled)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                policy.enabled ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  policy.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-sm font-semibold ${
                                policy.violation_count > 0 ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {policy.violation_count}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => deletePolicy(policy.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Policy"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* ===== RECENT VIOLATIONS SIDEBAR ===== */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recent Violations
                </h2>
              </div>
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {violations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      No active violations
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-500">
                      All policies are being met
                    </p>
                  </div>
                ) : (
                  violations.map((violation) => (
                    <div
                      key={violation.id}
                      className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg border-l-4 border-red-500"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {violation.policy_name}
                        </div>
                        {getSeverityBadge(violation.severity)}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-gray-400 mb-2">
                        {violation.message}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-gray-500">
                          Table: {violation.table_name || 'Unknown'}
                        </span>
                        <span className="text-slate-500 dark:text-gray-500">
                          {new Date(violation.detected_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== CREATE POLICY MODAL ===== */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Create New Policy
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-4">
                {/* Policy Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Policy Name *
                  </label>
                  <input
                    type="text"
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., High Quality Standard for Production"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newPolicy.description}
                    onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Optional description of the policy purpose..."
                  />
                </div>

                {/* Rule Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Rule Type *
                  </label>
                  <select
                    value={newPolicy.rule_type}
                    onChange={(e) => setNewPolicy({ ...newPolicy, rule_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {RULE_TYPES.map((rule) => (
                      <option key={rule.value} value={rule.value}>
                        {rule.icon} {rule.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Threshold */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Threshold Value *
                  </label>
                  <input
                    type="number"
                    value={newPolicy.threshold}
                    onChange={(e) =>
                      setNewPolicy({ ...newPolicy, threshold: parseFloat(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 85"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Severity Level *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {SEVERITIES.map((severity) => (
                      <button
                        key={severity.value}
                        onClick={() => setNewPolicy({ ...newPolicy, severity: severity.value })}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          newPolicy.severity === severity.value
                            ? `${severity.color} text-white shadow-lg`
                            : 'bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300'
                        }`}
                      >
                        {severity.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enabled Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                    Enable Policy Immediately
                  </label>
                  <button
                    onClick={() => setNewPolicy({ ...newPolicy, enabled: !newPolicy.enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      newPolicy.enabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        newPolicy.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-gray-700">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePolicy}
                  disabled={!newPolicy.name || !newPolicy.threshold}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-lg font-semibold transition-all shadow-lg disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Create Policy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernancePage;
