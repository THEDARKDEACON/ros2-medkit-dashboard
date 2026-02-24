import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformanceMetrics } from '@/components/performance/PerformanceMetrics';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', async () => {
  const actual = await vi.importActual('@/features/api/hooks');
  return {
    ...actual,
    usePerformanceMetrics: vi.fn(),
  };
});

describe('PerformanceMetrics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (refreshInterval?: number) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PerformanceMetrics refreshInterval={refreshInterval} />
      </QueryClientProvider>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/loading performance metrics/i)).toBeInTheDocument();
  });

  it('should render error state when metrics fail to load', () => {
    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    renderComponent();
    expect(screen.getByText(/failed to load performance metrics/i)).toBeInTheDocument();
  });

  it('should render CPU usage section with data', () => {
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

    renderComponent();
    expect(screen.getByText('CPU Usage by Component')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Perception')).toBeInTheDocument();
    expect(screen.getByText('45.5%')).toBeInTheDocument();
    expect(screen.getByText('78.2%')).toBeInTheDocument();
  });

  it('should render memory usage section with data', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [
        { componentId: 'comp1', componentName: 'SLAM', usage: 512, trend: 'stable' },
        { componentId: 'comp2', componentName: 'Vision', usage: 1024, trend: 'up' },
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

    renderComponent();
    expect(screen.getByText('Memory Usage by Component')).toBeInTheDocument();
    expect(screen.getByText('SLAM')).toBeInTheDocument();
    expect(screen.getByText('Vision')).toBeInTheDocument();
  });

  it('should render network bandwidth section with data', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkBandwidth: [
        { topicName: '/camera/image', bytesPerSecond: 1048576, messagesPerSecond: 30 },
        { topicName: '/lidar/scan', bytesPerSecond: 524288, messagesPerSecond: 10 },
      ],
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

    renderComponent();
    expect(screen.getByText('Network Bandwidth Usage')).toBeInTheDocument();
    expect(screen.getByText('/camera/image')).toBeInTheDocument();
    expect(screen.getByText('/lidar/scan')).toBeInTheDocument();
  });

  it('should render message rates section with data', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [
        { topicName: '/odom', publishRate: 50, subscribeRate: 50 },
        { topicName: '/cmd_vel', publishRate: 10, subscribeRate: 10 },
      ],
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

    renderComponent();
    expect(screen.getByText('Message Publication Rates')).toBeInTheDocument();
    expect(screen.getByText('/odom')).toBeInTheDocument();
    expect(screen.getByText('/cmd_vel')).toBeInTheDocument();
  });

  it('should render node processing latency section with data', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [
        { nodeId: 'node1', nodeName: 'planner', processingLatency: 25.5, callbackExecutionTime: 10.2 },
        { nodeId: 'node2', nodeName: 'controller', processingLatency: 15.8, callbackExecutionTime: 8.5 },
      ],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Node Processing Latency')).toBeInTheDocument();
    expect(screen.getByText('planner')).toBeInTheDocument();
    expect(screen.getByText('controller')).toBeInTheDocument();
  });

  it('should render TF metrics section with data', () => {
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

    renderComponent();
    expect(screen.getByText('Transform Tree (TF) Metrics')).toBeInTheDocument();
    expect(screen.getByText('100.5 Hz')).toBeInTheDocument();
    expect(screen.getByText('5.2 ms')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render disk I/O metrics section with data', () => {
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

    renderComponent();
    expect(screen.getByText('Disk I/O Statistics')).toBeInTheDocument();
    expect(screen.getByText('2.50 MB/s')).toBeInTheDocument();
  });

  it('should display empty state when no CPU data is available', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
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

    renderComponent();
    expect(screen.getByText('No CPU usage data available')).toBeInTheDocument();
  });

  it('should display last updated timestamp', () => {
    const timestamp = new Date('2024-01-15T10:30:00Z');
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkBandwidth: [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: timestamp.toISOString(),
    };

    vi.mocked(hooks.usePerformanceMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
  });

  it('should use custom refresh interval', () => {
    const mockMetrics: hooks.PerformanceMetrics = {
      cpuUsage: [],
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

    renderComponent(60000);
    
    expect(hooks.usePerformanceMetrics).toHaveBeenCalledWith({
      refetchInterval: 60000,
    });
  });
});
