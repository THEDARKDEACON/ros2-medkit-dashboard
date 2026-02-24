import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/features/stores/uiStore';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'view' | 'action' | 'general';
}

/**
 * Global keyboard navigation hook
 * Provides keyboard shortcuts for common dashboard actions
 */
export function useKeyboardNavigation() {
  const navigate = useNavigate();
  const { toggleSidebar, toggleTheme } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Navigation shortcuts
      if (ctrl && !shift && !alt) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            navigate('/');
            break;
          case 'c':
            event.preventDefault();
            navigate('/components');
            break;
          case 't':
            event.preventDefault();
            navigate('/topics');
            break;
          case 'o':
            event.preventDefault();
            navigate('/operations');
            break;
          case 'p':
            event.preventDefault();
            navigate('/parameters');
            break;
          case 'f':
            event.preventDefault();
            navigate('/faults');
            break;
          case 'v':
            event.preventDefault();
            navigate('/visualizations');
            break;
          case 's':
            event.preventDefault();
            navigate('/settings');
            break;
          case 'k':
            event.preventDefault();
            // Focus global search
            const searchInput = document.querySelector<HTMLInputElement>(
              '[data-keyboard-shortcut="global-search"]'
            );
            searchInput?.focus();
            break;
        }
      }

      // View shortcuts
      if (ctrl && shift && !alt) {
        switch (event.key.toLowerCase()) {
          case 'b':
            event.preventDefault();
            toggleSidebar();
            break;
          case 't':
            event.preventDefault();
            toggleTheme();
            break;
        }
      }

      // General shortcuts
      if (!ctrl && !shift && !alt) {
        switch (event.key) {
          case '?':
            event.preventDefault();
            // Open keyboard shortcuts help
            const helpButton = document.querySelector<HTMLButtonElement>(
              '[data-keyboard-shortcut="help"]'
            );
            helpButton?.click();
            break;
          case 'Escape':
            // Close modals/dialogs
            const closeButtons = document.querySelectorAll<HTMLButtonElement>(
              '[data-keyboard-shortcut="close"]'
            );
            closeButtons[closeButtons.length - 1]?.click();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleSidebar, toggleTheme]);
}

/**
 * Get all available keyboard shortcuts
 */
export function getKeyboardShortcuts(): KeyboardShortcut[] {
  return [
    // Navigation
    {
      key: 'Ctrl+H',
      description: 'Go to Dashboard',
      action: () => {},
      category: 'navigation',
    },
    {
      key: 'Ctrl+C',
      description: 'Go to Components',
      action: () => {},
      category: 'navigation',
    },
    {
      key: 'Ctrl+T',
      description: 'Go to Topics',
      action: () => {},
      category: 'navigation',
    },
    {
      key: 'Ctrl+O',
      description: 'Go to Operations',
      action: () => {},
      category: 'navigation',
    },
    {
      key: 'Ctrl+P',
      description: 'Go to Parameters',
      action: () => {},
      category: 'navigation',
    },
    {
      key: 'Ctrl+F',
      description: 'Go to Faults',
      action: () => {},
      category: 'navigation',
    },
    {
      key: 'Ctrl+V',
      description: 'Go to Visualizations',
      action: () => {},
      category: 'navigation',
    },
    {
      key: 'Ctrl+S',
      description: 'Go to Settings',
      action: () => {},
      category: 'navigation',
    },
    {
      key: 'Ctrl+K',
      description: 'Focus global search',
      action: () => {},
      category: 'navigation',
    },
    // View
    {
      key: 'Ctrl+Shift+B',
      description: 'Toggle sidebar',
      action: () => {},
      category: 'view',
    },
    {
      key: 'Ctrl+Shift+T',
      description: 'Toggle theme',
      action: () => {},
      category: 'view',
    },
    // General
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => {},
      category: 'general',
    },
    {
      key: 'Escape',
      description: 'Close dialog/modal',
      action: () => {},
      category: 'general',
    },
  ];
}
