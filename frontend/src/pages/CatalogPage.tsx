// src/pages/CatalogPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Database,
  Shield,
  TrendingUp,
  Clock,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Eye,
  BarChart3,
  Users,
  Layers,
  FileText,
} from 'lucide-react';
import DataPreviewModal from '../components/DataPreviewModal';

interface CatalogTable {
  table_name: string;
  total_scans: number;
  avg_quality_score: number;
  has_pii: boolean;
  last_scan_date: string;
  owner: string;
  database_type?: string;
  total_rows?: number;
  issues_count: number;
}

interface CatalogResponse {
  tables: CatalogTable[];
  total_count: number;
  summary: {
    total_tables: number;
    avg_quality: number;
    tables_with_pii: number;
    total_scans: number;
    pii_percentage: number;
  };
}

// Mock catalog data for testing
const mockCatalogData: CatalogResponse = {
  tables: [
    {
      table_name: 'users_table.csv',
      total_scans: 12,
      avg_quality_score: 85,
      has_pii: true,
      last_scan_date: '2026-02-13T14:30:00Z',
      owner: 'Admin Team',
      database_type: 'CSV',
      total_rows: 10,
      issues_count: 2,
    },
    {
      table_name: 'customer_data.csv',
      total_scans: 8,
      avg_quality_score: 92,
      has_pii: true,
      last_scan_date: '2026-02-13T10:15:00Z',
      owner: 'Sales Team',
      database_type: 'CSV',
      total_rows: 5,
      issues_count: 0,
    },
    {
      table_name: 'test_pii_data.csv',
      total_scans: 5,
      avg_quality_score: 78,
      has_pii: true,
      last_scan_date: '2026-02-13T09:00:00Z',
      owner: 'Data Team',
      database_type: 'CSV',
      total_rows: 5,
      issues_count: 3,
    },
  ],
  total_count: 3,
  summary: {
    total_tables: 3,
    avg_quality: 85,
    tables_with_pii: 3,
    total_scans: 25,
    pii_percentage: 100,
  },
};

const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [catalogData, setCatalogData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showPIIOnly, setShowPIIOnly] = useState(false);
  const [qualityFilters, setQualityFilters] = useState({
    critical: true,
    warning: true,
    healthy: true,
  });

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/catalog');
      
      // If API fails, use mock data
      if (!response.ok) {
        console.warn('Catalog API not available, using mock data');
        setCatalogData(mockCatalogData);
        setLoading(false);
        return;
      }

      const data: CatalogResponse = await response.json();
      setCatalogData(data);
      console.log('Catalog loaded:', data.total_count, 'tables');
    } catch (err: any) {
      console.warn('Failed to fetch catalog, using mock data', err);
      // Use mock data instead of showing error
      setCatalogData(mockCatalogData);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTables = (): CatalogTable[] => {
    if (!catalogData) return [];

    let filtered = catalogData.tables;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((table) =>
        table.table_name.toLowerCase().includes(query) ||
        table.owner.toLowerCase().includes(query) ||
        table.database_type?.toLowerCase().includes(query)
      );
    }

    // PII filter
    if (showPIIOnly) {
      filtered = filtered.filter((table) => table.has_pii);
    }

    // Quality filters
    filtered = filtered.filter((table) => {
      const score = table.avg_quality_score;
      if (score < 60 && qualityFilters.critical) return true;
      if (score >= 60 && score < 80 && qualityFilters.warning) return true;
      if (score >= 80 && qualityFilters.healthy) return true;
      return false;
    });

    return filtered;
  };

  const getQualityColor = (score: number): string => {
    if (score >= 80) return 'emerald';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4" />;
    if (score >= 60) return <AlertCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getRelativeTime = (isoDate: string): string => {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const handlePreviewClick = (tableName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remove .csv extension if present, backend searches without it
    const fileId = tableName.replace('.csv', '');
    
    console.log('🔍 Opening preview for:', fileId);
    
    setPreviewFile({ id: fileId, name: tableName });
  };

  const filteredTables = getFilteredTables();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Data Catalog</h1>
              <p className="text-gray-400 mt-1">Explore, search, and govern your data assets</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tables, owners, or database types..."
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Stats Cards */}
        {catalogData && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-blue-500 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Tables</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{catalogData.summary.total_tables}</div>
            </div>

            <div className="bg-gray-800 border border-emerald-700/50 rounded-xl p-4 hover:border-emerald-500 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Avg Quality</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{catalogData.summary.avg_quality}%</div>
            </div>

            <div className="bg-gray-800 border border-purple-700/50 rounded-xl p-4 hover:border-purple-500 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">PII Tables</span>
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">{catalogData.summary.tables_with_pii}</div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-blue-500 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Scans</span>
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold">{catalogData.summary.total_scans}</div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading catalog...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && catalogData && (
          <div className="flex gap-6">
            {/* Left Sidebar - Filters */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 sticky top-8">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Filters</h3>
                </div>

                {/* PII Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Data Sensitivity</h4>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showPIIOnly}
                      onChange={(e) => setShowPIIOnly(e.target.checked)}
                      className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-purple-600"
                    />
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="group-hover:text-white transition-colors">Show PII Only</span>
                    </div>
                  </label>
                </div>

                {/* Quality Level Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Quality Level</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={qualityFilters.critical}
                        onChange={(e) =>
                          setQualityFilters({ ...qualityFilters, critical: e.target.checked })
                        }
                        className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-red-600"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="group-hover:text-white transition-colors">Critical (&lt; 60%)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={qualityFilters.warning}
                        onChange={(e) =>
                          setQualityFilters({ ...qualityFilters, warning: e.target.checked })
                        }
                        className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-yellow-600"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="group-hover:text-white transition-colors">Warning (60-80%)</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={qualityFilters.healthy}
                        onChange={(e) =>
                          setQualityFilters({ ...qualityFilters, healthy: e.target.checked })
                        }
                        className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-emerald-600"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="group-hover:text-white transition-colors">Healthy (&gt; 80%)</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Active Filters Summary */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    Showing <span className="text-white font-semibold">{filteredTables.length}</span> of{' '}
                    <span className="text-white font-semibold">{catalogData.tables.length}</span> tables
                  </div>
                </div>
              </div>
            </div>

            {/* Main Area - Table Cards Grid */}
            <div className="flex-1">
              {filteredTables.length === 0 ? (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                  <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No tables found</h3>
                  <p className="text-gray-400">Try adjusting your filters or search query</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTables.map((table) => {
                    const qualityColor = getQualityColor(table.avg_quality_score);
                    
                    return (
                      <div
                        key={table.table_name}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all group"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                              {table.table_name}
                            </h3>
                            {table.database_type && (
                              <p className="text-xs text-gray-400 mt-1">{table.database_type}</p>
                            )}
                          </div>
                          {table.has_pii && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="bg-red-500/20 border border-red-500 rounded-full px-2 py-1 flex items-center gap-1">
                                <Shield className="w-3 h-3 text-red-400" />
                                <span className="text-xs text-red-400 font-semibold">PII</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="space-y-3 mb-4">
                          {/* Quality Score */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-400">Quality Score</span>
                              <div className={`flex items-center gap-1 text-${qualityColor}-400`}>
                                {getQualityIcon(table.avg_quality_score)}
                                <span className="text-sm font-semibold">{table.avg_quality_score}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full bg-${qualityColor}-500 transition-all duration-500`}
                                style={{
                                  width: `${table.avg_quality_score}%`,
                                  boxShadow: `0 0 8px rgba(${qualityColor === 'emerald' ? '16, 185, 129' : qualityColor === 'yellow' ? '245, 158, 11' : '239, 68, 68'}, 0.5)`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                              <BarChart3 className="w-4 h-4" />
                              <span>{table.total_scans} scans</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <AlertCircle className="w-4 h-4" />
                              <span>{table.issues_count} issues</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Users className="w-4 h-4" />
                            <span className="truncate">{table.owner}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{getRelativeTime(table.last_scan_date)}</span>
                          </div>

                          {table.total_rows && table.total_rows > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <FileText className="w-4 h-4" />
                              <span>{table.total_rows.toLocaleString()} rows</span>
                            </div>
                          )}
                        </div>

                        {/* Card Footer - Two Buttons */}
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => handlePreviewClick(table.table_name, e)}
                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">Preview</span>
                          </button>
                          <button 
                            onClick={() => navigate(`/catalog/${encodeURIComponent(table.table_name)}`)}
                            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-purple-600 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:bg-purple-600"
                          >
                            <span className="text-sm font-medium">Details</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Preview Modal */}
      {previewFile && (
        <DataPreviewModal
          fileId={previewFile.id}
          fileName={previewFile.name}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default CatalogPage;
