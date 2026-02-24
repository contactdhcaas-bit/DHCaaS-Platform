// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  Clock,
  Shield,
  GitBranch,
  Database,
  FileText,
  AlertTriangle,
  Settings,
  Workflow,
  Users,
  UploadCloud,
  UserCircle,
  ShoppingBag,
  MapPin,
  Search,
  ShieldCheck,
  Scan,
  BookOpen,
  ShieldAlert,
  Brain,
  Wrench,
  Link2,
  Key,
  LogOut,
  Cloud,
  UserCog,
  GitCompare,
  PieChart,
  ListChecks,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/upload', icon: UploadCloud, label: 'Upload Data' },
    { path: '/scans/new', icon: Scan, label: 'New Scan' },
    { path: '/users', icon: Users, label: 'User Management', badge: 'NEW' },
    { path: '/connectors', icon: Cloud, label: 'Cloud Connectors', badge: 'NEW' },
    { path: '/analysis', icon: Brain, label: 'AI Classification', badge: 'NEW' },
    { path: '/integration', icon: Wrench, label: 'Data Integration', badge: 'NEW' },
    { path: '/pipeline-builder', icon: GitCompare, label: 'Pipeline Builder', badge: 'NEW' },
    { path: '/report-builder', icon: PieChart, label: 'Analytics', badge: 'NEW' },
    { path: '/governance', icon: ShieldCheck, label: 'Data Governance', badge: 'NEW' },
    { path: '/mdm', icon: Link2, label: 'Master Data Mgmt', badge: 'NEW' },
    { path: '/customer360', icon: UserCog, label: 'Customer 360', badge: 'NEW' },
    { path: '/developers', icon: Key, label: 'Developers', badge: 'API' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/scheduled-scans', icon: Clock, label: 'Scheduled Scans' },
    { path: '/quality', icon: Shield, label: 'Data Quality' },
    { path: '/rules', icon: ListChecks, label: 'Quality Rules', badge: 'NEW' },
    { path: '/lineage', icon: GitBranch, label: 'Data Lineage' },
    { path: '/catalog', icon: Database, label: 'Catalog' },
    { path: '/glossary', icon: BookOpen, label: 'Business Glossary', badge: 'BETA' },
    { path: '/enrichment', icon: MapPin, label: 'Enrichment' },
    { path: '/policies', icon: FileText, label: 'Policies' },
    { path: '/compliance-overview', icon: ShieldAlert, label: 'Compliance Overview' },
    { path: '/security', icon: ShieldCheck, label: 'Trust Center' },
    { path: '/incidents', icon: AlertTriangle, label: 'Incidents' },
    { path: '/pipelines', icon: Workflow, label: 'Pipelines' },
    { path: '/team', icon: Users, label: 'Team' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const handleSearchClick = () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        metaKey: true,
        bubbles: true,
      })
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.full_name) {
      const names = user.full_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  return (
    <aside className="w-64 h-full bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col transition-colors duration-300">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-gray-800">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-slate-900 dark:text-white font-bold text-lg">DHCaaS</h1>
          <p className="text-xs text-slate-500 dark:text-gray-500 uppercase tracking-wider">
            Data Health Check
          </p>
        </div>
      </div>

      {/* Search Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={handleSearchClick}
          className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-700 rounded-xl transition-all duration-200 group"
          title="Open Search (Ctrl+K)"
        >
          <Search className="w-5 h-5 text-slate-500 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-300 transition-colors">
              Search...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded text-xs text-slate-500 dark:text-gray-500">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </div>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-700 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        item.badge === 'NEW'
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : item.badge === 'API'
                          ? 'bg-purple-500 text-white'
                          : 'bg-amber-500 text-white'
                      } ${isActive ? 'bg-white text-purple-600' : ''}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - User Info with Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-gray-800 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-gray-800 rounded-lg transition-colors duration-300">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{getUserInitials()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
