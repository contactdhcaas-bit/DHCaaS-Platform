// src/stores/authStore.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const STORAGE_KEY = "dhc_auth_store";

// Legacy keys (old)
const LEGACY_DHC_TOKEN_KEY = "dhc_token";
const LEGACY_TOKEN_TYPE_KEY = "token_type";

// Current keys used by the rest of the app
const CURRENT_TOKEN_KEY = "token";
const CURRENT_ACCESS_TOKEN_KEY = "access_token";

export type AuthUser = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;

  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;

  setAuth: (token: string | null, user: AuthUser | null) => void;

  logout: () => void;
};

function syncTokenToLocalStorage(token: string | null) {
  try {
    if (token && token.trim()) {
      localStorage.setItem(CURRENT_TOKEN_KEY, token);
      localStorage.setItem(CURRENT_ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(CURRENT_TOKEN_KEY);
      localStorage.removeItem(CURRENT_ACCESS_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

function readAnyTokenFromLocalStorage(): string | null {
  try {
    return (
      localStorage.getItem(CURRENT_TOKEN_KEY) ||
      localStorage.getItem(CURRENT_ACCESS_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_DHC_TOKEN_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

function cleanupLegacyKeys() {
  try {
    localStorage.removeItem(LEGACY_DHC_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_TYPE_KEY);
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setToken: (token) => {
        set({ token });
        syncTokenToLocalStorage(token);
      },

      setUser: (user) => set({ user }),

      setAuth: (token, user) => {
        set({ token, user });
        syncTokenToLocalStorage(token);
      },

      logout: () => {
        set({ token: null, user: null });
        syncTokenToLocalStorage(null);
        cleanupLegacyKeys();
        try {
          (useAuthStore as any).persist?.clearStorage?.();
        } catch {
          // ignore
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({ token: state.token, user: state.user }),

      onRehydrateStorage: () => {
        return (state, error) => {
          // Mark as hydrated
          state?.setHasHydrated(true);

          if (error) return;

          // 1) If Zustand store already has a token, sync it out to localStorage
          if (state?.token) {
            syncTokenToLocalStorage(state.token);
          } else {
            // 2) Otherwise, try to read any existing token from localStorage and move it into the store
            const legacyToken = readAnyTokenFromLocalStorage();
            if (legacyToken) {
              state?.setToken(legacyToken);
            }
          }

          // 3) Cleanup truly legacy keys
          cleanupLegacyKeys();
        };
      },
    }
  )
);

export default useAuthStore;
