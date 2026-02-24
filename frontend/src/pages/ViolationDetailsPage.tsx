// src/pages/ViolationDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Download, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface Violation {
  _id: string;
  rule_id: string;
  rule_name: string;
  job_id: string;
  column_name: string;
  violation_message: string;
  severity: string;
  rule_type: string;
  detected_at: string;
  is_resolved: boolean;
  additional_info?: any;
}

const ViolationDetailsPage: React.FC = () => {
  const { ruleId, jobId } = useParams<{ ruleId: string; jobId: string }>();
  const navigate = useNavigate();
  
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchViolations();
  }, [ruleId, jobId]);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.get(
        `${API_URL}/api/v1/rules/dataset/${jobId}/violations`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      let filtered = response.data.violations || [];
      if (ruleId) {
        filtered = filtered.filter((v: Violation) => v.rule_id === ruleId);
      }
      
      setViolations(filtered);
    } catch (err: any) {
      console.error('Failed to fetch violations:', err);
      setError(err.response?.data?.detail || 'Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
      HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      LOW: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
  };

  const exportToCSV = () => {
    const headers = ['Rule Name', 'Column', 'Message', 'Severity', 'Detected At'];
    const rows = violations.map(v => [
      v.rule_name,
      v.column_name || 'N/A',
      v.violation_message,
      v.severity,
      new Date(v.detected_at).toLocaleString(),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violations_${jobId}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Violation Details</h1>
              <p className="text-slate-400 mt-1">
                {violations.length > 0 && violations[0].rule_name}
              </p>
            </div>
          </div>

          <button
            onClick={exportToCSV}
            disabled={violations.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-red-300">
              <XCircle className="w-6 h-6" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && violations.length === 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-12 backdrop-blur-xl text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Violations Found</h3>
            <p className="text-slate-400">All rules passed for this dataset!</p>
          </div>
        )}

        {!loading && !error && violations.length > 0 && (
          <div className="space-y-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-xl">
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Violations</p>
                  <p className="text-3xl font-bold text-white">{violations.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Rule Type</p>
                  <p className="text-xl font-semibold text-white">{violations[0].rule_type}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Column</p>
                  <p className="text-xl font-semibold text-purple-400">{violations[0].column_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Severity</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-sm font-semibold ${getSeverityBadge(violations[0].severity)}`}>
                    {violations[0].severity}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rule Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Column</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Message</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Severity</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Detected At</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {violations.map((violation) => (
                      <tr key={violation._id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-white font-medium">{violation.rule_name}</td>
                        <td className="px-6 py-4 text-sm text-purple-400">{violation.column_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{violation.violation_message}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getSeverityBadge(violation.severity)}`}>
                            {violation.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(violation.detected_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {violation.is_resolved ? (
                            <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-yellow-400 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              Open
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViolationDetailsPage;
