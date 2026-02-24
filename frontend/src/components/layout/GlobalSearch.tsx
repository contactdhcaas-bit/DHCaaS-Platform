// src/components/layout/GlobalSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Mic, MicOff, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  type: 'page' | 'asset' | 'incident';
  path: string;
  description?: string;
}

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isListening, setIsListening] = useState(false); // ✅ Voice state
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null); // ✅ Speech recognition instance

  // ===== MOCK SEARCH DATABASE =====
  const searchDatabase: SearchResult[] = [
    { id: '1', title: 'Dashboard', type: 'page', path: '/dashboard', description: 'Main overview dashboard' },
    { id: '2', title: 'Upload Data', type: 'page', path: '/upload', description: 'Upload CSV, Excel, or JSON files' },
    { id: '3', title: 'Reports', type: 'page', path: '/reports', description: 'View compliance and quality reports' },
    { id: '4', title: 'Data Quality', type: 'page', path: '/quality', description: 'Monitor data health scores' },
    { id: '5', title: 'Data Lineage', type: 'page', path: '/lineage', description: 'Explore active metadata graph' },
    { id: '6', title: 'Catalog', type: 'page', path: '/catalog', description: 'Browse data assets catalog' },
    { id: '7', title: 'Enrichment', type: 'page', path: '/enrichment', description: 'Address verification & geocoding' },
    { id: '8', title: 'Policies', type: 'page', path: '/policies', description: 'Manage governance policies' },
    { id: '9', title: 'Incidents', type: 'page', path: '/incidents', description: 'Track data quality incidents' },
    { id: '10', title: 'Pipelines', type: 'page', path: '/pipelines', description: 'Data transformation pipelines' },
    { id: '11', title: 'Team', type: 'page', path: '/team', description: 'Manage team members' },
    { id: '12', title: 'Marketplace', type: 'page', path: '/marketplace', description: 'Data products marketplace' },
    { id: '13', title: 'Settings', type: 'page', path: '/settings', description: 'Application settings' },
    { id: '14', title: 'Profile', type: 'page', path: '/profile', description: 'User profile and preferences' },
    { id: '15', title: 'Customers Table', type: 'asset', path: '/catalog?asset=customers', description: 'Main customer data table' },
    { id: '16', title: 'Orders Table', type: 'asset', path: '/catalog?asset=orders', description: 'Order transactions table' },
    { id: '17', title: 'PII Leak Incident', type: 'incident', path: '/incidents?id=001', description: 'Critical PII exposure detected' },
  ];

  // ===== INITIALIZE SPEECH RECOGNITION =====
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Can be changed to 'ar-MA' for Arabic

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        // Auto-trigger search with voice input
        performSearch(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        
        switch (event.error) {
          case 'no-speech':
            setVoiceError('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setVoiceError('No microphone found. Please check your device.');
            break;
          case 'not-allowed':
            setVoiceError('Microphone access denied. Please enable it in settings.');
            break;
          default:
            setVoiceError('Voice recognition error. Please try again.');
        }
        
        // Clear error after 3 seconds
        setTimeout(() => setVoiceError(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // ===== KEYBOARD SHORTCUT (Cmd+K / Ctrl+K) =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ===== AUTO-FOCUS INPUT WHEN OPENED =====
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // ===== SEARCH LOGIC =====
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const filtered = searchDatabase.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(filtered);
  };

  useEffect(() => {
    performSearch(query);
  }, [query]);

  // ===== VOICE SEARCH HANDLERS =====
  const startListening = () => {
    if (!recognitionRef.current) {
      setVoiceError('Voice search not supported in this browser.');
      setTimeout(() => setVoiceError(null), 3000);
      return;
    }

    try {
      setVoiceError(null);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Speech recognition error:', error);
      setVoiceError('Could not start voice recognition. Please try again.');
      setTimeout(() => setVoiceError(null), 3000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // ===== NAVIGATION =====
  const handleResultClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  // ===== RESULT TYPE ICONS & COLORS =====
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'page':
        return { Icon: Search, color: 'text-blue-600' };
      case 'asset':
        return { Icon: TrendingUp, color: 'text-emerald-600' };
      case 'incident':
        return { Icon: AlertCircle, color: 'text-red-600' };
      default:
        return { Icon: Search, color: 'text-slate-600' };
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => {
          setIsOpen(false);
          setQuery('');
          setResults([]);
        }}
      />

      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-gray-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, assets, incidents... (or use voice)"
              className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none text-lg"
            />

            {/* Voice Search Button */}
            {isListening ? (
              <button
                onClick={stopListening}
                className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors animate-pulse"
                title="Stop Listening"
              >
                <MicOff className="w-5 h-5 text-red-600" />
              </button>
            ) : (
              <button
                onClick={startListening}
                className="p-2 bg-slate-100 dark:bg-gray-800 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
                title="Voice Search (Click to speak)"
              >
                <Mic className="w-5 h-5 text-slate-600 dark:text-gray-400" />
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                setResults([]);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Voice Error Message */}
          {voiceError && (
            <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {voiceError}
              </p>
            </div>
          )}

          {/* Listening Indicator */}
          {isListening && (
            <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-6 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  <div className="w-1 h-6 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
                  <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Listening... Speak now
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result) => {
                const { Icon, color } = getResultIcon(result.type);
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result.path)}
                    className="w-full flex items-start gap-4 px-6 py-4 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className={`p-2 bg-slate-100 dark:bg-gray-800 rounded-lg ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-slate-900 dark:text-white font-medium">
                        {result.title}
                      </h3>
                      {result.description && (
                        <p className="text-sm text-slate-600 dark:text-gray-400 mt-0.5">
                          {result.description}
                        </p>
                      )}
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-xs rounded-full capitalize">
                        {result.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query ? (
            <div className="px-6 py-12 text-center">
              <Search className="w-12 h-12 text-slate-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-gray-400">No results found for "{query}"</p>
              <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">
                Try different keywords or use voice search
              </p>
            </div>
          ) : (
            <div className="px-6 py-8">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Quick Access
              </h3>
              <div className="space-y-2">
                {searchDatabase.slice(0, 5).map((item) => {
                  const { Icon, color } = getResultIcon(item.type);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm text-slate-900 dark:text-white">{item.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Hints */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-gray-800 border-t border-slate-200 dark:border-gray-800 flex items-center justify-between text-xs text-slate-500 dark:text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded">↵</kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded">esc</kbd>
                to close
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Mic className="w-3 h-3" />
              <span>Voice search enabled</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSearch;
