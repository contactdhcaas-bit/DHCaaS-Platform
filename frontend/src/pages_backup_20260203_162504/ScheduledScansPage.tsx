// src/pages/ScheduledScansPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  Database,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  RefreshCw,
  Zap,
  TrendingUp,
  X,
} from 'lucide-react';

interface ScheduledScan {
  id: string;
  name: string;
  dataSource: string;
  frequency: string;
  nextRun: Date;
  lastRun: Date | null;
  status: 'active' | 'paused' | 'error';
  runsCompleted: number;
}

interface CreateScheduleForm {
  name: string;
  dataSource: string;
  frequency: string;
  time: string;
}

const ScheduledScansPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateScheduleForm>({
    name: '',
    dataSource: '',
    frequency: 'daily',
    time: '02:00',
  });

  // Available data sources (mock - replace with API call)
  const dataSources = [
    'MongoDB Production',
    'PostgreSQL Users',
    'MySQL Customer DB',
    'Redis Cache',
    'Elasticsearch Logs',
  ];

  // Mock data - replace with real API call
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([
    {
      id: '1',
      name: 'Daily Compliance Check',
      dataSource: 'MongoDB Production',
      frequency: 'Daily at 2:00 AM',
      nextRun: new Date(Date.now() + 3 * 60 * 60 * 1000),
      lastRun: new Date(Date.now() - 21 * 60 * 60 * 1000),
      status: 'active',
      runsCompleted: 247,
    },
    {
      id: '2',
      name: 'Weekly Security Audit',
      dataSource: 'PostgreSQL Users',
      frequency: 'Weekly on Monday',
      nextRun: new Date(Date.now() + 48 * 60 * 60 * 1000),
      lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'active',
      runsCompleted: 52,
    },
    {
      id: '3',
      name: 'PII Data Scan',
      dataSource: 'MySQL Customer DB',
      frequency: 'Every 6 hours',
      nextRun: new Date(Date.now() + 30 * 60 * 1000),
      lastRun: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
      status: 'active',
      runsCompleted: 1456,
    },
  ]);

  // Stats
  const stats = {
    totalSchedules: scheduledScans.length,
    activeSchedules: scheduledScans.filter(s => s.status === 'active').length,
    totalRuns: scheduledScans.reduce((sum, s) => sum + s.runsCompleted, 0),
    nextScan: scheduledScans.reduce((earliest, scan) => 
      !earliest || scan.nextRun < earliest ? scan.nextRun : earliest
    , null as Date | null),
  };

  // Calculate time until next run
  const getTimeUntilRun = (nextRun: Date) => {
    const now = new Date();
    const diff = nextRun.getTime() - now.getTime();
    
    if (diff < 0) return { text: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) {
      return {
        text: `${minutes}m`,
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        border: 'border-green-500/30',
        pulse: true,
      };
    } else if (hours < 24) {
      return {
        text: `${hours}h ${minutes}m`,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
      };
    } else {
      const days = Math.floor(hours / 24);
      return {
        text: `${days}d`,
        color: 'text-gray-400',
        bg: 'bg-gray-500/20',
        border: 'border-gray-500/30',
      };
    }
  };

  // Format relative time
  const getRelativeTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Less than an hour ago';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Format frequency text
  const getFrequencyText = (frequency: string, time: string) => {
    switch (frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        return `Weekly on Monday at ${time}`;
      case 'monthly':
        return `Monthly on 1st at ${time}`;
      case '6hours':
        return 'Every 6 hours';
      case '12hours':
        return 'Every 12 hours';
      default:
        return 'Unknown frequency';
    }
  };

  // Actions
  const handleRunNow = (id: string) => {
    console.log('Running scan:', id);
    // Add your run logic here
  };

  const handlePause = (id: string) => {
    setScheduledScans(scans =>
      scans.map(scan =>
        scan.id === id ? { ...scan, status: scan.status === 'active' ? 'paused' : 'active' } : scan
      )
    );
    setActiveMenu(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled scan?')) {
      setScheduledScans(scans => scans.filter(scan => scan.id !== id));
    }
    setActiveMenu(null);
  };

  const handleOpenModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      name: '',
      dataSource: '',
      frequency: 'daily',
      time: '02:00',
    });
  };

  const handleFormChange = (field: keyof CreateScheduleForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSchedule = () => {
    if (!formData.name || !formData.dataSource) {
      alert('Please fill in all required fields');
      return;
    }

    // Calculate next run time based on frequency and time
    const now = new Date();
    const [hours, minutes] = formData.time.split(':').map(Number);
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const newSchedule: ScheduledScan = {
      id: Date.now().toString(),
      name: formData.name,
      dataSource: formData.dataSource,
      frequency: getFrequencyText(formData.frequency, formData.time),
      nextRun,
      lastRun: null,
      status: 'active',
      runsCompleted: 0,
    };

    setScheduledScans(prev => [...prev, newSchedule]);
    handleCloseModal();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenu]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreateModalOpen) {
        handleCloseModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isCreateModalOpen]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Scheduled Scans</h1>
            <p className="text-gray-400">Automate compliance checks and security audits</p>
          </div>
          
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            New Schedule
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Schedules */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 to-purple-900/5 border border-purple-500/30 rounded-2xl p-6 group hover:border-purple-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
            
            <div className="relative">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-purple-400" />
              </div>
              
              <div className="text-4xl font-bold text-white mb-1">
                {stats.totalSchedules}
              </div>
              <div className="text-sm text-gray-400">Total Schedules</div>
            </div>
          </div>

          {/* Active Schedules */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-900/30 to-green-900/5 border border-green-500/30 rounded-2xl p-6 group hover:border-green-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all" />
            
            <div className="relative">
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              
              <div className="text-4xl font-bold text-white mb-1">
                {stats.activeSchedules}
              </div>
              <div className="text-sm text-gray-400">Active Now</div>
            </div>
          </div>

          {/* Total Runs */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/30 to-blue-900/5 border border-blue-500/30 rounded-2xl p-6 group hover:border-blue-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
            
            <div className="relative">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-blue-400" />
              </div>
              
              <div className="text-4xl font-bold text-white mb-1">
                {stats.totalRuns.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Completed Runs</div>
            </div>
          </div>

          {/* Next Scan */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-900/30 to-orange-900/5 border border-orange-500/30 rounded-2xl p-6 group hover:border-orange-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
            
            <div className="relative">
              <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-orange-400" />
              </div>
              
              <div className="text-2xl font-bold text-white mb-1">
                {stats.nextScan ? getTimeUntilRun(stats.nextScan).text : 'None'}
              </div>
              <div className="text-sm text-gray-400">Next Scan</div>
            </div>
          </div>
        </div>

        {/* Scheduled Scans List */}
        {scheduledScans.length === 0 ? (
          // Empty State
          <div className="bg-[#0B1120] border border-gray-800 rounded-2xl p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-purple-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3">
                No Scheduled Scans Yet
              </h3>
              
              <p className="text-gray-400 mb-6">
                Automate your compliance checks by scheduling regular scans. Set it once and let DataGuard AI handle the rest.
              </p>
              
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Your First Schedule
              </button>
            </div>
          </div>
        ) : (
          // Scans Grid
          <div className="grid grid-cols-1 gap-4">
            {scheduledScans.map((scan) => {
              const countdown = getTimeUntilRun(scan.nextRun);
              
              return (
                <div
                  key={scan.id}
                  className="bg-[#0B1120] border border-gray-800 rounded-xl p-6 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left Side - Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Icon */}
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Database className="w-6 h-6 text-purple-400" />
                        </div>
                        
                        {/* Title & Source */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white truncate">
                              {scan.name}
                            </h3>
                            
                            {scan.status === 'active' && (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Active
                              </span>
                            )}
                            
                            {scan.status === 'paused' && (
                              <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-semibold rounded-full">
                                Paused
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                              <Database className="w-4 h-4" />
                              {scan.dataSource}
                            </span>
                            <span className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4" />
                              {scan.frequency}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Next run:</span>
                          <span className={`ml-2 font-semibold ${countdown.color}`}>
                            {countdown.text}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Last run:</span>
                          <span className="ml-2 text-gray-300">
                            {getRelativeTime(scan.lastRun)}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <span className="ml-2 text-gray-300 font-semibold">
                            {scan.runsCompleted}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Side - Actions */}
                    <div className="flex items-center gap-3">
                      {/* Countdown Badge */}
                      <div className={`px-4 py-2 ${countdown.bg} border ${countdown.border} rounded-lg`}>
                        <div className="text-xs text-gray-400 mb-0.5">Next in</div>
                        <div className={`text-lg font-bold ${countdown.color} flex items-center gap-2`}>
                          {countdown.pulse && (
                            <div className={`w-2 h-2 ${countdown.bg} rounded-full animate-pulse`} />
                          )}
                          {countdown.text}
                        </div>
                      </div>
                      
                      {/* Run Now Button */}
                      <button
                        onClick={() => handleRunNow(scan.id)}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-900/30"
                      >
                        <Play className="w-5 h-5" />
                        Run Now
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === scan.id ? null : scan.id);
                          }}
                          className="w-10 h-10 flex items-center justify-center hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        
                        {activeMenu === scan.id && (
                          <div className="absolute right-0 top-12 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-10 animate-slideUp">
                            <button
                              onClick={() => handlePause(scan.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
                            >
                              {scan.status === 'active' ? (
                                <>
                                  <Pause className="w-4 h-4" />
                                  <span className="text-sm font-medium">Pause Schedule</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" />
                                  <span className="text-sm font-medium">Resume Schedule</span>
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleDelete(scan.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 border-t border-gray-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Delete Schedule</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B1120] border border-purple-500/30 rounded-2xl max-w-2xl w-full shadow-2xl shadow-purple-900/20 animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create New Schedule</h2>
                  <p className="text-sm text-gray-400">Automate your compliance scans</p>
                </div>
              </div>
              
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Scan Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Scan Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g., Daily Compliance Check"
                  className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                />
              </div>

              {/* Data Source */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Target Data Source <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.dataSource}
                  onChange={(e) => handleFormChange('dataSource', e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                >
                  <option value="">Select a data source</option>
                  {dataSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frequency and Time Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => handleFormChange('frequency', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                  >
                    <option value="6hours">Every 6 hours</option>
                    <option value="12hours">Every 12 hours</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly (Monday)</option>
                    <option value="monthly">Monthly (1st)</option>
                  </select>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleFormChange('time', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-blue-300 mb-1">
                      Schedule Preview
                    </div>
                    <div className="text-xs text-gray-400">
                      {formData.name || 'Your scan'} will run {getFrequencyText(formData.frequency, formData.time).toLowerCase()} on {formData.dataSource || 'selected data source'}.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              
              <button
                onClick={handleCreateSchedule}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/30 hover:scale-105"
              >
                <CheckCircle2 className="w-5 h-5" />
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ScheduledScansPage;
