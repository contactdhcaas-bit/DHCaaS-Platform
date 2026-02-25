// src/components/RuleCreationModal.tsx
// Dynamic Rule Creation Modal for Data Quality Rules
// Supports all 5 rule types with context-aware config fields

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle,
  Database,
  Table as TableIcon,
  Settings,
} from 'lucide-react';
import { createRule, getConnectors, Connector, DQRuleCreate } from '../services/api';

interface RuleCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialConnectorId?: string;
  initialTableName?: string;
  initialColumnName?: string;
}

const RuleCreationModal: React.FC<RuleCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialConnectorId,
  initialTableName,
  initialColumnName,
}) => {
  // ===== STATE =====
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConnectors, setLoadingConnectors] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [connectorId, setConnectorId] = useState(initialConnectorId || '');
  const [tableName, setTableName] = useState(initialTableName || '');
  const [columnName, setColumnName] = useState(initialColumnName || '');
  const [ruleType, setRuleType] = useState<'not_null' | 'regex_match' | 'numeric_range' | 'string_length' | 'allowed_values'>('not_null');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');

  // Dynamic config fields
  const [pattern, setPattern] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [minValue, setMinValue] = useState<number | ''>('');
  const [maxValue, setMaxValue] = useState<number | ''>('');
  const [minLength, setMinLength] = useState<number | ''>('');
  const [maxLength, setMaxLength] = useState<number | ''>('');
  const [allowedValues, setAllowedValues] = useState('');

  // ===== EFFECTS =====
  useEffect(() => {
    if (isOpen) {
      fetchConnectors();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialConnectorId) setConnectorId(initialConnectorId);
    if (initialTableName) setTableName(initialTableName);
    if (initialColumnName) setColumnName(initialColumnName);
  }, [initialConnectorId, initialTableName, initialColumnName]);

  // ===== FETCH CONNECTORS =====
  const fetchConnectors = async () => {
    try {
      setLoadingConnectors(true);
      const response = await getConnectors();
      setConnectors(response.connectors);
    } catch (err: any) {
      setError('Failed to load connectors');
    } finally {
      setLoadingConnectors(false);
    }
  };

  // ===== RESET FORM =====
  const resetForm = () => {
    setRuleName('');
    setDescription('');
    setConnectorId(initialConnectorId || '');
    setTableName(initialTableName || '');
    setColumnName(initialColumnName || '');
    setRuleType('not_null');
    setSeverity('medium');
    setPattern('');
    setCaseSensitive(false);
    setMinValue('');
    setMaxValue('');
    setMinLength('');
    setMaxLength('');
    setAllowedValues('');
    setError(null);
    setSuccess(false);
  };

  // ===== BUILD RULE CONFIG =====
  const buildRuleConfig = () => {
    const config: any = {};

    switch (ruleType) {
      case 'not_null':
        // No config needed
        break;
      case 'regex_match':
        config.pattern = pattern;
        config.case_sensitive = caseSensitive;
        break;
      case 'numeric_range':
        if (minValue !== '') config.min_value = Number(minValue);
        if (maxValue !== '') config.max_value = Number(maxValue);
        config.inclusive = true;
        break;
      case 'string_length':
        if (minLength !== '') config.min_length = Number(minLength);
        if (maxLength !== '') config.max_length = Number(maxLength);
        break;
      case 'allowed_values':
        config.values = allowedValues.split(',').map((v) => v.trim()).filter((v) => v !== '');
        config.case_sensitive = false;
        break;
    }

    return config;
  };

  // ===== VALIDATION =====
  const validateForm = (): string | null => {
    if (!ruleName.trim()) return 'Rule name is required';
    if (!connectorId) return 'Connector is required';
    if (!tableName.trim()) return 'Table name is required';
    if (!columnName.trim()) return 'Column name is required';

    // Rule-specific validation
    if (ruleType === 'regex_match' && !pattern.trim()) {
      return 'Regex pattern is required';
    }
    if (ruleType === 'numeric_range') {
      if (minValue === '' && maxValue === '') {
        return 'At least one of min_value or max_value is required';
      }
      if (minValue !== '' && maxValue !== '' && Number(minValue) >= Number(maxValue)) {
        return 'min_value must be less than max_value';
      }
    }
    if (ruleType === 'string_length') {
      if (minLength === '' && maxLength === '') {
        return 'At least one of min_length or max_length is required';
      }
      if (minLength !== '' && maxLength !== '' && Number(minLength) > Number(maxLength)) {
        return 'min_length must be less than or equal to max_length';
      }
    }
    if (ruleType === 'allowed_values' && allowedValues.trim() === '') {
      return 'At least one allowed value is required';
    }

    return null;
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: DQRuleCreate = {
        rule_name: ruleName.trim(),
        description: description.trim() || undefined,
        connector_id: connectorId,
        table_name: tableName.trim(),
        column_name: columnName.trim(),
        rule_type: ruleType,
        rule_config: buildRuleConfig(),
        severity,
        enabled: true,
      };

      await createRule(payload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER HELPERS =====
  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      not_null: 'Not Null',
      regex_match: 'Regex Match',
      numeric_range: 'Numeric Range',
      string_length: 'String Length',
      allowed_values: 'Allowed Values',
    };
    return labels[type] || type;
  };

  const renderDynamicConfig = () => {
    switch (ruleType) {
      case 'not_null':
        return (
          <div className="bg-slate-500/5 border border-slate-500/20 rounded-lg p-4">
            <p className="text-sm text-slate-400">
              This rule type does not require additional configuration.
            </p>
          </div>
        );

      case 'regex_match':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Regex Pattern *
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="^[A-Z]{3}\d{6}$"
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">
                JavaScript-compatible regular expression pattern
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="caseSensitive"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="w-4 h-4 bg-[#0F172A] border-[#1E293B] rounded text-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0"
              />
              <label htmlFor="caseSensitive" className="text-sm text-slate-300 cursor-pointer">
                Case sensitive matching
              </label>
            </div>
          </div>
        );

      case 'numeric_range':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Min Value
              </label>
              <input
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Max Value
              </label>
              <input
                type="number"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="100"
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'string_length':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Min Length
              </label>
              <input
                type="number"
                value={minLength}
                onChange={(e) => setMinLength(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="3"
                min="0"
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Max Length
              </label>
              <input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="50"
                min="1"
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'allowed_values':
        return (
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Allowed Values *
            </label>
            <input
              type="text"
              value={allowedValues}
              onChange={(e) => setAllowedValues(e.target.value)}
              placeholder="active, inactive, pending"
              className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Comma-separated list of allowed values (case-insensitive)
            </p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0B1120] border border-[#1E293B] shadow-2xl rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Data Quality Rule</h2>
              <p className="text-xs text-slate-400 mt-0.5">Define validation rules for your data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-[#1E293B] text-slate-400 hover:text-white rounded-lg transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Error Banner */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-emerald-300">Rule created successfully!</span>
              </div>
            )}

            {/* Rule Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Email Must Be Valid"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of this rule"
                rows={2}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 resize-none"
              />
            </div>

            {/* Connector */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Connector *
              </label>
              <select
                value={connectorId}
                onChange={(e) => setConnectorId(e.target.value)}
                disabled={loading || loadingConnectors || !!initialConnectorId}
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Select a connector</option>
                {connectors.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Table & Column */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  Table Name *
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="users"
                  disabled={loading || !!initialTableName}
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Column Name *
                </label>
                <input
                  type="text"
                  value={columnName}
                  onChange={(e) => setColumnName(e.target.value)}
                  placeholder="email"
                  disabled={loading || !!initialColumnName}
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </div>

            {/* Rule Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Rule Type *
              </label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as any)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="not_null">Not Null</option>
                <option value="regex_match">Regex Match</option>
                <option value="numeric_range">Numeric Range</option>
                <option value="string_length">String Length</option>
                <option value="allowed_values">Allowed Values</option>
              </select>
            </div>

            {/* Dynamic Config */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Rule Configuration
              </label>
              {renderDynamicConfig()}
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Severity *
              </label>
              <div className="grid grid-cols-4 gap-3">
                {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    disabled={loading}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 ${
                      severity === sev
                        ? sev === 'critical'
                          ? 'bg-red-500/20 border-red-500 text-red-300'
                          : sev === 'high'
                          ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                          : sev === 'medium'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                          : 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-[#0F172A] border-[#1E293B] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1E293B] bg-[#0F172A]/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 bg-[#131B2C] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Create Rule
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleCreationModal;
