import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/layout/Header';
import { useUIStore } from '@/features/stores/uiStore';
import { useConnectionStore } from '@/features/stores/connectionStore';

describe('Header', () => {
  beforeEach(() => {
    // Reset stores before each test
    useUIStore.setState({ theme: 'light', sidebarCollapsed: false });
    useConnectionStore.setState({ apiStatus: 'disconnected' });
  });

  it('should render logo and title', () => {
    render(<Header />);

    expect(screen.getByText('Dojo Robot Dashboard')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument(); // Logo letter
  });

  it('should display connection status', () => {
    useConnectionStore.setState({ apiStatus: 'connected' });
    render(<Header />);

    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should show different connection statuses', () => {
    const { rerender } = render(<Header />);

    // Disconnected
    useConnectionStore.setState({ apiStatus: 'disconnected' });
    rerender(<Header />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();

    // Reconnecting
    useConnectionStore.setState({ apiStatus: 'reconnecting' });
    rerender(<Header />);
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();

    // Failed
    useConnectionStore.setState({ apiStatus: 'failed' });
    rerender(<Header />);
    expect(screen.getByText('Connection Failed')).toBeInTheDocument();
  });

  it('should toggle theme when theme button is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const initialTheme = useUIStore.getState().theme;
    expect(initialTheme).toBe('light');

    // Find and click theme toggle button
    const themeButton = screen.getByLabelText(/Switch to dark mode/i);
    await user.click(themeButton);

    const newTheme = useUIStore.getState().theme;
    expect(newTheme).toBe('dark');
  });

  it('should toggle sidebar when menu button is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const initialCollapsed = useUIStore.getState().sidebarCollapsed;
    expect(initialCollapsed).toBe(false);

    // Find and click menu toggle button
    const menuButton = screen.getByLabelText('Toggle sidebar');
    await user.click(menuButton);

    const newCollapsed = useUIStore.getState().sidebarCollapsed;
    expect(newCollapsed).toBe(true);
  });

  it('should display correct theme icon', () => {
    const { rerender } = render(<Header />);

    // Light mode should show moon icon (switch to dark)
    useUIStore.setState({ theme: 'light' });
    rerender(<Header />);
    expect(screen.getByLabelText(/Switch to dark mode/i)).toBeInTheDocument();

    // Dark mode should show sun icon (switch to light)
    useUIStore.setState({ theme: 'dark' });
    rerender(<Header />);
    expect(screen.getByLabelText(/Switch to light mode/i)).toBeInTheDocument();
  });
});
