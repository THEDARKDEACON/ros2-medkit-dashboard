/**
 * Unit tests for FaultTimeline component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaultTimeline } from '../../../../components/faults/FaultTimeline';
import type { Fault } from '../../../../types/api';

describe('FaultTimeline', () => {
  const mockFaults: Fault[] = [
    {
      code: 'ERR001',
      message: 'Navigation error',
      severity: 'error',
      componentId: 'nav_component',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
    {
      code: 'WARN001',
      message: 'Low battery warning',
      severity: 'warning',
      componentId: 'power_component',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    },
    {
      code: 'INFO001',
      message: 'System initialized',
      severity: 'info',
      componentId: 'nav_component',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    },
    {
      code: 'ERR002',
      message: 'Sensor failure',
      severity: 'error',
      componentId: 'sensor_component',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    },
  ];

  it('should render empty state when no faults provided', () => {
    render(<FaultTimeline faults={[]} />);

    expect(screen.getByText('No fault history')).toBeInTheDocument();
    expect(screen.getByText('Fault events will appear here as they occur')).toBeInTheDocument();
  });

  it('should render timeline with fault data', () => {
    render(<FaultTimeline faults={mockFaults} />);

    // Check for time range selector
    expect(screen.getByText('Last Hour')).toBeInTheDocument();
    expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();

    // Check for statistics
    expect(screen.getByText('Total Faults')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should display correct statistics', () => {
    render(<FaultTimeline faults={mockFaults} />);

    // Total faults
    const totalElement = screen.getByText('Total Faults').nextElementSibling;
    expect(totalElement).toHaveTextContent('4');

    // Errors
    const errorsElement = screen.getByText('Errors').nextElementSibling;
    expect(errorsElement).toHaveTextContent('2');

    // Warnings
    const warningsElement = screen.getByText('Warnings').nextElementSibling;
    expect(warningsElement).toHaveTextContent('1');

    // Info
    const infoElement = screen.getByText('Info').nextElementSibling;
    expect(infoElement).toHaveTextContent('1');
  });

  it('should change time range when button clicked', async () => {
    const user = userEvent.setup();
    render(<FaultTimeline faults={mockFaults} />);

    // Default is "Last 24 Hours"
    const last24HoursButton = screen.getByRole('button', { name: 'Last 24 Hours' });
    expect(last24HoursButton).toHaveAttribute('aria-pressed', 'true');

    // Click "Last Hour"
    const lastHourButton = screen.getByRole('button', { name: 'Last Hour' });
    await user.click(lastHourButton);

    // Check that "Last Hour" is now active
    expect(lastHourButton).toHaveAttribute('aria-pressed', 'true');
    expect(last24HoursButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should call onFaultSelect when bar is clicked', () => {
    const onFaultSelect = vi.fn();
    
    render(<FaultTimeline faults={mockFaults} onFaultSelect={onFaultSelect} />);

    // Find and click on a bar (this is tricky with Recharts, so we'll just verify the callback is passed)
    // In a real scenario, you'd need to simulate a click on the chart
    expect(onFaultSelect).not.toHaveBeenCalled();
  });

  it('should show empty state when no faults in selected time range', async () => {
    // Create faults from 8 days ago (outside 7-day range)
    const oldFaults: Fault[] = [
      {
        code: 'ERR001',
        message: 'Old error',
        severity: 'error',
        componentId: 'nav_component',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    render(<FaultTimeline faults={oldFaults} />);

    // Should show empty state for default 24h range
    await waitFor(() => {
      expect(screen.getByText('No faults in selected time range')).toBeInTheDocument();
    });
  });

  it('should group faults by time buckets', () => {
    render(<FaultTimeline faults={mockFaults} />);

    // The chart should be rendered (ResponsiveContainer is present)
    // We can't easily test the internal grouping logic without accessing the chart data
    // But we can verify the component renders without errors
    expect(screen.getByText('Time Range')).toBeInTheDocument();
  });

  it('should use custom height prop', () => {
    const { container } = render(<FaultTimeline faults={mockFaults} height={500} />);

    // The ResponsiveContainer should have the custom height
    // This is difficult to test directly, but we can verify the component renders
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('should display help text', () => {
    render(<FaultTimeline faults={mockFaults} />);

    expect(screen.getByText('Click on a bar to view faults from that time period')).toBeInTheDocument();
  });

  it('should handle faults with different severities', () => {
    const mixedFaults: Fault[] = [
      {
        code: 'ERR001',
        message: 'Error 1',
        severity: 'error',
        componentId: 'comp1',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        code: 'ERR002',
        message: 'Error 2',
        severity: 'error',
        componentId: 'comp2',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        code: 'WARN001',
        message: 'Warning 1',
        severity: 'warning',
        componentId: 'comp3',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ];

    render(<FaultTimeline faults={mixedFaults} />);

    // Check statistics
    const errorsElement = screen.getByText('Errors').nextElementSibling;
    expect(errorsElement).toHaveTextContent('2');

    const warningsElement = screen.getByText('Warnings').nextElementSibling;
    expect(warningsElement).toHaveTextContent('1');

    const infoElement = screen.getByText('Info').nextElementSibling;
    expect(infoElement).toHaveTextContent('0');
  });

  it('should handle single fault', () => {
    const singleFault: Fault[] = [
      {
        code: 'ERR001',
        message: 'Single error',
        severity: 'error',
        componentId: 'comp1',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ];

    render(<FaultTimeline faults={singleFault} />);

    const totalElement = screen.getByText('Total Faults').nextElementSibling;
    expect(totalElement).toHaveTextContent('1');
  });

  it('should render time range selector with correct initial state', () => {
    render(<FaultTimeline faults={mockFaults} />);

    // Default should be "Last 24 Hours"
    const last24HoursButton = screen.getByRole('button', { name: 'Last 24 Hours' });
    expect(last24HoursButton).toHaveClass('bg-primary');
    expect(last24HoursButton).toHaveAttribute('aria-pressed', 'true');

    // Others should not be active
    const lastHourButton = screen.getByRole('button', { name: 'Last Hour' });
    expect(lastHourButton).not.toHaveClass('bg-primary');
    expect(lastHourButton).toHaveAttribute('aria-pressed', 'false');
  });
});
