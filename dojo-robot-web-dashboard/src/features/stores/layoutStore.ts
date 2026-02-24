import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardLayout, PanelConfig } from '../../types/layout';
import { PRESET_LAYOUTS } from '../../config/presetLayouts';

interface LayoutState {
  // Current layout
  currentLayoutId: string | null;
  layouts: DashboardLayout[];
  
  // Layout management
  setCurrentLayout: (layoutId: string) => void;
  createLayout: (name: string, panels?: PanelConfig[]) => DashboardLayout;
  updateLayout: (layoutId: string, updates: Partial<DashboardLayout>) => void;
  deleteLayout: (layoutId: string) => void;
  duplicateLayout: (layoutId: string, newName: string) => DashboardLayout;
  
  // Panel management
  addPanel: (layoutId: string, panel: PanelConfig) => void;
  removePanel: (layoutId: string, panelId: string) => void;
  updatePanel: (layoutId: string, panelId: string, updates: Partial<PanelConfig>) => void;
  updatePanelPositions: (layoutId: string, panels: PanelConfig[]) => void;
  
  // Utilities
  getCurrentLayout: () => DashboardLayout | null;
  getLayout: (layoutId: string) => DashboardLayout | null;
  resetToDefault: () => void;
  loadPreset: (presetName: string) => void;
}

// Default layout
const createDefaultLayout = (): DashboardLayout => ({
  id: 'default',
  name: 'Default Layout',
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  panels: [
    {
      id: 'system-health-1',
      type: 'system-health',
      position: { x: 0, y: 0 },
      size: { width: 6, height: 2 },
      config: {},
    },
    {
      id: 'metrics-1',
      type: 'metrics',
      position: { x: 6, y: 0 },
      size: { width: 6, height: 2 },
      config: {},
    },
    {
      id: 'quick-access-1',
      type: 'quick-access',
      position: { x: 0, y: 2 },
      size: { width: 4, height: 2 },
      config: {},
    },
    {
      id: 'fault-summary-1',
      type: 'fault-summary',
      position: { x: 4, y: 2 },
      size: { width: 8, height: 2 },
      config: {},
    },
  ],
});

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      currentLayoutId: 'default',
      layouts: [createDefaultLayout()],
      
      setCurrentLayout: (layoutId) => {
        const layout = get().layouts.find((l) => l.id === layoutId);
        if (layout) {
          set({ currentLayoutId: layoutId });
        }
      },
      
      createLayout: (name, panels = []) => {
        const newLayout: DashboardLayout = {
          id: `layout-${Date.now()}`,
          name,
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          panels,
        };
        
        set((state) => ({
          layouts: [...state.layouts, newLayout],
          currentLayoutId: newLayout.id,
        }));
        
        return newLayout;
      },
      
      updateLayout: (layoutId, updates) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === layoutId
              ? {
                  ...layout,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : layout
          ),
        }));
      },
      
      deleteLayout: (layoutId) => {
        const state = get();
        const layout = state.layouts.find((l) => l.id === layoutId);
        
        // Cannot delete default layout
        if (layout?.isDefault) {
          return;
        }
        
        set((state) => {
          const newLayouts = state.layouts.filter((l) => l.id !== layoutId);
          const newCurrentId =
            state.currentLayoutId === layoutId
              ? newLayouts[0]?.id || null
              : state.currentLayoutId;
          
          return {
            layouts: newLayouts,
            currentLayoutId: newCurrentId,
          };
        });
      },
      
      duplicateLayout: (layoutId, newName) => {
        const layout = get().layouts.find((l) => l.id === layoutId);
        if (!layout) {
          throw new Error('Layout not found');
        }
        
        const duplicatedLayout: DashboardLayout = {
          ...layout,
          id: `layout-${Date.now()}`,
          name: newName,
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          panels: layout.panels.map((panel) => ({
            ...panel,
            id: `${panel.id}-copy-${Date.now()}`,
          })),
        };
        
        set((state) => ({
          layouts: [...state.layouts, duplicatedLayout],
        }));
        
        return duplicatedLayout;
      },
      
      addPanel: (layoutId, panel) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === layoutId
              ? {
                  ...layout,
                  panels: [...layout.panels, panel],
                  updatedAt: new Date().toISOString(),
                }
              : layout
          ),
        }));
      },
      
      removePanel: (layoutId, panelId) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === layoutId
              ? {
                  ...layout,
                  panels: layout.panels.filter((p) => p.id !== panelId),
                  updatedAt: new Date().toISOString(),
                }
              : layout
          ),
        }));
      },
      
      updatePanel: (layoutId, panelId, updates) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === layoutId
              ? {
                  ...layout,
                  panels: layout.panels.map((panel) =>
                    panel.id === panelId ? { ...panel, ...updates } : panel
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : layout
          ),
        }));
      },
      
      updatePanelPositions: (layoutId, panels) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === layoutId
              ? {
                  ...layout,
                  panels,
                  updatedAt: new Date().toISOString(),
                }
              : layout
          ),
        }));
      },
      
      getCurrentLayout: () => {
        const state = get();
        return state.layouts.find((l) => l.id === state.currentLayoutId) || null;
      },
      
      getLayout: (layoutId) => {
        return get().layouts.find((l) => l.id === layoutId) || null;
      },
      
      resetToDefault: () => {
        set({
          currentLayoutId: 'default',
          layouts: [createDefaultLayout()],
        });
      },
      
      loadPreset: (presetName) => {
        const preset = PRESET_LAYOUTS[presetName];
        if (!preset) return;
        
        // Create a new layout from the preset
        const newLayout: DashboardLayout = {
          ...preset,
          id: `${presetName}-${Date.now()}`,
          name: `${preset.name} (Copy)`,
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          panels: preset.panels.map((panel) => ({
            ...panel,
            id: `${panel.id}-${Date.now()}`,
          })),
        };
        
        set((state) => ({
          layouts: [...state.layouts, newLayout],
          currentLayoutId: newLayout.id,
        }));
      },
    }),
    {
      name: 'layout-storage',
      partialize: (state) => ({
        currentLayoutId: state.currentLayoutId,
        layouts: state.layouts,
      }),
    }
  )
);
