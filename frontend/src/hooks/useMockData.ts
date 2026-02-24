// src/hooks/useMockData.ts
import { useState, useEffect } from 'react';

// ===== UTILITY FUNCTIONS =====
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFloat = (min: number, max: number, decimals: number = 2): number => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};

const getRandomTrend = (length: number = 12, min: number = 50, max: number = 100): number[] => {
  const trend: number[] = [];
  let current = getRandomInt(min, max);
  
  for (let i = 0; i < length; i++) {
    const change = getRandomFloat(-15, 15);
    current = Math.max(min, Math.min(max, current + change));
    trend.push(parseFloat(current.toFixed(1)));
  }
  
  return trend;
};

// ===== INTERFACES =====
interface DashboardMetrics {
  revenue: number;
  revenueChange: number;
  qualityScore: number;
  qualityChange: number;
  activeUsers: number;
  usersChange: number;
  incidentsCount: number;
  incidentsChange: number;
}

interface RevenueDataPoint {
  month: string;
  value: number;
  change: number;
}

interface QualityDataPoint {
  month: string;
  score: number;
}

interface IncidentDataPoint {
  category: string;
  count: number;
  severity: string;
}

interface ChartData {
  revenue: RevenueDataPoint[];
  quality: QualityDataPoint[];
  incidents: IncidentDataPoint[];
}

interface ActivityLog {
  id: string;
  type: 'scan' | 'incident' | 'user' | 'system';
  message: string;
  time: string;
}

interface UseMockDataReturn {
  metrics: DashboardMetrics;
  chartData: ChartData;
  recentActivity: ActivityLog[];
  isLive: boolean;
}

// ===== MOCK DATA HOOK =====
export const useMockData = (updateInterval: number = 5000): UseMockDataReturn => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    revenue: 1240000,
    revenueChange: 12.5,
    qualityScore: 94.2,
    qualityChange: 2.1,
    activeUsers: 1847,
    usersChange: 8.3,
    incidentsCount: 23,
    incidentsChange: -15.2,
  });

  const [chartData, setChartData] = useState<ChartData>({
    revenue: [
      { month: 'Jan', value: 980000, change: 5.2 },
      { month: 'Feb', value: 1020000, change: 4.1 },
      { month: 'Mar', value: 1100000, change: 7.8 },
      { month: 'Apr', value: 1080000, change: -1.8 },
      { month: 'May', value: 1150000, change: 6.5 },
      { month: 'Jun', value: 1200000, change: 4.3 },
      { month: 'Jul', value: 1180000, change: -1.7 },
      { month: 'Aug', value: 1220000, change: 3.4 },
      { month: 'Sep', value: 1260000, change: 3.3 },
      { month: 'Oct', value: 1240000, change: -1.6 },
      { month: 'Nov', value: 1190000, change: 2.1 },
      { month: 'Dec', value: 1240000, change: 12.5 },
    ],
    quality: [
      { month: 'Jan', score: 89.2 },
      { month: 'Feb', score: 90.5 },
      { month: 'Mar', score: 91.8 },
      { month: 'Apr', score: 90.2 },
      { month: 'May', score: 92.4 },
      { month: 'Jun', score: 93.1 },
      { month: 'Jul', score: 92.8 },
      { month: 'Aug', score: 93.5 },
      { month: 'Sep', score: 94.2 },
      { month: 'Oct', score: 93.8 },
      { month: 'Nov', score: 92.7 },
      { month: 'Dec', score: 94.2 },
    ],
    incidents: [
      { category: 'Critical', count: 5, severity: 'Critical' },
      { category: 'High', count: 12, severity: 'High' },
      { category: 'Medium', count: 28, severity: 'Medium' },
      { category: 'Low', count: 45, severity: 'Low' },
    ],
  });

  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([
    {
      id: '1',
      type: 'scan',
      message: 'Data quality scan completed for Customer Database',
      time: '2m ago',
    },
    {
      id: '2',
      type: 'incident',
      message: 'Critical incident resolved: Missing values in Orders table',
      time: '5m ago',
    },
    {
      id: '3',
      type: 'user',
      message: 'New user Sarah Williams joined the platform',
      time: '10m ago',
    },
    {
      id: '4',
      type: 'system',
      message: 'Weekly compliance report generated successfully',
      time: '15m ago',
    },
  ]);

  const [isLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics((prev) => ({
        revenue: Math.max(1000000, prev.revenue + getRandomInt(-5000, 10000)),
        revenueChange: getRandomFloat(-5, 15, 1),
        qualityScore: Math.max(85, Math.min(99, prev.qualityScore + getRandomFloat(-0.5, 0.5, 1))),
        qualityChange: getRandomFloat(-2, 3, 1),
        activeUsers: Math.max(1500, prev.activeUsers + getRandomInt(-10, 20)),
        usersChange: getRandomFloat(-5, 10, 1),
        incidentsCount: Math.max(0, prev.incidentsCount + getRandomInt(-2, 1)),
        incidentsChange: getRandomFloat(-20, 5, 1),
      }));

      setChartData((prev) => ({
        ...prev,
        revenue: prev.revenue.map((item, index) => 
          index === prev.revenue.length - 1
            ? { ...item, value: metrics.revenue, change: metrics.revenueChange }
            : item
        ),
        quality: prev.quality.map((item, index) =>
          index === prev.quality.length - 1
            ? { ...item, score: metrics.qualityScore }
            : item
        ),
      }));

      if (Math.random() < 0.2) {
        const activities = [
          {
            type: 'scan' as const,
            message: 'Data quality scan completed for Product Catalog',
          },
          {
            type: 'incident' as const,
            message: 'New incident detected: Duplicate records in Users table',
          },
          {
            type: 'user' as const,
            message: 'User Mike Johnson updated security settings',
          },
          {
            type: 'system' as const,
            message: 'Database backup completed successfully',
          },
          {
            type: 'scan' as const,
            message: 'Compliance check passed for Financial Reports',
          },
        ];

        const randomActivity = activities[getRandomInt(0, activities.length - 1)];
        
        setRecentActivity((prev) => [
          {
            id: Date.now().toString(),
            type: randomActivity.type,
            message: randomActivity.message,
            time: 'Just now',
          },
          ...prev.slice(0, 9),
        ]);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLive, updateInterval, metrics.revenue, metrics.revenueChange, metrics.qualityScore]);

  return {
    metrics,
    chartData,
    recentActivity,
    isLive,
  };
};

// ===== UTILITY EXPORTS =====
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

export const getTimeAgo = (timestamp: string): string => {
  const now = new Date().getTime();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};
