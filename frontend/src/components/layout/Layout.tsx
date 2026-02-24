// src/components/layout/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from '../CommandPalette';
import AIPilot from '../AIPilot';

const Layout: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // ===== GLOBAL KEYBOARD SHORTCUT (Cmd+K / Ctrl+K) =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-white dark:bg-[#0B1120] overflow-hidden transition-colors duration-300">
      {/* Left Side - Sidebar */}
      <Sidebar />

      {/* Right Side - Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden bg-white dark:bg-[#0B1120] transition-colors duration-300">
        <Outlet />
      </main>

      {/* ===== GLOBAL OVERLAYS (Fixed Positioning - Outside Main Flow) ===== */}
      
      {/* Command Palette (Search Modal) - Triggered by Cmd/Ctrl + K */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* AI Pilot (Floating Chat Widget) - Always Available */}
      <AIPilot />
    </div>
  );
};

export default Layout;
