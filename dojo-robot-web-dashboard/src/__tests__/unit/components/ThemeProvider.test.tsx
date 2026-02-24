/**
 * Unit tests for ThemeProvider component
 * **Validates: Requirements 11.1, 11.2, 11.5, 11.8**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useUIStore } from '@/features/stores/uiStore';

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset store to default state
    useUIStore.setState({ theme: 'light' });
    
    // Clear any existing classes on document element
    document.documentElement.className = '';
  });

  it('should apply light theme class to document element', () => {
    useUIStore.setState({ theme: 'light' });
    
    render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply dark theme class to document element', () => {
    useUIStore.setState({ theme: 'dark' });
    
    render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should update theme class when theme changes', async () => {
    const { rerender } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    // Initial state - light theme
    expect(document.documentElement.classList.contains('light')).toBe(true);
    
    // Change to dark theme
    useUIStore.setState({ theme: 'dark' });
    rerender(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should apply transition styles during theme change', () => {
    const { rerender } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    // Change theme
    useUIStore.setState({ theme: 'dark' });
    rerender(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    // Check that transition style is applied
    const transitionStyle = document.documentElement.style.transition;
    expect(transitionStyle).toContain('background-color');
    expect(transitionStyle).toContain('color');
  });

  it('should remove transition styles after animation completes', async () => {
    vi.useFakeTimers();
    
    const { rerender } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    // Change theme
    useUIStore.setState({ theme: 'dark' });
    rerender(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    // Transition should be set initially
    expect(document.documentElement.style.transition).toBeTruthy();
    
    // Fast-forward time past the transition duration (300ms)
    await vi.advanceTimersByTimeAsync(300);
    
    // Transition should be removed
    expect(document.documentElement.style.transition).toBe('');
    
    vi.useRealTimers();
  });

  it('should render children correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(getByText('Test content')).toBeInTheDocument();
  });

  it('should only have one theme class applied at a time', () => {
    useUIStore.setState({ theme: 'light' });
    
    const { rerender } = render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    // Switch to dark
    useUIStore.setState({ theme: 'dark' });
    rerender(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });
});
