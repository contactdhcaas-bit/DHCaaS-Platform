// src/components/LogoutButton.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

type Props = {
  className?: string;
  label?: string;
};

export default function LogoutButton({ className = "", label = "Logout" }: Props) {
  const navigate = useNavigate();

  const onLogout = () => {
    // Clear tokens + persisted store
    useAuthStore.getState().logout();

    // Hard redirect is also ok, but navigate is usually enough
    navigate("/login", { replace: true });
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className={
        className ||
        "w-full flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
      }
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
