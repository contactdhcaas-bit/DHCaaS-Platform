// src/pages/DashboardPage.tsx
import React from 'react';
import { TrendingUp, Shield, Users, AlertTriangle } from 'lucide-react';
import { useMockData, formatCurrency, formatNumber, formatPercentage } from '../hooks/useMockData';
import RevenueAreaChart from '../components/charts/RevenueAreaChart';
import QualityDonutChart from '../components/charts/QualityDonutChart';
import IncidentsBarChart from '../components/charts/IncidentsBarChart';

const DashboardPage: React.FC = () => {
  const { metrics, recentActivity } = useMockData(5000);

  const stats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(metrics.revenue),
      change: formatPercentage(metrics.revenueChange),
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      trend: metrics.revenueChange >= 0 ? 'up' : 'down',
    },
    {
      label: 'Data Quality Score',
      value: `${metrics.qualityScore.toFixed(1)}%`,
      change: formatPercentage(metrics.qualityChange),
      icon: Shield,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      trend: metrics.qualityChange >= 0 ? 'up' : 'down',
    },
    {
      label: 'Active Users',
      value: formatNumber(metrics.activeUsers),
      change: formatPercentage(metrics.usersChange),
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      trend: metrics.usersChange >= 0 ? 'up' : 'down',
    },
    {
      label: 'Open Incidents',
      value: metrics.incidentsCount.toString(),
      change: formatPercentage(metrics.incidentsChange),
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      trend: metrics.incidentsChange >= 0 ? 'up' : 'down',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] p-4 md:p-6 space-y-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Real-time data health monitoring
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border backdrop-blur-sm rounded-xl p-4 md:p-6 hover:scale-105 transition-all duration-300 bg-white dark:bg-opacity-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-slate-600 dark:text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-slate-900 dark:text-white text-2xl md:text-3xl font-bold mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span
                      className={`text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-slate-500 dark:text-gray-500 text-xs">
                      vs last period
                    </span>
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <RevenueAreaChart />

        {/* Quality Donut Chart */}
        <QualityDonutChart />
      </div>

      {/* Incidents Bar Chart - Full Width */}
      <IncidentsBarChart />

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-slate-200 dark:border-gray-800 rounded-xl p-6 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-slate-100 dark:bg-gray-800/50 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-800 transition-colors"
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'scan'
                    ? 'bg-blue-500'
                    : activity.type === 'incident'
                    ? 'bg-red-500'
                    : activity.type === 'user'
                    ? 'bg-purple-500'
                    : 'bg-green-500'
                }`}
              ></div>
              <div className="flex-1">
                <p className="text-slate-900 dark:text-white text-sm">{activity.message}</p>
                <p className="text-slate-500 dark:text-gray-500 text-xs mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
