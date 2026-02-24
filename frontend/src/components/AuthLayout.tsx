// src/components/AuthLayout.tsx
import React from 'react';
import { ScanLine, Sparkles, Shield, Clock, Headphones } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  quote?: string;
  quoteAuthor?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  quote = "Data is the new oil, but only if refined.",
  quoteAuthor = "Transform raw data into actionable intelligence"
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Side - Dynamic Particle Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900" />

        {/* Animated Particles/Orbs */}
        <div className="absolute inset-0">
          {/* Large Orbs */}
          <div className="absolute top-[10%] left-[15%] w-32 h-32 bg-purple-600/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-[30%] right-[20%] w-40 h-40 bg-blue-600/20 rounded-full blur-3xl animate-float-delayed-1" />
          <div className="absolute bottom-[20%] left-[25%] w-36 h-36 bg-indigo-600/20 rounded-full blur-3xl animate-float-delayed-2" />
          <div className="absolute bottom-[35%] right-[15%] w-28 h-28 bg-violet-600/20 rounded-full blur-3xl animate-float-delayed-3" />

          {/* Medium Orbs */}
          <div className="absolute top-[45%] left-[10%] w-24 h-24 bg-purple-500/15 rounded-full blur-2xl animate-float-slow" />
          <div className="absolute top-[60%] right-[30%] w-20 h-20 bg-blue-500/15 rounded-full blur-2xl animate-float-slow-delayed-1" />
          <div className="absolute top-[20%] left-[40%] w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl animate-float-slow-delayed-2" />

          {/* Small Particles */}
          <div className="absolute top-[25%] left-[20%] w-3 h-3 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50 animate-pulse-glow" />
          <div className="absolute top-[50%] right-[25%] w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 animate-pulse-glow-delayed-1" />
          <div className="absolute bottom-[30%] left-[35%] w-2 h-2 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/50 animate-pulse-glow-delayed-2" />
          <div className="absolute top-[70%] right-[40%] w-3 h-3 bg-violet-400 rounded-full shadow-lg shadow-violet-400/50 animate-pulse-glow-delayed-3" />
          <div className="absolute top-[40%] left-[50%] w-2 h-2 bg-purple-300 rounded-full shadow-lg shadow-purple-300/50 animate-pulse-glow-delayed-4" />
          <div className="absolute bottom-[45%] right-[35%] w-3 h-3 bg-blue-300 rounded-full shadow-lg shadow-blue-300/50 animate-pulse-glow" />

          {/* Connection Lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full opacity-10">
            <defs>
              <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <line x1="20%" y1="25%" x2="50%" y2="40%" stroke="url(#line-grad)" strokeWidth="1" className="animate-line-draw" />
            <line x1="50%" y1="40%" x2="75%" y2="50%" stroke="url(#line-grad)" strokeWidth="1" className="animate-line-draw-delayed" />
            <line x1="35%" y1="70%" x2="60%" y2="45%" stroke="url(#line-grad)" strokeWidth="1" className="animate-line-draw" />
          </svg>
        </div>

        {/* Glassmorphic Content Container */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo - Glassmorphic */}
          <div className="mb-8 flex items-center gap-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 w-fit shadow-2xl">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-xl">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold">DataGuard AI</div>
              <div className="text-xs uppercase tracking-widest text-purple-300">Enterprise</div>
            </div>
          </div>

          {/* Quote - Glassmorphic */}
          <blockquote className="space-y-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start gap-4">
              <Sparkles className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1 animate-pulse" />
              <p className="text-3xl font-light leading-relaxed">
                "{quote}"
              </p>
            </div>
            <footer className="text-purple-300 text-sm">
              — {quoteAuthor}
            </footer>
          </blockquote>

          {/* Trust Badges - Glassmorphic */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: '99.9% Uptime', icon: Clock, color: 'text-green-400' },
              { label: 'SOC 2 Certified', icon: Shield, color: 'text-blue-400' },
              { label: '24/7 Support', icon: Headphones, color: 'text-purple-400' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-all shadow-xl"
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                  <div className="text-xs text-purple-200">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">DataGuard AI</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400">Enterprise</div>
            </div>
          </div>

          {/* Form Content */}
          {children}

          {/* Trust Footer */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>All systems operational</span>
            </div>
            <span>•</span>
            <span>256-bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Advanced Animation Styles */}
      <style>{`
        /* Floating Orbs */
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.5;
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.4;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(-40px, 40px) scale(1.2);
            opacity: 0.4;
          }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        .animate-float-delayed-1 {
          animation: float 25s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-float-delayed-2 {
          animation: float 22s ease-in-out infinite;
          animation-delay: 4s;
        }
        .animate-float-delayed-3 {
          animation: float 28s ease-in-out infinite;
          animation-delay: 6s;
        }

        .animate-float-slow {
          animation: float-slow 30s ease-in-out infinite;
        }
        .animate-float-slow-delayed-1 {
          animation: float-slow 35s ease-in-out infinite;
          animation-delay: 3s;
        }
        .animate-float-slow-delayed-2 {
          animation: float-slow 32s ease-in-out infinite;
          animation-delay: 5s;
        }

        /* Pulsing Glow Particles */
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .animate-pulse-glow-delayed-1 {
          animation: pulse-glow 3.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-pulse-glow-delayed-2 {
          animation: pulse-glow 4s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-pulse-glow-delayed-3 {
          animation: pulse-glow 3.2s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        .animate-pulse-glow-delayed-4 {
          animation: pulse-glow 3.8s ease-in-out infinite;
          animation-delay: 2s;
        }

        /* Line Draw Animation */
        @keyframes line-draw {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-line-draw {
          animation: line-draw 4s ease-in-out infinite;
        }
        .animate-line-draw-delayed {
          animation: line-draw 5s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
