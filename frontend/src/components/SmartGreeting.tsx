import React, { useMemo } from 'react';
import { Sun, Cloud, Moon, TrendingUp, AlertTriangle, Shield, Sparkles } from 'lucide-react';

interface SmartGreetingProps {
  userName?: string;
  complianceScore?: number;
}

export const SmartGreeting: React.FC<SmartGreetingProps> = ({ 
  userName = 'User',
  complianceScore = 0 
}) => {
  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Good Morning',
        icon: Sun,
        timeEmoji: '☀️',
        gradient: 'from-amber-900/50 to-orange-900/50',
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/10',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: 'Good Afternoon',
        icon: Cloud,
        timeEmoji: '☁️',
        gradient: 'from-blue-900/50 to-cyan-900/50',
        iconColor: 'text-blue-400',
        iconBg: 'bg-blue-500/10',
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: 'Good Evening',
        icon: Moon,
        timeEmoji: '🌙',
        gradient: 'from-indigo-900/50 to-purple-900/50',
        iconColor: 'text-indigo-400',
        iconBg: 'bg-indigo-500/10',
      };
    } else {
      return {
        greeting: 'Good Night',
        icon: Moon,
        timeEmoji: '🌙',
        gradient: 'from-slate-900/50 to-gray-900/50',
        iconColor: 'text-slate-400',
        iconBg: 'bg-slate-500/10',
      };
    }
  }, []);

  const statusData = useMemo(() => {
    if (complianceScore >= 80) {
      return {
        status: 'Healthy',
        message: 'Your data compliance is in excellent shape',
        icon: Shield,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        badge: 'bg-green-500/20 text-green-300',
        emoji: '✅',
      };
    } else if (complianceScore >= 60) {
      return {
        status: 'Moderate',
        message: 'Some compliance issues need attention',
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        badge: 'bg-yellow-500/20 text-yellow-300',
        emoji: '⚠️',
      };
    } else if (complianceScore >= 40) {
      return {
        status: 'Risky',
        message: 'Multiple compliance risks detected',
        icon: AlertTriangle,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        badge: 'bg-orange-500/20 text-orange-300',
        emoji: '🔶',
      };
    } else {
      return {
        status: 'Critical',
        message: 'Immediate action required for compliance',
        icon: AlertTriangle,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        badge: 'bg-red-500/20 text-red-300',
        emoji: '🚨',
      };
    }
  }, [complianceScore]);

  const GreetingIcon = greetingData.icon;
  const StatusIcon = statusData.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${greetingData.gradient} border border-gray-800/50 backdrop-blur-sm`}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative p-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl ${greetingData.iconBg} flex items-center justify-center`}>
                <GreetingIcon className={`w-6 h-6 ${greetingData.iconColor}`} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-white">
                    {greetingData.greeting}, {userName}!
                  </h1>
                  <span className="text-2xl">{greetingData.timeEmoji}</span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className={`w-10 h-10 rounded-lg ${statusData.bg} flex items-center justify-center`}>
                <StatusIcon className={`w-5 h-5 ${statusData.color}`} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusData.badge}`}>
                    {statusData.status} {statusData.emoji}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mt-1">
                  {statusData.message}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Compliance Score
              </span>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-white">
                {complianceScore}
              </span>
              <span className="text-2xl text-gray-400">/100</span>
            </div>

            <div className="mt-4">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    complianceScore >= 80 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                      : complianceScore >= 60
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                      : complianceScore >= 40
                      ? 'bg-gradient-to-r from-orange-500 to-red-400'
                      : 'bg-gradient-to-r from-red-500 to-rose-400'
                  }`}
                  style={{ width: `${complianceScore}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-400 font-medium">+5% from last week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartGreeting;
