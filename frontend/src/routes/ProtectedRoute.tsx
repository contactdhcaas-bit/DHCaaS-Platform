// src/routes/ProtectedRoute.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

function readTokenFromStorage(): string | null {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("dhc_token") ||
      null
    );
  } catch {
    return null;
  }
}

const ProtectedRoute: React.FC = () => {
  const location = useLocation();

  const storeToken = useAuthStore((s) => s.token) as string | null;
  const setToken = useAuthStore((s) => s.setToken);

  const [hydrated, setHydrated] = useState<boolean>(() => {
    const anyStore = useAuthStore as any;
    return typeof anyStore?.persist?.hasHydrated === "function"
      ? Boolean(anyStore.persist.hasHydrated())
      : true;
  });

  useEffect(() => {
    const anyStore = useAuthStore as any;
    if (!anyStore?.persist) return;

    if (typeof anyStore.persist.hasHydrated === "function") {
      setHydrated(Boolean(anyStore.persist.hasHydrated()));
    }

    const unsub =
      typeof anyStore.persist.onFinishHydration === "function"
        ? anyStore.persist.onFinishHydration(() => setHydrated(true))
        : undefined;

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // After hydration, ensure store token is filled from localStorage before deciding to redirect.
  useEffect(() => {
    if (!hydrated) return;
    if (storeToken) return;

    const t = readTokenFromStorage();
    if (t) setToken(t);
  }, [hydrated, storeToken, setToken]);

  const effectiveToken = useMemo(() => {
    return storeToken || readTokenFromStorage();
  }, [storeToken]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-gray-100 grid place-items-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-[#111827] p-6">
          <div className="text-sm font-semibold">Loading session...</div>
          <div className="mt-2 text-xs text-gray-400">
            Restoring your authentication state.
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
