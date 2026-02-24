import { describe, it, expect, beforeEach } from 'vitest';
import { useNavigationStore } from '../../../features/stores/navigationStore';

describe('navigationStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNavigationStore.setState({
      breadcrumbs: [],
      history: [],
      currentPath: '/',
      isNavigating: false,
    });
  });

  describe('breadcrumbs', () => {
    it('should push breadcrumb', () => {
      const { pushBreadcrumb } = useNavigationStore.getState();
      pushBreadcrumb({ label: 'Home', path: '/' });
      expect(useNavigationStore.getState().breadcrumbs).toHaveLength(1);
      expect(useNavigationStore.getState().breadcrumbs[0]).toEqual({
        label: 'Home',
        path: '/',
      });
    });

    it('should push multiple breadcrumbs', () => {
      const { pushBreadcrumb } = useNavigationStore.getState();
      pushBreadcrumb({ label: 'Home', path: '/' });
      pushBreadcrumb({ label: 'Components', path: '/components' });
      expect(useNavigationStore.getState().breadcrumbs).toHaveLength(2);
    });

    it('should pop breadcrumb', () => {
      const { pushBreadcrumb, popBreadcrumb } =
        useNavigationStore.getState();
      pushBreadcrumb({ label: 'Home', path: '/' });
      pushBreadcrumb({ label: 'Components', path: '/components' });
      popBreadcrumb();
      expect(useNavigationStore.getState().breadcrumbs).toHaveLength(1);
      expect(useNavigationStore.getState().breadcrumbs[0].label).toBe(
        'Home',
      );
    });

    it('should set breadcrumbs', () => {
      const { setBreadcrumbs } = useNavigationStore.getState();
      const crumbs = [
        { label: 'Home', path: '/' },
        { label: 'Components', path: '/components' },
      ];
      setBreadcrumbs(crumbs);
      expect(useNavigationStore.getState().breadcrumbs).toEqual(crumbs);
    });

    it('should clear breadcrumbs', () => {
      const { pushBreadcrumb, clearBreadcrumbs } =
        useNavigationStore.getState();
      pushBreadcrumb({ label: 'Home', path: '/' });
      clearBreadcrumbs();
      expect(useNavigationStore.getState().breadcrumbs).toHaveLength(0);
    });
  });

  describe('navigation history', () => {
    it('should add to history', () => {
      const { addToHistory } = useNavigationStore.getState();
      addToHistory('/components');
      expect(useNavigationStore.getState().history).toContain(
        '/components',
      );
      expect(useNavigationStore.getState().currentPath).toBe(
        '/components',
      );
    });

    it('should not add duplicate consecutive paths', () => {
      const { addToHistory } = useNavigationStore.getState();
      addToHistory('/components');
      addToHistory('/components');
      expect(useNavigationStore.getState().history).toHaveLength(1);
    });

    it('should maintain history size limit', () => {
      const { addToHistory } = useNavigationStore.getState();
      // Add 15 paths (more than MAX_HISTORY_SIZE of 10)
      for (let i = 0; i < 15; i++) {
        addToHistory(`/path-${i}`);
      }
      expect(useNavigationStore.getState().history.length).toBeLessThanOrEqual(
        10,
      );
    });

    it('should clear history', () => {
      const { addToHistory, clearHistory } =
        useNavigationStore.getState();
      addToHistory('/components');
      addToHistory('/topics');
      clearHistory();
      expect(useNavigationStore.getState().history).toHaveLength(0);
      expect(useNavigationStore.getState().currentPath).toBe('/');
    });

    it('should check if can go back', () => {
      const { addToHistory, canGoBack } = useNavigationStore.getState();
      expect(canGoBack()).toBe(false);
      addToHistory('/components');
      expect(canGoBack()).toBe(false); // Only 1 item
      addToHistory('/topics');
      expect(canGoBack()).toBe(true); // 2 items
    });

    it('should check if can go forward', () => {
      const { canGoForward } = useNavigationStore.getState();
      // Currently always returns false as forward history is not implemented
      expect(canGoForward()).toBe(false);
    });
  });

  describe('navigation state', () => {
    it('should set navigating state', () => {
      const { setIsNavigating } = useNavigationStore.getState();
      setIsNavigating(true);
      expect(useNavigationStore.getState().isNavigating).toBe(true);
      setIsNavigating(false);
      expect(useNavigationStore.getState().isNavigating).toBe(false);
    });
  });
});
