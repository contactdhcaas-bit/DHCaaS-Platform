import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Database,
  Clock,
  Loader2,
  Upload,
  FileText,
  Zap,
  Tag,
  Brain,
  AlertCircle,
  X,
  ArrowLeft,
  Download,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import ViolationsList from '../components/ViolationsList';

// Types
interface ScanJob {
  id: string;
  status: string;
  result?: AnalysisResult;
}

interface AnalysisResult {
  [key: string]: any;
}

class ScanServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScanServiceError';
  }
}

// Helper functions
const downloadReportPDF = async (jobId: string) => {
  const response = await api.get(`/reports/${jobId}/pdf`, { responseType: 'blob' });
  return response.data;
};

const checkReportStatus = async (jobId: string) => {
  const response = await api.get(`/reports/${jobId}/status`);
  return response.data;
};

const DataQualityPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  // ===== SCAN DATA STATE =====
  const [scanData, setScanData] = useState<ScanJob | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);

  // ===== FILE UPLOAD STATE =====
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== TOAST STATE =====
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // ===== FETCH SCAN DETAILS =====
  useEffect(() => {
    if (!jobId) return;

    const fetchScanDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.scans.getById(jobId);
        setScanData(data);
      } catch (err: any) {
        console.error('Failed to fetch scan details:', err);
        if (err instanceof ScanServiceError) {
          setError(err.message);
        } else {
          setError('Failed to load scan details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchScanDetails();
  }, [jobId]);

  // ===== DOWNLOAD REPORT HANDLER (UPDATED) =====
  const handleDownloadReport = async () => {
    if (!scanData?.job_id) {
      triggerToast('No scan selected', 'error');
      return;
    }

    // Check if scan is completed
    if (scanData.status !== 'completed') {
      triggerToast('Scan must be completed before generating a report', 'error');
      return;
    }

    setDownloadingReport(true);

    try {
      // Optional: Check report status first
      console.log('Checking report status...');
      const statusCheck = await checkReportStatus(scanData.job_id);

      if (!statusCheck.ready_for_report) {
        triggerToast(statusCheck.message || 'Scan is not ready for reporting', 'error');
        setDownloadingReport(false);
        return;
      }

      // Download the PDF
      console.log('Downloading PDF report...');
      await downloadReportPDF(scanData.job_id);

      // Success notification
      triggerToast('âœ… Report downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('PDF download error:', err);
      
      // Show user-friendly error message
      const errorMessage = err.message || 'Failed to download report. Please try again.';
      triggerToast(`âŒ ${errorMessage}`, 'error');
    } finally {
      setDownloadingReport(false);
    }
  };

  // ===== TOAST NOTIFICATION (UPDATED) =====
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // ===== FILE UPLOAD HANDLERS =====
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validExtensions = ['csv', 'xlsx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      triggerToast('âŒ Invalid file type. Please upload CSV or XLSX files.', 'error');
      return;
    }

    setUploadedFile(file);
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const response = await api.analysis.analyzeDataset(file);
      setAnalysisResult(response.data);
      triggerToast(`âœ… Analysis completed in ${response.data.latency_ms}ms!`, 'success');
    } catch (error: any) {
      setAnalysisError(error.message || 'Failed to analyze file');
      triggerToast('âŒ Analysis failed. Please try again.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearAnalysis = () => {
    setUploadedFile(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ===== HELPER FUNCTIONS =====
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500 animate-pulse';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
      case 'A+':
        return 'text-emerald-400';
      case 'B':
      case 'B+':
        return 'text-blue-400';
      case 'C':
        return 'text-yellow-400';
      case 'D':
      case 'F':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTagBadgeColor = (tag: string) => {
    const tagColors: Record<string, string> = {
      PII: 'bg-red-900/30 text-red-400 border-red-800',
      Sensitive: 'bg-orange-900/30 text-orange-400 border-orange-800',
      Financial: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
      GDPR: 'bg-purple-900/30 text-purple-400 border-purple-800',
      'Compliance Required': 'bg-pink-900/30 text-pink-400 border-pink-800',
      Geolocation: 'bg-blue-900/30 text-blue-400 border-blue-800',
      Temporal: 'bg-cyan-900/30 text-cyan-400 border-cyan-800',
      'Customer Data': 'bg-indigo-900/30 text-indigo-400 border-indigo-800',
    };
    return tagColors[tag] || 'bg-gray-900/30 text-gray-400 border-gray-800';
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading scan details...</p>
        </div>
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Scan</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== EMPTY STATE (No jobId) =====
  if (!jobId || !scanData) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          {/* ===== FILE UPLOAD ZONE ===== */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                AI-Powered Dataset Analysis
              </h2>
              {uploadedFile && (
                <button
                  onClick={handleClearAnalysis}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-purple-600 hover:bg-gray-800'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                  <p className="text-lg font-semibold text-purple-400">Analyzing dataset...</p>
                  <p className="text-sm text-gray-400">Running AI Auto-Tagger on your data</p>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-400">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  {analysisResult && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <Zap className="w-4 h-4" />
                      Analyzed in {analysisResult.latency_ms}ms
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-purple-900/30 rounded-2xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Drop your CSV or XLSX file here</p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                  </div>
                  <p className="text-xs text-gray-500">Supports: .csv, .xlsx (Max 50MB)</p>
                </div>
              )}
            </div>

            {analysisError && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Analysis Failed</p>
                  <p className="text-xs text-red-300 mt-1">{analysisError}</p>
                </div>
              </div>
            )}
          </div>

          {/* ===== SMART SCHEMA RESULTS ===== */}
          {analysisResult && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Smart Schema Analysis</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Database className="w-4 h-4" />
                    {analysisResult.dataset_summary.total_columns} columns
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <FileText className="w-4 h-4" />
                    {analysisResult.dataset_summary.total_rows} rows
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <Shield className="w-4 h-4" />
                    {analysisResult.dataset_summary.pii_columns} PII columns
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Column Name</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Detected Type</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">AI Tags</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Confidence</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">AI Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.columns.map((column, idx) => (
                        <tr key={idx} className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-semibold text-white">{column.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full border border-blue-800">
                              {column.detected_type}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1">
                              {column.tags.length > 0 ? (
                                column.tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getTagBadgeColor(tag)}`}
                                  >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No tags</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-[100px]">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-white">{column.confidence_score}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-full rounded-full ${
                                      column.confidence_score >= 85
                                        ? 'bg-emerald-500'
                                        : column.confidence_score >= 70
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${column.confidence_score}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-xs text-gray-400 max-w-md">{column.ai_description}</p>
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
  }

  // ===== MAIN CONTENT - REAL SCAN DATA =====
  const results = scanData.results || {};
  const overallScore = results.overall_score || 0;
  const grade = results.grade || 'N/A';
  const totalRecords = results.total_records || results.rows_scanned || 0;
  const issuesFound = results.issues_found || 0;
  const breakdown = results.breakdown || {};
  const issues = results.issues || [];
  const keyFindings = results.key_findings || [];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Data Quality Report</h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-400">{scanData.datasource_name || scanData.job_id}</p>
                <span className={`px-3 py-1 ${getStatusColor(scanData.status)} text-white text-sm font-semibold rounded-full`}>
                  {scanData.status.toUpperCase()}
                </span>
                <span className="text-gray-500 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatDate(scanData.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Download Button - UPDATED */}
          {scanData.status === 'completed' && (
            <button
              onClick={handleDownloadReport}
              disabled={downloadingReport}
              className={`
                flex items-center gap-2 px-6 py-3 font-semibold rounded-xl
                transition-all duration-200
                ${
                  downloadingReport
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:shadow-lg hover:scale-105'
                }
              `}
            >
              {downloadingReport ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Report
                </>
              )}
            </button>
          )}
        </div>

        {/* ===== SCORE CARDS ===== */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <span className={`text-5xl font-bold ${getGradeColor(grade)}`}>{grade}</span>
            </div>
            <p className="text-sm text-emerald-300 mb-1">Overall Score</p>
            <p className="text-4xl font-bold text-white">{overallScore.toFixed(1)}%</p>
          </div>

          {/* Total Records */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
              <Database className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Total Records</p>
            <p className="text-4xl font-bold text-white">{totalRecords.toLocaleString()}</p>
          </div>

          {/* Issues Found */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-yellow-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Issues Found</p>
            <p className="text-4xl font-bold text-white">{issuesFound}</p>
          </div>

          {/* Source Type */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Source Type</p>
            <p className="text-2xl font-bold text-white uppercase">{scanData.source_type}</p>
          </div>
        </div>

        {/* ===== QUALITY BREAKDOWN ===== */}
        {Object.keys(breakdown).length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-purple-400" />
              Quality Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(breakdown).map(([key, value]) => (
                <div key={key} className="bg-gray-900/50 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-2 capitalize">{key.replace(/_/g, ' ')}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-white">{value}%</p>
                  </div>
                  <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== KEY FINDINGS ===== */}
        {keyFindings.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
              Key Findings
            </h2>
            <ul className="space-y-3">
              {keyFindings.map((finding: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-gray-300">
                  <span className="w-6 h-6 bg-emerald-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </span>
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ===== ISSUES TABLE ===== */}
        {issues.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-yellow-400" />
              Detected Issues ({issues.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Type</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Description</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Severity</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-semibold">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm font-medium">
                          {issue.type || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{issue.description || 'No description'}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${
                            issue.severity === 'critical'
                              ? 'bg-red-500 text-white'
                              : issue.severity === 'high'
                              ? 'bg-orange-500 text-white'
                              : issue.severity === 'medium'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          {issue.severity || 'low'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-white font-semibold">{issue.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State - No Issues */}
        {scanData.status === 'completed' && issues.length === 0 && (
          <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-2xl p-12 text-center">
            <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3">No Issues Detected!</h3>
            <p className="text-emerald-400">Your data quality is excellent. All checks passed successfully.</p>
          </div>
        )}
      </div>

        {/* ===== POLICY VIOLATIONS SECTION ===== */}
        {scanData.status === 'completed' && jobId && (
          <div className="mt-8">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-purple-400" />
                Compliance & Violations
              </h2>
              <ViolationsList scanId={jobId} />
            </div>
          </div>
        )}

      {/* ===== TOAST NOTIFICATION (UPDATED) ===== */}
      {showToast && (
        <div
          className={`
            fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl 
            flex items-center gap-3 animate-slide-up z-50
            ${
              toastType === 'success'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
            }
          `}
        >
          {toastType === 'success' ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}

      <style>
        {`
          @keyframes slide-up {
            from {
              transform: translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default DataQualityPage;



