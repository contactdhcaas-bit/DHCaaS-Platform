// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Users,
  Key,
  Bell,
  Save,
  Plus,
  Copy,
  Trash2,
  CheckCircle,
  Moon,
  Sun,
  Monitor,
  Mail,
  MessageSquare,
  FileText,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

type TabType = 'general' | 'users' | 'api' | 'notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastActive: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  visible: boolean;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ===== GENERAL SETTINGS STATE =====
  const [platformName, setPlatformName] = useState('DHCaaS Platform');
  const [language, setLanguage] = useState('english');
  const [theme, setTheme] = useState('dark');

  // ===== USERS STATE =====
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@dhcaas.com',
      role: 'Administrator',
      status: 'active',
      lastActive: '2 min ago',
    },
    {
      id: '2',
      name: 'Data Engineer',
      email: 'engineer@dhcaas.com',
      role: 'Engineer',
      status: 'active',
      lastActive: '15 min ago',
    },
    {
      id: '3',
      name: 'Analyst User',
      email: 'analyst@dhcaas.com',
      role: 'Analyst',
      status: 'active',
      lastActive: '1 hour ago',
    },
    {
      id: '4',
      name: 'Guest Viewer',
      email: 'guest@external.com',
      role: 'Viewer',
      status: 'inactive',
      lastActive: '3 days ago',
    },
  ]);

  // ===== API KEYS STATE =====
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_4xK9mP2nQw8vL3jR5tY7uE1sA6bC0dF',
      created: '2026-01-15',
      lastUsed: '2 hours ago',
      visible: false,
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk_test_7bN4vM9xW2eR6tP3qL8uK5jH1cD0fG',
      created: '2026-02-01',
      lastUsed: '5 min ago',
      visible: false,
    },
    {
      id: '3',
      name: 'Integration Testing',
      key: 'sk_test_2pQ8rT4nK7vM3wE9xL5jC1bF6dH0sA',
      created: '2026-02-03',
      lastUsed: 'Never',
      visible: false,
    },
  ]);

  // ===== NOTIFICATIONS STATE =====
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackWebhooks, setSlackWebhooks] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // ===== TOAST FUNCTION =====
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ===== HANDLE SAVE =====
  const handleSaveSettings = () => {
    triggerToast('Settings saved successfully! ✅');
  };

  // ===== HANDLE INVITE USER =====
  const handleInviteUser = () => {
    triggerToast('Invitation email sent! 📧');
  };

  // ===== HANDLE GENERATE API KEY =====
  const handleGenerateApiKey = () => {
    const newKey: ApiKey = {
      id: `${apiKeys.length + 1}`,
      name: 'New API Key',
      key: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      visible: false,
    };
    setApiKeys([...apiKeys, newKey]);
    triggerToast('New API key generated! 🔑');
  };

  // ===== HANDLE COPY KEY =====
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    triggerToast('API key copied to clipboard! 📋');
  };

  // ===== HANDLE REVOKE KEY =====
  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
    triggerToast('API key revoked successfully! ⚠️');
  };

  // ===== TOGGLE KEY VISIBILITY =====
  const toggleKeyVisibility = (id: string) => {
    setApiKeys(
      apiKeys.map((key) =>
        key.id === id ? { ...key, visible: !key.visible } : key
      )
    );
  };

  // ===== TABS =====
  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">System Settings</h1>
              <p className="text-lg text-gray-400 mt-1">Configure your DHCaaS platform</p>
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>

        {/* ===== TABS NAVIGATION ===== */}
        <div className="flex items-center gap-2 mb-8 bg-gray-800 border border-gray-700 rounded-xl p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ===== TAB CONTENT ===== */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">General Settings</h2>
              </div>

              {/* Platform Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-purple-600 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name appears in the sidebar and browser title
                </p>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-purple-600 transition-colors cursor-pointer"
                >
                  <option value="english">English</option>
                  <option value="french">Français (French)</option>
                  <option value="arabic">العربية (Arabic)</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Theme Preference
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-purple-600 bg-purple-900/20'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <Sun className="w-8 h-8 text-yellow-500" />
                    <span className="text-sm font-medium text-white">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-purple-600 bg-purple-900/20'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <Moon className="w-8 h-8 text-blue-500" />
                    <span className="text-sm font-medium text-white">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === 'system'
                        ? 'border-purple-600 bg-purple-900/20'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <Monitor className="w-8 h-8 text-gray-500" />
                    <span className="text-sm font-medium text-white">System</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS & ROLES */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Users & Roles</h2>
                <button
                  onClick={handleInviteUser}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Invite User
                </button>
              </div>

              <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        User
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Role
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Last Active
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-t border-gray-700 hover:bg-gray-800 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-semibold text-white">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-purple-900/30 text-purple-400 text-xs font-medium rounded-full border border-purple-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {user.status === 'active' ? (
                            <span className="flex items-center gap-2 text-sm text-emerald-400">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="w-2 h-2 bg-gray-500 rounded-full" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-400">{user.lastActive}</span>
                        </td>
                        <td className="py-4 px-6">
                          <button className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: API KEYS */}
          {activeTab === 'api' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">API Keys</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Manage API keys for programmatic access
                  </p>
                </div>
                <button
                  onClick={handleGenerateApiKey}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Generate New Key
                </button>
              </div>

              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="bg-gray-900 border border-gray-700 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{apiKey.name}</h3>
                        <p className="text-xs text-gray-500">
                          Created: {apiKey.created} • Last used: {apiKey.lastUsed}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevokeKey(apiKey.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-medium rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Revoke
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm text-gray-300">
                        {apiKey.visible ? apiKey.key : apiKey.key.replace(/./g, '•')}
                      </div>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                        title={apiKey.visible ? 'Hide key' : 'Show key'}
                      >
                        {apiKey.visible ? (
                          <EyeOff className="w-5 h-5 text-gray-400" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopyKey(apiKey.key)}
                        className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>

              <div className="space-y-6">
                {/* Email Alerts */}
                <div className="flex items-center justify-between p-5 bg-gray-900 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Email Alerts</h3>
                      <p className="text-sm text-gray-400">
                        Receive notifications about critical incidents and errors
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      emailAlerts ? 'bg-emerald-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                        emailAlerts ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Slack Webhooks */}
                <div className="flex items-center justify-between p-5 bg-gray-900 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Slack Webhooks</h3>
                      <p className="text-sm text-gray-400">
                        Send real-time updates to your Slack workspace
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSlackWebhooks(!slackWebhooks)}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      slackWebhooks ? 'bg-emerald-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                        slackWebhooks ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Weekly Reports */}
                <div className="flex items-center justify-between p-5 bg-gray-900 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Weekly Reports</h3>
                      <p className="text-sm text-gray-400">
                        Automated weekly summary of data quality metrics
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWeeklyReports(!weeklyReports)}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      weeklyReports ? 'bg-emerald-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                        weeklyReports ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== TOAST NOTIFICATION ===== */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up z-50">
          <CheckCircle className="w-6 h-6" />
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}

      <style>
        {`
          @keyframes slide-up {
            from {
              transform: translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default SettingsPage;
