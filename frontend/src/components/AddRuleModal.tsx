// src/components/AddRuleModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Hash,
  Text,
  Calendar,
  Mail,
  Phone,
  List,
  Ruler,
  Lock,
} from 'lucide-react';
import { Rule, RuleType } from '../services/ruleService';

interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Omit<Rule, 'rule_id'>) => Promise<void>;
  jobId: string;
  columns: string[];
}

const RULE_TYPES: {
  value: RuleType;
  label: string;
  icon: React.ReactNode;
  description: string;
  scope: 'COLUMN' | 'DATASET';
}[] = [
  {
    value: 'NOT_NULL',
    label: 'Not Null',
    icon: <Lock className="w-4 h-4" />,
    description: 'Column must not contain null values',
    scope: 'COLUMN',
  },
  {
    value: 'UNIQUE',
    label: 'Unique',
    icon: <Hash className="w-4 h-4" />,
    description: 'Column values must be unique',
    scope: 'COLUMN',
  },
  {
    value: 'EMAIL',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    description: 'Validate email address format',
    scope: 'COLUMN',
  },
  {
    value: 'PHONE',
    label: 'Phone',
    icon: <Phone className="w-4 h-4" />,
    description: 'Validate phone number format',
    scope: 'COLUMN',
  },
  {
    value: 'REGEX',
    label: 'Regex Pattern',
    icon: <Text className="w-4 h-4" />,
    description: 'Match values against regex pattern',
    scope: 'COLUMN',
  },
  {
    value: 'RANGE',
    label: 'Numeric Range',
    icon: <Ruler className="w-4 h-4" />,
    description: 'Values must be within min/max range',
    scope: 'COLUMN',
  },
  {
    value: 'ENUM',
    label: 'Allowed Values',
    icon: <List className="w-4 h-4" />,
    description: 'Values must be in allowed list',
    scope: 'COLUMN',
  },
  {
    value: 'DATE_FORMAT',
    label: 'Date Format',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Validate date format',
    scope: 'COLUMN',
  },
  {
    value: 'LENGTH',
    label: 'String Length',
    icon: <Text className="w-4 h-4" />,
    description: 'String length constraints',
    scope: 'COLUMN',
  },
  {
    value: 'MIN_VALUE',
    label: 'Minimum Value',
    icon: <Ruler className="w-4 h-4" />,
    description: 'Minimum numeric value',
    scope: 'COLUMN',
  },
  {
    value: 'MAX_VALUE',
    label: 'Maximum Value',
    icon: <Ruler className="w-4 h-4" />,
    description: 'Maximum numeric value',
    scope: 'COLUMN',
  },
];

const AddRuleModal: React.FC<AddRuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  jobId,
  columns,
}) => {
  const [formData, setFormData] = useState<Partial<Rule>>({
    rule_name: '',
    description: '',
    job_id: jobId,
    rule_type: 'NOT_NULL',
    scope: 'COLUMN',
    column_name: columns[0] || '',
    parameters: {},
    severity: 'HIGH',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        rule_name: '',
        description: '',
        job_id: jobId,
        rule_type: 'NOT_NULL',
        scope: 'COLUMN',
        column_name: columns[0] || '',
        parameters: {},
        severity: 'HIGH',
      });
      setError(null);
    }
  }, [isOpen, jobId, columns]);

  const handleRuleTypeChange = (ruleType: RuleType) => {
    const ruleConfig = RULE_TYPES.find((r) => r.value === ruleType);
    setFormData({
      ...formData,
      rule_type: ruleType,
      scope: ruleConfig?.scope || 'COLUMN',
      parameters: {},
    });
  };

  const renderParameterInputs = () => {
    switch (formData.rule_type) {
      case 'REGEX':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regex Pattern *
            </label>
            <input
              type="text"
              placeholder="^[A-Z]{2}\\d{4}$"
              value={formData.parameters?.pattern || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, pattern: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter a valid regex pattern</p>
          </div>
        );

      case 'RANGE':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Value
              </label>
              <input
                type="number"
                placeholder="0"
                value={formData.parameters?.min || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parameters: {
                      ...formData.parameters,
                      min: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Value
              </label>
              <input
                type="number"
                placeholder="100"
                value={formData.parameters?.max || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parameters: {
                      ...formData.parameters,
                      max: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'ENUM':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Values (comma-separated) *
            </label>
            <input
              type="text"
              placeholder="Active, Inactive, Pending"
              value={(formData.parameters?.allowed_values || []).join(', ')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parameters: {
                    ...formData.parameters,
                    allowed_values: e.target.value.split(',').map((v) => v.trim()),
                  },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        );

      case 'DATE_FORMAT':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format *
            </label>
            <select
              value={formData.parameters?.format || '%Y-%m-%d'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, format: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="%Y-%m-%d">YYYY-MM-DD</option>
              <option value="%d/%m/%Y">DD/MM/YYYY</option>
              <option value="%m/%d/%Y">MM/DD/YYYY</option>
              <option value="%Y-%m-%d %H:%M:%S">YYYY-MM-DD HH:MM:SS</option>
            </select>
          </div>
        );

      case 'LENGTH':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Length
              </label>
              <input
                type="number"
                placeholder="0"
                value={formData.parameters?.min_length || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parameters: {
                      ...formData.parameters,
                      min_length: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Length
              </label>
              <input
                type="number"
                placeholder="100"
                value={formData.parameters?.max_length || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parameters: {
                      ...formData.parameters,
                      max_length: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'MIN_VALUE':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Value *
            </label>
            <input
              type="number"
              placeholder="0"
              value={formData.parameters?.min || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, min: parseFloat(e.target.value) },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        );

      case 'MAX_VALUE':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Value *
            </label>
            <input
              type="number"
              placeholder="100"
              value={formData.parameters?.max || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parameters: { ...formData.parameters, max: parseFloat(e.target.value) },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSave(formData as Omit<Rule, 'rule_id'>);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Data Quality Rule</h2>
              <p className="text-sm text-gray-500 mt-1">
                Define validation rules for your dataset
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Rule Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.rule_name}
                  onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                  placeholder="e.g., Email Validation Rule"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this rule..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Rule Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rule Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {RULE_TYPES.map((ruleType) => (
                    <button
                      key={ruleType.value}
                      type="button"
                      onClick={() => handleRuleTypeChange(ruleType.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.rule_type === ruleType.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            formData.rule_type === ruleType.value
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {ruleType.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{ruleType.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ruleType.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Selection */}
              {formData.scope === 'COLUMN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Column *
                  </label>
                  <select
                    value={formData.column_name}
                    onChange={(e) =>
                      setFormData({ ...formData, column_name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Parameters */}
              {renderParameterInputs()}

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity *
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: severity as any })}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        formData.severity === severity
                          ? severity === 'CRITICAL'
                            ? 'bg-red-500 text-white'
                            : severity === 'HIGH'
                            ? 'bg-orange-500 text-white'
                            : severity === 'MEDIUM'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Rule
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRuleModal;
