// src/components/CreatePolicyModal.tsx
import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { policyService } from '../services/policyService';

interface CreatePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicyCreated: () => void;
}

interface PolicyFormData {
  name: string;
  description: string;
  rule_type: string;
  threshold: number;
  severity: string;
}

const CreatePolicyModal: React.FC<CreatePolicyModalProps> = ({
  isOpen,
  onClose,
  onPolicyCreated,
}) => {
  const [formData, setFormData] = useState<PolicyFormData>({
    name: '',
    description: '',
    rule_type: 'quality_score',
    threshold: 80,
    severity: 'medium',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const ruleTypes = [
    { value: 'quality_score', label: 'Quality Score Threshold', placeholder: 'e.g., 80' },
    { value: 'pii_rows', label: 'PII Rows Detection', placeholder: 'e.g., 0 (no PII allowed)' },
    { value: 'duplicates', label: 'Duplicate Records', placeholder: 'e.g., 5 (max duplicates)' },
    { value: 'missing_data', label: 'Missing Data Percentage', placeholder: 'e.g., 10 (max %)' },
  ];

  const severityLevels = [
    { value: 'critical', label: 'Critical', color: 'text-red-500' },
    { value: 'high', label: 'High', color: 'text-orange-500' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
    { value: 'low', label: 'Low', color: 'text-blue-500' },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'threshold' ? parseFloat(value) || 0 : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.name.trim()) {
      setError('Policy name is required');
      return;
    }

    if (formData.threshold < 0) {
      setError('Threshold must be a positive number');
      return;
    }

    try {
      setLoading(true);
      await policyService.createPolicy(formData);
      setSuccess(true);

      // Show success and close
      setTimeout(() => {
        onPolicyCreated();
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating policy:', err);
      setError(err.response?.data?.detail || 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'quality_score',
      threshold: 80,
      severity: 'medium',
    });
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const selectedRuleType = ruleTypes.find((rt) => rt.value === formData.rule_type);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-800 border border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-white">
                    Create New Policy
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="mb-4 p-4 bg-emerald-900/30 border border-emerald-700 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-300">Policy created successfully!</span>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-red-300">{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Policy Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Policy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Data Quality Score Policy"
                      required
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe what this policy checks for..."
                      rows={3}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 resize-none"
                    />
                  </div>

                  {/* Rule Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rule Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="rule_type"
                      value={formData.rule_type}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    >
                      {ruleTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Threshold Value <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="threshold"
                      value={formData.threshold}
                      onChange={handleInputChange}
                      placeholder={selectedRuleType?.placeholder}
                      required
                      min="0"
                      step="0.01"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {selectedRuleType?.placeholder}
                    </p>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Severity Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="severity"
                      value={formData.severity}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                    >
                      {severityLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Policy'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreatePolicyModal;
