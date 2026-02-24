import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../../features/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      theme: 'light',
      layoutMode: 'default',
      sidebarCollapsed: false,
      preferences: {
        autoRefresh: true,
        refreshInterval: 1000,
        showTimestamps: true,
        compactMode: false,
        animationsEnabled: true,
      },
    });
  });

  describe('theme management', () => {
    it('should set theme', () => {
      const { setTheme } = useUIStore.getState();
      setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('should toggle theme', () => {
      const { toggleTheme } = useUIStore.getState();
      expect(useUIStore.getState().theme).toBe('light');
      toggleTheme();
      expect(useUIStore.getState().theme).toBe('dark');
      toggleTheme();
      expect(useUIStore.getState().theme).toBe('light');
    });
  });

  describe('layout management', () => {
    it('should set layout mode', () => {
      const { setLayoutMode } = useUIStore.getState();
      setLayoutMode('compact');
      expect(useUIStore.getState().layoutMode).toBe('compact');
    });

    it('should toggle sidebar', () => {
      const { toggleSidebar } = useUIStore.getState();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
      toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
      toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should set sidebar collapsed state', () => {
      const { setSidebarCollapsed } = useUIStore.getState();
      setSidebarCollapsed(true);
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });
  });

  describe('preferences management', () => {
    it('should update preferences', () => {
      const { updatePreferences } = useUIStore.getState();
      updatePreferences({ autoRefresh: false, refreshInterval: 2000 });
      const prefs = useUIStore.getState().preferences;
      expect(prefs.autoRefresh).toBe(false);
      expect(prefs.refreshInterval).toBe(2000);
      expect(prefs.showTimestamps).toBe(true); // unchanged
    });

    it('should partially update preferences', () => {
      const { updatePreferences } = useUIStore.getState();
      updatePreferences({ compactMode: true });
      const prefs = useUIStore.getState().preferences;
      expect(prefs.compactMode).toBe(true);
      expect(prefs.autoRefresh).toBe(true); // unchanged
    });
  });
});
