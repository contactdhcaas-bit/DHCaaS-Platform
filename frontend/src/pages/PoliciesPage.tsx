// src/pages/PoliciesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Database,
  Loader2,
} from 'lucide-react';
import { policyService, Policy } from '../services/policyService';
import CreatePolicyModal from '../components/CreatePolicyModal';

type SeverityType = 'critical' | 'high' | 'medium' | 'warning' | 'info';

const PoliciesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleType, setSelectedRuleType] = useState<string>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await policyService.getPolicies();
      setPolicies(data);
    } catch (err: any) {
      console.error('Error fetching policies:', err);
      setError(err.response?.data?.detail || 'Failed to load policies');
      triggerToast('Failed to load policies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePolicyCreated = () => {
    triggerToast('Policy created successfully!', 'success');
    fetchPolicies();
  };

  const activePolicies = policies.filter((p) => p.enabled).length;
  const criticalRules = policies.filter((p) => p.severity === 'critical' && p.enabled).length;

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const togglePolicyStatus = async (policy: Policy) => {
    try {
      await policyService.updatePolicy(policy.id, { enabled: !policy.enabled });
      await fetchPolicies();
      triggerToast(`Policy ${!policy.enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err: any) {
      triggerToast('Failed to update policy', 'error');
    }
  };

  const deletePolicy = async (policy: Policy) => {
    if (!confirm(`Are you sure you want to delete "${policy.name}"?`)) return;

    try {
      await policyService.deletePolicy(policy.id);
      await fetchPolicies();
      triggerToast('Policy deleted successfully');
    } catch (err: any) {
      triggerToast('Failed to delete policy', 'error');
    }
  };

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRuleType = selectedRuleType === 'all' || policy.rule_type === selectedRuleType;
    return matchesSearch && matchesRuleType;
  });

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getSeverityBadgeColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: 'bg-red-900/30 text-red-400 border-red-700',
      high: 'bg-orange-900/30 text-orange-400 border-orange-700',
      medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
      low: 'bg-blue-900/30 text-blue-400 border-blue-700',
    };
    return colors[severity] || 'bg-gray-900/30 text-gray-400 border-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading policies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPolicies}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Data Governance Policies</h1>
            <p className="text-gray-400 mt-2">Define and manage quality rules</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Policy
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Policies</p>
                <p className="text-2xl font-bold">{policies.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-2xl font-bold">{activePolicies}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Critical Rules</p>
                <p className="text-2xl font-bold">{criticalRules}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedRuleType}
              onChange={(e) => setSelectedRuleType(e.target.value)}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Rule Types</option>
              <option value="quality_score">Quality Score</option>
              <option value="pii_rows">PII Detection</option>
              <option value="duplicates">Duplicates</option>
              <option value="missing_data">Missing Data</option>
            </select>
          </div>
        </div>

        {/* Policies Table */}
        {filteredPolicies.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Policies Found</h3>
            <p className="text-gray-500">Create your first policy to get started</p>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Policy Name</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Rule Type</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Threshold</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Severity</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-white">{policy.name}</p>
                          {policy.description && (
                            <p className="text-sm text-gray-400 mt-1">{policy.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                          {policy.rule_type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300">{policy.threshold}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-sm border ${getSeverityBadgeColor(policy.severity)}`}>
                          {policy.severity}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => togglePolicyStatus(policy)}
                          className={`relative w-14 h-8 rounded-full transition-all ${
                            policy.enabled ? 'bg-emerald-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                              policy.enabled ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => triggerToast(`Editing ${policy.name}...`)}
                            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                          <button
                            onClick={() => deletePolicy(policy)}
                            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Policy Modal */}
      <CreatePolicyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPolicyCreated={handlePolicyCreated}
      />
    </div>
  );
};

export default PoliciesPage;
