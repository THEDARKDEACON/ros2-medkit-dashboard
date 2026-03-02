import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';

// Mock the hooks
vi.mock('@/features/api/hooks', () => ({
  useSystemHealth: vi.fn(),
  usePerformanceMetrics: vi.fn(),
  useSemanticObjects: vi.fn(),
  useRobotPose: vi.fn(),
}));

import { useSystemHealth, usePerformanceMetrics, useSemanticObjects, useRobotPose } from '@/features/api/hooks';

const mockSystemHealth = (overrides: Record<string, unknown> = {}) => {
  vi.mocked(useSystemHealth).mockReturnValue({
    data: {
      systemStatus: 'healthy',
      totalAreas: 3,
      totalComponents: 10,
      activeComponents: 10,
      totalTopics: 25,
      faultCounts: { error: 0, warning: 0, info: 0 },
      areas: [],
      components: [],
      faults: [],
      ...overrides,
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as any);
};

const mockPerfMetrics = (cpuVal?: number, memVal?: number, netVal?: number) => {
  vi.mocked(usePerformanceMetrics).mockReturnValue({
    data: cpuVal !== undefined ? {
      cpuUsage: [{ value: cpuVal, timestamp: '' }],
      memoryUsage: memVal !== undefined ? [{ value: memVal, timestamp: '' }] : [],
      networkBandwidth: netVal !== undefined ? [{ value: netVal, timestamp: '' }] : [],
      messageRates: [],
      latency: [],
      tfMetrics: { updateRate: 0, latency: 0, transformCount: 0 },
      diskIO: { readBytesPerSecond: 0, writeBytesPerSecond: 0, loggingRate: 0 },
      timestamp: new Date().toISOString(),
    } : undefined,
    isLoading: false,
    error: null,
  } as any);
};

const mockRobotPose = (x?: number, y?: number, theta?: number) => {
  vi.mocked(useRobotPose).mockReturnValue({
    data: x !== undefined ? { x, y: y ?? 0, theta: theta ?? 0 } : undefined,
    isLoading: false,
    error: null,
  } as any);
};

const mockSemantic = (objects?: Array<{ id: string; class: string; confidence: number }>) => {
  vi.mocked(useSemanticObjects).mockReturnValue({
    data: objects || [],
    isLoading: false,
    error: null,
  } as any);
};

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('MetricsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerfMetrics();
    mockRobotPose();
    mockSemantic();
  });

  it('should display loading state while fetching data', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: undefined as any,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('should display error message when fetch fails', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: undefined as any,
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    });

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Unable to load metrics data')).toBeInTheDocument();
  });

  it('should display performance metrics section', () => {
    mockSystemHealth();
    mockPerfMetrics(45.2, 62.8, 1.2);

    renderWithProviders(<MetricsPanel />);

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('Network Activity')).toBeInTheDocument();
  });

  it('should display real CPU usage percentage', () => {
    mockSystemHealth();
    mockPerfMetrics(45.2, 62.8, 1.2);

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('45.2%')).toBeInTheDocument();
  });

  it('should display real memory usage percentage', () => {
    mockSystemHealth();
    mockPerfMetrics(45.2, 62.8, 1.2);

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('62.8%')).toBeInTheDocument();
  });

  it('should display real network activity', () => {
    mockSystemHealth();
    mockPerfMetrics(45.2, 62.8, 1.2);

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('1.2 MB/s')).toBeInTheDocument();
  });

  it('should show dash when performance data is unavailable', () => {
    mockSystemHealth();
    mockPerfMetrics(); // no data

    renderWithProviders(<MetricsPanel />);

    // All three metrics should show "—"
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('should display robot position from real pose data', () => {
    mockSystemHealth();
    mockRobotPose(2.5, 1.8, 1.57);

    renderWithProviders(<MetricsPanel />);

    expect(screen.getByText('Robot Position & Orientation')).toBeInTheDocument();
    expect(screen.getByText('2.50 m')).toBeInTheDocument();
    expect(screen.getByText('1.80 m')).toBeInTheDocument();
    expect(screen.getByText('1.57 rad')).toBeInTheDocument();
  });

  it('should show unavailable message when pose data missing', () => {
    mockSystemHealth();
    mockRobotPose(); // no data

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText(/Robot pose unavailable/i)).toBeInTheDocument();
  });

  it('should display exploration progress section', () => {
    mockSystemHealth();

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Exploration Progress')).toBeInTheDocument();
  });

  it('should display semantic object detection section', () => {
    mockSystemHealth();

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Semantic Object Detection')).toBeInTheDocument();
    expect(screen.getByText('Total Objects Detected')).toBeInTheDocument();
  });

  it('should display real semantic object counts', () => {
    mockSystemHealth();
    mockSemantic([
      { id: '1', class: 'chair', confidence: 0.9 },
      { id: '2', class: 'chair', confidence: 0.85 },
      { id: '3', class: 'person', confidence: 0.92 },
    ]);

    renderWithProviders(<MetricsPanel />);

    expect(screen.getByText('3')).toBeInTheDocument(); // total
    expect(screen.getByText('chair')).toBeInTheDocument();
    expect(screen.getByText('person')).toBeInTheDocument();
  });

  it('should display all four main sections', () => {
    mockSystemHealth();

    renderWithProviders(<MetricsPanel />);

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Robot Position & Orientation')).toBeInTheDocument();
    expect(screen.getByText('Exploration Progress')).toBeInTheDocument();
    expect(screen.getByText('Semantic Object Detection')).toBeInTheDocument();
  });
});
