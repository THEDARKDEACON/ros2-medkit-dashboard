/**
 * Unit tests for ThemeToggle component
 * **Validates: Requirements 11.1, 11.2, 11.3**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useUIStore } from '@/features/stores/uiStore';

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset store to default state
    useUIStore.setState({ theme: 'light' });
  });

  it('should render theme toggle button', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();
  });

  it('should display moon icon in light mode', () => {
    useUIStore.setState({ theme: 'light' });
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(button).toBeInTheDocument();
  });

  it('should display sun icon in dark mode', () => {
    useUIStore.setState({ theme: 'dark' });
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /switch to light mode/i });
    expect(button).toBeInTheDocument();
  });

  it('should toggle theme when clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    
    // Initial state is light
    expect(useUIStore.getState().theme).toBe('light');
    
    // Click to toggle to dark
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(useUIStore.getState().theme).toBe('dark');
    
    // Click again to toggle back to light
    await user.click(button);
    
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('should have proper accessibility attributes', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });

  it('should update aria-label based on current theme', () => {
    const { rerender } = render(<ThemeToggle />);
    
    // Light mode
    useUIStore.setState({ theme: 'light' });
    rerender(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Dark mode
    useUIStore.setState({ theme: 'dark' });
    rerender(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
  });
});
