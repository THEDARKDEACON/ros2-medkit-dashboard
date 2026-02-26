import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '../../../features/stores/layoutStore';
import type { PanelConfig } from '../../../types/layout';

describe('layoutStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useLayoutStore.getState().resetToDefault();
  });

  describe('Layout Management', () => {
    it('should initialize with default layout', () => {
      const { layouts, currentLayoutId } = useLayoutStore.getState();

      expect(layouts).toHaveLength(1);
      expect(layouts[0].id).toBe('default');
      expect(layouts[0].isDefault).toBe(true);
      expect(currentLayoutId).toBe('default');
    });

    it('should create a new layout', () => {
      const { createLayout } = useLayoutStore.getState();

      const newLayout = createLayout('My Custom Layout');

      expect(newLayout.name).toBe('My Custom Layout');
      expect(newLayout.isDefault).toBe(false);
      expect(useLayoutStore.getState().layouts).toHaveLength(2);
    });

    it('should set current layout', () => {
      const { createLayout, setCurrentLayout } = useLayoutStore.getState();

      const newLayout = createLayout('Test Layout');
      setCurrentLayout(newLayout.id);

      expect(useLayoutStore.getState().currentLayoutId).toBe(newLayout.id);
    });

    it('should update layout', () => {
      const { createLayout, updateLayout, getLayout } = useLayoutStore.getState();

      const layout = createLayout('Test Layout');
      updateLayout(layout.id, { name: 'Updated Layout' });

      const updated = getLayout(layout.id);
      expect(updated?.name).toBe('Updated Layout');
    });

    it('should delete non-default layout', () => {
      const { createLayout, deleteLayout } = useLayoutStore.getState();

      const layout = createLayout('Test Layout');
      deleteLayout(layout.id);

      expect(useLayoutStore.getState().layouts).toHaveLength(1);
    });

    it('should not delete default layout', () => {
      const { deleteLayout } = useLayoutStore.getState();

      deleteLayout('default');

      expect(useLayoutStore.getState().layouts).toHaveLength(1);
      expect(useLayoutStore.getState().layouts[0].id).toBe('default');
    });

    it('should duplicate layout', async () => {
      const { createLayout, duplicateLayout } = useLayoutStore.getState();

      const original = createLayout('Original Layout');

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const duplicate = duplicateLayout(original.id, 'Duplicated Layout');

      expect(duplicate.name).toBe('Duplicated Layout');
      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.panels.length).toBe(original.panels.length);
      expect(useLayoutStore.getState().layouts).toHaveLength(3);
    });
  });

  describe('Panel Management', () => {
    it('should add panel to layout', () => {
      const { createLayout, addPanel, getLayout } = useLayoutStore.getState();

      const layout = createLayout('Test Layout', []);
      const panel: PanelConfig = {
        id: 'test-panel',
        type: 'metrics',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 2 },
        config: {},
      };

      addPanel(layout.id, panel);

      const updated = getLayout(layout.id);
      expect(updated?.panels).toHaveLength(1);
      expect(updated?.panels[0].id).toBe('test-panel');
    });

    it('should remove panel from layout', () => {
      const { createLayout, addPanel, removePanel, getLayout } = useLayoutStore.getState();

      const layout = createLayout('Test Layout', []);
      const panel: PanelConfig = {
        id: 'test-panel',
        type: 'metrics',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 2 },
        config: {},
      };

      addPanel(layout.id, panel);
      removePanel(layout.id, 'test-panel');

      const updated = getLayout(layout.id);
      expect(updated?.panels).toHaveLength(0);
    });

    it('should update panel', () => {
      const { createLayout, addPanel, updatePanel, getLayout } = useLayoutStore.getState();

      const layout = createLayout('Test Layout', []);
      const panel: PanelConfig = {
        id: 'test-panel',
        type: 'metrics',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 2 },
        config: {},
      };

      addPanel(layout.id, panel);
      updatePanel(layout.id, 'test-panel', {
        size: { width: 6, height: 3 },
      });

      const updated = getLayout(layout.id);
      expect(updated?.panels[0].size).toEqual({ width: 6, height: 3 });
    });

    it('should update panel positions', () => {
      const { createLayout, updatePanelPositions, getLayout } = useLayoutStore.getState();

      const panels: PanelConfig[] = [
        {
          id: 'panel-1',
          type: 'metrics',
          position: { x: 0, y: 0 },
          size: { width: 4, height: 2 },
          config: {},
        },
        {
          id: 'panel-2',
          type: 'system-health',
          position: { x: 4, y: 0 },
          size: { width: 4, height: 2 },
          config: {},
        },
      ];

      const layout = createLayout('Test Layout', panels);

      const updatedPanels = panels.map((p) => ({
        ...p,
        position: { x: p.position.x + 1, y: p.position.y + 1 },
      }));

      updatePanelPositions(layout.id, updatedPanels);

      const updated = getLayout(layout.id);
      expect(updated?.panels[0].position).toEqual({ x: 1, y: 1 });
      expect(updated?.panels[1].position).toEqual({ x: 5, y: 1 });
    });
  });

  describe('Utilities', () => {
    it('should get current layout', () => {
      const { getCurrentLayout } = useLayoutStore.getState();

      const current = getCurrentLayout();

      expect(current).not.toBeNull();
      expect(current?.id).toBe('default');
    });

    it('should get layout by id', () => {
      const { createLayout, getLayout } = useLayoutStore.getState();

      const layout = createLayout('Test Layout');
      const retrieved = getLayout(layout.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(layout.id);
    });

    it('should reset to default', () => {
      const { createLayout, resetToDefault } = useLayoutStore.getState();

      createLayout('Layout 1');
      createLayout('Layout 2');

      resetToDefault();

      const state = useLayoutStore.getState();
      expect(state.layouts).toHaveLength(1);
      expect(state.layouts[0].id).toBe('default');
      expect(state.currentLayoutId).toBe('default');
    });

    it('should load preset layout', () => {
      const { loadPreset } = useLayoutStore.getState();

      loadPreset('operator');

      const state = useLayoutStore.getState();
      expect(state.layouts.length).toBeGreaterThan(1);

      const operatorLayout = state.layouts.find((l) => l.name.includes('Operator'));
      expect(operatorLayout).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    it('should set createdAt and updatedAt on creation', () => {
      const { createLayout } = useLayoutStore.getState();

      const layout = createLayout('Test Layout');

      expect(layout.createdAt).toBeDefined();
      expect(layout.updatedAt).toBeDefined();
    });

    it('should update updatedAt on modification', async () => {
      const { createLayout, updateLayout, getLayout } = useLayoutStore.getState();

      const layout = createLayout('Test Layout');
      const originalUpdatedAt = layout.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      updateLayout(layout.id, { name: 'Updated Layout' });

      const updated = getLayout(layout.id);
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
    });
  });
});
