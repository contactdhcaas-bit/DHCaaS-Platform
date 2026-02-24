import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Database,
  Cloud,
  ShoppingCart,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Award,
  TrendingUp,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  Download,
  History,
  Network,
  Clock,
  User,
  Globe,
  CreditCard,
  Package,
  ExternalLink,
  CircleDot,
  Sparkles,
} from 'lucide-react';
import {
  getGoldenRecords,
  getGoldenRecordDetails,
  createDemoRecord,
  GoldenRecord,
  SourceRecord
} from '../services/mdmService';

const Customer360Page: React.FC = () => {
  const [customers, setCustomers] = useState<GoldenRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<GoldenRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGoldenRecords(0, 100);
      
      if (!data || !data.items) {
        setCustomers([]);
        return;
      }
      
      setCustomers(data.items);
      if (data.items.length > 0) {
        setSelectedCustomer(data.items[0]);
      }
    } catch (error: any) {
      console.error('Failed to load customers:', error);
      setError(error?.response?.data?.detail || 'Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemo = async () => {
    try {
      setCreatingDemo(true);
      setError(null);
      const newRecord = await createDemoRecord();
      await loadCustomers();
      setSelectedCustomer(newRecord);
    } catch (error: any) {
      console.error('Failed to create demo:', error);
      setError(error?.response?.data?.detail || 'Failed to create demo customer');
    } finally {
      setCreatingDemo(false);
    }
  };

  const handleSelectCustomer = async (customer: GoldenRecord) => {
    try {
      const details = await getGoldenRecordDetails(customer.id);
      setSelectedCustomer(details);
    } catch (error) {
      console.error('Failed to load customer details:', error);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const name = c.golden_data?.name || c.golden_data?.customer_name || '';
    const email = c.golden_data?.email || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getSourceIcon = (source: string) => {
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('crm')) return <Database className="w-4 h-4 text-blue-400" />;
    if (sourceLower.includes('erp')) return <Cloud className="w-4 h-4 text-purple-400" />;
    if (sourceLower.includes('commerce') || sourceLower.includes('ecommerce')) 
      return <ShoppingCart className="w-4 h-4 text-green-400" />;
    return <Database className="w-4 h-4 text-gray-400" />;
  };

  const getFieldIcon = (key: string) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('email')) return <Mail className="w-4 h-4" />;
    if (keyLower.includes('phone')) return <Phone className="w-4 h-4" />;
    if (keyLower.includes('address') || keyLower.includes('city')) return <MapPin className="w-4 h-4" />;
    if (keyLower.includes('company') || keyLower.includes('employer')) return <Building className="w-4 h-4" />;
    if (keyLower.includes('status')) return <CircleDot className="w-4 h-4" />;
    if (keyLower.includes('tier') || keyLower.includes('level')) return <Award className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-emerald-400';
    if (score >= 0.7) return 'text-amber-400';
    return 'text-orange-400';
  };

  const getConfidenceBg = (score: number) => {
    if (score >= 0.9) return 'from-emerald-500/20 via-green-500/10 to-transparent';
    if (score >= 0.7) return 'from-amber-500/20 via-yellow-500/10 to-transparent';
    return 'from-orange-500/20 via-red-500/10 to-transparent';
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('active')) return 'border-emerald-500';
    if (statusLower.includes('inactive')) return 'border-gray-500';
    return 'border-blue-500';
  };

  const generateTimeline = (customer: GoldenRecord) => {
    const events = (customer.source_records || []).map(record => ({
      date: new Date(record.last_updated),
      system: record.source_system,
      action: 'Data Updated',
      icon: getSourceIcon(record.source_system)
    }));

    events.push({
      date: new Date(customer.created_at),
      system: 'MDM System',
      action: 'Golden Record Created',
      icon: <Award className="w-4 h-4 text-yellow-400" />
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-6">
      <div className="max-w-[1900px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                Customer 360° Intelligence
              </h1>
              <p className="text-gray-400 text-lg">Unified profiles with AI-powered data reconciliation</p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadCustomers}
                disabled={loading}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl text-white transition-all flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateDemo}
                disabled={creatingDemo}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 rounded-xl text-white font-semibold transition-all flex items-center gap-2 shadow-2xl shadow-purple-500/50"
              >
                {creatingDemo ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Create Demo Customer
              </motion.button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 backdrop-blur-xl"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </motion.div>
          )}
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Customer List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-3"
          >
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl h-[calc(100vh-200px)] flex flex-col">
              <div className="relative mb-5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                <AnimatePresence>
                  {loading ? (
                    <div className="text-center py-12 text-gray-400">
                      <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
                      <p>Loading...</p>
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-gray-400"
                    >
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="mb-3">No customers found</p>
                      <button
                        onClick={handleCreateDemo}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                      >
                        + Create Demo Customer
                      </button>
                    </motion.div>
                  ) : (
                    filteredCustomers.map((customer, idx) => {
                      const name = customer.golden_data?.name || customer.golden_data?.customer_name || 'Unknown';
                      const email = customer.golden_data?.email || '';
                      const status = customer.golden_data?.status || 'active';
                      const isSelected = selectedCustomer?.id === customer.id;
                      const score = customer.confidence_score || 0;

                      return (
                        <motion.button
                          key={customer.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleSelectCustomer(customer)}
                          className={`w-full p-4 rounded-xl text-left transition-all relative overflow-hidden ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-500/70 shadow-xl shadow-purple-500/20'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 border-2 ${getStatusColor(status)}`}>
                              {name.charAt(0).toUpperCase()}
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                                status.toLowerCase().includes('active') ? 'bg-emerald-500' : 'bg-gray-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white truncate mb-1">{name}</div>
                              <div className="text-xs text-gray-400 truncate mb-2">{email}</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score * 100}%` }}
                                    className={`h-full ${
                                      score >= 0.9 ? 'bg-emerald-400' : score >= 0.7 ? 'bg-amber-400' : 'bg-orange-400'
                                    }`}
                                  />
                                </div>
                                <span className={`text-[10px] font-bold ${getConfidenceColor(score)}`}>
                                  {(score * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <div className="col-span-9">
            <AnimatePresence mode="wait">
              {!selectedCustomer ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-16 text-center h-[calc(100vh-200px)] flex items-center justify-center"
                >
                  <div>
                    <Users className="w-24 h-24 text-gray-600 mx-auto mb-6 opacity-50" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Customer Selected</h3>
                    <p className="text-gray-400 text-lg">Select a customer from the list to view their 360° profile</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedCustomer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-2"
                >
                  {/* Hero Header Card */}
                  <div className={`relative bg-gradient-to-r ${getConfidenceBg(selectedCustomer.confidence_score || 0)} backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-6">
                          <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 ${getStatusColor(selectedCustomer.golden_data?.status || 'active')}`}>
                            {(selectedCustomer.golden_data?.name || selectedCustomer.golden_data?.customer_name || 'U').charAt(0).toUpperCase()}
                            <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-slate-900 ${
                              (selectedCustomer.golden_data?.status || '').toLowerCase().includes('active') ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-gray-500'
                            }`} />
                          </div>
                          <div>
                            <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                              {selectedCustomer.golden_data?.name || selectedCustomer.golden_data?.customer_name || 'Unknown Customer'}
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm font-medium rounded-full border border-purple-500/30">
                                ID: {(selectedCustomer?.id || 'N/A').slice(0, 8)}
                              </span>
                            </h2>
                            <div className="flex items-center gap-6 text-gray-300 mb-3">
                              {selectedCustomer.golden_data?.email && (
                                <span className="flex items-center gap-2">
                                  <Mail className="w-5 h-5 text-blue-400" />
                                  {selectedCustomer.golden_data.email}
                                </span>
                              )}
                              {selectedCustomer.golden_data?.phone && (
                                <span className="flex items-center gap-2">
                                  <Phone className="w-5 h-5 text-green-400" />
                                  {selectedCustomer.golden_data.phone}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {(selectedCustomer.golden_data?.status || 'Active').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-400">
                                {selectedCustomer.source_records?.length || 0} Sources • Updated {formatTimeAgo(new Date(selectedCustomer.updated_at))}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Confidence Score Radial */}
                        <div className="text-center">
                          <div className="relative w-32 h-32">
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-white/10"
                              />
                              <motion.circle
                                initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - (selectedCustomer.confidence_score || 0)) }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={2 * Math.PI * 56}
                                className={getConfidenceColor(selectedCustomer.confidence_score || 0)}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className={`text-3xl font-bold ${getConfidenceColor(selectedCustomer.confidence_score || 0)}`}>
                                {((selectedCustomer.confidence_score || 0) * 100).toFixed(0)}%
                              </span>
                              <span className="text-xs text-gray-400 mt-1">Confidence</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
                        >
                          <Link2 className="w-4 h-4" />
                          Merge Manually
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
                        >
                          <Unlink className="w-4 h-4" />
                          Unlink Source
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Export Profile
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Golden Record - 3 Column Layout */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Golden Record</h3>
                        <p className="text-sm text-gray-400">Unified from {selectedCustomer.source_records?.length || 0} data sources</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(selectedCustomer.golden_data || {}).map(([key, value], idx) => {
                        const confidence = selectedCustomer.field_confidence?.[key] || 0;
                        const fieldIcon = getFieldIcon(key);
                        
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onMouseEnter={() => setHoveredField(key)}
                            onMouseLeave={() => setHoveredField(null)}
                            className="relative bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all group cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
                                  {fieldIcon}
                                </div>
                                <span className="text-sm text-gray-400 group-hover:text-gray-300 capitalize font-medium">
                                  {key.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getSourceIcon('CRM')}
                                <span className={`text-xs font-bold ${getConfidenceColor(confidence)}`}>
                                  {(confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-white font-semibold text-base break-words">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>

                            {/* Tooltip */}
                            <AnimatePresence>
                              {hoveredField === key && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-slate-900 border border-purple-500/50 rounded-lg text-xs text-white whitespace-nowrap shadow-2xl"
                                >
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-purple-400" />
                                    Last updated 2 days ago by CRM
                                  </div>
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 border-r border-b border-purple-500/50 rotate-45" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Timeline */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <History className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Activity Timeline</h3>
                        <p className="text-sm text-gray-400">Recent data synchronization events</p>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-transparent" />
                      <div className="space-y-4">
                        {generateTimeline(selectedCustomer).map((event, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative flex items-start gap-4 pl-4"
                          >
                            <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                              {event.icon}
                            </div>
                            <div className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-semibold">{event.action}</span>
                                <span className="text-xs text-gray-400">{formatTimeAgo(event.date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>Source:</span>
                                <span className="text-purple-400 font-medium">{event.system}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Relationship Graph Placeholder */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Network className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Relationship Graph</h3>
                        <p className="text-sm text-gray-400">Connected entities and hierarchies</p>
                      </div>
                    </div>

                    <div className="h-64 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                      <div className="relative text-center">
                        <Network className="w-16 h-16 text-gray-600 mx-auto mb-3 opacity-50" />
                        <p className="text-gray-400 text-lg font-medium">Relationship visualization coming soon</p>
                        <p className="text-gray-500 text-sm mt-2">Household • Employer • Affiliates</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Source Records Table */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Database className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Source Records</h3>
                        <p className="text-sm text-gray-400">Contributing data sources</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Source System</th>
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Source ID</th>
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Quality</th>
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Last Sync</th>
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedCustomer.source_records || []).map((source, idx) => (
                            <motion.tr
                              key={idx}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="border-b border-white/5 hover:bg-white/5 transition-all group"
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                    {getSourceIcon(source.source_system)}
                                  </div>
                                  <span className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                                    {source.source_system}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-gray-300 font-mono text-sm bg-white/5 px-3 py-1 rounded-lg">
                                  {source.source_id}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 max-w-[100px] h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(source.quality_score || 0) * 100}%` }}
                                      className={`h-full ${getConfidenceColor(source.quality_score || 0).replace('text-', 'bg-')}`}
                                    />
                                  </div>
                                  <span className={`text-sm font-bold ${getConfidenceColor(source.quality_score || 0)}`}>
                                    {((source.quality_score || 0) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-gray-300 text-sm">
                                {formatTimeAgo(new Date(source.last_updated))}
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  ACTIVE
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(147, 51, 234, 0.6), rgba(219, 39, 119, 0.6));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(147, 51, 234, 0.8), rgba(219, 39, 119, 0.8));
        }
      `}</style>
    </div>
  );
};

export default Customer360Page;
