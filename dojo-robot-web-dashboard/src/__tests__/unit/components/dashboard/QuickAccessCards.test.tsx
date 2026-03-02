import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickAccessCards } from '@/components/dashboard/QuickAccessCards';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', () => ({
  useSystemHealth: vi.fn(),
  useSemanticObjects: vi.fn().mockReturnValue({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

const mockUseSystemHealth = hooks.useSystemHealth as ReturnType<typeof vi.fn>;

// Helper to render with providers
function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('QuickAccessCards', () => {
  it('renders without crashing', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 0, warning: 0, info: 0 },
        systemStatus: 'healthy' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('displays all three subsystem cards', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 0, warning: 0, info: 0 },
        systemStatus: 'healthy' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    // Check all three subsystem cards are present
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Perception')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
  });

  it('displays correct descriptions for each subsystem', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 0, warning: 0, info: 0 },
        systemStatus: 'healthy' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    expect(screen.getByText('Path planning and autonomous navigation')).toBeInTheDocument();
    expect(screen.getByText('Semantic object detection and scene understanding')).toBeInTheDocument();
    expect(screen.getByText('Fault monitoring and system diagnostics')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 0, warning: 0, info: 0 },
        systemStatus: 'healthy' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    const navigationCard = screen.getByLabelText('Navigate to Navigation subsystem');
    const perceptionCard = screen.getByLabelText('Navigate to Perception subsystem');
    const safetyCard = screen.getByLabelText('Navigate to Safety subsystem');

    expect(navigationCard).toHaveAttribute('href', '/visualizations');
    expect(perceptionCard).toHaveAttribute('href', '/visualizations');
    expect(safetyCard).toHaveAttribute('href', '/faults');
  });

  it('displays metrics for each card', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 0, warning: 0, info: 0 },
        systemStatus: 'healthy' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    // Navigation metrics
    expect(screen.getByText('Active Goals')).toBeInTheDocument();
    expect(screen.getByText('Path Length')).toBeInTheDocument();

    // Perception metrics
    expect(screen.getByText('Detected Objects')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();

    // Safety metrics
    expect(screen.getByText('Active Faults')).toBeInTheDocument();
    expect(screen.getByText('Last Check')).toBeInTheDocument();
  });

  it('displays correct fault count in safety card', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 2, warning: 3, info: 1 },
        systemStatus: 'critical' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    // Should show 5 active faults (2 errors + 3 warnings)
    const safetySection = screen.getByText('Safety').closest('a');
    expect(safetySection).toHaveTextContent('5');
  });

  it('shows loading state when data is loading', () => {
    mockUseSystemHealth.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    // Should show loading indicators
    const loadingIndicators = screen.getAllByText('...');
    expect(loadingIndicators.length).toBeGreaterThan(0);
  });

  it('cards are clickable and accessible', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 0, warning: 0, info: 0 },
        systemStatus: 'healthy' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    const navigationCard = screen.getByLabelText('Navigate to Navigation subsystem');
    const perceptionCard = screen.getByLabelText('Navigate to Perception subsystem');
    const safetyCard = screen.getByLabelText('Navigate to Safety subsystem');

    // Cards should be links
    expect(navigationCard.tagName).toBe('A');
    expect(perceptionCard.tagName).toBe('A');
    expect(safetyCard.tagName).toBe('A');

    // Cards should have aria-labels
    expect(navigationCard).toHaveAttribute('aria-label');
    expect(perceptionCard).toHaveAttribute('aria-label');
    expect(safetyCard).toHaveAttribute('aria-label');
  });

  it('displays status indicators for each subsystem', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 1, warning: 0, info: 0 },
        systemStatus: 'critical' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    // Check for status indicators (should have role="status")
    const statusIndicators = screen.getAllByRole('status');
    expect(statusIndicators.length).toBeGreaterThanOrEqual(3);
  });

  it('shows critical status for safety card when errors exist', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 2, warning: 0, info: 0 },
        systemStatus: 'critical' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    const safetyStatus = screen.getByLabelText('Safety status: critical');
    expect(safetyStatus).toBeInTheDocument();
  });

  it('shows warning status for safety card when warnings exist', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 0, warning: 2, info: 0 },
        systemStatus: 'degraded' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    const safetyStatus = screen.getByLabelText('Safety status: warning');
    expect(safetyStatus).toBeInTheDocument();
  });

  it('shows healthy status for safety card when no faults exist', () => {
    mockUseSystemHealth.mockReturnValue({
      data: {
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: { error: 0, warning: 0, info: 0 },
        systemStatus: 'healthy' as const,
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<QuickAccessCards />);

    const safetyStatus = screen.getByLabelText('Safety status: healthy');
    expect(safetyStatus).toBeInTheDocument();
  });
});
