// src/pages/RulesPage.tsx
import React, { useState, useEffect } from 'react';
import ruleService, {
  DataQualityRuleCreate,
  DataQualityRuleResponse,
  Dataset,
  RuleType,
  Severity,
  RuleScope,
  ValidationReport,
} from '../services/ruleService';
import { 
  Play, Shield, AlertCircle, CheckCircle2, Trash2, Plus, 
  RefreshCw, Database, Sparkles, TrendingUp, XCircle, Activity,
  ChevronRight, Filter, Edit3
} from 'lucide-react';

type UploadStatus = 'idle' | 'success' | 'error';

const RulesPage: React.FC = () => {
  console.log('🔷 [RulesPage] Component Rendered');

  // ============================================================================
  // STATE
  // ============================================================================
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [rules, setRules] = useState<DataQualityRuleResponse[]>([]);
  const [selectedRule, setSelectedRule] = useState<DataQualityRuleResponse | null>(null);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingRules, setLoadingRules] = useState(false);
  const [creating, setCreating] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [datasetError, setDatasetError] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: UploadStatus } | null>(null);

  // Form state
  const [formData, setFormData] = useState<DataQualityRuleCreate>({
    rule_name: '',
    description: '',
    job_id: '',
    rule_type: 'NOT_NULL',
    scope: 'COLUMN',
    column_name: '',
    parameters: {},
    severity: 'MEDIUM',
    is_active: true,
    stop_on_failure: false,
    created_by: '',
    tags: [],
  });

  // ============================================================================
  // TOAST NOTIFICATIONS
  // ============================================================================
  const showToast = (message: string, type: UploadStatus) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================
  useEffect(() => {
    console.log('🔷 [RulesPage] COMPONENT MOUNTED');
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      console.log('🔷 [RulesPage] Dataset selection changed:', selectedDatasetId);
      loadRules(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================
  const loadDatasets = async () => {
    console.log('🔷 [RulesPage] Loading datasets...');
    setLoadingDatasets(true);
    setDatasetError('');

    try {
      const data = await ruleService.getDatasets();
      console.log('🔷 [RulesPage] Datasets Loaded:', data.length);

      if (data.length === 0) {
        setDatasetError('no_data');
        setDatasets([]);
      } else {
        setDatasets(data);
        setDatasetError('');

        if (!selectedDatasetId && data.length > 0) {
          const firstId = data[0].job_id;
          setSelectedDatasetId(firstId);
          console.log('🔷 [RulesPage] Auto-selected first dataset:', firstId);
        }
      }
    } catch (error: any) {
      console.error('🔷 [RulesPage] Failed to load datasets:', error);
      setDatasetError('error');
      setDatasets([]);
    } finally {
      setLoadingDatasets(false);
    }
  };

  const loadRules = async (jobId: string) => {
    console.log('🔷 [RulesPage] Loading rules for:', jobId);
    setLoadingRules(true);

    try {
      const data = await ruleService.getRules(jobId);
      console.log('🔷 [RulesPage] Rules loaded:', data.length);
      setRules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('🔷 [RulesPage] Failed to load rules:', error);
      setRules([]);
    } finally {
      setLoadingRules(false);
    }
  };

  // ============================================================================
  // ACTIONS
  // ============================================================================
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔷 [RulesPage] Creating rule...');

    if (!selectedDatasetId) {
      showToast('Please select a dataset first', 'error');
      return;
    }

    setCreating(true);

    try {
      const ruleData: DataQualityRuleCreate = {
        ...formData,
        job_id: selectedDatasetId,
      };

      const createdRule = await ruleService.createRule(ruleData);
      console.log('🔷 [RulesPage] Rule created:', createdRule.rule_id);
      
      showToast(`Rule "${createdRule.rule_name}" created successfully!`, 'success');
      await loadRules(selectedDatasetId);

      // Reset form
      setFormData({
        rule_name: '',
        description: '',
        job_id: '',
        rule_type: 'NOT_NULL',
        scope: 'COLUMN',
        column_name: '',
        parameters: {},
        severity: 'MEDIUM',
        is_active: true,
        stop_on_failure: false,
        created_by: '',
        tags: [],
      });
    } catch (error: any) {
      console.error('🔷 [RulesPage] Failed to create rule:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to create rule';
      showToast(errorMsg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    console.log('🔷 [RulesPage] Deleting rule:', ruleId);

    try {
      await ruleService.deleteRule(ruleId);
      console.log('🔷 [RulesPage] Rule deleted');
      showToast('Rule deleted successfully', 'success');
      await loadRules(selectedDatasetId);
      if (selectedRule?.rule_id === ruleId) {
        setSelectedRule(null);
      }
    } catch (error) {
      console.error('🔷 [RulesPage] Failed to delete rule:', error);
      showToast('Failed to delete rule', 'error');
    }
  };

  const handleRunValidation = async () => {
    console.log('🔷 [RulesPage] Running validation...');

    if (!selectedDatasetId) {
      showToast('Please select a dataset', 'error');
      return;
    }

    if (rules.length === 0) {
      showToast('No rules to validate. Create at least one rule first.', 'error');
      return;
    }

    setValidating(true);

    try {
      const report = await ruleService.runValidation(selectedDatasetId);
      console.log('🔷 [RulesPage] Validation complete:', report);
      setValidationReport(report);
      showToast(`Validation complete! Quality Score: ${report.quality_score}%`, 'success');
    } catch (error: any) {
      console.error('🔷 [RulesPage] Validation failed:', error);
      showToast(error.message || 'Validation failed', 'error');
    } finally {
      setValidating(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================
  const selectedDataset = datasets.find((d) => d.job_id === selectedDatasetId);
  const columns = selectedDataset?.column_names || [];
  const activeRules = rules.filter(r => r.is_active);
  const healthScore = selectedDataset ? Math.floor(85 + Math.random() * 10) : 0; // Mock score

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'from-red-600 to-red-500';
      case 'HIGH': return 'from-orange-600 to-orange-500';
      case 'MEDIUM': return 'from-yellow-600 to-yellow-500';
      case 'LOW': return 'from-blue-600 to-blue-500';
      default: return 'from-gray-600 to-gray-500';
    }
  };

  const getSeverityGlow = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'shadow-red-500/50';
      case 'HIGH': return 'shadow-orange-500/50';
      case 'MEDIUM': return 'shadow-yellow-500/50';
      case 'LOW': return 'shadow-blue-500/50';
      default: return 'shadow-gray-500/50';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 animate-slide-in-right`}>
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-xl ${
            toast.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-purple-400" />
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              Data Quality Studio
            </h1>
          </div>
          <p className="text-lg text-slate-400">
            Define, manage, and execute data quality rules with enterprise-grade precision
          </p>
        </div>

        {/* Dataset Selector Card */}
        <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-2xl pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-lg font-semibold text-white">
                <Database className="w-5 h-5 text-purple-400" />
                Select Dataset
              </label>
              <button
                onClick={loadDatasets}
                disabled={loadingDatasets}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingDatasets ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingDatasets ? (
              <div className="flex items-center justify-center gap-3 text-slate-400 py-8">
                <Activity className="w-6 h-6 animate-pulse" />
                <span>Loading datasets...</span>
              </div>
            ) : datasetError === 'no_data' ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-300 mb-2">No Datasets Available</h3>
                    <p className="text-sm text-yellow-200/80 mb-4">
                      Upload and scan a file to start creating data quality rules.
                    </p>
                    <a
                      href="/upload"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Upload Data
                    </a>
                  </div>
                </div>
              </div>
            ) : datasets.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No datasets found</p>
              </div>
            ) : (
              <>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                >
                  {datasets.map((dataset) => (
                    <option key={dataset.job_id} value={dataset.job_id} className="bg-slate-800">
                      {dataset.datasource_name || dataset.job_id}
                    </option>
                  ))}
                </select>

                {selectedDataset && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 backdrop-blur-sm rounded-lg p-4 border border-purple-400/20">
                      <p className="text-sm text-slate-400 mb-1">Health Score</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        <p className="text-2xl font-bold text-white">{healthScore}%</p>
                      </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <p className="text-sm text-slate-400 mb-1">Columns</p>
                      <p className="text-2xl font-bold text-white">{columns.length}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      <p className="text-sm text-slate-400 mb-1">Active Rules</p>
                      <p className="text-2xl font-bold text-white">{activeRules.length}</p>
                    </div>
                  </div>
                )}

                {/* Hero Validation Button */}
                <button
                  onClick={handleRunValidation}
                  disabled={validating || rules.length === 0 || !selectedDatasetId}
                  className="group relative w-full mt-6 flex items-center justify-center gap-3 px-8 py-5 text-xl font-bold text-white transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl opacity-100 group-hover:opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl blur-xl opacity-50 group-hover:opacity-75" />
                  
                  <div className="relative flex items-center gap-3">
                    {validating ? (
                      <>
                        <Activity className="w-7 h-7 animate-pulse" />
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-7 h-7" />
                        <span>Run Validation ({rules.length} {rules.length === 1 ? 'Rule' : 'Rules'})</span>
                      </>
                    )}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Split View */}
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT: Rules List (30%) */}
          <div className="col-span-1 relative bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Filter className="w-6 h-6 text-purple-400" />
                Active Rules
              </h2>
              <span className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm font-semibold border border-purple-400/30">
                {rules.length}
              </span>
            </div>

            {loadingRules ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity className="w-10 h-10 text-purple-400 animate-pulse mb-4" />
                <p className="text-slate-400">Loading rules...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No rules defined yet</p>
                <p className="text-sm text-slate-500">Create your first rule →</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {rules.map((rule) => (
                  <div
                    key={rule.rule_id}
                    onClick={() => setSelectedRule(rule)}
                    className={`group relative cursor-pointer rounded-xl p-4 border transition-all ${
                      selectedRule?.rule_id === rule.rule_id
                        ? 'bg-purple-600/20 border-purple-400/50 shadow-lg'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white flex-1">{rule.rule_name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRule(rule.rule_id);
                        }}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                      {rule.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-r ${getSeverityColor(rule.severity)} text-white shadow-lg ${getSeverityGlow(rule.severity)}`}>
                        {rule.severity}
                      </span>
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-md text-xs border border-blue-400/30">
                        {rule.rule_type}
                      </span>
                      {rule.is_active && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                    </div>

                    {selectedRule?.rule_id === rule.rule_id && (
                      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Configuration Studio (70%) */}
          <div className="col-span-2 relative bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 rounded-2xl pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <Edit3 className="w-7 h-7 text-purple-400" />
                <h2 className="text-3xl font-bold text-white">
                  {selectedRule ? 'Edit Rule' : 'Create New Rule'}
                </h2>
              </div>

              <form onSubmit={handleCreateRule} className="space-y-6">
                {/* Rule Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Rule Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    required
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="e.g., Email Format Validation"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder="Describe what this rule checks..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Rule Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Rule Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.rule_type}
                      onChange={(e) => setFormData({ ...formData, rule_type: e.target.value as RuleType })}
                      required
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    >
                      <option value="NOT_NULL" className="bg-slate-800">NOT_NULL</option>
                      <option value="UNIQUE" className="bg-slate-800">UNIQUE</option>
                      <option value="EMAIL" className="bg-slate-800">EMAIL</option>
                      <option value="PHONE" className="bg-slate-800">PHONE</option>
                      <option value="REGEX" className="bg-slate-800">REGEX</option>
                      <option value="RANGE" className="bg-slate-800">RANGE</option>
                      <option value="ENUM" className="bg-slate-800">ENUM</option>
                      <option value="DATE_FORMAT" className="bg-slate-800">DATE_FORMAT</option>
                      <option value="LENGTH" className="bg-slate-800">LENGTH</option>
                      <option value="MIN_VALUE" className="bg-slate-800">MIN_VALUE</option>
                      <option value="MAX_VALUE" className="bg-slate-800">MAX_VALUE</option>
                      <option value="CUSTOM_SQL" className="bg-slate-800">CUSTOM_SQL</option>
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as Severity })}
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    >
                      <option value="LOW" className="bg-slate-800">LOW</option>
                      <option value="MEDIUM" className="bg-slate-800">MEDIUM</option>
                      <option value="HIGH" className="bg-slate-800">HIGH</option>
                      <option value="CRITICAL" className="bg-slate-800">CRITICAL</option>
                    </select>
                  </div>

                  {/* Scope */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Scope</label>
                    <select
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value as RuleScope })}
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    >
                      <option value="COLUMN" className="bg-slate-800">COLUMN</option>
                      <option value="ROW" className="bg-slate-800">ROW</option>
                      <option value="DATASET" className="bg-slate-800">DATASET</option>
                    </select>
                  </div>

                  {/* Column Name */}
                  {formData.scope === 'COLUMN' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Column <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.column_name || ''}
                        onChange={(e) => setFormData({ ...formData, column_name: e.target.value })}
                        required
                        className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                      >
                        <option value="" className="bg-slate-800">Select column</option>
                        {columns.map((col) => (
                          <option key={col} value={col} className="bg-slate-800">{col}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Parameters */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Parameters (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(formData.parameters, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, parameters: parsed });
                      } catch (err) {
                        // Invalid JSON
                      }
                    }}
                    rows={4}
                    className="w-full bg-slate-900/50 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-green-400 font-mono text-sm placeholder-slate-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                    placeholder='{"pattern": "^[A-Za-z]+$"}'
                  />
                  <p className="text-xs text-slate-500 mt-1">Enter valid JSON configuration</p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-purple-400"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-300 flex-1">
                    <span className="font-semibold">Active</span> - Rule will be executed during validation
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={creating || !selectedDatasetId}
                  className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-white transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl opacity-100 group-hover:opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75" />
                  
                  <div className="relative flex items-center gap-3">
                    {creating ? (
                      <>
                        <Activity className="w-6 h-6 animate-spin" />
                        <span>Creating Rule...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-6 h-6" />
                        <span>Create Rule</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Validation Report */}
        {validationReport && (
          <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-7 h-7 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Validation Report</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
                <p className="text-sm text-slate-400 mb-2">Quality Score</p>
                <p className="text-4xl font-black text-green-400">{validationReport.quality_score}%</p>
              </div>
              <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
                <p className="text-sm text-slate-400 mb-2">Rules Executed</p>
                <p className="text-4xl font-black text-blue-400">{validationReport.total_rules_executed}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
                <p className="text-sm text-slate-400 mb-2">Passed</p>
                <p className="text-4xl font-black text-purple-400">{validationReport.total_rules_passed}</p>
              </div>
              <div className="bg-gradient-to-r from-red-600/20 to-red-500/20 backdrop-blur-sm rounded-xl p-6 border border-red-400/30">
                <p className="text-sm text-slate-400 mb-2">Violations</p>
                <p className="text-4xl font-black text-red-400">{validationReport.total_violations}</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p className="text-slate-400">
                  <span className="font-semibold text-white">Status:</span> {validationReport.overall_status}
                </p>
                <p className="text-slate-400">
                  <span className="font-semibold text-white">Dataset:</span> {validationReport.dataset_name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.7);
        }
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RulesPage;
