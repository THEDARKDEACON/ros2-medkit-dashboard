import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';

// Mock all hooks
vi.mock('@/features/api/hooks', () => ({
  useSystemHealth: vi.fn(),
}));

vi.mock('@/hooks/useRosbridgeTopic', () => ({
  useRosbridgeTopic: vi.fn(),
}));

vi.mock('@/features/stores/rosbridgeStore', () => ({
  useRosbridgeStore: vi.fn(),
}));

import { useSystemHealth } from '@/features/api/hooks';
import { useRosbridgeTopic } from '@/hooks/useRosbridgeTopic';
import { useRosbridgeStore } from '@/features/stores/rosbridgeStore';

const mockHealthy = () => {
  vi.mocked(useSystemHealth).mockReturnValue({
    data: {
      systemStatus: 'healthy',
      totalAreas: 27,
      totalComponents: 18,
      activeComponents: 18,
      totalTopics: 18,
      faultCounts: { error: 0, warning: 0, info: 0 },
      areas: [],
      components: [],
      faults: [],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  } as any);
};

const mockRosbridge = (connected: boolean) => {
  vi.mocked(useRosbridgeStore).mockImplementation((selector: any) => {
    const state = { status: connected ? 'connected' : 'disconnected' };
    return selector(state);
  });
};

const mockOdom = (pose?: { x: number; y: number; z: number; yaw: number }) => {
  vi.mocked(useRosbridgeTopic).mockImplementation(((topic: string) => {
    if (topic === '/odom' && pose) {
      return {
        data: {
          pose: { pose: { position: { x: pose.x, y: pose.y, z: pose.z }, orientation: { x: 0, y: 0, z: Math.sin(pose.yaw / 2), w: Math.cos(pose.yaw / 2) } } },
          twist: { twist: { linear: { x: 0.5, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0.1 } } },
        },
        isConnected: true,
        lastUpdate: Date.now(),
        messageCount: 42,
        error: undefined,
      };
    }
    return { data: undefined, isConnected: true, lastUpdate: undefined, messageCount: 0, error: undefined };
  }) as any);
};

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
}

describe('MetricsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRosbridge(false);
    vi.mocked(useRosbridgeTopic).mockReturnValue({
      data: undefined, isConnected: false, lastUpdate: undefined, messageCount: 0, error: undefined,
    } as any);
  });

  it('should display loading state while fetching health data', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: undefined as any, isLoading: true, error: null, refetch: vi.fn(),
    });
    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('should display error message when health fetch fails', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: undefined as any, isLoading: false, error: new Error('fail'), refetch: vi.fn(),
    });
    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Unable to load metrics data')).toBeInTheDocument();
  });

  it('should display robot position from /odom topic', () => {
    mockHealthy();
    mockRosbridge(true);
    mockOdom({ x: 2.5, y: 1.8, z: 0.0, yaw: 1.57 });

    renderWithProviders(<MetricsPanel />);

    expect(screen.getByText('Robot Position & Velocity')).toBeInTheDocument();
    expect(screen.getByText('2.500 m')).toBeInTheDocument();
    expect(screen.getByText('1.800 m')).toBeInTheDocument();
  });

  it('should show waiting message when not connected', () => {
    mockHealthy();
    mockRosbridge(false);

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Connect to rosbridge to see robot position')).toBeInTheDocument();
  });

  it('should display navigation section with health data', () => {
    mockHealthy();

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument(); // areas
    // 18 appears for both components and topics
    const eighteens = screen.getAllByText('18');
    expect(eighteens.length).toBeGreaterThanOrEqual(1);
  });

  it('should display all main sections', () => {
    mockHealthy();

    renderWithProviders(<MetricsPanel />);
    expect(screen.getByText('Robot Position & Velocity')).toBeInTheDocument();
    expect(screen.getByText('System Diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });
});
