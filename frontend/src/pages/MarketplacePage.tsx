// src/pages/MarketplacePage.tsx
import React, { useState } from 'react';
import {
  Search,
  Database,
  BarChart3,
  Users,
  Cloud,
  Package,
  Star,
  CheckCircle,
  Download,
  Settings,
  Sparkles,
  Shield,
  Zap,
  GitBranch,
  Mail,
  FileText,
  Lock,
  Server,
  HardDrive,
  Workflow,
  Globe,
  Crown,
} from 'lucide-react';

type CategoryType = 'all' | 'databases' | 'bi' | 'crm' | 'storage' | 'cloud';
type AppStatus = 'installed' | 'available' | 'premium';

interface App {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  category: CategoryType;
  rating: number;
  installs: string;
  status: AppStatus;
  verified: boolean;
  featured: boolean;
}

const MarketplacePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [apps, setApps] = useState<App[]>([
    // Featured Apps
    {
      id: '1',
      name: 'Snowflake',
      description: 'Native connector for high-speed data warehouse ingestion',
      icon: Database,
      iconColor: '#29B5E8',
      category: 'databases',
      rating: 4.9,
      installs: '12.5K',
      status: 'installed',
      verified: true,
      featured: true,
    },
    {
      id: '2',
      name: 'AWS S3',
      description: 'Seamless integration with Amazon S3 buckets and object storage',
      icon: Cloud,
      iconColor: '#FF9900',
      category: 'storage',
      rating: 4.8,
      installs: '18.2K',
      status: 'installed',
      verified: true,
      featured: true,
    },
    {
      id: '3',
      name: 'Salesforce',
      description: 'Sync CRM data with real-time bidirectional updates',
      icon: Users,
      iconColor: '#00A1E0',
      category: 'crm',
      rating: 4.7,
      installs: '9.8K',
      status: 'available',
      verified: true,
      featured: true,
    },

    // Databases
    {
      id: '4',
      name: 'PostgreSQL',
      description: 'Connect to PostgreSQL databases with automatic schema detection',
      icon: Database,
      iconColor: '#336791',
      category: 'databases',
      rating: 4.8,
      installs: '15.3K',
      status: 'installed',
      verified: true,
      featured: false,
    },
    {
      id: '5',
      name: 'MongoDB',
      description: 'NoSQL database connector with collection-level scanning',
      icon: Database,
      iconColor: '#47A248',
      category: 'databases',
      rating: 4.6,
      installs: '11.2K',
      status: 'available',
      verified: true,
      featured: false,
    },
    {
      id: '6',
      name: 'MySQL',
      description: 'Fast and reliable MySQL database integration',
      icon: Database,
      iconColor: '#00758F',
      category: 'databases',
      rating: 4.9,
      installs: '22.1K',
      status: 'installed',
      verified: true,
      featured: false,
    },

    // BI Tools
    {
      id: '7',
      name: 'Power BI',
      description: 'Publish datasets directly to Microsoft Power BI workspaces',
      icon: BarChart3,
      iconColor: '#F2C811',
      category: 'bi',
      rating: 4.7,
      installs: '8.5K',
      status: 'available',
      verified: true,
      featured: false,
    },
    {
      id: '8',
      name: 'Tableau',
      description: 'Export clean data to Tableau for advanced visualizations',
      icon: BarChart3,
      iconColor: '#E97627',
      category: 'bi',
      rating: 4.8,
      installs: '7.9K',
      status: 'premium',
      verified: true,
      featured: false,
    },

    // CRM
    {
      id: '9',
      name: 'HubSpot',
      description: 'Integrate marketing and sales data from HubSpot CRM',
      icon: Users,
      iconColor: '#FF7A59',
      category: 'crm',
      rating: 4.5,
      installs: '6.2K',
      status: 'available',
      verified: false,
      featured: false,
    },

    // Storage
    {
      id: '10',
      name: 'Google Cloud Storage',
      description: 'Connect to GCS buckets with automatic file detection',
      icon: Cloud,
      iconColor: '#4285F4',
      category: 'storage',
      rating: 4.6,
      installs: '10.3K',
      status: 'available',
      verified: true,
      featured: false,
    },
    {
      id: '11',
      name: 'Azure Blob Storage',
      description: 'Microsoft Azure blob storage integration',
      icon: Cloud,
      iconColor: '#0078D4',
      category: 'storage',
      rating: 4.4,
      installs: '5.8K',
      status: 'premium',
      verified: true,
      featured: false,
    },

    // Cloud Platforms
    {
      id: '12',
      name: 'Databricks',
      description: 'Unified analytics platform connector with Delta Lake support',
      icon: Zap,
      iconColor: '#FF3621',
      category: 'cloud',
      rating: 4.9,
      installs: '4.2K',
      status: 'premium',
      verified: true,
      featured: false,
    },
  ]);

  const [installingApps, setInstallingApps] = useState<Set<string>>(new Set());

  // Categories
  const categories = [
    { id: 'all', label: 'All Apps', icon: Package },
    { id: 'databases', label: 'Databases', icon: Database },
    { id: 'bi', label: 'BI Tools', icon: BarChart3 },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'cloud', label: 'Cloud', icon: Globe },
  ];

  // Filter Apps
  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredApps = apps.filter((app) => app.featured);

  // Handle Install
  const handleInstall = (appId: string) => {
    setInstallingApps(new Set(installingApps).add(appId));

    // Simulate installation delay
    setTimeout(() => {
      setApps(
        apps.map((app) =>
          app.id === appId ? { ...app, status: 'installed' as AppStatus } : app
        )
      );
      setInstallingApps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }, 2000);
  };

  // Get Status Button
  const getStatusButton = (app: App) => {
    const isInstalling = installingApps.has(app.id);

    if (isInstalling) {
      return (
        <button
          disabled
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg cursor-not-allowed"
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Installing...
        </button>
      );
    }

    switch (app.status) {
      case 'installed':
        return (
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        );
      case 'premium':
        return (
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-medium rounded-lg transition-all">
            <Crown className="w-4 h-4" />
            Upgrade
          </button>
        );
      case 'available':
      default:
        return (
          <button
            onClick={() => handleInstall(app.id)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Install
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Integration Marketplace</h1>
              <p className="text-lg text-gray-400 mt-1">
                Connect to 100+ data sources and platforms
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs text-gray-400">Installed</p>
              <p className="text-sm font-bold text-white">
                {apps.filter((a) => a.status === 'installed').length} Apps
              </p>
            </div>
          </div>
        </div>

        {/* ===== SEARCH & FILTERS ===== */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find a connector (e.g. Snowflake, AWS, Tableau)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-lg outline-none focus:border-purple-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as CategoryType)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== FEATURED APPS (CAROUSEL) ===== */}
        {selectedCategory === 'all' && searchQuery === '' && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">Featured Integrations</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {featuredApps.map((app) => {
                const Icon = app.icon;
                return (
                  <div
                    key={app.id}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-purple-600 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: `${app.iconColor}20` }}
                      >
                        <Icon className="w-9 h-9" style={{ color: app.iconColor }} />
                      </div>
                      {app.verified && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full border border-blue-800">
                          <Shield className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{app.name}</h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{app.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-white">{app.rating}</span>
                        <span>({app.installs})</span>
                      </div>
                      {getStatusButton(app)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== ALL APPS GRID ===== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              {selectedCategory === 'all' ? 'All Integrations' : `${categories.find(c => c.id === selectedCategory)?.label}`}
            </h2>
            <p className="text-sm text-gray-400">
              {filteredApps.length} {filteredApps.length === 1 ? 'result' : 'results'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {filteredApps.map((app) => {
              const Icon = app.icon;
              return (
                <div
                  key={app.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                      style={{ backgroundColor: `${app.iconColor}20` }}
                    >
                      <Icon className="w-7 h-7" style={{ color: app.iconColor }} />
                    </div>
                    {app.verified && (
                      <Shield className="w-4 h-4 text-blue-400" title="Verified Partner" />
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{app.name}</h3>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2 h-8">
                    {app.description}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-white">{app.rating}</span>
                    <span className="mx-1">•</span>
                    <span>{app.installs} installs</span>
                  </div>

                  {getStatusButton(app)}
                </div>
              );
            })}
          </div>

          {filteredApps.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No apps found</h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
