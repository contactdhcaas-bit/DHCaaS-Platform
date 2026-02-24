// src/pages/IntegrationPage.tsx
import React, { useState } from 'react';
import {
  Upload,
  Wrench,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  Play,
  FileText,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface TransformationRule {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface CleaningResult {
  status: string;
  cleaned_file_name: string;
  original_file_name: string;
  download_url: string;
  changes: {
    rows_before: number;
    rows_after: number;
    rows_removed: number;
    duplicates_removed: number;
    missing_filled: number;
    cells_modified: number;
    outliers_removed: number;
    transformations: string[];
  };
  processing_time: string;
}

const TRANSFORMATION_RULES: TransformationRule[] = [
  {
    id: 'drop_duplicates',
    name: 'Remove Duplicates',
    description: 'Eliminate duplicate rows from dataset',
    icon: '🔄',
    category: 'Data Quality',
  },
  {
    id: 'fill_missing',
    name: 'Fill Missing Values',
    description: 'Impute nulls with mean/mode',
    icon: '📝',
    category: 'Data Quality',
  },
  {
    id: 'standardize_case',
    name: 'Standardize Case',
    description: 'Convert text to lowercase',
    icon: '🔤',
    category: 'Standardization',
  },
  {
    id: 'trim_whitespace',
    name: 'Trim Whitespace',
    description: 'Remove leading/trailing spaces',
    icon: '✂️',
    category: 'Standardization',
  },
  {
    id: 'remove_special_chars',
    name: 'Clean Special Chars',
    description: 'Remove unwanted characters',
    icon: '🧹',
    category: 'Standardization',
  },
  {
    id: 'normalize_dates',
    name: 'Normalize Dates',
    description: 'Standardize date formats',
    icon: '📅',
    category: 'Data Types',
  },
  {
    id: 'fix_data_types',
    name: 'Fix Data Types',
    description: 'Auto-detect and convert types',
    icon: '🎯',
    category: 'Data Types',
  },
  {
    id: 'remove_outliers',
    name: 'Remove Outliers',
    description: 'Filter statistical anomalies',
    icon: '📊',
    category: 'Data Quality',
  },
];

const IntegrationPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CleaningResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const toggleRule = (ruleId: string) => {
    setSelectedRules((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const selectAllRules = () => {
    setSelectedRules(TRANSFORMATION_RULES.map((rule) => rule.id));
  };

  const clearAllRules = () => {
    setSelectedRules([]);
  };

  const runTransformation = async () => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    if (selectedRules.length === 0) {
      setError('Please select at least one transformation rule');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('rules', selectedRules.join(','));

    try {
      const response = await fetch('http://localhost:8000/api/v1/integration/clean', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transformation failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to process transformation. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (result) {
      window.open(`http://localhost:8000${result.download_url}`, '_blank');
    }
  };

  const reset = () => {
    setFile(null);
    setSelectedRules([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Data Integration & ETL
            </h1>
            <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">
              NEW
            </span>
          </div>
          <p className="text-slate-600 dark:text-gray-400">
            Transform and clean your datasets with automated ETL rules
          </p>
        </div>

        {/* Step 1: Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Upload Dataset
            </h2>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-300 dark:border-gray-700 hover:border-blue-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label className="flex flex-col items-center justify-center h-48 cursor-pointer">
              {file ? (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-blue-600 mx-auto mb-3" />
                  <p className="text-lg font-medium text-slate-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                    }}
                    className="mt-3 text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-slate-400 dark:text-gray-500 mb-3" />
                  <span className="text-lg font-medium text-slate-700 dark:text-gray-300">
                    Drop your file here
                  </span>
                  <span className="text-sm text-slate-500 dark:text-gray-500">
                    CSV, XLSX, JSON, or Parquet (max 50MB)
                  </span>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls,.json,.parquet"
                onChange={handleFileInput}
              />
            </label>
          </div>
        </div>

        {/* Step 2: Select Transformations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Select Transformations
              </h2>
              <span className="text-sm text-slate-500 dark:text-gray-400">
                ({selectedRules.length} selected)
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllRules}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAllRules}
                className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRANSFORMATION_RULES.map((rule) => (
              <button
                key={rule.id}
                onClick={() => toggleRule(rule.id)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedRules.includes(rule.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-slate-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                {selectedRules.includes(rule.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="text-3xl mb-2">{rule.icon}</div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {rule.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-400 mb-2">
                  {rule.description}
                </p>
                <span className="inline-block px-2 py-0.5 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-xs rounded">
                  {rule.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Run Transformation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold">3</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Execute Transformation
            </h2>
          </div>

          <div className="flex gap-4">
            <button
              onClick={runTransformation}
              disabled={!file || selectedRules.length === 0 || loading}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-semibold transition-all shadow-lg disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run Transformation Job</span>
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-6 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-400">{error}</span>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-400 mb-2">
                    Transformation Complete!
                  </h3>
                  <p className="text-green-800 dark:text-green-300 mb-4">
                    Your data has been successfully cleaned and transformed. Processed in{' '}
                    {result.processing_time}
                  </p>

                  {/* Changes Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-slate-600 dark:text-gray-400">Rows Before</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {result.changes.rows_before}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-slate-600 dark:text-gray-400">Rows After</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {result.changes.rows_after}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-slate-600 dark:text-gray-400">Duplicates Removed</div>
                      <div className="text-2xl font-bold text-red-600">
                        {result.changes.duplicates_removed}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div className="text-xs text-slate-600 dark:text-gray-400">Missing Filled</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {result.changes.missing_filled}
                      </div>
                    </div>
                  </div>

                  {/* Transformations Applied */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                      Transformations Applied:
                    </h4>
                    <ul className="space-y-1">
                      {result.changes.transformations.map((transformation, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300"
                        >
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          {transformation}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={downloadFile}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-lg text-lg"
                  >
                    <Download className="w-6 h-6" />
                    Download Cleaned Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationPage;
