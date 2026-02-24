// src/pages/PoliciesPage.tsx
import React from 'react';
import { FileText } from 'lucide-react';

const PoliciesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] p-4 md:p-6 space-y-6 transition-colors duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          Policies
        </h1>
        <p className="text-slate-600 dark:text-gray-400 mt-1">
          Define and manage data governance policies
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-slate-200 dark:border-gray-800 rounded-xl p-8 text-center">
        <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Policy Management Coming Soon
        </h2>
        <p className="text-slate-600 dark:text-gray-400 max-w-md mx-auto">
          Create and enforce data governance policies across your organization.
        </p>
      </div>
    </div>
  );
};

export default PoliciesPage;
