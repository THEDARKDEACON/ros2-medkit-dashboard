import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafetyMonitor } from '@/components/safety/SafetyMonitor';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', async () => {
  const actual = await vi.importActual('@/features/api/hooks');
  return {
    ...actual,
    useSafetyStatus: vi.fn(),
    useBehaviorTree: vi.fn(),
    useSafetyEvents: vi.fn(),
    useSafetyMetrics: vi.fn(),
  };
});

// Mock child components
vi.mock('@/components/safety/EmergencyStopButton', () => ({
  EmergencyStopButton: () => <div data-testid="emergency-stop-button">Emergency Stop</div>,
}));

vi.mock('@/components/safety/BehaviorTreeView', () => ({
  BehaviorTreeView: () => <div data-testid="behavior-tree-view">Behavior Tree</div>,
}));

describe('SafetyMonitor', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (componentId = 'safety_component') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SafetyMonitor componentId={componentId} />
      </QueryClientProvider>
    );
  };

  it('should render loading state initially', () => {
    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/loading safety system data/i)).toBeInTheDocument();
  });

  it('should render error state when safety status fails to load', () => {
    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/failed to load safety system data/i)).toBeInTheDocument();
  });

  it('should render healthy safety status', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [],
      systemHealth: 'healthy',
      lastSafetyCheck: new Date().toISOString(),
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'idle',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText(/all safety systems operational/i)).toBeInTheDocument();
  });

  it('should render degraded safety status', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [],
      systemHealth: 'degraded',
      lastSafetyCheck: new Date().toISOString(),
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'idle',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(screen.getByText(/some safety systems experiencing issues/i)).toBeInTheDocument();
  });

  it('should render critical safety status', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: true,
      collisionDetected: true,
      safetyZoneViolation: true,
      proximityWarnings: [],
      systemHealth: 'critical',
      lastSafetyCheck: new Date().toISOString(),
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'failure',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText(/critical safety system failure/i)).toBeInTheDocument();
  });

  it('should render emergency stop button', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [],
      systemHealth: 'healthy',
      lastSafetyCheck: new Date().toISOString(),
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'idle',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByTestId('emergency-stop-button')).toBeInTheDocument();
  });

  it('should render safety status cards', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [],
      systemHealth: 'healthy',
      lastSafetyCheck: new Date().toISOString(),
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'idle',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getAllByText('Emergency Stop').length).toBeGreaterThan(0);
    expect(screen.getByText('Collision Detected')).toBeInTheDocument();
    expect(screen.getByText('Zone Violation')).toBeInTheDocument();
  });

  it('should render proximity warnings when present', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [
        { direction: 'front', distance: 0.5, severity: 'high' },
        { direction: 'left', distance: 1.2, severity: 'medium' },
      ],
      systemHealth: 'healthy',
      lastSafetyCheck: new Date().toISOString(),
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'idle',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Proximity Warnings')).toBeInTheDocument();
    expect(screen.getByText('front')).toBeInTheDocument();
    expect(screen.getByText('left')).toBeInTheDocument();
    expect(screen.getByText('0.50 m')).toBeInTheDocument();
    expect(screen.getByText('1.20 m')).toBeInTheDocument();
  });

  it('should render behavior tree view', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [],
      systemHealth: 'healthy',
      lastSafetyCheck: new Date().toISOString(),
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'running',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Behavior Tree State')).toBeInTheDocument();
    expect(screen.getByTestId('behavior-tree-view')).toBeInTheDocument();
  });

  it('should render active safety behaviors', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [],
      systemHealth: 'healthy',
      lastSafetyCheck: new Date().toISOString(),
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'running',
        },
        activeBehaviors: [
          {
            id: 'behavior1',
            name: 'Collision Avoidance',
            status: 'running',
            startTime: new Date(Date.now() - 5000).toISOString(),
          },
        ],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Active Safety Behaviors')).toBeInTheDocument();
    expect(screen.getByText('Collision Avoidance')).toBeInTheDocument();
  });

  it('should render safety metrics', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [],
      systemHealth: 'healthy',
      lastSafetyCheck: new Date().toISOString(),
    };

    const mockMetrics: hooks.SafetyMetrics = {
      totalEvents: 42,
      emergencyStops: 2,
      collisions: 1,
      zoneViolations: 5,
      averageResponseTime: 150,
      systemUptime: 86400,
    };

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'idle',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Safety System Metrics')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('should render safety event log', () => {
    const mockSafetyStatus: hooks.SafetyStatus = {
      emergencyStopActive: false,
      collisionDetected: false,
      safetyZoneViolation: false,
      proximityWarnings: [],
      systemHealth: 'healthy',
      lastSafetyCheck: new Date().toISOString(),
    };

    const mockEvents: hooks.SafetyEvent[] = [
      {
        id: 'event1',
        type: 'proximity_warning',
        severity: 'warning',
        message: 'Object detected in front',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'event2',
        type: 'zone_violation',
        severity: 'error',
        message: 'Safety zone violated',
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
    ];

    vi.mocked(hooks.useSafetyStatus).mockReturnValue({
      data: mockSafetyStatus,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useBehaviorTree).mockReturnValue({
      data: {
        rootNode: {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'idle',
        },
        activeBehaviors: [],
        lastUpdate: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyEvents).mockReturnValue({
      data: mockEvents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useSafetyMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText('Safety Event Log')).toBeInTheDocument();
    expect(screen.getByText('Object detected in front')).toBeInTheDocument();
    expect(screen.getByText('Safety zone violated')).toBeInTheDocument();
  });
});
