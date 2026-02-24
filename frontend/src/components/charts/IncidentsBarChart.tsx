// src/components/charts/IncidentsBarChart.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useMockData } from '../../hooks/useMockData';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const severity = payload[0].payload.severity;
    const colors = {
      Critical: '#ef4444',
      High: '#f97316',
      Medium: '#eab308',
      Low: '#84cc16',
    };

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-300 text-sm font-medium mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors[severity as keyof typeof colors] }}
          ></div>
          <p className="text-white text-lg font-bold">{payload[0].value} incidents</p>
        </div>
        <p className="text-xs text-gray-400 mt-1">{severity} priority</p>
      </div>
    );
  }
  return null;
};

const IncidentsBarChart: React.FC = () => {
  const { chartData } = useMockData(5000);

  // Severity colors
  const getColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return '#ef4444';
      case 'High':
        return '#f97316';
      case 'Medium':
        return '#eab308';
      case 'Low':
        return '#84cc16';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Incidents by Severity</h3>
          <p className="text-sm text-gray-400 mt-1">Last 7 days breakdown</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData.incidents}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />

          <XAxis
            dataKey="category"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
          />

          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }} />

          <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={1000}>
            {chartData.incidents.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.severity)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6">
        {['Critical', 'High', 'Medium', 'Low'].map((severity) => (
          <div key={severity} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getColor(severity) }}
            ></div>
            <span className="text-xs text-gray-400">{severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentsBarChart;
