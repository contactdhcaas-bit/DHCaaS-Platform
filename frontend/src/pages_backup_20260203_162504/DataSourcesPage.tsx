import React, { useState } from 'react';
import {
  Database,
  Cloud,
  Server,
  CheckCircle2,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Shield,
  MessageSquare,
  Box,
  Trash2,
  Zap,
  TrendingUp,
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'error';
  host: string;
  lastSync: Date;
  recordCount: number;
  icon: any;
  color: string;
}

interface Connector {
  id: string;
  name: string;
  type: 'database' | 'cloud' | 'saas';
  description: string;
  icon: any;
  color: string;
  bgGradient: string;
}

const DataSourcesPage: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: '1',
      name: 'MongoDB Production',
      type: 'MongoDB',
      status: 'active',
      host: 'mongodb.example.com',
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      recordCount: 125430,
      icon: Database,
      color: 'text-green-400',
    },
    {
      id: '2',
      name: 'PostgreSQL Users',
      type: 'PostgreSQL',
      status: 'active',
      host: 'postgres.example.com',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      recordCount: 45620,
      icon: Server,
      color: 'text-blue-400',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false);

  const [formData, setFormData] = useState({
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
  });

  const connectors: Connector[] = [
    {
      id: 'mongodb',
      name: 'MongoDB',
      type: 'database',
      description: 'Connect to MongoDB Atlas or self-hosted clusters',
      icon: Database,
      color: 'text-green-400',
      bgGradient: 'from-green-900/30 to-green-900/5',
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      type: 'database',
      description: 'Connect to PostgreSQL databases',
      icon: Server,
      color: 'text-blue-400',
      bgGradient: 'from-blue-900/30 to-blue-900/5',
    },
    {
      id: 'mysql',
      name: 'MySQL',
      type: 'database',
      description: 'Connect to MySQL or MariaDB databases',
      icon: Database,
      color: 'text-orange-400',
      bgGradient: 'from-orange-900/30 to-orange-900/5',
    },
    {
      id: 'redis',
      name: 'Redis',
      type: 'database',
      description: 'Connect to Redis cache and data stores',
      icon: Zap,
      color: 'text-red-400',
      bgGradient: 'from-red-900/30 to-red-900/5',
    },
    {
      id: 'aws-s3',
      name: 'AWS S3',
      type: 'cloud',
      description: 'Connect to Amazon S3 buckets',
      icon: Cloud,
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-900/30 to-yellow-900/5',
    },
    {
      id: 'gcs',
      name: 'Google Cloud Storage',
      type: 'cloud',
      description: 'Connect to GCS buckets',
      icon: Cloud,
      color: 'text-blue-400',
      bgGradient: 'from-blue-900/30 to-blue-900/5',
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      type: 'saas',
      description: 'Connect to Salesforce CRM data',
      icon: Shield,
      color: 'text-blue-400',
      bgGradient: 'from-blue-900/30 to-blue-900/5',
    },
    {
      id: 'slack',
      name: 'Slack',
      type: 'saas',
      description: 'Connect to Slack workspace data',
      icon: MessageSquare,
      color: 'text-purple-400',
      bgGradient: 'from-purple-900/30 to-purple-900/5',
    },
  ];

  const stats = {
    totalSources: dataSources.length,
    activeSources: dataSources.filter(s => s.status === 'active').length,
    totalRecords: dataSources.reduce((sum, s) => sum + s.recordCount, 0),
  };

  const getRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleOpenModal = (connector: Connector) => {
    setSelectedConnector(connector);
    setFormData({
      host: '',
      port: connector.id === 'postgresql' ? '5432' : '27017',
      database: '',
      username: '',
      password: '',
    });
    setTestSuccess(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConnector(null);
    setTestSuccess(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTestSuccess(true);
    setIsTesting(false);
  };

  const handleConnect = async () => {
    if (!selectedConnector) return;
    setIsConnecting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newSource: DataSource = {
      id: Date.now().toString(),
      name: `${selectedConnector.name} ${formData.database}`,
      type: selectedConnector.name,
      status: 'active',
      host: formData.host,
      lastSync: new Date(),
      recordCount: Math.floor(Math.random() * 100000),
      icon: selectedConnector.icon,
      color: selectedConnector.color,
    };

    setDataSources(prev => [newSource, ...prev]);
    setIsConnecting(false);
    handleCloseModal();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleRemove = (id: string) => {
    if (window.confirm('Disconnect this data source?')) {
      setDataSources(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Data Sources</h1>
          <p className="text-gray-400">Manage your connected databases and storage services</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/5 border border-purple-500/30 rounded-2xl p-6">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Database className="w-7 h-7 text-purple-400" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.totalSources}</div>
            <div className="text-sm text-gray-400">Total Sources</div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-900/5 border border-green-500/30 rounded-2xl p-6">
            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.activeSources}</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/5 border border-blue-500/30 rounded-2xl p-6">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-blue-400" />
            </div>
            <div className="text-4xl font-bold text-white mb-1">
              {(stats.totalRecords / 1000).toFixed(1)}K
            </div>
            <div className="text-sm text-gray-400">Records</div>
          </div>
        </div>

        {/* Active Sources */}
        <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Active Data Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSources.map((source) => {
              const Icon = source.icon;
              return (
                <div key={source.id} className="bg-[#0A0F1E] border border-gray-800 rounded-xl p-5 hover:border-purple-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Icon className={`w-6 h-6 ${source.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{source.name}</h3>
                        <p className="text-xs text-gray-500">{source.type}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(source.id)} className="text-gray-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="text-green-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        Active
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Records:</span>
                      <span className="text-white font-semibold">{source.recordCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Sync:</span>
                      <span className="text-gray-400">{getRelativeTime(source.lastSync)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Marketplace */}
        <div className="bg-[#0B1120] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Available Connectors</h2>
          
          {/* Databases */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Databases</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {connectors.filter(c => c.type === 'database').map((connector) => {
                const Icon = connector.icon;
                return (
                  <div key={connector.id} className={`bg-gradient-to-br ${connector.bgGradient} border border-gray-800 rounded-xl p-5 hover:border-purple-500/30 transition-all`}>
                    <div className="w-12 h-12 bg-gray-900/50 rounded-xl flex items-center justify-center mb-4">
                      <Icon className={`w-6 h-6 ${connector.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{connector.name}</h3>
                    <p className="text-xs text-gray-400 mb-4">{connector.description}</p>
                    <button
                      onClick={() => handleOpenModal(connector)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Connect
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cloud */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Cloud Storage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {connectors.filter(c => c.type === 'cloud').map((connector) => {
                const Icon = connector.icon;
                return (
                  <div key={connector.id} className={`bg-gradient-to-br ${connector.bgGradient} border border-gray-800 rounded-xl p-5 hover:border-purple-500/30 transition-all`}>
                    <div className="w-12 h-12 bg-gray-900/50 rounded-xl flex items-center justify-center mb-4">
                      <Icon className={`w-6 h-6 ${connector.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{connector.name}</h3>
                    <p className="text-xs text-gray-400 mb-4">{connector.description}</p>
                    <button
                      onClick={() => handleOpenModal(connector)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Connect
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SaaS */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">SaaS Platforms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {connectors.filter(c => c.type === 'saas').map((connector) => {
                const Icon = connector.icon;
                return (
                  <div key={connector.id} className={`bg-gradient-to-br ${connector.bgGradient} border border-gray-800 rounded-xl p-5 hover:border-purple-500/30 transition-all`}>
                    <div className="w-12 h-12 bg-gray-900/50 rounded-xl flex items-center justify-center mb-4">
                      <Icon className={`w-6 h-6 ${connector.color}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{connector.name}</h3>
                    <p className="text-xs text-gray-400 mb-4">{connector.description}</p>
                    <button
                      onClick={() => handleOpenModal(connector)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Connect
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedConnector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B1120] border border-purple-500/30 rounded-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Connect to {selectedConnector.name}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Host</label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({...formData, host: e.target.value})}
                  placeholder="localhost"
                  className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Port</label>
                  <input
                    type="text"
                    value={formData.port}
                    onChange={(e) => setFormData({...formData, port: e.target.value})}
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Database</label>
                  <input
                    type="text"
                    value={formData.database}
                    onChange={(e) => setFormData({...formData, database: e.target.value})}
                    placeholder="my_db"
                    className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="admin"
                  className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#0A0F1E] border border-gray-700 rounded-xl text-white"
                />
              </div>

              {testSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-300 font-semibold">Connection Successful!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
              <button onClick={handleCloseModal} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold">
                Cancel
              </button>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2"
              >
                {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Test Connection'}
              </button>
              <button
                onClick={handleConnect}
                disabled={!testSuccess || isConnecting}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">Connected successfully!</span>
        </div>
      )}
    </div>
  );
};

export default DataSourcesPage;
