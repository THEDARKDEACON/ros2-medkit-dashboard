import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';
import { useSystemHealth } from '@/features/api/hooks';

// Mock the hooks
vi.mock('@/features/api/hooks', () => ({
  useSystemHealth: vi.fn(),
}));

describe('MetricsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state while fetching data', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: undefined as any,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('should display error message when fetch fails', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: undefined as any,
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    expect(screen.getByText('Unable to load metrics data')).toBeInTheDocument();
  });

  it('should display performance metrics section', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('Network Activity')).toBeInTheDocument();
  });

  it('should display CPU usage percentage', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for CPU usage value (mocked at 45.2%)
    expect(screen.getByText('45.2%')).toBeInTheDocument();
  });

  it('should display memory usage percentage', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for memory usage value (mocked at 62.8%)
    expect(screen.getByText('62.8%')).toBeInTheDocument();
  });

  it('should display network activity', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for network activity value (mocked at 1.2 MB/s)
    expect(screen.getByText('1.2 MB/s')).toBeInTheDocument();
  });

  it('should display robot position and orientation section', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    expect(screen.getByText('Robot Position & Orientation')).toBeInTheDocument();
    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Orientation')).toBeInTheDocument();
  });

  it('should display robot position coordinates', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for position values (mocked at x: 2.5, y: 1.8, z: 0.0)
    expect(screen.getByText('2.50 m')).toBeInTheDocument();
    expect(screen.getByText('1.80 m')).toBeInTheDocument();
    expect(screen.getByText('0.00 m')).toBeInTheDocument();
  });

  it('should display robot orientation values', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for orientation values (mocked at roll: 0.0, pitch: 0.0, yaw: 1.57)
    expect(screen.getByText('1.57 rad')).toBeInTheDocument();
  });

  it('should display exploration progress section', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    expect(screen.getByText('Exploration Progress')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('Area Covered')).toBeInTheDocument();
    expect(screen.getByText('Active Frontiers')).toBeInTheDocument();
  });

  it('should display exploration progress percentage', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for exploration progress (mocked at 68%)
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  it('should display area covered in square meters', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for area covered (mocked at 45.3 m²)
    expect(screen.getByText('45.3 m²')).toBeInTheDocument();
  });

  it('should display active frontiers count', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for frontiers count (mocked at 12)
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('should display semantic object detection section', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    expect(screen.getByText('Semantic Object Detection')).toBeInTheDocument();
    expect(screen.getByText('Total Objects Detected')).toBeInTheDocument();
  });

  it('should display total detected objects count', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for total objects (mocked at 23)
    expect(screen.getByText('23')).toBeInTheDocument();
  });

  it('should display object counts by type', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for object types
    expect(screen.getByText('person')).toBeInTheDocument();
    expect(screen.getByText('chair')).toBeInTheDocument();
    expect(screen.getByText('table')).toBeInTheDocument();
    expect(screen.getByText('door')).toBeInTheDocument();
    expect(screen.getByText('other')).toBeInTheDocument();

    // Check for counts (mocked values) - using getAllByText since some numbers appear multiple times
    const threes = screen.getAllByText('3');
    expect(threes.length).toBeGreaterThanOrEqual(1); // person and other both have count 3
    expect(screen.getByText('8')).toBeInTheDocument(); // chair count
    expect(screen.getByText('4')).toBeInTheDocument(); // table count
    expect(screen.getByText('5')).toBeInTheDocument(); // door count
  });

  it('should have proper accessibility attributes for progress bars', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Check for progress bar accessibility attributes
    const explorationProgress = screen.getByLabelText('Exploration progress');
    expect(explorationProgress).toHaveAttribute('role', 'progressbar');
    expect(explorationProgress).toHaveAttribute('aria-valuenow', '68');
    expect(explorationProgress).toHaveAttribute('aria-valuemin', '0');
    expect(explorationProgress).toHaveAttribute('aria-valuemax', '100');
  });

  it('should display all four main sections', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 0,
          info: 0,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MetricsPanel />);

    // Verify all four main sections are present
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Robot Position & Orientation')).toBeInTheDocument();
    expect(screen.getByText('Exploration Progress')).toBeInTheDocument();
    expect(screen.getByText('Semantic Object Detection')).toBeInTheDocument();
  });
});
