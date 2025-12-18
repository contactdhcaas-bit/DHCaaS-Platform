import React from "react";

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen">
      <div className="px-4 py-4 font-semibold border-b border-slate-800">
        DHCaaS
      </div>

      <nav className="p-3 space-y-2 text-sm">
        <button className="w-full text-left px-3 py-2 rounded-md bg-slate-800 text-slate-100">
          Dashboard
        </button>
        <button className="w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800">
          Incidents
        </button>
        <button className="w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800">
          Settings
        </button>
      </nav>
    </aside>
  );
};
