// src/components/charts/RevenueAreaChart.tsx
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useMockData, formatCurrency } from '../../hooks/useMockData';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-3 shadow-xl">
        <p className="text-gray-300 text-sm font-medium mb-1">{label}</p>
        <p className="text-purple-400 text-lg font-bold">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.change !== undefined && (
          <p
            className={`text-xs mt-1 ${
              payload[0].payload.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {payload[0].payload.change >= 0 ? '↑' : '↓'}{' '}
            {Math.abs(payload[0].payload.change).toFixed(1)}% vs last month
          </p>
        )}
      </div>
    );
  }
  return null;
};

const RevenueAreaChart: React.FC = () => {
  const { chartData } = useMockData(5000);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
          <p className="text-sm text-gray-400 mt-1">Last 12 months performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs text-gray-400">Monthly Revenue</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData.revenue}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {/* Purple Gradient */}
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

          <XAxis
            dataKey="month"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
          />

          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a855f7', strokeWidth: 2 }} />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#a855f7"
            strokeWidth={3}
            fill="url(#colorRevenue)"
            animationDuration={1500}
            animationBegin={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueAreaChart;
