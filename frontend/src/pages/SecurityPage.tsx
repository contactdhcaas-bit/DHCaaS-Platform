// src/pages/SecurityPage.tsx
import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Database,
  Users,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  Key,
  FileText,
  TrendingUp,
  Activity,
  Zap,
  Globe,
} from 'lucide-react';

type TabType = 'pii-radar' | 'access-logs' | 'compliance';

interface PIIAsset {
  id: string;
  tableName: string;
  database: string;
  piiFields: string[];
  maskingStatus: 'encrypted' | 'plain' | 'partial';
  riskLevel: 'high' | 'medium' | 'low';
  lastScanned: string;
}

interface AccessLog {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
  status: 'success' | 'denied';
}

interface ComplianceReport {
  id: string;
  title: string;
  framework: string;
  date: string;
  status: 'passed' | 'failed' | 'pending';
  score: number;
}

const SecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pii-radar');
  const [searchQuery, setSearchQuery] = useState('');

  // ===== MOCK DATA: PII ASSETS =====
  const piiAssets: PIIAsset[] = [
    {
      id: '1',
      tableName: 'customers',
      database: 'production_db',
      piiFields: ['email', 'phone', 'address', 'ssn'],
      maskingStatus: 'encrypted',
      riskLevel: 'low',
      lastScanned: '2026-02-04 10:30',
    },
    {
      id: '2',
      tableName: 'user_profiles',
      database: 'production_db',
      piiFields: ['email', 'date_of_birth', 'national_id'],
      maskingStatus: 'encrypted',
      riskLevel: 'low',
      lastScanned: '2026-02-04 09:15',
    },
    {
      id: '3',
      tableName: 'orders',
      database: 'production_db',
      piiFields: ['billing_address', 'credit_card_last4'],
      maskingStatus: 'partial',
      riskLevel: 'medium',
      lastScanned: '2026-02-03 16:45',
    },
    {
      id: '4',
      tableName: 'employee_records',
      database: 'hr_db',
      piiFields: ['ssn', 'bank_account', 'salary', 'email'],
      maskingStatus: 'encrypted',
      riskLevel: 'low',
      lastScanned: '2026-02-04 11:00',
    },
    {
      id: '5',
      tableName: 'application_logs',
      database: 'logging_db',
      piiFields: ['user_email', 'ip_address'],
      maskingStatus: 'plain',
      riskLevel: 'high',
      lastScanned: '2026-02-04 08:20',
    },
    {
      id: '6',
      tableName: 'support_tickets',
      database: 'support_db',
      piiFields: ['customer_email', 'phone_number'],
      maskingStatus: 'plain',
      riskLevel: 'high',
      lastScanned: '2026-02-02 14:30',
    },
  ];

  // ===== MOCK DATA: ACCESS LOGS =====
  const accessLogs: AccessLog[] = [
    {
      id: '1',
      user: 'admin@dhcaas.com',
      action: 'READ',
      resource: 'customers.email',
      timestamp: '2026-02-04 12:45:23',
      ipAddress: '192.168.1.100',
      status: 'success',
    },
    {
      id: '2',
      user: 'analyst@dhcaas.com',
      action: 'EXPORT',
      resource: 'orders.billing_address',
      timestamp: '2026-02-04 12:30:15',
      ipAddress: '192.168.1.105',
      status: 'success',
    },
    {
      id: '3',
      user: 'guest@external.com',
      action: 'READ',
      resource: 'employee_records.ssn',
      timestamp: '2026-02-04 12:15:08',
      ipAddress: '203.45.67.89',
      status: 'denied',
    },
    {
      id: '4',
      user: 'admin@dhcaas.com',
      action: 'UPDATE',
      resource: 'user_profiles.national_id',
      timestamp: '2026-02-04 11:50:42',
      ipAddress: '192.168.1.100',
      status: 'success',
    },
    {
      id: '5',
      user: 'data_engineer@dhcaas.com',
      action: 'READ',
      resource: 'application_logs.user_email',
      timestamp: '2026-02-04 11:30:19',
      ipAddress: '192.168.1.110',
      status: 'success',
    },
    {
      id: '6',
      user: 'contractor@external.com',
      action: 'EXPORT',
      resource: 'customers.ssn',
      timestamp: '2026-02-04 11:10:55',
      ipAddress: '198.51.100.42',
      status: 'denied',
    },
  ];

  // ===== MOCK DATA: COMPLIANCE REPORTS =====
  const complianceReports: ComplianceReport[] = [
    {
      id: '1',
      title: 'CNDP 09-08 Compliance Audit',
      framework: 'CNDP (Morocco)',
      date: '2026-02-01',
      status: 'passed',
      score: 94,
    },
    {
      id: '2',
      title: 'GDPR Readiness Assessment',
      framework: 'GDPR (EU)',
      date: '2026-01-15',
      status: 'passed',
      score: 89,
    },
    {
      id: '3',
      title: 'SOC 2 Type II Certification',
      framework: 'SOC 2',
      date: '2026-01-10',
      status: 'passed',
      score: 96,
    },
    {
      id: '4',
      title: 'ISO 27001 Security Review',
      framework: 'ISO 27001',
      date: '2025-12-20',
      status: 'pending',
      score: 82,
    },
  ];

  // ===== STATS CALCULATIONS =====
  const totalAssets = piiAssets.length;
  const totalPIIFields = piiAssets.reduce((sum, asset) => sum + asset.piiFields.length, 0);
  const complianceRisks = piiAssets.filter((a) => a.maskingStatus === 'plain').length;
  const activePolicies = 12; // Hardcoded
  const securityScore = 94; // Hardcoded

  // ===== MASKING STATUS BADGE =====
  const getMaskingBadge = (status: string) => {
    switch (status) {
      case 'encrypted':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-medium rounded-full border border-emerald-800">
            <Lock className="w-3 h-3" />
            Encrypted
          </span>
        );
      case 'partial':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-900/30 text-yellow-400 text-xs font-medium rounded-full border border-yellow-800">
            <Shield className="w-3 h-3" />
            Partial Mask
          </span>
        );
      case 'plain':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-900/30 text-red-400 text-xs font-medium rounded-full border border-red-800">
            <Eye className="w-3 h-3" />
            Plain Text
          </span>
        );
    }
  };

  // ===== RISK LEVEL BADGE =====
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return (
          <span className="px-3 py-1 bg-red-900/30 text-red-400 text-xs font-bold rounded-full border border-red-800">
            HIGH RISK
          </span>
        );
      case 'medium':
        return (
          <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 text-xs font-bold rounded-full border border-yellow-800">
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="px-3 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-bold rounded-full border border-emerald-800">
            LOW RISK
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Trust & Security Center</h1>
              <p className="text-lg text-gray-400 mt-1">
                End-to-end data protection and compliance monitoring
              </p>
            </div>
          </div>

          {/* Global Security Score */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-white" />
              <p className="text-sm text-white/80 font-medium">Security Score</p>
            </div>
            <p className="text-5xl font-bold text-white mb-1">{securityScore}</p>
            <p className="text-sm text-white/90 font-medium">
              {securityScore >= 90 ? '🛡️ Secure' : securityScore >= 70 ? '⚠️ Moderate' : '🔴 At Risk'}
            </p>
          </div>
        </div>

        {/* ===== TOP KPI CARDS ===== */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Database className="w-8 h-8 text-blue-500" />
              <Activity className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{totalAssets}</p>
            <p className="text-sm text-gray-400">Protected Data Assets</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <Eye className="w-8 h-8 text-purple-500" />
              <Zap className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{totalPIIFields}</p>
            <p className="text-sm text-gray-400">PII Fields Detected</p>
          </div>

          <div className="bg-gray-800 border border-red-900/50 rounded-xl p-5 hover:border-red-800 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <Globe className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-3xl font-bold text-red-400 mb-1">{complianceRisks}</p>
            <p className="text-sm text-gray-400">Compliance Risks</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <FileCheck className="w-8 h-8 text-emerald-500" />
              <CheckCircle className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{activePolicies}</p>
            <p className="text-sm text-gray-400">Active Policies</p>
          </div>
        </div>

        {/* ===== TABS NAVIGATION ===== */}
        <div className="flex items-center gap-2 mb-6 bg-gray-800 border border-gray-700 rounded-xl p-2">
          <button
            onClick={() => setActiveTab('pii-radar')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'pii-radar'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Eye className="w-5 h-5" />
            PII Radar
          </button>
          <button
            onClick={() => setActiveTab('access-logs')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'access-logs'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Activity className="w-5 h-5" />
            Access Logs
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'compliance'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            Compliance Reports
          </button>
        </div>

        {/* ===== TAB CONTENT ===== */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          {/* TAB 1: PII RADAR */}
          {activeTab === 'pii-radar' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">PII Radar</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Monitor sensitive data across all assets
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 outline-none focus:border-purple-600 transition-colors"
                    />
                  </div>
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-300 transition-colors flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {piiAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                          <Database className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{asset.tableName}</h3>
                          <p className="text-sm text-gray-400">{asset.database}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMaskingBadge(asset.maskingStatus)}
                        {getRiskBadge(asset.riskLevel)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {asset.piiFields.map((field, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-medium rounded-full border border-gray-700"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-4 h-4" />
                        Last scanned: {asset.lastScanned}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ACCESS LOGS */}
          {activeTab === 'access-logs' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Access Audit Logs</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Track who accessed sensitive data and when
                  </p>
                </div>
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-gray-300 transition-colors flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last 7 Days
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                        Action
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                        Resource
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                        Timestamp
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                        IP Address
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-white">{log.user}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded-full">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-300 font-mono">{log.resource}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-400">{log.timestamp}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-400 font-mono">{log.ipAddress}</span>
                        </td>
                        <td className="py-4 px-4">
                          {log.status === 'success' ? (
                            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-900/30 text-emerald-400 text-xs font-medium rounded-full border border-emerald-800 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-1 bg-red-900/30 text-red-400 text-xs font-medium rounded-full border border-red-800 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              Denied
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COMPLIANCE REPORTS */}
          {activeTab === 'compliance' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Compliance Reports</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Download audit reports and certifications
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {complianceReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
                          <FileText className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{report.title}</h3>
                          <p className="text-sm text-gray-400">{report.framework}</p>
                        </div>
                      </div>
                      {report.status === 'passed' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                      ) : report.status === 'pending' ? (
                        <Clock className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Compliance Score</span>
                        <span className="text-sm font-bold text-white">{report.score}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600"
                          style={{ width: `${report.score}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {report.date}
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
