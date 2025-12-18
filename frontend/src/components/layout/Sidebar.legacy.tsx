import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  FileBox,
  Shield,
  AlertCircle,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Data Sources', href: '/datasources', icon: Database },
  { name: 'Assets', href: '/assets', icon: FileBox },
  { name: 'Rules', href: '/rules', icon: Shield },
  { name: 'Incidents', href: '/incidents', icon: AlertCircle },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col w-64 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-700">
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DH</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            DHCaaS
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 mr-3',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-dark-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
};
