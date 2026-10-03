/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        // DHCaaS Official Brand Colors (Palette B - Enterprise Blue)
        brand: {
          900: '#0F2854', // Primary - Deep Enterprise Blue
          700: '#1C4D8D', // Secondary - Professional Blue
          500: '#4988C4', // Accent - Bright Blue
          100: '#BDE8F5', // Background Light - Sky Blue
        },
        // Legacy Brand Colors (Deprecated - kept for backward compatibility)
        'brand-purple': '#9333ea',
        'brand-dark': '#0B1120',
        'brand-card': '#1F2937',
        'brand-border': '#374151',
        // Semantic Colors
        success: {
          DEFAULT: '#10b981',
          500: '#10b981',
        },
        warning: {
          DEFAULT: '#f59e0b',
          500: '#f59e0b',
        },
        danger: {
          DEFAULT: '#ef4444',
          500: '#ef4444',
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(15, 40, 84, 0.25)', // Brand 900 glow
        'glow-accent': '0 0 20px rgba(73, 136, 196, 0.35)', // Brand 500 glow
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
