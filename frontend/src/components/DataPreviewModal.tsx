// src/components/DataPreviewModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  Download,
  RefreshCw,
  Shield,
} from 'lucide-react';

interface DataPreviewModalProps {
  fileId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface PreviewData {
  data: Record<string, any>[];
  columns: string[];
  total_rows: number;
  displayed_rows: number;
  masked_columns: string[];
  masking_summary: Record<string, any>;
  privacy_applied: boolean;
  file_info: {
    file_name: string;
    file_id: string;
    file_size: number;
    file_type: string;
  };
}

const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  fileId,
  fileName,
  isOpen,
  onClose,
}) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnmasked, setIsUnmasked] = useState(false);
  const [showUnmaskWarning, setShowUnmaskWarning] = useState(false);
  const [rowCount, setRowCount] = useState(10);

  useEffect(() => {
    if (isOpen) {
      fetchPreview();
    }
  }, [isOpen, rowCount]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/api/v1/governance/preview/${fileId}?rows=${rowCount}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch preview');
      }

      const data = await response.json();
      setPreviewData(data);
      setIsUnmasked(false);
    } catch (err) {
      setError('Failed to load data preview. Please try again.');
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmask = async () => {
    try {
      setLoading(true);

      // Simulate authorization check (in production, use actual user role)
      const response = await fetch(
        `http://localhost:8000/api/v1/governance/unmask/${fileId}?user_role=admin`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Insufficient permissions to unmask data');
      }

      const result = await response.json();

      // Show warning toast
      setShowUnmaskWarning(true);
      setTimeout(() => setShowUnmaskWarning(false), 5000);

      // In production, re-fetch unmasked data from secure endpoint
      // For now, just mark as unmasked
      setIsUnmasked(true);

      console.log('Unmask authorized:', result);
    } catch (err) {
      setError('Access denied: Insufficient permissions to view sensitive data.');
      console.error('Unmask error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemask = () => {
    setIsUnmasked(false);
    fetchPreview();
  };

  const isColumnMasked = (columnName: string): boolean => {
    return previewData?.masked_columns.includes(columnName) || false;
  };

  const getCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const isMaskedValue = (value: string): boolean => {
    return value.includes('***') || value.includes('****');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Data Preview
              </h3>
              <p className="text-sm text-slate-500 dark:text-gray-400">{fileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {previewData && (
              <div className="flex items-center gap-2">
                {isUnmasked ? (
                  <button
                    onClick={handleRemask}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Re-mask Data</span>
                  </button>
                ) : (
                  <button
                    onClick={handleUnmask}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white rounded-lg transition-colors font-medium"
                  >
                    <Unlock className="w-4 h-4" />
                    <span className="text-sm">Show Original</span>
                  </button>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Warning Toast */}
        {showUnmaskWarning && (
          <div className="mx-6 mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-400">
                ⚠️ Access Logged: You are viewing sensitive PII
              </p>
              <p className="text-xs text-orange-800 dark:text-orange-300 mt-1">
                This action has been recorded in the audit log for compliance purposes.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Controls */}
        {previewData && (
          <div className="px-6 py-3 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield
                  className={`w-4 h-4 ${
                    previewData.privacy_applied ? 'text-green-600' : 'text-slate-400'
                  }`}
                />
                <span className="text-sm text-slate-700 dark:text-gray-300">
                  {previewData.privacy_applied ? 'Privacy Applied' : 'No Masking'}
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400">
                Showing {previewData.displayed_rows} of {previewData.total_rows} rows
              </div>
              <div className="text-sm text-slate-600 dark:text-gray-400">
                {previewData.masked_columns.length} columns masked
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={rowCount}
                onChange={(e) => setRowCount(parseInt(e.target.value))}
                className="px-3 py-1 border border-slate-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value={5}>5 rows</option>
                <option value={10}>10 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
              <button
                onClick={fetchPreview}
                disabled={loading}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && !previewData ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : previewData ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-gray-900">
                    {previewData.columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-slate-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <span>{column}</span>
                          {isColumnMasked(column) && !isUnmasked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                              <Lock className="w-3 h-3" />
                              Masked
                            </span>
                          )}
                          {isColumnMasked(column) && isUnmasked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                              <Unlock className="w-3 h-3" />
                              Visible
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {previewData.data.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {previewData.columns.map((column) => {
                        const value = getCellValue(row[column]);
                        const isMasked = isMaskedValue(value) && !isUnmasked;
                        return (
                          <td
                            key={column}
                            className={`px-4 py-3 text-sm ${
                              isMasked
                                ? 'text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/10'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-500 dark:text-gray-400">No preview available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewData && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600 dark:text-gray-400">
                <strong>File:</strong> {previewData.file_info.file_name} •{' '}
                <strong>Size:</strong> {(previewData.file_info.file_size / 1024).toFixed(2)} KB •{' '}
                <strong>Type:</strong> {previewData.file_info.file_type.toUpperCase()}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreviewModal;
