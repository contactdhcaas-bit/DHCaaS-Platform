// src/components/charts/QualityDonutChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMockData } from '../../hooks/useMockData';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-300 text-sm font-medium">{payload[0].name}</p>
        <p className="text-white text-lg font-bold mt-1">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

const QualityDonutChart: React.FC = () => {
  const { metrics } = useMockData(5000);

  // Calculate data quality breakdown
  const validPercent = metrics.qualityScore;
  const invalidPercent = ((100 - validPercent) * 0.6).toFixed(1);
  const emptyPercent = ((100 - validPercent) * 0.4).toFixed(1);

  const data = [
    { name: 'Valid Data', value: parseFloat(validPercent.toFixed(1)), color: '#10b981' },
    { name: 'Invalid Data', value: parseFloat(invalidPercent), color: '#ef4444' },
    { name: 'Empty Fields', value: parseFloat(emptyPercent), color: '#6b7280' },
  ];

  // Custom label in center
  const renderCenterLabel = () => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-bold"
      >
        <tspan x="50%" dy="-0.5em" fontSize="32" fill="#ffffff">
          {validPercent.toFixed(1)}%
        </tspan>
        <tspan x="50%" dy="1.5em" fontSize="14" fill="#9ca3af">
          Quality Score
        </tspan>
      </text>
    );
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Data Quality Breakdown</h3>
        <p className="text-sm text-gray-400 mt-1">Current data health status</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1000}
            animationBegin={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.3)" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {renderCenterLabel()}
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs text-gray-400">{item.name}</span>
            </div>
            <span className="text-lg font-bold text-white">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QualityDonutChart;
