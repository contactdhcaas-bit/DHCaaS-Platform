// src/pages/DevelopersPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Code,
  Terminal,
  Shield,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react';

interface APIKey {
  id: string;
  key_preview: string;
  name: string;
  description: string | null;
  owner: string;
  created_at: string;
  last_used: string | null;
  total_calls: number;
  is_active: boolean;
}

interface APIKeyListResponse {
  keys: APIKey[];
  total: number;
  active_keys: number;
  total_calls: number;
}

interface NewAPIKeyResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  owner: string;
  created_at: string;
  last_used: string | null;
  total_calls: number;
  is_active: boolean;
}

const DevelopersPage: React.FC = () => {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [stats, setStats] = useState({ total: 0, active_keys: 0, total_calls: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'python' | 'curl' | 'javascript'>('python');

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/developers/keys');
      
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data: APIKeyListResponse = await response.json();
      setKeys(data.keys);
      setStats({
        total: data.total,
        active_keys: data.active_keys,
        total_calls: data.total_calls,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/developers/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName,
          description: newKeyDescription || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      const data: NewAPIKeyResponse = await response.json();
      setGeneratedKey(data.key);
      setShowCreateModal(false);
      setShowKeyModal(true);
      setNewKeyName('');
      setNewKeyDescription('');
      fetchKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke "${keyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/developers/keys/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      fetchKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const codeSnippets = {
    python: `import requests

# Use your API key in the X-API-Key header
headers = {
    "X-API-Key": "${generatedKey || 'YOUR_API_KEY_HERE'}"
}

# Example: Trigger a data quality scan
response = requests.post(
    "http://localhost:8000/api/v1/scans",
    headers=headers,
    json={
        "datasource_name": "customers.csv",
        "file_path": "/data/customers.csv"
    }
)

print(response.json())`,
    
    curl: `# Use your API key in the X-API-Key header
curl -X POST "http://localhost:8000/api/v1/scans" \\
  -H "X-API-Key: ${generatedKey || 'YOUR_API_KEY_HERE'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "datasource_name": "customers.csv",
    "file_path": "/data/customers.csv"
  }'`,
    
    javascript: `// Use your API key in the X-API-Key header
const apiKey = "${generatedKey || 'YOUR_API_KEY_HERE'}";

// Example: Trigger a data quality scan
fetch("http://localhost:8000/api/v1/scans", {
  method: "POST",
  headers: {
    "X-API-Key": apiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    datasource_name: "customers.csv",
    file_path: "/data/customers.csv"
  })
})
.then(response => response.json())
.then(data => console.log(data));`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Developer Console
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage API keys and integrate DHCaaS into your applications
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Generate API Key
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Keys</span>
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {stats.active_keys} active
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total API Calls</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total_calls.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All time</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">Active</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All systems operational</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* API Keys Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              API Keys ({keys.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading API keys...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">No API keys yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
              >
                Generate Your First Key
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Key Prefix
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Calls
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {keys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{key.name}</p>
                          {key.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{key.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 rounded font-mono text-sm">
                          {key.key_preview}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(key.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(key.last_used)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                          {key.total_calls.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {key.is_active ? (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-bold uppercase">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRevokeKey(key.id, key.name)}
                          disabled={!key.is_active}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Code Snippets Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-600" />
              Integration Examples
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Use these code snippets to integrate DHCaaS API into your applications
            </p>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('python')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'python'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setActiveTab('curl')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'curl'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveTab('javascript')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === 'javascript'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                JavaScript
              </button>
            </div>

            {/* Code Block */}
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto">
                <code className="text-sm font-mono">{codeSnippets[activeTab]}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(codeSnippets[activeTab])}
                className="absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Create Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Generate New API Key
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Key Name *
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., CI/CD Pipeline"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                  placeholder="What will this key be used for?"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKeyName('');
                    setNewKeyDescription('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateKey}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Generate Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show Generated Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    API Key Generated!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Save this key now - it won't be shown again
                  </p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Important:</strong> This is the only time you'll see this key. Copy it now and store it securely. If you lose it, you'll need to generate a new one.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Your API Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={generatedKey}
                    readOnly
                    className="w-full px-4 py-3 pr-24 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setGeneratedKey('');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
              >
                I've Saved My Key
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevelopersPage;
