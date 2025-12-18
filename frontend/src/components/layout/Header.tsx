import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
      <div className="font-semibold">DHCaaS Console</div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span>demo@org</span>
        <span className="h-8 w-8 rounded-full bg-slate-300" />
      </div>
    </header>
  );
};
