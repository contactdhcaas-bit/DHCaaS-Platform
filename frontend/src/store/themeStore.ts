import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () => set((state) => {
        const newMode = !state.isDarkMode;
        document.documentElement.classList.toggle('dark', newMode);
        return { isDarkMode: newMode };
      }),
      setDarkMode: (isDark) => {
        document.documentElement.classList.toggle('dark', isDark);
        set({ isDarkMode: isDark });
      },
    }),
    {
      name: 'dhcaas-theme',
    }
  )
);
