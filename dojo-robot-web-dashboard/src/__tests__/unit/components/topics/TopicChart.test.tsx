import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicChart } from '@/components/topics/TopicChart';

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`line-${dataKey}`} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Brush: () => <div data-testid="brush" />,
}));

describe('TopicChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display empty state for non-numeric data', () => {
    render(<TopicChart data="string data" topicName="/test/topic" />);

    expect(screen.getByText('No numeric data')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This topic does not contain numeric data that can be visualized in a chart.'
      )
    ).toBeInTheDocument();
  });

  it('should display waiting state when no data points are available', () => {
    render(<TopicChart data={null} topicName="/test/topic" />);

    expect(screen.getByText('No numeric data')).toBeInTheDocument();
  });

  it('should render chart for numeric primitive data', async () => {
    const { rerender } = render(
      <TopicChart data={42} topicName="/test/topic" />
    );

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Should show data point count
    expect(screen.getByText(/1 data points/)).toBeInTheDocument();

    // Add another data point
    rerender(<TopicChart data={43} topicName="/test/topic" />);

    await waitFor(() => {
      expect(screen.getByText(/2 data points/)).toBeInTheDocument();
    });
  });

  it('should render chart for object with numeric fields', async () => {
    const data = {
      velocity: 1.5,
      acceleration: 0.3,
      position: 10.2,
    };

    render(<TopicChart data={data} topicName="/test/topic" />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Should show all numeric fields in legend
    expect(screen.getByText('velocity')).toBeInTheDocument();
    expect(screen.getByText('acceleration')).toBeInTheDocument();
    expect(screen.getByText('position')).toBeInTheDocument();
  });

  it('should render chart for array of numeric values', async () => {
    const data = [1.0, 2.0, 3.0, 4.0];

    render(<TopicChart data={data} topicName="/test/topic" />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Should show array indices in legend
    expect(screen.getByText('[0]')).toBeInTheDocument();
    expect(screen.getByText('[1]')).toBeInTheDocument();
    expect(screen.getByText('[2]')).toBeInTheDocument();
    expect(screen.getByText('[3]')).toBeInTheDocument();
  });

  it('should filter out non-numeric fields from objects', async () => {
    const data = {
      velocity: 1.5,
      name: 'robot',
      active: true,
      position: 10.2,
    };

    render(<TopicChart data={data} topicName="/test/topic" />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Should only show numeric fields
    expect(screen.getByText('velocity')).toBeInTheDocument();
    expect(screen.getByText('position')).toBeInTheDocument();
    expect(screen.queryByText('name')).not.toBeInTheDocument();
    expect(screen.queryByText('active')).not.toBeInTheDocument();
  });

  it('should handle nested objects with numeric values', async () => {
    const data = {
      pose: {
        x: 1.0,
        y: 2.0,
        z: 3.0,
      },
      velocity: 0.5,
    };

    render(<TopicChart data={data} topicName="/test/topic" />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Should show nested fields with dot notation
    expect(screen.getByText('pose.x')).toBeInTheDocument();
    expect(screen.getByText('pose.y')).toBeInTheDocument();
    expect(screen.getByText('pose.z')).toBeInTheDocument();
    expect(screen.getByText('velocity')).toBeInTheDocument();
  });

  it('should provide zoom controls', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TopicChart data={1} topicName="/test/topic" />
    );

    // Add multiple data points
    for (let i = 2; i <= 10; i++) {
      rerender(<TopicChart data={i} topicName="/test/topic" />);
    }

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Should have zoom controls
    const zoomInButton = screen.getByLabelText('Zoom in');
    const zoomOutButton = screen.getByLabelText('Zoom out');
    const resetButton = screen.getByLabelText('Reset zoom');

    expect(zoomInButton).toBeInTheDocument();
    expect(zoomOutButton).toBeInTheDocument();
    expect(resetButton).toBeInTheDocument();

    // Zoom out should be disabled initially
    expect(zoomOutButton).toBeDisabled();
    expect(resetButton).toBeDisabled();

    // Click zoom in
    await user.click(zoomInButton);

    // Zoom out and reset should now be enabled
    await waitFor(() => {
      expect(zoomOutButton).not.toBeDisabled();
      expect(resetButton).not.toBeDisabled();
    });
  });

  it('should filter out NaN and Infinity values', async () => {
    const data = {
      valid: 1.5,
      nan: NaN,
      infinity: Infinity,
      negInfinity: -Infinity,
    };

    render(<TopicChart data={data} topicName="/test/topic" />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // Should only show valid numeric field
    expect(screen.getByText('valid')).toBeInTheDocument();
    expect(screen.queryByText('nan')).not.toBeInTheDocument();
    expect(screen.queryByText('infinity')).not.toBeInTheDocument();
    expect(screen.queryByText('negInfinity')).not.toBeInTheDocument();
  });

  it('should display "Showing last 60 seconds" message', async () => {
    render(<TopicChart data={42} topicName="/test/topic" />);

    await waitFor(() => {
      expect(screen.getByText(/Showing last 60 seconds/)).toBeInTheDocument();
    });
  });

  it('should display visualized fields legend', async () => {
    const data = {
      velocity: 1.5,
      acceleration: 0.3,
    };

    render(<TopicChart data={data} topicName="/test/topic" />);

    await waitFor(() => {
      expect(screen.getByText('Visualized fields:')).toBeInTheDocument();
    });
  });
});
