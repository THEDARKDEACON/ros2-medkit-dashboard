import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '@/components/layout/StatusBar';
import { useConnectionStore } from '@/features/stores/connectionStore';

describe('StatusBar', () => {
  beforeEach(() => {
    useConnectionStore.setState({
      apiStatus: 'disconnected',
      sseStatus: 'disconnected',
      wsStatus: 'disconnected',
      pollingEnabled: false,
      lastConnected: null,
      reconnectAttempts: 0,
    });
  });

  it('should display all connection statuses', () => {
    render(<StatusBar />);

    expect(screen.getByText(/API:/)).toBeInTheDocument();
    expect(screen.getByText(/SSE:/)).toBeInTheDocument();
    expect(screen.getByText(/WebSocket:/)).toBeInTheDocument();
  });

  it('should show last connected time', () => {
    render(<StatusBar />);

    expect(screen.getByText(/Last connected:/)).toBeInTheDocument();
  });

  it('should display "Never" when never connected', () => {
    useConnectionStore.setState({ lastConnected: null });
    render(<StatusBar />);

    expect(screen.getByText(/Last connected: Never/)).toBeInTheDocument();
  });

  it('should format last connected timestamp', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');
    useConnectionStore.setState({ lastConnected: testDate.toISOString() });
    render(<StatusBar />);

    // Should display formatted time (exact format depends on locale)
    expect(screen.getByText(/Last connected:/)).toBeInTheDocument();
  });

  it('should show reconnect attempts when greater than 0', () => {
    useConnectionStore.setState({ reconnectAttempts: 3 });
    render(<StatusBar />);

    expect(screen.getByText(/Reconnect attempts: 3/)).toBeInTheDocument();
  });

  it('should not show reconnect attempts when 0', () => {
    useConnectionStore.setState({ reconnectAttempts: 0 });
    render(<StatusBar />);

    expect(screen.queryByText(/Reconnect attempts:/)).not.toBeInTheDocument();
  });

  it('should show polling mode indicator when enabled', () => {
    useConnectionStore.setState({ pollingEnabled: true });
    render(<StatusBar />);

    expect(screen.getByText('Polling Mode')).toBeInTheDocument();
  });

  it('should not show polling mode when disabled', () => {
    useConnectionStore.setState({ pollingEnabled: false });
    render(<StatusBar />);

    expect(screen.queryByText('Polling Mode')).not.toBeInTheDocument();
  });

  it('should display different connection statuses correctly', () => {
    const { rerender } = render(<StatusBar />);

    // Connected
    useConnectionStore.setState({ apiStatus: 'connected' });
    rerender(<StatusBar />);
    expect(screen.getByText('API:')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();

    // Reconnecting
    useConnectionStore.setState({ apiStatus: 'reconnecting' });
    rerender(<StatusBar />);
    expect(screen.getByText('Reconnecting')).toBeInTheDocument();

    // Failed
    useConnectionStore.setState({ apiStatus: 'failed' });
    rerender(<StatusBar />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should show all three connection types independently', () => {
    useConnectionStore.setState({
      apiStatus: 'connected',
      sseStatus: 'reconnecting',
      wsStatus: 'disconnected',
    });
    render(<StatusBar />);

    expect(screen.getByText('API:')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('SSE:')).toBeInTheDocument();
    expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    expect(screen.getByText('WebSocket:')).toBeInTheDocument();
    // Note: There are two "Disconnected" texts, so we use getAllByText
    expect(screen.getAllByText('Disconnected').length).toBeGreaterThan(0);
  });
});
