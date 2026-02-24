import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PerformanceAlerts } from '@/components/performance/PerformanceAlerts';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', async () => {
  const actual = await vi.importActual('@/features/api/hooks');
  return {
    ...actual,
    usePerformanceAlerts: vi.fn(),
    usePerformanceThresholds: vi.fn(),
    useUpdatePerformanceThresholds: vi.fn(),
    useExportPerformanceData: vi.fn(),
  };
});

describe('PerformanceAlerts', () => {
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
        <PerformanceAlerts refreshInterval={refreshInterval} />
      </QueryClientProvider>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/loading performance alerts/i)).toBeInTheDocument();
  });

  it('should render error state when alerts fail to load', () => {
    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/failed to load performance alerts/i)).toBeInTheDocument();
  });

  it('should render no alerts state when no alerts are active', () => {
    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('No Active Alerts')).toBeInTheDocument();
    expect(screen.getByText(/all performance metrics are within configured thresholds/i)).toBeInTheDocument();
  });

  it('should render warning alerts', () => {
    const mockAlerts: hooks.PerformanceAlert[] = [
      {
        id: 'alert1',
        type: 'cpu',
        severity: 'warning',
        message: 'CPU usage is high',
        threshold: 70,
        currentValue: 75,
        componentId: 'navigation',
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('1 Warning')).toBeInTheDocument();
    expect(screen.getByText('CPU usage is high')).toBeInTheDocument();
  });

  it('should render critical alerts', () => {
    const mockAlerts: hooks.PerformanceAlert[] = [
      {
        id: 'alert1',
        type: 'memory',
        severity: 'critical',
        message: 'Memory usage is critical',
        threshold: 2048,
        currentValue: 2500,
        componentId: 'slam',
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('1 Critical')).toBeInTheDocument();
    expect(screen.getByText('Memory usage is critical')).toBeInTheDocument();
  });

  it('should render multiple alerts with correct counts', () => {
    const mockAlerts: hooks.PerformanceAlert[] = [
      {
        id: 'alert1',
        type: 'cpu',
        severity: 'warning',
        message: 'CPU usage is high',
        threshold: 70,
        currentValue: 75,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'alert2',
        type: 'memory',
        severity: 'critical',
        message: 'Memory usage is critical',
        threshold: 2048,
        currentValue: 2500,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'alert3',
        type: 'latency',
        severity: 'warning',
        message: 'Latency is high',
        threshold: 100,
        currentValue: 120,
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('1 Critical')).toBeInTheDocument();
    expect(screen.getByText('2 Warning')).toBeInTheDocument();
  });

  it('should display alert details', () => {
    const mockAlerts: hooks.PerformanceAlert[] = [
      {
        id: 'alert1',
        type: 'cpu',
        severity: 'warning',
        message: 'CPU usage is high',
        threshold: 70,
        currentValue: 75,
        componentId: 'navigation',
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Component: navigation')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('70.0%')).toBeInTheDocument();
  });

  it('should render configure thresholds button', () => {
    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByLabelText('Configure thresholds')).toBeInTheDocument();
  });

  it('should render export data button', () => {
    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByLabelText('Export performance data')).toBeInTheDocument();
  });

  it('should open threshold configuration dialog when button is clicked', () => {
    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useUpdatePerformanceThresholds).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();
    
    const configButton = screen.getByLabelText('Configure thresholds');
    fireEvent.click(configButton);
    
    expect(screen.getByText('Configure Alert Thresholds')).toBeInTheDocument();
  });

  it('should open export data dialog when button is clicked', () => {
    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExportPerformanceData).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();
    
    const exportButton = screen.getByLabelText('Export performance data');
    fireEvent.click(exportButton);
    
    expect(screen.getByText('Export Performance Data')).toBeInTheDocument();
  });

  it('should use custom refresh interval', () => {
    vi.mocked(hooks.usePerformanceAlerts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.usePerformanceThresholds).mockReturnValue({
      data: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 1024,
        memoryCritical: 2048,
        latencyWarning: 100,
        latencyCritical: 500,
        diskIOWarning: 50,
        diskIOCritical: 100,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent(5000);
    
    expect(hooks.usePerformanceAlerts).toHaveBeenCalledWith({
      refetchInterval: 5000,
    });
  });
});
