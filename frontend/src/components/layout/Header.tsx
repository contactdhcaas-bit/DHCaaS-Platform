// src/components/layout/Header.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
      <div className="font-semibold">DHCaaS Console</div>

      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span>{user?.email || "demo@org"}</span>
        <span className="h-8 w-8 rounded-full bg-slate-300" />

        <button
          type="button"
          onClick={handleLogout}
          className="ml-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-semibold"
        >
          Logout
        </button>
      </div>
    </header>
  );
};
