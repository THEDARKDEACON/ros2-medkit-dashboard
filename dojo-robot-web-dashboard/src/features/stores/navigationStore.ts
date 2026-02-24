import { create } from 'zustand';

export interface Breadcrumb {
  label: string;
  path: string;
  icon?: string;
}

interface NavigationState {
  // Breadcrumbs
  breadcrumbs: Breadcrumb[];
  pushBreadcrumb: (breadcrumb: Breadcrumb) => void;
  popBreadcrumb: () => void;
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  clearBreadcrumbs: () => void;

  // Navigation history
  history: string[];
  currentPath: string;
  addToHistory: (path: string) => void;
  clearHistory: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;

  // Navigation state
  isNavigating: boolean;
  setIsNavigating: (navigating: boolean) => void;
}

const MAX_HISTORY_SIZE = 10;

export const useNavigationStore = create<NavigationState>((set, get) => ({
  // Breadcrumbs state
  breadcrumbs: [],
  pushBreadcrumb: (breadcrumb) =>
    set((state) => ({
      breadcrumbs: [...state.breadcrumbs, breadcrumb],
    })),
  popBreadcrumb: () =>
    set((state) => ({
      breadcrumbs: state.breadcrumbs.slice(0, -1),
    })),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  clearBreadcrumbs: () => set({ breadcrumbs: [] }),

  // Navigation history state
  history: [],
  currentPath: '/',
  addToHistory: (path) =>
    set((state) => {
      // Don't add duplicate consecutive paths
      if (
        state.history.length > 0 &&
        state.history[state.history.length - 1] === path
      ) {
        return { currentPath: path };
      }

      // Keep only the last MAX_HISTORY_SIZE - 1 items, then add the new one
      const newHistory =
        state.history.length >= MAX_HISTORY_SIZE
          ? [...state.history.slice(-(MAX_HISTORY_SIZE - 1)), path]
          : [...state.history, path];

      return {
        history: newHistory,
        currentPath: path,
      };
    }),
  clearHistory: () => set({ history: [], currentPath: '/' }),
  canGoBack: () => {
    const state = get();
    return state.history.length > 1;
  },
  canGoForward: () => {
    // This would require tracking forward history separately
    // For now, return false as we're only tracking backward history
    return false;
  },

  // Navigation state
  isNavigating: false,
  setIsNavigating: (navigating) => set({ isNavigating: navigating }),
}));
