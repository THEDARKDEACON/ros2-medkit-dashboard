import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemHealthOverview } from '@/components/dashboard/SystemHealthOverview';
import { useSystemHealth } from '@/features/api/hooks';

// Mock the hooks
vi.mock('@/features/api/hooks', () => ({
  useSystemHealth: vi.fn(),
}));

describe('SystemHealthOverview', () => {
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

    render(<SystemHealthOverview />);

    expect(screen.getByText('Loading system health...')).toBeInTheDocument();
  });

  it('should display error state when fetch fails', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: undefined as any,
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    });

    render(<SystemHealthOverview />);

    expect(screen.getByText('Failed to load system health data')).toBeInTheDocument();
  });

  it('should display healthy system status with correct styling', () => {
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

    render(<SystemHealthOverview />);

    expect(screen.getByText('System Status: Healthy')).toBeInTheDocument();
    expect(screen.getByText('All systems operational')).toBeInTheDocument();
  });

  it('should display degraded system status when warnings present', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'degraded',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
        totalTopics: 25,
        faultCounts: {
          error: 0,
          warning: 2,
          info: 1,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SystemHealthOverview />);

    expect(screen.getByText('System Status: Degraded')).toBeInTheDocument();
    expect(screen.getByText('Some issues detected')).toBeInTheDocument();
  });

  it('should display critical system status when errors present', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'critical',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 7,
        totalTopics: 25,
        faultCounts: {
          error: 3,
          warning: 1,
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

    render(<SystemHealthOverview />);

    expect(screen.getByText('System Status: Critical')).toBeInTheDocument();
    expect(screen.getByText('Critical errors present')).toBeInTheDocument();
  });

  it('should display correct area count', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 5,
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

    render(<SystemHealthOverview />);

    expect(screen.getByText('Areas')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display correct component counts (active/total)', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 12,
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

    render(<SystemHealthOverview />);

    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('10 / 12')).toBeInTheDocument();
    expect(screen.getByText('10 active')).toBeInTheDocument();
  });

  it('should display correct topic count', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 10,
        totalTopics: 42,
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

    render(<SystemHealthOverview />);

    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should display system activity as Active when components are running', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 8,
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

    render(<SystemHealthOverview />);

    expect(screen.getByText('System Activity')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('8 components running')).toBeInTheDocument();
  });

  it('should display system activity as Idle when no components are running', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'healthy',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 0,
        totalTopics: 0,
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

    render(<SystemHealthOverview />);

    expect(screen.getByText('System Activity')).toBeInTheDocument();
    expect(screen.getByText('Idle')).toBeInTheDocument();
    expect(screen.getByText('0 components running')).toBeInTheDocument();
  });

  it('should display fault counts by severity', () => {
    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        systemStatus: 'degraded',
        totalAreas: 3,
        totalComponents: 10,
        activeComponents: 9,
        totalTopics: 25,
        faultCounts: {
          error: 2,
          warning: 5,
          info: 3,
        },
        areas: [],
        components: [],
        faults: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SystemHealthOverview />);

    expect(screen.getByText('Fault Summary')).toBeInTheDocument();
    
    // Check error count
    expect(screen.getByLabelText('2 errors')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    
    // Check warning count
    expect(screen.getByLabelText('5 warnings')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    
    // Check info count
    expect(screen.getByLabelText('3 info')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('should display zero fault counts when no faults present', () => {
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

    render(<SystemHealthOverview />);

    expect(screen.getByLabelText('0 errors')).toBeInTheDocument();
    expect(screen.getByLabelText('0 warnings')).toBeInTheDocument();
    expect(screen.getByLabelText('0 info')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
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

    render(<SystemHealthOverview />);

    // Check for role="status" attributes
    expect(screen.getByLabelText('System status: Healthy')).toHaveAttribute('role', 'status');
    expect(screen.getByLabelText('0 errors')).toHaveAttribute('role', 'status');
  });
});
