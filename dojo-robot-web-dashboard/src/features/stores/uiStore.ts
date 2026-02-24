import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';
export type LayoutMode = 'default' | 'compact' | 'expanded';

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Layout
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Preferences
  preferences: {
    autoRefresh: boolean;
    refreshInterval: number; // in milliseconds
    showTimestamps: boolean;
    compactMode: boolean;
    animationsEnabled: boolean;
  };
  updatePreferences: (
    preferences: Partial<UIState['preferences']>,
  ) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Theme state
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      // Layout state
      layoutMode: 'default',
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),

      // Preferences state
      preferences: {
        autoRefresh: true,
        refreshInterval: 1000,
        showTimestamps: true,
        compactMode: false,
        animationsEnabled: true,
      },
      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),
    }),
    {
      name: 'ui-storage', // localStorage key
      partialize: (state) => ({
        theme: state.theme,
        layoutMode: state.layoutMode,
        sidebarCollapsed: state.sidebarCollapsed,
        preferences: state.preferences,
      }),
    },
  ),
);
