// src/components/layout/AppShell.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AICopilot from '../AICopilot';
import ThemeToggle from '../ThemeToggle';
import { Menu, X } from 'lucide-react';

const AppShell: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] flex transition-colors duration-300">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop: Always visible, Mobile: Drawer */}
      <div
        className={`
          fixed md:sticky top-0 left-0 h-screen z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <Sidebar onLinkClick={closeMobileMenu} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-gray-800 px-4 py-3 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-slate-900 dark:text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-900 dark:text-white" />
                )}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">DG</span>
                </div>
                <span className="text-slate-900 dark:text-white font-semibold">DataGuard AI</span>
              </div>
            </div>
            
            {/* Theme Toggle + Live Indicator */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 text-xs font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Top Bar (Optional - for consistency) */}
        <div className="hidden md:block sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-gray-800 px-6 py-3 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 text-sm font-medium">Live Data</span>
                <span className="text-slate-500 dark:text-gray-500 text-xs">Updates every 5s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Copilot - Fixed to Viewport */}
      <AICopilot />
    </div>
  );
};

export default AppShell;
