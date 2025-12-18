import React from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { DarkModeToggle } from '@/components/common/DarkModeToggle';
import { OrgSwitcher } from './OrgSwitcher';

export const Header: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between px-6">
      <div className="flex items-center flex-1 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets, rules, incidents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 ml-6">
        <OrgSwitcher />
        
        <DarkModeToggle />

        <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-dark-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-medium text-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </header>
  );
};
