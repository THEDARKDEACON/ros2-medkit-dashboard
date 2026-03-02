import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickAccessCards } from '@/components/dashboard/QuickAccessCards';

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
  (useSystemHealth as ReturnType<typeof vi.fn>).mockReturnValue({
    data: {
      totalAreas: 3, totalComponents: 10, activeComponents: 8, totalTopics: 25,
      faultCounts: { error: 0, warning: 0, info: 0 },
      systemStatus: 'healthy', areas: [], components: [], faults: [],
    },
    isLoading: false, error: null, refetch: vi.fn(),
  });
};

const setupMocks = (rosbridgeConnected = false) => {
  mockHealthy();
  vi.mocked(useRosbridgeStore).mockImplementation((selector: any) => {
    return selector({ status: rosbridgeConnected ? 'connected' : 'disconnected' });
  });
  vi.mocked(useRosbridgeTopic).mockReturnValue({
    data: undefined, isConnected: rosbridgeConnected, lastUpdate: undefined, messageCount: 0, error: undefined,
  } as any);
};

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}><BrowserRouter>{component}</BrowserRouter></QueryClientProvider>
  );
}

describe('QuickAccessCards', () => {
  it('renders without crashing', () => {
    setupMocks();
    renderWithProviders(<QuickAccessCards />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('displays all three subsystem cards', () => {
    setupMocks();
    renderWithProviders(<QuickAccessCards />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Perception')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
  });

  it('displays correct descriptions for each subsystem', () => {
    setupMocks();
    renderWithProviders(<QuickAccessCards />);
    expect(screen.getByText('Path planning and autonomous navigation')).toBeInTheDocument();
    expect(screen.getByText('LiDAR scanning and obstacle detection')).toBeInTheDocument();
    expect(screen.getByText('Fault monitoring and system diagnostics')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    setupMocks();
    renderWithProviders(<QuickAccessCards />);
    const navCard = screen.getByLabelText('Navigate to Navigation subsystem');
    const perceptionCard = screen.getByLabelText('Navigate to Perception subsystem');
    const safetyCard = screen.getByLabelText('Navigate to Safety subsystem');
    expect(navCard).toHaveAttribute('href', '/visualizations');
    expect(perceptionCard).toHaveAttribute('href', '/visualizations');
    expect(safetyCard).toHaveAttribute('href', '/faults');
  });

  it('displays metrics for each card', () => {
    setupMocks();
    renderWithProviders(<QuickAccessCards />);
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Odom Messages')).toBeInTheDocument();
    expect(screen.getByText('Scan Points')).toBeInTheDocument();
    expect(screen.getByText('Min Range')).toBeInTheDocument();
    expect(screen.getByText('Active Faults')).toBeInTheDocument();
    expect(screen.getByText('Last Check')).toBeInTheDocument();
  });

  it('displays correct fault count in safety card', () => {
    setupMocks();
    (useSystemHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        totalAreas: 3, totalComponents: 10, activeComponents: 8, totalTopics: 25,
        faultCounts: { error: 2, warning: 3, info: 1 },
        systemStatus: 'critical', areas: [], components: [], faults: [],
      },
      isLoading: false, error: null, refetch: vi.fn(),
    });
    renderWithProviders(<QuickAccessCards />);
    const safetySection = screen.getByText('Safety').closest('a');
    expect(safetySection).toHaveTextContent('5');
  });

  it('shows loading state when data is loading', () => {
    setupMocks();
    (useSystemHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined, isLoading: true, error: null, refetch: vi.fn(),
    });
    renderWithProviders(<QuickAccessCards />);
    const loadingIndicators = screen.getAllByText('...');
    expect(loadingIndicators.length).toBeGreaterThan(0);
  });

  it('cards are accessible links', () => {
    setupMocks();
    renderWithProviders(<QuickAccessCards />);
    const navCard = screen.getByLabelText('Navigate to Navigation subsystem');
    expect(navCard.tagName).toBe('A');
  });

  it('displays status indicators for each subsystem', () => {
    setupMocks();
    (useSystemHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        totalAreas: 3, totalComponents: 10, activeComponents: 8, totalTopics: 25,
        faultCounts: { error: 1, warning: 0, info: 0 },
        systemStatus: 'critical', areas: [], components: [], faults: [],
      },
      isLoading: false, error: null, refetch: vi.fn(),
    });
    renderWithProviders(<QuickAccessCards />);
    const statusIndicators = screen.getAllByRole('status');
    expect(statusIndicators.length).toBeGreaterThanOrEqual(3);
  });

  it('shows critical status for safety when errors exist', () => {
    setupMocks();
    (useSystemHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        totalAreas: 3, totalComponents: 10, activeComponents: 8, totalTopics: 25,
        faultCounts: { error: 2, warning: 0, info: 0 },
        systemStatus: 'critical', areas: [], components: [], faults: [],
      },
      isLoading: false, error: null, refetch: vi.fn(),
    });
    renderWithProviders(<QuickAccessCards />);
    expect(screen.getByLabelText('Safety status: critical')).toBeInTheDocument();
  });

  it('shows healthy status for safety when no faults', () => {
    setupMocks();
    renderWithProviders(<QuickAccessCards />);
    expect(screen.getByLabelText('Safety status: healthy')).toBeInTheDocument();
  });
});
