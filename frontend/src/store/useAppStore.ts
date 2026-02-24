// src/store/useAppStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ===== TYPE DEFINITIONS =====
interface User {
  name: string;
  role: string;
  email: string;
  avatar: string;
}

interface Stats {
  incidentCount: number;
  trustScore: number;
  activePipelines: number;
  dataScanned: string;
  issuesResolved: number;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface AppState {
  // ===== STATE =====
  user: User;
  stats: Stats;
  notifications: Notification[];
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;

  // ===== USER ACTIONS =====
  setUser: (user: Partial<User>) => void;
  updateUserRole: (role: string) => void;

  // ===== STATS ACTIONS =====
  resolveIncident: () => void;
  addIncident: () => void;
  updateTrustScore: (score: number) => void;
  triggerPipeline: () => void;
  stopPipeline: () => void;
  incrementIssuesResolved: (count?: number) => void;

  // ===== NOTIFICATION ACTIONS =====
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // ===== THEME ACTIONS =====
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // ===== UI ACTIONS =====
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // ===== RESET =====
  resetStore: () => void;
}

// ===== INITIAL STATE =====
const initialState = {
  user: {
    name: 'Admin User',
    role: 'CTO',
    email: 'admin@dhcaas.com',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=8b5cf6&color=fff',
  },
  stats: {
    incidentCount: 12,
    trustScore: 94,
    activePipelines: 8,
    dataScanned: '1.2 TB',
    issuesResolved: 8432,
  },
  notifications: [
    {
      id: '1',
      type: 'warning' as const,
      title: 'PII Data Exposed',
      message: 'Unencrypted SSN fields detected in customer_backup table',
      timestamp: Date.now() - 1800000, // 30 min ago
      read: false,
    },
    {
      id: '2',
      type: 'success' as const,
      title: 'Pipeline Completed',
      message: 'ETL_Sales_Daily pipeline executed successfully',
      timestamp: Date.now() - 3600000, // 1 hour ago
      read: false,
    },
    {
      id: '3',
      type: 'error' as const,
      title: 'Schema Drift Detected',
      message: 'Unexpected schema changes in sales_table breaking downstream pipelines',
      timestamp: Date.now() - 7200000, // 2 hours ago
      read: false,
    },
  ],
  theme: 'dark' as const,
  sidebarCollapsed: false,
};

// ===== CREATE STORE =====
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // ===== INITIAL STATE =====
        ...initialState,

        // ===== USER ACTIONS =====
        setUser: (user) =>
          set(
            (state) => ({
              user: { ...state.user, ...user },
            }),
            false,
            'setUser'
          ),

        updateUserRole: (role) =>
          set(
            (state) => ({
              user: { ...state.user, role },
            }),
            false,
            'updateUserRole'
          ),

        // ===== STATS ACTIONS =====
        resolveIncident: () =>
          set(
            (state) => ({
              stats: {
                ...state.stats,
                incidentCount: Math.max(0, state.stats.incidentCount - 1),
              },
            }),
            false,
            'resolveIncident'
          ),

        addIncident: () =>
          set(
            (state) => ({
              stats: {
                ...state.stats,
                incidentCount: state.stats.incidentCount + 1,
              },
            }),
            false,
            'addIncident'
          ),

        updateTrustScore: (score) =>
          set(
            (state) => ({
              stats: {
                ...state.stats,
                trustScore: Math.min(100, Math.max(0, score)),
              },
            }),
            false,
            'updateTrustScore'
          ),

        triggerPipeline: () =>
          set(
            (state) => ({
              stats: {
                ...state.stats,
                activePipelines: state.stats.activePipelines + 1,
              },
            }),
            false,
            'triggerPipeline'
          ),

        stopPipeline: () =>
          set(
            (state) => ({
              stats: {
                ...state.stats,
                activePipelines: Math.max(0, state.stats.activePipelines - 1),
              },
            }),
            false,
            'stopPipeline'
          ),

        incrementIssuesResolved: (count = 1) =>
          set(
            (state) => ({
              stats: {
                ...state.stats,
                issuesResolved: state.stats.issuesResolved + count,
              },
            }),
            false,
            'incrementIssuesResolved'
          ),

        // ===== NOTIFICATION ACTIONS =====
        addNotification: (notification) =>
          set(
            (state) => ({
              notifications: [
                {
                  ...notification,
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  timestamp: Date.now(),
                  read: false,
                },
                ...state.notifications,
              ].slice(0, 50), // Keep only last 50 notifications
            }),
            false,
            'addNotification'
          ),

        markNotificationAsRead: (id) =>
          set(
            (state) => ({
              notifications: state.notifications.map((notif) =>
                notif.id === id ? { ...notif, read: true } : notif
              ),
            }),
            false,
            'markNotificationAsRead'
          ),

        markAllNotificationsAsRead: () =>
          set(
            (state) => ({
              notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
            }),
            false,
            'markAllNotificationsAsRead'
          ),

        clearNotification: (id) =>
          set(
            (state) => ({
              notifications: state.notifications.filter((notif) => notif.id !== id),
            }),
            false,
            'clearNotification'
          ),

        clearAllNotifications: () =>
          set(
            {
              notifications: [],
            },
            false,
            'clearAllNotifications'
          ),

        // ===== THEME ACTIONS =====
        setTheme: (theme) =>
          set(
            {
              theme,
            },
            false,
            'setTheme'
          ),

        // ===== UI ACTIONS =====
        toggleSidebar: () =>
          set(
            (state) => ({
              sidebarCollapsed: !state.sidebarCollapsed,
            }),
            false,
            'toggleSidebar'
          ),

        setSidebarCollapsed: (collapsed) =>
          set(
            {
              sidebarCollapsed: collapsed,
            },
            false,
            'setSidebarCollapsed'
          ),

        // ===== RESET =====
        resetStore: () =>
          set(
            {
              ...initialState,
            },
            false,
            'resetStore'
          ),
      }),
      {
        name: 'dhcaas-storage', // LocalStorage key
        partialize: (state) => ({
          // Only persist these fields
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          user: state.user,
        }),
      }
    ),
    {
      name: 'DHCaaS Store', // DevTools name
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ===== SELECTORS (OPTIONAL BUT RECOMMENDED) =====
export const selectUser = (state: AppState) => state.user;
export const selectStats = (state: AppState) => state.stats;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectUnreadNotifications = (state: AppState) =>
  state.notifications.filter((n) => !n.read);
export const selectTheme = (state: AppState) => state.theme;
export const selectSidebarCollapsed = (state: AppState) => state.sidebarCollapsed;
