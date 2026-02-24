// src/pages/ScheduledScansPage.tsx
import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Database,
  Activity,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

// ===== TYPES =====
interface Schedule {
  id: string;
  name: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Hourly';
  nextRun: string;
  target: string;
  isActive: boolean;
  description: string;
}

interface ExecutionHistory {
  id: string;
  scanName: string;
  status: 'Success' | 'Failed' | 'Running';
  duration: string;
  rowsScanned: number;
  timestamp: string;
  issues?: number;
}

// ===== MOCK DATA =====
const mockSchedules: Schedule[] = [
  {
    id: 'SCH-001',
    name: 'Daily Sales Data Check',
    frequency: 'Daily',
    nextRun: '2026-02-04T02:00:00',
    target: 'Sales Database',
    isActive: true,
    description: 'Validates sales data completeness and accuracy',
  },
  {
    id: 'SCH-002',
    name: 'Weekly GDPR Compliance Audit',
    frequency: 'Weekly',
    nextRun: '2026-02-10T00:00:00',
    target: 'Customer Data Warehouse',
    isActive: true,
    description: 'Checks PII data handling and retention policies',
  },
  {
    id: 'SCH-003',
    name: 'Hourly Inventory Sync',
    frequency: 'Hourly',
    nextRun: '2026-02-03T21:00:00',
    target: 'Inventory Management',
    isActive: true,
    description: 'Real-time inventory data quality monitoring',
  },
  {
    id: 'SCH-004',
    name: 'Monthly Financial Reports',
    frequency: 'Monthly',
    nextRun: '2026-03-01T06:00:00',
    target: 'Financial Database',
    isActive: false,
    description: 'End-of-month financial data validation',
  },
];

const mockExecutionHistory: ExecutionHistory[] = [
  {
    id: 'EXEC-001',
    scanName: 'Daily Sales Data Check',
    status: 'Success',
    duration: '2m 34s',
    rowsScanned: 1247893,
    timestamp: '2026-02-03T02:00:00',
    issues: 0,
  },
  {
    id: 'EXEC-002',
    scanName: 'Hourly Inventory Sync',
    status: 'Success',
    duration: '45s',
    rowsScanned: 89234,
    timestamp: '2026-02-03T20:00:00',
    issues: 2,
  },
  {
    id: 'EXEC-003',
    scanName: 'Weekly GDPR Compliance Audit',
    status: 'Failed',
    duration: '5m 12s',
    rowsScanned: 0,
    timestamp: '2026-02-03T00:00:00',
    issues: 15,
  },
  {
    id: 'EXEC-004',
    scanName: 'Daily Sales Data Check',
    status: 'Success',
    duration: '2m 41s',
    rowsScanned: 1245671,
    timestamp: '2026-02-02T02:00:00',
    issues: 1,
  },
  {
    id: 'EXEC-005',
    scanName: 'Hourly Inventory Sync',
    status: 'Running',
    duration: '1m 12s',
    rowsScanned: 45621,
    timestamp: '2026-02-03T19:00:00',
    issues: 0,
  },
  {
    id: 'EXEC-006',
    scanName: 'Daily Sales Data Check',
    status: 'Success',
    duration: '2m 38s',
    rowsScanned: 1243124,
    timestamp: '2026-02-01T02:00:00',
    issues: 0,
  },
];

// ===== COMPONENT =====
const ScheduledScansPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);

  // Toggle schedule active state
  const toggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.id === id ? { ...schedule, isActive: !schedule.isActive } : schedule
      )
    );
  };

  // Handle new schedule (mock)
  const handleNewSchedule = () => {
    console.log('🚀 New Schedule Modal Triggered (UI Only)');
    alert('New Schedule Modal (Coming Soon)\n\nThis will open a modal to create a new scheduled scan.');
  };

  // Format next run time
  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return 'Overdue';
    if (diffHours < 1) return `in ${diffMinutes}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Tomorrow';
    return `in ${diffDays}d`;
  };

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Frequency badge color
  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Hourly':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Daily':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Weekly':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Monthly':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Status badge color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Success':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          icon: <CheckCircle2 className="w-4 h-4" />,
        };
      case 'Failed':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          icon: <XCircle className="w-4 h-4" />,
        };
      case 'Running':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          icon: <Activity className="w-4 h-4 animate-pulse" />,
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
          icon: <AlertCircle className="w-4 h-4" />,
        };
    }
  };

  // Stats
  const activeSchedules = schedules.filter((s) => s.isActive).length;
  const successfulScans = mockExecutionHistory.filter((h) => h.status === 'Success').length;
  const successRate = Math.round((successfulScans / mockExecutionHistory.length) * 100);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Scheduled Scans
              </h1>
            </div>
            <p className="text-slate-600 dark:text-gray-400">
              Automate data quality checks with scheduled scan configurations
            </p>
          </div>
          <button
            onClick={handleNewSchedule}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Schedule</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Active Schedules */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-gray-500">Active</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {activeSchedules}
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">Active Schedules</p>
          </div>

          {/* Total Executions */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-gray-500">Total</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {mockExecutionHistory.length}
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">Recent Executions</p>
          </div>

          {/* Success Rate */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-gray-500">Rate</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {successRate}%
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400">Success Rate</p>
          </div>
        </div>

        {/* Active Schedules Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Active Schedules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {schedule.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {schedule.description}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleSchedule(schedule.id)}
                    className={`ml-4 p-2 rounded-lg transition-colors ${
                      schedule.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={schedule.isActive ? 'Pause' : 'Resume'}
                  >
                    {schedule.isActive ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  {/* Frequency */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-gray-400">Frequency:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(
                        schedule.frequency
                      )}`}
                    >
                      {schedule.frequency}
                    </span>
                  </div>

                  {/* Target */}
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-gray-400">Target:</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {schedule.target}
                    </span>
                  </div>

                  {/* Next Run */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-gray-400">Next Run:</span>
                    <span
                      className={`text-sm font-medium ${
                        schedule.isActive
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {schedule.isActive ? formatNextRun(schedule.nextRun) : 'Paused'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Execution History */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Recent Execution History
          </h2>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      Scan Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      Rows Scanned
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      Issues
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {mockExecutionHistory.map((execution) => {
                    const statusDisplay = getStatusDisplay(execution.status);
                    return (
                      <tr
                        key={execution.id}
                        className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {/* Scan Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {execution.scanName}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}
                          >
                            {statusDisplay.icon}
                            {execution.status}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-gray-400">
                            {execution.duration}
                          </span>
                        </td>

                        {/* Rows Scanned */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {execution.rowsScanned.toLocaleString()}
                          </span>
                        </td>

                        {/* Issues */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {execution.issues !== undefined && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                execution.issues === 0
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              }`}
                            >
                              {execution.issues}
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-gray-400">
                            {formatTimestamp(execution.timestamp)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledScansPage;
