// src/pages/SettingsPage.tsx
import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Users,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Key,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Save,
  Globe,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

type Tab = 'general' | 'team' | 'notifications' | 'security' | 'integrations';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const { success, info } = useToast();

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: Building2 },
    { id: 'team' as Tab, label: 'Team', icon: Users },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
    { id: 'integrations' as Tab, label: 'Integrations', icon: Database },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-purple-400" />
            Settings
          </h1>
          <p className="text-gray-400 mt-1">Manage your workspace configuration</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 transition-all whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-6">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Workspace Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    defaultValue="DataGuard AI Enterprise"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Acme Corporation"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Time Zone
                  </label>
                  <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500">
                    <option>UTC (GMT+0:00)</option>
                    <option>EST (GMT-5:00)</option>
                    <option>PST (GMT-8:00)</option>
                    <option>CET (GMT+1:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Language
                  </label>
                  <select className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500">
                    <option>English</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Spanish</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <button
                onClick={() => success('Workspace settings saved successfully!')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Team Members</h3>
              <button
                onClick={() => info('Opening invite member form...')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all"
              >
                + Invite Member
              </button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'John Doe', email: 'john@acme.com', role: 'Admin' },
                { name: 'Jane Smith', email: 'jane@acme.com', role: 'Editor' },
                { name: 'Bob Wilson', email: 'bob@acme.com', role: 'Viewer' },
              ].map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-medium">{member.name}</div>
                      <div className="text-sm text-gray-400">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm">
                      {member.role}
                    </span>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>

            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Receive email updates for important events' },
                { label: 'Data Quality Alerts', desc: 'Get notified when quality scores drop' },
                { label: 'Pipeline Failures', desc: 'Alert me when pipelines fail' },
                { label: 'Incident Reports', desc: 'Notify about new data incidents' },
                { label: 'Weekly Summary', desc: 'Receive weekly activity summary' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl"
                >
                  <div>
                    <div className="text-white font-medium">{item.label}</div>
                    <div className="text-sm text-gray-400">{item.desc}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-800">
              <button
                onClick={() => success('Notification preferences saved!')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Production API Key
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value="sk_live_1234567890abcdefghijklmnop"
                        readOnly
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard('sk_live_1234567890abcdefghijklmnop')}
                      className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        success('New API key generated successfully!');
                        setShowApiKey(true);
                      }}
                      className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
                  <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>Keep your API key secure. Regenerating will invalidate the previous key.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Two-Factor Authentication</h3>
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Enable 2FA</div>
                    <div className="text-sm text-gray-400">Add an extra layer of security</div>
                  </div>
                  <button
                    onClick={() => info('Opening 2FA setup...')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Enable
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Session Management</h3>
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Active Sessions</div>
                    <div className="text-sm text-gray-400">2 active sessions detected</div>
                  </div>
                  <button
                    onClick={() => info('Signing out from all devices...')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Sign Out All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Connected Integrations</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: 'Snowflake',
                  icon: Database,
                  status: 'Connected',
                  color: 'text-blue-400',
                },
                {
                  name: 'PostgreSQL',
                  icon: Database,
                  status: 'Connected',
                  color: 'text-blue-400',
                },
                { name: 'Slack', icon: Mail, status: 'Not Connected', color: 'text-gray-400' },
                { name: 'Jira', icon: Globe, status: 'Not Connected', color: 'text-gray-400' },
              ].map((integration, idx) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center ${integration.color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{integration.name}</div>
                          <div
                            className={`text-xs ${
                              integration.status === 'Connected'
                                ? 'text-green-400'
                                : 'text-gray-400'
                            }`}
                          >
                            {integration.status}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        integration.status === 'Connected'
                          ? info(`Disconnecting from ${integration.name}...`)
                          : info(`Connecting to ${integration.name}...`)
                      }
                      className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        integration.status === 'Connected'
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
