// src/components/SchemaViewerModal.tsx
// Schema Introspection Viewer Modal with Integrated Rule Creation
// Displays database schema with ability to create rules directly from columns

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Eye,
  Shield,
  Plus,
} from 'lucide-react';
import { getConnectorSchema, SchemaResponse } from '../services/api';
import RuleCreationModal from './RuleCreationModal';

interface SchemaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectorId: string;
  connectorName: string;
}

const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({
  isOpen,
  onClose,
  connectorId,
  connectorName,
}) => {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  // Rule creation modal state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');

  useEffect(() => {
    if (isOpen && connectorId) {
      fetchSchema();
    }
  }, [isOpen, connectorId]);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getConnectorSchema(connectorId);
      setSchema(response);

      // Auto-expand first table if only one table exists
      if (response.table_count === 1) {
        const firstTable = Object.keys(response.schema)[0];
        setExpandedTables(new Set([firstTable]));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch schema');
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const handleAddRule = (tableName: string, columnName: string) => {
    setSelectedTable(tableName);
    setSelectedColumn(columnName);
    setIsRuleModalOpen(true);
  };

  const getDataTypeBadgeColor = (dataType: string) => {
    const type = dataType.toLowerCase();
    if (type.includes('int') || type.includes('serial') || type.includes('number')) {
      return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    }
    if (type.includes('varchar') || type.includes('char') || type.includes('text')) {
      return 'bg-green-500/10 text-green-300 border-green-500/30';
    }
    if (type.includes('bool')) {
      return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
    if (type.includes('date') || type.includes('time')) {
      return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
    }
    if (type.includes('json')) {
      return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
    }
    return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[#0B1120] border border-[#1E293B] shadow-2xl rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Database Schema</h2>
                <p className="text-xs text-slate-400 mt-0.5">{connectorName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1E293B] text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                <p className="text-slate-400 text-sm font-medium">
                  Extracting schema from database...
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Schema Extraction Failed</p>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            ) : schema ? (
              <div className="space-y-4">
                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#131B2C] border border-[#1E293B] rounded-lg p-4">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      Total Tables
                    </p>
                    <p className="text-2xl font-bold text-white">{schema.table_count}</p>
                  </div>
                  <div className="bg-[#131B2C] border border-[#1E293B] rounded-lg p-4">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      Total Columns
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {Object.values(schema.schema).reduce(
                        (sum, columns) => sum + columns.length,
                        0
                      )}
                    </p>
                  </div>
                  <div className="bg-[#131B2C] border border-[#1E293B] rounded-lg p-4">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      Status
                    </p>
                    <p className="text-sm font-semibold text-emerald-400">Ready</p>
                  </div>
                </div>

                {/* Tables Accordion */}
                <div className="space-y-2">
                  {Object.entries(schema.schema).map(([tableName, columns]) => (
                    <div
                      key={tableName}
                      className="bg-[#131B2C] border border-[#1E293B] rounded-lg overflow-hidden"
                    >
                      {/* Table Header */}
                      <button
                        onClick={() => toggleTable(tableName)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1E293B]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
                            <TableIcon className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">{tableName}</p>
                            <p className="text-xs text-slate-400">
                              {columns.length} column{columns.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded text-xs font-medium">
                            {columns.length}
                          </span>
                          {expandedTables.has(tableName) ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Columns List */}
                      {expandedTables.has(tableName) && (
                        <div className="border-t border-[#1E293B] bg-[#0F172A]/50">
                          <div className="px-5 py-3">
                            <div className="space-y-2">
                              {columns.map((column) => (
                                <div
                                  key={column.column}
                                  className="flex items-center justify-between py-2.5 px-3 bg-[#131B2C] border border-[#1E293B] rounded-lg hover:border-[#2E3A4B] transition-colors group"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-6 h-6 bg-[#0F172A] border border-[#1E293B] rounded flex items-center justify-center">
                                      <Database className="w-3 h-3 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-white font-mono">
                                        {column.column}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`px-2.5 py-1 border rounded text-xs font-medium ${getDataTypeBadgeColor(
                                        column.type
                                      )}`}
                                    >
                                      {column.type}
                                    </span>
                                    {column.nullable ? (
                                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded text-xs font-medium">
                                        NULL
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-medium">
                                        NOT NULL
                                      </span>
                                    )}
                                    {/* Add Rule Button */}
                                    <button
                                      onClick={() => handleAddRule(tableName, column.column)}
                                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-400 hover:text-indigo-300 rounded-md text-xs font-semibold transition-all"
                                      title="Add Data Quality Rule"
                                    >
                                      <Shield className="w-3 h-3" />
                                      <span>Add Rule</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Success Message */}
                {schema.table_count > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-300 font-medium">
                      {schema.message}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1E293B] bg-[#0F172A]/50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#131B2C] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Rule Creation Modal (Higher z-index) */}
      {isRuleModalOpen && (
        <RuleCreationModal
          isOpen={isRuleModalOpen}
          onClose={() => setIsRuleModalOpen(false)}
          onSuccess={() => {
            setIsRuleModalOpen(false);
            // Optionally show success message or refresh schema
          }}
          initialConnectorId={connectorId}
          initialTableName={selectedTable}
          initialColumnName={selectedColumn}
        />
      )}
    </>
  );
};

export default SchemaViewerModal;
