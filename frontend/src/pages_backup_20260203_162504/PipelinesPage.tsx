// src/pages/PipelinesPage.tsx
import React from 'react';
import { Workflow } from 'lucide-react';

const PipelinesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] p-4 md:p-6 space-y-6 transition-colors duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          Pipelines
        </h1>
        <p className="text-slate-600 dark:text-gray-400 mt-1">
          Monitor and manage data pipelines
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-slate-200 dark:border-gray-800 rounded-xl p-8 text-center">
        <Workflow className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Pipeline Monitoring Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-gray-400 max-w-md mx-auto">
          Track data pipeline health and performance metrics.
        </p>
      </div>
    </div>
  );
};

export default PipelinesPage;
