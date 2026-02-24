// src/components/ThemeToggle.tsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-slate-700 dark:bg-slate-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      aria-label="Toggle theme"
    >
      {/* Track */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 transition-opacity duration-300 ${
            theme === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
        ></div>
        <div
          className={`absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 transition-opacity duration-300 ${
            theme === 'light' ? 'opacity-100' : 'opacity-0'
          }`}
        ></div>
      </div>

      {/* Toggle Ball */}
      <div
        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="w-4 h-4 text-purple-600" />
        ) : (
          <Sun className="w-4 h-4 text-orange-500" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
