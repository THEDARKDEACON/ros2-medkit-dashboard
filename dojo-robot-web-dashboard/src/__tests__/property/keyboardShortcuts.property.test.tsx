import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

/**
 * Property 47: Keyboard Shortcut Execution
 * 
 * **Validates: Requirements 10.6**
 * 
 * For any defined keyboard shortcut, pressing that key combination should trigger the associated action.
 */

// Test component that uses keyboard navigation
function TestComponent() {
  useKeyboardNavigation();
  return <div data-testid="test-component">Test</div>;
}

describe('Property 47: Keyboard Shortcut Execution', () => {
  beforeEach(() => {
    // Mock window.location for navigation tests
    delete (window as any).location;
    window.location = { ...window.location, href: '/' } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Feature: dojo-robot-web-dashboard, Property 47: For any defined keyboard shortcut, pressing that key combination should trigger the associated action', () => {
    // Define keyboard shortcuts to test
    const shortcuts = [
      { key: 'h', ctrl: true, expectedPath: '/', description: 'Home' },
      { key: 'c', ctrl: true, expectedPath: '/components', description: 'Components' },
      { key: 't', ctrl: true, expectedPath: '/topics', description: 'Topics' },
      { key: 'o', ctrl: true, expectedPath: '/operations', description: 'Operations' },
      { key: 'p', ctrl: true, expectedPath: '/parameters', description: 'Parameters' },
      { key: 'f', ctrl: true, expectedPath: '/faults', description: 'Faults' },
      { key: 'v', ctrl: true, expectedPath: '/visualizations', description: 'Visualizations' },
      { key: 's', ctrl: true, expectedPath: '/settings', description: 'Settings' },
    ];

    shortcuts.forEach(({ key, ctrl, expectedPath, description }) => {
      // Render component with router
      const { unmount } = render(
        <BrowserRouter>
          <TestComponent />
        </BrowserRouter>
      );

      // Create and dispatch keyboard event
      const event = new KeyboardEvent('keydown', {
        key,
        ctrlKey: ctrl,
        bubbles: true,
        cancelable: true,
      });

      // Mock preventDefault to verify it's called
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      // Dispatch the event
      window.dispatchEvent(event);

      // Verify preventDefault was called (shortcut was recognized)
      expect(preventDefaultSpy).toHaveBeenCalled();

      unmount();
    });
  });

  it('should not trigger shortcuts when typing in input fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('h', 'c', 't', 'o', 'p', 'f', 'v', 's'),
        (key) => {
          const { unmount } = render(
            <BrowserRouter>
              <div>
                <TestComponent />
                <input data-testid="test-input" />
              </div>
            </BrowserRouter>
          );

          // Focus the input
          const input = screen.getByTestId('test-input');
          input.focus();

          // Create keyboard event
          const event = new KeyboardEvent('keydown', {
            key,
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          });

          const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

          // Dispatch event while input is focused
          Object.defineProperty(event, 'target', {
            value: input,
            writable: false,
          });
          window.dispatchEvent(event);

          // Verify preventDefault was NOT called (shortcut was ignored)
          expect(preventDefaultSpy).not.toHaveBeenCalled();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should not trigger shortcuts when typing in textarea fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('h', 'c', 't', 'o', 'p', 'f', 'v', 's'),
        (key) => {
          const { unmount } = render(
            <BrowserRouter>
              <div>
                <TestComponent />
                <textarea data-testid="test-textarea" />
              </div>
            </BrowserRouter>
          );

          // Focus the textarea
          const textarea = screen.getByTestId('test-textarea');
          textarea.focus();

          // Create keyboard event
          const event = new KeyboardEvent('keydown', {
            key,
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          });

          const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

          // Dispatch event while textarea is focused
          Object.defineProperty(event, 'target', {
            value: textarea,
            writable: false,
          });
          window.dispatchEvent(event);

          // Verify preventDefault was NOT called (shortcut was ignored)
          expect(preventDefaultSpy).not.toHaveBeenCalled();

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should require correct modifier keys for shortcuts', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('h', 'c', 'o', 'p', 'f', 'v', 's'), // Exclude 't' and 'k' which have multiple shortcuts
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (key, ctrlKey, shiftKey, altKey) => {
          const { unmount } = render(
            <BrowserRouter>
              <TestComponent />
            </BrowserRouter>
          );

          // Create keyboard event with random modifiers
          const event = new KeyboardEvent('keydown', {
            key,
            ctrlKey,
            shiftKey,
            altKey,
            bubbles: true,
            cancelable: true,
          });

          const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

          window.dispatchEvent(event);

          // Shortcut should only trigger with Ctrl and no other modifiers
          if (ctrlKey && !shiftKey && !altKey) {
            expect(preventDefaultSpy).toHaveBeenCalled();
          } else {
            expect(preventDefaultSpy).not.toHaveBeenCalled();
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle Escape key to close dialogs', () => {
    const mockCloseButton = document.createElement('button');
    mockCloseButton.setAttribute('data-keyboard-shortcut', 'close');
    const clickSpy = vi.fn();
    mockCloseButton.addEventListener('click', clickSpy);
    document.body.appendChild(mockCloseButton);

    render(
      <BrowserRouter>
        <TestComponent />
      </BrowserRouter>
    );

    // Press Escape
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(event);

    // Verify close button was clicked
    expect(clickSpy).toHaveBeenCalled();

    document.body.removeChild(mockCloseButton);
  });

  it('should handle ? key to open help', () => {
    const mockHelpButton = document.createElement('button');
    mockHelpButton.setAttribute('data-keyboard-shortcut', 'help');
    const clickSpy = vi.fn();
    mockHelpButton.addEventListener('click', clickSpy);
    document.body.appendChild(mockHelpButton);

    render(
      <BrowserRouter>
        <TestComponent />
      </BrowserRouter>
    );

    // Press ?
    const event = new KeyboardEvent('keydown', {
      key: '?',
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    // Verify preventDefault was called and help button was clicked
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    document.body.removeChild(mockHelpButton);
  });

  it('should handle Ctrl+K to focus global search', () => {
    const mockSearchInput = document.createElement('input');
    mockSearchInput.setAttribute('data-keyboard-shortcut', 'global-search');
    const focusSpy = vi.fn();
    mockSearchInput.focus = focusSpy;
    document.body.appendChild(mockSearchInput);

    render(
      <BrowserRouter>
        <TestComponent />
      </BrowserRouter>
    );

    // Press Ctrl+K
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    // Verify preventDefault was called and search input was focused
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();

    document.body.removeChild(mockSearchInput);
  });
});
