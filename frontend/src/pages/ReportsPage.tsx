// src/pages/ReportsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  FileDown,
  Calendar,
  TrendingUp,
  Database,
  DollarSign,
  CheckCircle,
  Download,
  Play,
  Pause,
  Settings,
  Filter,
  Sparkles,
  Clock,
  Mail,
  FileText,
  Zap,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ===== TYPES =====
type TabType = 'dashboards' | 'generator' | 'scheduled';

interface Report {
  _id: string;
  job_id: string;
  datasource_id: string;
  datasource_name?: string;
  datasource_type?: string;
  organization_id: string;
  generated_by: string;
  generated_at: string;
  status: string;
  report_type: string;
  file_name: string;
  download_count?: number;
  last_downloaded_at?: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: string;
  recipients: string;
  lastRun: string;
  nextRun: string;
  status: 'active' | 'paused';
}

interface ScanJob {
  _id: string;
  datasource_id: string;
  datasource_name?: string;
  status: string;
  completed_at?: string;
  results?: {
    total_records_scanned?: number;
    issues_count?: number;
  };
}

// ===== API BASE URL =====
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ReportsPage: React.FC = () => {
  // ===== STATE =====
  const [activeTab, setActiveTab] = useState<TabType>('dashboards');
  const [reports, setReports] = useState<Report[]>([]);
  const [scanJobs, setScanJobs] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Report Generator State
  const [selectedJobId, setSelectedJobId] = useState('');
  const [reportName, setReportName] = useState('');
  const [selectedScope, setSelectedScope] = useState('all');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['completeness']);
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  // ===== MOCK DATA FOR KPIs =====
  const kpis = {
    dataScanned: '1.2 TB',
    issuesResolved: 8432,
    moneySaved: 42000,
  };

  // Quality Trend Data (Last 30 days)
  const qualityTrendData = [
    { day: 'Week 1', score: 85 },
    { day: 'Week 2', score: 88 },
    { day: 'Week 3', score: 92 },
    { day: 'Week 4', score: 98 },
  ];

  // Error Distribution Data
  const errorDistribution = [
    { source: 'MySQL', count: 145, color: '#3b82f6', percentage: 35 },
    { source: 'API', count: 98, color: '#8b5cf6', percentage: 24 },
    { source: 'S3', count: 76, color: '#f59e0b', percentage: 18 },
    { source: 'Logs', count: 52, color: '#ef4444', percentage: 13 },
    { source: 'Other', count: 42, color: '#6b7280', percentage: 10 },
  ];

  // Scheduled Reports (Mock Data)
  const scheduledReports: ScheduledReport[] = [
    {
      id: '1',
      name: 'Weekly Executive Summary',
      frequency: 'Weekly (Monday 9AM)',
      recipients: 'exec-team@dhcaas.com',
      lastRun: '2026-02-03 09:00',
      nextRun: '2026-02-10 09:00',
      status: 'active',
    },
    {
      id: '2',
      name: 'Daily Data Quality Report',
      frequency: 'Daily (8AM)',
      recipients: 'data-team@dhcaas.com',
      lastRun: '2026-02-04 08:00',
      nextRun: '2026-02-05 08:00',
      status: 'active',
    },
    {
      id: '3',
      name: 'Monthly Compliance Audit',
      frequency: 'Monthly (1st, 9AM)',
      recipients: 'compliance@dhcaas.com',
      lastRun: '2026-02-01 09:00',
      nextRun: '2026-03-01 09:00',
      status: 'active',
    },
    {
      id: '4',
      name: 'PII Detection Summary',
      frequency: 'Weekly (Friday 5PM)',
      recipients: 'security@dhcaas.com',
      lastRun: '2026-01-31 17:00',
      nextRun: '2026-02-07 17:00',
      status: 'paused',
    },
  ];

  // ===== EFFECTS =====
  useEffect(() => {
    fetchReports();
    fetchCompletedJobs();
  }, []);

  // ===== API FUNCTIONS =====
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/reports/list?limit=50`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch reports');

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedJobs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/scan-jobs?status=completed&limit=20`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch scan jobs');

      const data = await response.json();
      setScanJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching scan jobs:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedJobId) {
      toast.error('Please select a scan job');
      return;
    }

    try {
      setGenerating(true);
      
      // Generate report
      const generateResponse = await fetch(
        `${API_BASE_URL}/api/v1/reports/generate/${selectedJobId}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      if (!generateResponse.ok) {
        throw new Error('Failed to generate report');
      }

      const generateData = await generateResponse.json();
      toast.success('Report generated successfully!');

      // Automatically download the report
      const downloadUrl = `${API_BASE_URL}${generateData.download_url}`;
      const token = localStorage.getItem('token');
      
      // Create a temporary link to download
      const link = document.createElement('a');
      link.href = `${downloadUrl}?token=${token}`;
      link.download = generateData.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh reports list
      await fetchReports();

      // Reset form
      setSelectedJobId('');
      setReportName('');
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const downloadUrl = `${API_BASE_URL}/api/v1/reports/download/${reportId}`;
      
      // Open in new tab for download
      window.open(`${downloadUrl}?token=${token}`, '_blank');
      
      toast.success('Report download started');
      
      // Refresh reports list to update download count
      setTimeout(() => fetchReports(), 1000);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/reports/${reportId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error('Failed to delete report');

      toast.success('Report deleted successfully');
      await fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const toggleReportStatus = (id: string) => {
    toast('Schedule management coming soon!', { icon: '⏰' });
    console.log(`Toggling report ${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Analytics Hub</h1>
              <p className="text-lg text-gray-400 mt-1">Insights, reports, and data storytelling</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Reports</p>
              <p className="text-2xl font-bold text-white">{reports.length}</p>
            </div>
          </div>
        </div>

        {/* ===== KPI HEADER (3 CARDS) ===== */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <Database className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-sm text-blue-300 font-medium">Total Data Scanned</p>
            </div>
            <p className="text-4xl font-bold text-white">{kpis.dataScanned}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border border-emerald-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-300 font-medium">Issues Resolved</p>
            </div>
            <p className="text-4xl font-bold text-white">{kpis.issuesResolved.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border border-purple-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-purple-400" />
              </div>
              <p className="text-sm text-purple-300 font-medium">Money Saved (ROI)</p>
            </div>
            <p className="text-4xl font-bold text-white">
              ${(kpis.moneySaved / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {/* ===== TABS NAVIGATION ===== */}
        <div className="flex items-center gap-2 mb-6 bg-gray-800 border border-gray-700 rounded-xl p-2">
          <button
            onClick={() => setActiveTab('dashboards')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'dashboards'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Interactive Dashboards
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Report Generator
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'scheduled'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Scheduled Reports
          </button>
        </div>

        {/* ===== TAB CONTENT ===== */}
        {/* TAB 1: INTERACTIVE DASHBOARDS */}
        {activeTab === 'dashboards' && (
          <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Chart 1: Quality Trend */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Quality Trends</h2>
                    <p className="text-sm text-gray-400">Last 30 days performance</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm font-semibold">+13%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {qualityTrendData.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">{item.day}</span>
                        <span className="text-sm font-bold text-white">{item.score}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Error Distribution */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Error Distribution</h2>
                    <p className="text-sm text-gray-400">By data source</p>
                  </div>
                  <PieChart className="w-6 h-6 text-gray-500" />
                </div>

                <div className="space-y-3">
                  {errorDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-gray-300">{item.source}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">{item.count} errors</span>
                        <span className="text-sm font-bold text-white">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex w-full h-4 rounded-full overflow-hidden">
                  {errorDistribution.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full"
                      title={`${item.source}: ${item.percentage}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Additional Metric Cards */}
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Top Data Sources</h2>
                <div className="space-y-3">
                  {[
                    { name: 'customers_prod', records: '1.2M', quality: 98 },
                    { name: 'orders_staging', records: '850K', quality: 95 },
                    { name: 'analytics_raw', records: '2.4M', quality: 92 },
                  ].map((source, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-900 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{source.name}</p>
                        <p className="text-xs text-gray-400">{source.records} records</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-400">{source.quality}%</p>
                        <p className="text-xs text-gray-400">Quality</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Scans</h2>
                <div className="space-y-3">
                  {scanJobs.slice(0, 3).map((scan, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-900 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {scan.datasource_name || 'Scan Job'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {scan.completed_at ? formatDate(scan.completed_at) : 'Running'}
                          </p>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                  ))}
                  
                  {scanJobs.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">No recent scans</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generated Reports List */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Generated Reports</h2>
                    <p className="text-sm text-gray-400 mt-1">Download and manage your PDF reports</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate New
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
              ) : reports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                          Report Name
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                          Data Source
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                          Generated
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                          Downloads
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr
                          key={report._id}
                          className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-purple-400" />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {report.file_name}
                                </p>
                                <p className="text-xs text-gray-400">PDF Report</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm text-white">{report.datasource_name || 'N/A'}</p>
                              <p className="text-xs text-gray-400">{report.datasource_type || ''}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-300">
                              {formatDate(report.generated_at)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-300">
                              {report.download_count || 0}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDownloadReport(report._id, report.file_name)}
                                className="p-2 hover:bg-emerald-900/30 text-emerald-400 rounded-lg transition-colors"
                                title="Download Report"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReport(report._id)}
                                className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg transition-colors"
                                title="Delete Report"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Reports Yet</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Generate your first PDF report from completed scan jobs
                  </p>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                  >
                    Generate Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REPORT GENERATOR */}
        {activeTab === 'generator' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h2 className="text-3xl font-bold text-white mb-2">Custom Report Generator</h2>
                <p className="text-gray-400">
                  Create tailored PDF reports for your data quality insights
                </p>
              </div>

              <div className="space-y-6">
                {/* Select Scan Job */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Select Scan Job *
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-purple-600 transition-colors"
                  >
                    <option value="">-- Select a completed scan job --</option>
                    {scanJobs.map((job) => (
                      <option key={job._id} value={job._id}>
                        {job.datasource_name || job._id} - {formatDate(job.completed_at || '')}
                      </option>
                    ))}
                  </select>
                  {scanJobs.length === 0 && (
                    <p className="text-sm text-amber-400 mt-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      No completed scan jobs available. Please run a scan first.
                    </p>
                  )}
                </div>

                {/* Report Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Report Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g., Monthly Quality Summary"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none focus:border-purple-600 transition-colors"
                  />
                </div>

                {/* Scope Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Data Scope
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedScope('all')}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedScope === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      All Data Sources
                    </button>
                    <button
                      onClick={() => setSelectedScope('specific')}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        selectedScope === 'specific'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      Specific Tables
                    </button>
                  </div>
                </div>

                {/* Metrics Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Metrics to Include
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['completeness', 'uniqueness', 'validity', 'timeliness'].map((metric) => (
                      <button
                        key={metric}
                        onClick={() => {
                          if (selectedMetrics.includes(metric)) {
                            setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
                          } else {
                            setSelectedMetrics([...selectedMetrics, metric]);
                          }
                        }}
                        className={`px-4 py-3 rounded-lg font-medium transition-all capitalize ${
                          selectedMetrics.includes(metric)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {metric}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'pdf', label: 'PDF', available: true },
                      { value: 'csv', label: 'CSV', available: false },
                      { value: 'json', label: 'JSON', available: false },
                    ].map((format) => (
                      <button
                        key={format.value}
                        onClick={() => format.available && setSelectedFormat(format.value)}
                        disabled={!format.available}
                        className={`px-4 py-3 rounded-lg font-medium transition-all uppercase ${
                          selectedFormat === format.value && format.available
                            ? 'bg-emerald-600 text-white'
                            : format.available
                            ? 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                            : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {format.label}
                        {!format.available && (
                          <span className="block text-xs mt-1">Coming Soon</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateReport}
                  disabled={generating || !selectedJobId}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 font-bold text-lg rounded-xl transition-all ${
                    generating || !selectedJobId
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                  }`}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-6 h-6" />
                      Generate Report Now
                    </>
                  )}
                </button>

                {!selectedJobId && (
                  <p className="text-center text-sm text-gray-400">
                    Please select a scan job to generate a report
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SCHEDULED REPORTS */}
        {activeTab === 'scheduled' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Scheduled Reports</h2>
                  <p className="text-sm text-gray-400 mt-1">Automated report delivery (Coming Soon)</p>
                </div>
                <button
                  onClick={() => toast('Feature coming soon!', { icon: '🚀' })}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Create Schedule
                </button>
              </div>
            </div>

            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                    Report Name
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                    Frequency
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                    Recipients
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                    Last Run
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                    Next Run
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {scheduledReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-medium text-white">{report.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {report.frequency}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Mail className="w-4 h-4 text-gray-500" />
                        {report.recipients}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-400">{report.lastRun}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-400">{report.nextRun}</span>
                    </td>
                    <td className="py-4 px-6">
                      {report.status === 'active' ? (
                        <span className="flex items-center gap-2 px-3 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-medium rounded-full border border-emerald-800 w-fit">
                          <Play className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-gray-400 text-xs font-medium rounded-full border border-gray-600 w-fit">
                          <Pause className="w-3 h-3" />
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleReportStatus(report.id)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          title={report.status === 'active' ? 'Pause' : 'Resume'}
                        >
                          {report.status === 'active' ? (
                            <Pause className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Play className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => toast('Feature coming soon!', { icon: '⚙️' })}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          title="Configure"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 bg-gray-900/50 border-t border-gray-700">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">
                  Scheduled reports feature is coming soon. You can currently generate reports on-demand.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
