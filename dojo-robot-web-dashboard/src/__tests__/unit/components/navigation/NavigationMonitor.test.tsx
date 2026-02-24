import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationMonitor } from '@/components/navigation/NavigationMonitor';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', () => ({
  useNavigationStatus: vi.fn(),
  useExplorationStats: vi.fn(),
}));

describe('NavigationMonitor', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (componentId: string = 'test-nav') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NavigationMonitor componentId={componentId} />
      </QueryClientProvider>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/loading navigation data/i)).toBeInTheDocument();
  });

  it('should render error state when navigation status fails', () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/failed to load navigation data/i)).toBeInTheDocument();
  });

  it('should display exploring status', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
        currentGoal: { x: 5.0, y: 3.0, theta: 1.57 },
        plannedPath: [
          { x: 0, y: 0, theta: 0 },
          { x: 1, y: 1, theta: 0.78 },
        ],
        localizationQuality: 0.95,
        pathPlanningState: 'computing',
        obstacleDetected: false,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: {
        exploredArea: 45.5,
        totalArea: 100.0,
        explorationProgress: 45.5,
        frontierClusters: [],
        estimatedTimeRemaining: 300,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Exploring')).toBeInTheDocument();
      expect(screen.getByText(/actively exploring environment/i)).toBeInTheDocument();
    });
  });

  it('should display idle status', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'idle',
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Idle')).toBeInTheDocument();
      expect(screen.getByText(/no active navigation/i)).toBeInTheDocument();
    });
  });

  it('should display exploration progress', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: {
        exploredArea: 45.5,
        totalArea: 100.0,
        explorationProgress: 45.5,
        estimatedTimeRemaining: 300,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('45.5%')).toBeInTheDocument();
      expect(screen.getByText('45.5 m²')).toBeInTheDocument();
      expect(screen.getByText('100.0 m²')).toBeInTheDocument();
      expect(screen.getByText('5m 0s')).toBeInTheDocument();
    });
  });

  it('should display current goal coordinates', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
        currentGoal: { x: 5.123, y: 3.456, theta: 1.571 },
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/5\.123/)).toBeInTheDocument();
      expect(screen.getByText(/3\.456/)).toBeInTheDocument();
      expect(screen.getByText(/1\.571/)).toBeInTheDocument();
    });
  });

  it('should display "No active goal" when goal is not set', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'idle',
        currentGoal: undefined,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no active goal/i)).toBeInTheDocument();
    });
  });

  it('should display planned path information', async () => {
    const path = [
      { x: 0, y: 0, theta: 0 },
      { x: 1, y: 0, theta: 0 },
      { x: 2, y: 0, theta: 0 },
    ];

    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
        plannedPath: path,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // waypoints count
      expect(screen.getByText(/2\.00 m/)).toBeInTheDocument(); // path length
    });
  });

  it('should display frontier clusters', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: {
        exploredArea: 45.5,
        totalArea: 100.0,
        explorationProgress: 45.5,
        frontierClusters: [
          { id: '1', centroid: { x: 10.5, y: 5.2 }, size: 25 },
          { id: '2', centroid: { x: 15.3, y: 8.7 }, size: 30 },
        ],
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Cluster 1')).toBeInTheDocument();
      expect(screen.getByText('Cluster 2')).toBeInTheDocument();
      expect(screen.getByText('25 points')).toBeInTheDocument();
      expect(screen.getByText('30 points')).toBeInTheDocument();
    });
  });

  it('should format time correctly', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: {
        exploredArea: 45.5,
        totalArea: 100.0,
        explorationProgress: 45.5,
        estimatedTimeRemaining: 3665, // 1h 1m 5s
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('1h 1m')).toBeInTheDocument();
    });
  });

  it('should have proper ARIA labels', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useExplorationStats).mockReturnValue({
      data: {
        exploredArea: 45.5,
        totalArea: 100.0,
        explorationProgress: 45.5,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      const statusElement = screen.getByRole('status', { name: /navigation status: exploring/i });
      expect(statusElement).toBeInTheDocument();
    });
  });
});
