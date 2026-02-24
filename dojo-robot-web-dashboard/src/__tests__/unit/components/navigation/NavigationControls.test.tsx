import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationControls } from '@/components/navigation/NavigationControls';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', () => ({
  useNavigationStatus: vi.fn(),
}));

describe('NavigationControls', () => {
  let queryClient: QueryClient;
  const mockOnPause = vi.fn();
  const mockOnResume = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NavigationControls
          componentId="test-nav"
          onPause={mockOnPause}
          onResume={mockOnResume}
          onCancel={mockOnCancel}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/loading controls/i)).toBeInTheDocument();
  });

  it('should render control buttons', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
        localizationQuality: 0.95,
        pathPlanningState: 'computing',
        obstacleDetected: false,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('should disable resume button when exploring', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      expect(resumeButton).toBeDisabled();
    });
  });

  it('should enable pause button when exploring', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      expect(pauseButton).not.toBeDisabled();
    });
  });

  it('should call onPause when pause button is clicked', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
    });

    expect(mockOnPause).toHaveBeenCalledTimes(1);
  });

  it('should call onResume when resume button is clicked', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'idle',
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);
    });

    expect(mockOnResume).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
    });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should display localization quality', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
        localizationQuality: 0.856,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('85.6%')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });
  });

  it('should display correct quality label for different levels', async () => {
    const testCases = [
      { quality: 0.9, label: 'Excellent' },
      { quality: 0.7, label: 'Good' },
      { quality: 0.5, label: 'Fair' },
      { quality: 0.2, label: 'Poor' },
    ];

    for (const { quality, label } of testCases) {
      vi.mocked(hooks.useNavigationStatus).mockReturnValue({
        data: {
          status: 'exploring',
          localizationQuality: quality,
        },
        isLoading: false,
        error: null,
      } as any);

      const { unmount } = renderComponent();

      await waitFor(() => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('should display path planning state', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'planning',
        pathPlanningState: 'computing_path',
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/computing path/i)).toBeInTheDocument();
    });
  });

  it('should display obstacle detection status - clear', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
        obstacleDetected: false,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  it('should display obstacle detection status - detected', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
        obstacleDetected: true,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Detected')).toBeInTheDocument();
      expect(screen.getByText(/robot is avoiding obstacles/i)).toBeInTheDocument();
    });
  });

  it('should show "No data available" when localization quality is undefined', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'idle',
        localizationQuality: undefined,
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });
  });

  it('should disable buttons when callbacks are not provided', async () => {
    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <NavigationControls componentId="test-nav" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /resume/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  it('should handle async button clicks correctly', async () => {
    mockOnPause.mockResolvedValue(undefined);

    vi.mocked(hooks.useNavigationStatus).mockReturnValue({
      data: {
        status: 'exploring',
      },
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    await waitFor(() => {
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
    });

    await waitFor(() => {
      expect(mockOnPause).toHaveBeenCalled();
    });
  });
});
