import React, { useEffect, useRef } from "react";
import { X, LayoutDashboard, UploadCloud, AlertTriangle, BarChart3, Users, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const MOBILE_NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: UploadCloud, label: "Scans", href: "/upload" },
  { icon: AlertTriangle, label: "Incidents", href: "/incidents", badge: 23 },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Users, label: "Team", href: "/team" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

type Props = {
  onClose: () => void;
};

export const MobileSidebar: React.FC<Props> = ({ onClose }) => {
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Prevent background scrolling while the sidebar is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sidebar */}
      <div
        ref={panelRef}
        className="absolute left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">DHCaaS</h2>
                <p className="text-xs text-emerald-700 font-medium">CNDP Compliant</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Close menu"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 pt-2 space-y-2">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`group flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-xl"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-6 h-6 flex-shrink-0 transition-transform ${
                    isActive ? "text-white -rotate-12 scale-110" : "text-slate-400 group-hover:text-slate-500"
                  }`}
                />
                <span className="font-semibold text-base">{item.label}</span>
                {typeof item.badge === "number" && (
                  <span className="ml-auto flex items-center justify-center w-6 h-6 bg-orange-500 text-xs font-bold text-white rounded-full shadow-lg">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between text-sm">
              <span>Compliance Score</span>
              <span className="font-bold text-lg">94%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full w-[94%] shadow-inner" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
