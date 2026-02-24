// src/components/CommandPalette.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Clock, FileText, Database } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  category: string;
  path: string;
  icon: React.ElementType;
  description?: string;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // ===== SEARCHABLE ITEMS (All App Routes) =====
  const allItems: SearchItem[] = [
    { id: '1', title: 'Dashboard', category: 'Pages', path: '/dashboard', icon: Database, description: 'Overview and metrics' },
    { id: '2', title: 'Upload Data', category: 'Pages', path: '/upload', icon: FileText, description: 'Upload files for scanning' },
    { id: '3', title: 'Reports', category: 'Pages', path: '/reports', icon: FileText, description: 'Compliance reports' },
    { id: '4', title: 'Scheduled Scans', category: 'Pages', path: '/scheduled-scans', icon: Clock, description: 'Automated scan jobs' },
    { id: '5', title: 'Data Quality', category: 'Pages', path: '/quality', icon: Database, description: 'Quality metrics' },
    { id: '6', title: 'Data Lineage', category: 'Pages', path: '/lineage', icon: Database, description: 'Data flow visualization' },
    { id: '7', title: 'Catalog', category: 'Pages', path: '/catalog', icon: Database, description: 'Data asset inventory' },
    { id: '8', title: 'Policies', category: 'Pages', path: '/policies', icon: FileText, description: 'Governance policies' },
    { id: '9', title: 'Incidents', category: 'Pages', path: '/incidents', icon: FileText, description: 'Security incidents' },
    { id: '10', title: 'Pipelines', category: 'Pages', path: '/pipelines', icon: Database, description: 'Data pipelines' },
    { id: '11', title: 'Team', category: 'Pages', path: '/team', icon: Database, description: 'Team management' },
    { id: '12', title: 'Settings', category: 'Pages', path: '/settings', icon: Database, description: 'App settings' },
  ];

  // ===== FILTER RESULTS BASED ON QUERY =====
  const filteredItems = query.trim() === ''
    ? allItems
    : allItems.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
      );

  // ===== KEYBOARD NAVIGATION =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems]);

  // ===== AUTO-FOCUS INPUT WHEN OPENED =====
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // ===== HANDLE SELECTION =====
  const handleSelect = (item: SearchItem) => {
    navigate(item.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, features, or data..."
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none text-lg"
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500 dark:text-gray-400">No results found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-150 ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-slate-500 dark:text-gray-400'}`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Keyboard Hints */}
          <div className="flex items-center justify-between px-6 py-3 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-200 dark:border-gray-800">
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
