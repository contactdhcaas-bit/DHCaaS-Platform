import React from "react";

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-16 h-16 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
      <div className="text-lg font-medium text-slate-600">{message}</div>
    </div>
  );
};
