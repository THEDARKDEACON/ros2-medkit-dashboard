import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResourceUsageChart } from '@/components/performance/ResourceUsageChart';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', async () => {
  const actual = await vi.importActual('@/features/api/hooks');
  return {
    ...actual,
    usePerformanceMetrics: vi.fn(),
  };
});

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Brush: () => <div data-testid="brush" />,
}));

describe('ResourceUsageChart', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (metricType: 'cpu' | 'memory' | 'tf' | 'disk', height?: number) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ResourceUsageChart metricType={metricType} height={height} />
      </QueryClientProvider>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderComponent('cpu');
    expect(screen.getByText(/loading performance data/i)).toBeInTheDocument();
  });

  it('should render error state when metrics fail to load', () => {
    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    renderComponent('cpu');
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
  });

  it('should render waiting state when no data is available', () => {
    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: {
        cpuUsage: [],
        memoryUsage: [],
        networkBandwidth: [],
        messageRates: [],
        latency: [],
        tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
        diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
        timestamp: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent('cpu');
    expect(screen.getByText(/waiting for data/i)).toBeInTheDocument();
  });

  it('should render CPU usage chart with title', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [
        { componentId: 'comp1', componentName: 'Navigation', usage: 45.5, trend: 'up' },
      ],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('cpu');
    expect(screen.getByText('CPU Usage Over Time')).toBeInTheDocument();
  });

  it('should render memory usage chart with title', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [
        { componentId: 'comp1', componentName: 'SLAM', usage: 512, trend: 'stable' },
      ],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('memory');
    expect(screen.getByText('Memory Usage Over Time')).toBeInTheDocument();
  });

  it('should render TF metrics chart with title', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 100.5, latency: 5.2, transformCount: 42 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('tf');
    expect(screen.getByText('Transform Tree (TF) Metrics')).toBeInTheDocument();
  });

  it('should render disk I/O chart with title', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 10485760, writeBytesPerSecond: 5242880, loggingRate: 2.5 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('disk');
    expect(screen.getByText('Disk I/O Statistics')).toBeInTheDocument();
  });

  it('should render zoom controls', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [
        { componentId: 'comp1', componentName: 'Navigation', usage: 45.5, trend: 'up' },
      ],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('cpu');
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
  });

  it('should display data point count', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [
        { componentId: 'comp1', componentName: 'Navigation', usage: 45.5, trend: 'up' },
      ],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('cpu');
    expect(screen.getByText(/last 60 seconds/i)).toBeInTheDocument();
  });

  it('should render chart components', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [
        { componentId: 'comp1', componentName: 'Navigation', usage: 45.5, trend: 'up' },
      ],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('cpu');
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should use custom refresh interval', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [
        { componentId: 'comp1', componentName: 'Navigation', usage: 45.5, trend: 'up' },
      ],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('cpu', 500);

    expect(hooks.usePerformanceMetrics).toHaveBeenCalledWith({
      refetchInterval: 30000,
    });
  });

  it('should render series legend for CPU chart', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [
        { componentId: 'comp1', componentName: 'Navigation', usage: 45.5, trend: 'up' },
        { componentId: 'comp2', componentName: 'Perception', usage: 78.2, trend: 'down' },
      ],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('cpu');
    expect(screen.getByText('Visualized series:')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Perception')).toBeInTheDocument();
  });

  it('should render series legend for TF chart', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 100.5, latency: 5.2, transformCount: 42 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('tf');
    expect(screen.getByText('Visualized series:')).toBeInTheDocument();
    expect(screen.getByText('Update Rate (Hz)')).toBeInTheDocument();
    expect(screen.getByText('Latency (ms)')).toBeInTheDocument();
  });

  it('should render series legend for disk I/O chart', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 10485760, writeBytesPerSecond: 5242880, loggingRate: 2.5 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('disk');
    expect(screen.getByText('Visualized series:')).toBeInTheDocument();
    expect(screen.getByText('Read (MB/s)')).toBeInTheDocument();
    expect(screen.getByText('Write (MB/s)')).toBeInTheDocument();
    expect(screen.getByText('Logging (MB/s)')).toBeInTheDocument();
  });
});
