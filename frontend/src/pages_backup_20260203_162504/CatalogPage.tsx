import React, { useState, useMemo, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Database,
  FileText,
  Table,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  Info,
  Tag,
  FolderOpen,
  X,
  TrendingUp,
  Calendar,
  MapPin,
  Download,
  Code,
  BarChart3,
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

// Types
interface DataAsset {
  id: string;
  assetName: string;
  assetType: 'CSV' | 'JSON' | 'SQL';
  columnName: string;
  detectedType: 'Personal' | 'Financial' | 'Security' | 'None';
  piiTypes: string[];
  riskScore: number;
  sensitivity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Verified' | 'Unverified';
  lastScanned: string;
  rowCount?: number;
  aiConfidence: number;
  sampleValues?: string[];
  dataLocation?: string;
  tags?: string[];
  scannerId?: string;
  riskTrend?: number[];
  columnsCount?: number;
  safeDataPercentage?: number;
  sensitiveDataPercentage?: number;
}

// Mock Data
const MOCK_DATA: DataAsset[] = [
  {
    id: '1',
    assetName: 'customer_database.csv',
    assetType: 'CSV',
    columnName: 'email_address',
    detectedType: 'Personal',
    piiTypes: ['Email'],
    riskScore: 85,
    sensitivity: 'High',
    status: 'Verified',
    lastScanned: '2026-02-02T12:30:00Z',
    rowCount: 12500,
    aiConfidence: 98,
    sampleValues: [
      'john.doe@*****.com',
      'sarah.m@*****.com',
      'alex.***@gmail.com',
      'emma.wilson@*****.net',
      'mike.r@*****.org',
    ],
    dataLocation: 'AWS S3 > Marketing Bucket > customer_database.csv',
    tags: ['GDPR', 'Marketing', 'CRM'],
    scannerId: 'SCAN-2026-001',
    riskTrend: [75, 78, 82, 85, 85],
    columnsCount: 12,
    safeDataPercentage: 75,
    sensitiveDataPercentage: 25,
  },
  {
    id: '2',
    assetName: 'customer_database.csv',
    assetType: 'CSV',
    columnName: 'credit_card_number',
    detectedType: 'Financial',
    piiTypes: ['Credit Card'],
    riskScore: 95,
    sensitivity: 'Critical',
    status: 'Verified',
    lastScanned: '2026-02-02T12:30:00Z',
    rowCount: 12500,
    aiConfidence: 99,
    sampleValues: [
      '4532-XXXX-XXXX-8890',
      '5500-XXXX-XXXX-1234',
      '3782-XXXX-XXXX-5678',
      '6011-XXXX-XXXX-9012',
      '4111-XXXX-XXXX-3456',
    ],
    dataLocation: 'AWS S3 > Finance Bucket > customer_database.csv',
    tags: ['PCI-DSS', 'Finance', 'Payment'],
    scannerId: 'SCAN-2026-001',
    riskTrend: [88, 90, 92, 94, 95],
    columnsCount: 12,
    safeDataPercentage: 20,
    sensitiveDataPercentage: 80,
  },
  {
    id: '3',
    assetName: 'employee_records.csv',
    assetType: 'CSV',
    columnName: 'social_security_number',
    detectedType: 'Security',
    piiTypes: ['SSN'],
    riskScore: 98,
    sensitivity: 'Critical',
    status: 'Unverified',
    lastScanned: '2026-02-01T14:20:00Z',
    rowCount: 3400,
    aiConfidence: 97,
    sampleValues: ['***-**-1234', '***-**-5678', '***-**-9012', '***-**-3456', '***-**-7890'],
    dataLocation: 'Azure Blob > HR Container > employee_records.csv',
    tags: ['HR', 'Confidential', 'Internal'],
    scannerId: 'SCAN-2026-002',
    riskTrend: [92, 94, 96, 97, 98],
    columnsCount: 8,
    safeDataPercentage: 15,
    sensitiveDataPercentage: 85,
  },
  {
    id: '4',
    assetName: 'transactions.json',
    assetType: 'JSON',
    columnName: 'card_number',
    detectedType: 'Financial',
    piiTypes: ['Credit Card'],
    riskScore: 92,
    sensitivity: 'Critical',
    status: 'Verified',
    lastScanned: '2026-02-02T10:00:00Z',
    rowCount: 45000,
    aiConfidence: 99,
    sampleValues: [
      '6011-XXXX-XXXX-2345',
      '4111-XXXX-XXXX-6789',
      '5431-XXXX-XXXX-0123',
      '3714-XXXX-XXXX-4567',
      '4532-XXXX-XXXX-8901',
    ],
    dataLocation: 'GCP Storage > E-commerce > transactions.json',
    tags: ['PCI-DSS', 'E-commerce', 'Sales'],
    scannerId: 'SCAN-2026-003',
    riskTrend: [85, 87, 89, 91, 92],
    columnsCount: 15,
    safeDataPercentage: 30,
    sensitiveDataPercentage: 70,
  },
  {
    id: '5',
    assetName: 'analytics_data.csv',
    assetType: 'CSV',
    columnName: 'user_id',
    detectedType: 'None',
    piiTypes: [],
    riskScore: 25,
    sensitivity: 'Low',
    status: 'Verified',
    lastScanned: '2026-02-02T11:45:00Z',
    rowCount: 125000,
    aiConfidence: 82,
    sampleValues: ['usr_8a7b9c', 'usr_3f4e2d', 'usr_9k1m0n', 'usr_5p6q7r', 'usr_2s3t4u'],
    dataLocation: 'On-Premise > Analytics Server > analytics_data.csv',
    tags: ['Analytics', 'Public'],
    scannerId: 'SCAN-2026-004',
    riskTrend: [30, 28, 26, 25, 25],
    columnsCount: 20,
    safeDataPercentage: 95,
    sensitiveDataPercentage: 5,
  },
];

const DataCatalogPage: React.FC = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSensitivity, setSelectedSensitivity] = useState<string[]>([]);
  const [selectedPIITypes, setSelectedPIITypes] = useState<string[]>([]);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<string[]>([]);
  const [expandedFilters, setExpandedFilters] = useState({
    sensitivity: true,
    piiType: true,
    assetType: true,
  });
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeepDiveModalOpen, setIsDeepDiveModalOpen] = useState(false);

  // Fetch from API
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['dataCatalog'],
    queryFn: async () => {
      const response = await fetch('/api/data-catalog');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json() as Promise<DataAsset[]>;
    },
  });

  const allData = useMemo(() => {
    const realData = apiData || [];
    return realData.length > 0 ? realData : MOCK_DATA;
  }, [apiData]);

  // Filter counters
  const filterCounts = useMemo(() => {
    return {
      sensitivity: {
        Critical: allData.filter((a) => a.sensitivity === 'Critical').length,
        High: allData.filter((a) => a.sensitivity === 'High').length,
        Medium: allData.filter((a) => a.sensitivity === 'Medium').length,
        Low: allData.filter((a) => a.sensitivity === 'Low').length,
      },
      piiType: {
        Email: allData.filter((a) => a.piiTypes.includes('Email')).length,
        'Credit Card': allData.filter((a) => a.piiTypes.includes('Credit Card')).length,
        SSN: allData.filter((a) => a.piiTypes.includes('SSN')).length,
        Phone: allData.filter((a) => a.piiTypes.includes('Phone')).length,
        Passport: allData.filter((a) => a.piiTypes.includes('Passport')).length,
      },
      assetType: {
        CSV: allData.filter((a) => a.assetType === 'CSV').length,
        JSON: allData.filter((a) => a.assetType === 'JSON').length,
        SQL: allData.filter((a) => a.assetType === 'SQL').length,
      },
    };
  }, [allData]);

  // Client-side filtering
  const filteredData = useMemo(() => {
    return allData.filter((asset) => {
      const matchesSearch =
        searchQuery === '' ||
        asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.columnName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.piiTypes.some((pii) => pii.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSensitivity =
        selectedSensitivity.length === 0 || selectedSensitivity.includes(asset.sensitivity);

      const matchesPIIType =
        selectedPIITypes.length === 0 ||
        asset.piiTypes.some((pii) => selectedPIITypes.includes(pii));

      const matchesAssetType =
        selectedAssetTypes.length === 0 || selectedAssetTypes.includes(asset.assetType);

      return matchesSearch && matchesSensitivity && matchesPIIType && matchesAssetType;
    });
  }, [allData, searchQuery, selectedSensitivity, selectedPIITypes, selectedAssetTypes]);

  // Helper functions
  const toggleFilter = (section: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSensitivity = (level: string) => {
    setSelectedSensitivity((prev) =>
      prev.includes(level) ? prev.filter((s) => s !== level) : [...prev, level]
    );
  };

  const togglePIIType = (type: string) => {
    setSelectedPIITypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAssetType = (type: string) => {
    setSelectedAssetTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedSensitivity([]);
    setSelectedPIITypes([]);
    setSelectedAssetTypes([]);
    setSearchQuery('');
  };

  const openDrawer = (asset: DataAsset) => {
    setSelectedAsset(asset);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedAsset(null), 300);
  };

  const openDeepDive = () => {
    setIsDeepDiveModalOpen(true);
  };

  const closeDeepDive = () => {
    setIsDeepDiveModalOpen(false);
  };

  const downloadReport = () => {
    if (!selectedAsset) return;
    alert(`Downloading PDF report for ${selectedAsset.assetName}...`);
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'CSV':
        return <FileText className="w-4 h-4" />;
      case 'JSON':
        return <Database className="w-4 h-4" />;
      case 'SQL':
        return <Table className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSensitivityBadge = (sensitivity: string) => {
    const configs = {
      Critical: {
        class: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: <ShieldAlert className="w-3 h-3" />,
      },
      High: {
        class: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        icon: <AlertTriangle className="w-3 h-3" />,
      },
      Medium: {
        class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: <Shield className="w-3 h-3" />,
      },
      Low: {
        class: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: <Shield className="w-3 h-3" />,
      },
    };
    return configs[sensitivity as keyof typeof configs] || configs.Low;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      Personal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Financial: 'bg-red-500/20 text-red-400 border-red-500/30',
      Security: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      None: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[type as keyof typeof colors] || colors.None;
  };

  const getRiskColor = (score: number) => {
    if (score >= 90) return 'bg-red-500';
    if (score >= 70) return 'bg-orange-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRiskTooltip = (asset: DataAsset) => {
    const factors = [];
    if (asset.sensitivity === 'Critical') factors.push('Critical sensitivity level');
    if (asset.sensitivity === 'High') factors.push('High sensitivity level');
    if (asset.status === 'Unverified') factors.push('Unverified status');
    if (asset.piiTypes.length > 2) factors.push(`${asset.piiTypes.length} PII types detected`);
    return `Score impacted by: ${factors.join(' + ')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Data Catalog</h1>
            <p className="text-sm md:text-base text-slate-400">
              Enterprise-grade data discovery with AI-powered PII detection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{filteredData.length} assets found</span>
            {(selectedSensitivity.length > 0 ||
              selectedPIITypes.length > 0 ||
              selectedAssetTypes.length > 0 ||
              searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Glass Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for assets, columns, or PII tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-400 text-base md:text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar - Hidden on mobile by default */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Filters</h2>
            </div>

            {/* Sensitivity Filter */}
            <div className="mb-6">
              <button
                onClick={() => toggleFilter('sensitivity')}
                className="flex items-center justify-between w-full mb-3"
              >
                <span className="text-sm font-medium text-slate-300">Sensitivity</span>
                {expandedFilters.sensitivity ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {expandedFilters.sensitivity && (
                <div className="space-y-2">
                  {['Critical', 'High', 'Medium', 'Low'].map((level) => (
                    <label
                      key={level}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSensitivity.includes(level)}
                        onChange={() => toggleSensitivity(level)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300 flex-1">{level}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({filterCounts.sensitivity[level as keyof typeof filterCounts.sensitivity]})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* PII Type Filter */}
            <div className="mb-6">
              <button
                onClick={() => toggleFilter('piiType')}
                className="flex items-center justify-between w-full mb-3"
              >
                <span className="text-sm font-medium text-slate-300">PII Type</span>
                {expandedFilters.piiType ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {expandedFilters.piiType && (
                <div className="space-y-2">
                  {['Email', 'Credit Card', 'SSN', 'Phone', 'Passport'].map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPIITypes.includes(type)}
                        onChange={() => togglePIIType(type)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300 flex-1">{type}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({filterCounts.piiType[type as keyof typeof filterCounts.piiType]})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Asset Type Filter */}
            <div>
              <button
                onClick={() => toggleFilter('assetType')}
                className="flex items-center justify-between w-full mb-3"
              >
                <span className="text-sm font-medium text-slate-300">Asset Type</span>
                {expandedFilters.assetType ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {expandedFilters.assetType && (
                <div className="space-y-2">
                  {['CSV', 'JSON', 'SQL'].map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssetTypes.includes(type)}
                        onChange={() => toggleAssetType(type)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300 flex-1">{type}</span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({filterCounts.assetType[type as keyof typeof filterCounts.assetType]})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                <Database className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No assets found</h3>
                <p className="text-slate-400">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-900/50 border-b border-white/10">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Column
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Risk Score
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Sensitivity
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((asset) => {
                      const sensitivityConfig = getSensitivityBadge(asset.sensitivity);
                      return (
                        <tr
                          key={asset.id}
                          onClick={() => openDrawer(asset)}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
                                {getAssetIcon(asset.assetType)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  {asset.assetName}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {asset.rowCount?.toLocaleString()} rows
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-semibold text-white">
                              {asset.columnName}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${getTypeBadge(
                                  asset.detectedType
                                )}`}
                              >
                                {asset.detectedType}
                              </span>
                              <span
                                className={`text-xs font-bold ${getConfidenceColor(
                                  asset.aiConfidence
                                )}`}
                              >
                                {asset.aiConfidence}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="group relative flex items-center gap-2">
                              <div className="flex-1 min-w-[60px]">
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getRiskColor(asset.riskScore)}`}
                                    style={{ width: `${asset.riskScore}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-white w-8">
                                {asset.riskScore}
                              </span>
                              <Info className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                              <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 border border-white/20 rounded-lg p-3 shadow-xl z-10">
                                <p className="text-xs text-slate-300">{getRiskTooltip(asset)}</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 border-b border-r border-white/20 rotate-45" />
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${sensitivityConfig.class}`}
                            >
                              {sensitivityConfig.icon}
                              {asset.sensitivity}
                            </span>
                          </td>
                          <td className="p-3">
                            {asset.status === 'Verified' ? (
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-orange-400">
                                <XCircle className="w-4 h-4" />
                                <span className="text-xs">Unverified</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                                <Clock className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER */}
      <Transition.Root show={isDrawerOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeDrawer}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                    <div className="flex h-full flex-col bg-slate-900 shadow-xl border-l border-white/10">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <Dialog.Title className="text-xl font-bold text-white mb-1 truncate">
                              {selectedAsset?.assetName}
                            </Dialog.Title>
                            <p className="text-sm text-blue-100">
                              Column: <span className="font-mono">{selectedAsset?.columnName}</span>
                            </p>
                          </div>
                          <button
                            onClick={closeDrawer}
                            className="ml-3 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                        {selectedAsset && (
                          <>
                            {/* Risk Trend */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
                              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                Risk Trend (Last 5 Scans)
                              </h3>
                              <div className="flex items-end gap-2 h-20">
                                {selectedAsset.riskTrend?.map((value, idx) => (
                                  <div
                                    key={idx}
                                    className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all hover:opacity-80"
                                    style={{ height: `${value}%` }}
                                    title={`Scan ${idx + 1}: ${value}%`}
                                  />
                                ))}
                              </div>
                              <div className="flex justify-between mt-2 text-xs text-slate-400">
                                <span>5 scans ago</span>
                                <span>Latest</span>
                              </div>
                            </div>

                            {/* Sample Data */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
                              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-green-400" />
                                Sample Values (Masked)
                              </h3>
                              <div className="space-y-2">
                                {selectedAsset.sampleValues?.map((value, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-slate-900/50 border border-white/10 rounded-lg p-3 font-mono text-xs md:text-sm text-slate-300 break-all"
                                  >
                                    {value}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
                              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-purple-400" />
                                Metadata
                              </h3>
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-400 mb-1">Data Location</p>
                                    <p className="text-sm text-white font-mono break-all">
                                      {selectedAsset.dataLocation}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-400 mb-1">Last Scanned</p>
                                    <p className="text-sm text-white">
                                      {formatDate(selectedAsset.lastScanned)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Database className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-400 mb-1">Scanner ID</p>
                                    <p className="text-sm text-white font-mono">
                                      {selectedAsset.scannerId}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
                              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Tag className="w-4 h-4 text-yellow-400" />
                                Tags
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {selectedAsset.tags?.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-medium"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-white/10 p-4 md:p-6 bg-slate-900/50">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={openDeepDive}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                          >
                            View Full Details
                          </button>
                          <button
                            onClick={closeDrawer}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* DEEP DIVE MODAL (Centered) */}
      <Transition.Root show={isDeepDiveModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={closeDeepDive}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 md:px-8 py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <Dialog.Title className="text-xl md:text-2xl font-bold text-white mb-1 truncate">
                          Deep Dive: {selectedAsset?.assetName}
                        </Dialog.Title>
                        <p className="text-sm text-purple-100">
                          Comprehensive asset analysis and metadata
                        </p>
                      </div>
                      <button
                        onClick={closeDeepDive}
                        className="ml-3 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {selectedAsset && (
                      <>
                        {/* Data Distribution Chart */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                            Data Distribution
                          </h3>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="space-y-4">
                              {/* Safe Data Bar */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-300">
                                    Safe Data
                                  </span>
                                  <span className="text-sm font-bold text-green-400">
                                    {selectedAsset.safeDataPercentage}%
                                  </span>
                                </div>
                                <div className="h-8 bg-white/10 rounded-lg overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center text-white text-xs font-semibold"
                                    style={{ width: `${selectedAsset.safeDataPercentage}%` }}
                                  >
                                    {selectedAsset.safeDataPercentage}%
                                  </div>
                                </div>
                              </div>

                              {/* Sensitive Data Bar */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-300">
                                    Sensitive Data
                                  </span>
                                  <span className="text-sm font-bold text-red-400">
                                    {selectedAsset.sensitiveDataPercentage}%
                                  </span>
                                </div>
                                <div className="h-8 bg-white/10 rounded-lg overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-white text-xs font-semibold"
                                    style={{
                                      width: `${selectedAsset.sensitiveDataPercentage}%`,
                                    }}
                                  >
                                    {selectedAsset.sensitiveDataPercentage}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* JSON Metadata View */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Code className="w-5 h-5 text-purple-400" />
                            Raw Metadata (JSON)
                          </h3>
                          <div className="bg-slate-950 border border-white/10 rounded-xl p-4 md:p-6 overflow-x-auto">
                            <pre className="text-xs md:text-sm text-slate-300 font-mono">
                              {JSON.stringify(
                                {
                                  id: selectedAsset.id,
                                  asset_name: selectedAsset.assetName,
                                  asset_type: selectedAsset.assetType,
                                  column_name: selectedAsset.columnName,
                                  detected_type: selectedAsset.detectedType,
                                  pii_types: selectedAsset.piiTypes,
                                  risk_score: selectedAsset.riskScore,
                                  sensitivity: selectedAsset.sensitivity,
                                  ai_confidence: selectedAsset.aiConfidence,
                                  scanned_at: selectedAsset.lastScanned,
                                  scanner_id: selectedAsset.scannerId,
                                  columns_count: selectedAsset.columnsCount,
                                  rows_count: selectedAsset.rowCount,
                                  data_location: selectedAsset.dataLocation,
                                  tags: selectedAsset.tags,
                                  safe_data_percentage: selectedAsset.safeDataPercentage,
                                  sensitive_data_percentage:
                                    selectedAsset.sensitiveDataPercentage,
                                },
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="border-t border-white/10 p-4 md:p-6 bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={downloadReport}
                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Asset Report (PDF)
                      </button>
                      <button
                        onClick={closeDeepDive}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default DataCatalogPage;
