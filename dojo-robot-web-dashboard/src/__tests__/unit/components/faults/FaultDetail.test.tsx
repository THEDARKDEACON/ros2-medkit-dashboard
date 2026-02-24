/**
 * Unit tests for FaultDetail component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FaultDetail } from '../../../../components/faults/FaultDetail';
import * as hooks from '../../../../features/api/hooks';
import type { FaultSnapshot } from '../../../../types/api';

// Mock the hooks
vi.mock('../../../../features/api/hooks', async () => {
  const actual = await vi.importActual('../../../../features/api/hooks');
  return {
    ...actual,
    useFaultSnapshots: vi.fn(),
    useDownloadRosbag: vi.fn(),
  };
});

describe('FaultDetail', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const mockSnapshot: FaultSnapshot = {
    faultCode: 'FAULT_001',
    timestamp: '2024-01-15T10:30:00Z',
    systemState: {
      cpu_usage: 45.2,
      memory_usage: 62.8,
      active_nodes: 12,
    },
    topicData: {
      '/velocity': { linear: { x: 1.5, y: 0, z: 0 } },
      '/position': { x: 10.5, y: 20.3, z: 0 },
    },
  };

  const renderComponent = (faultCode: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <FaultDetail faultCode={faultCode} />
      </QueryClientProvider>
    );
  };

  it('should display loading state while fetching snapshot', () => {
    vi.mocked(hooks.useFaultSnapshots).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(hooks.useDownloadRosbag).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    renderComponent('FAULT_001');

    expect(screen.getByText('Loading fault snapshot...')).toBeInTheDocument();
  });

  it('should display error state when fetch fails', () => {
    vi.mocked(hooks.useFaultSnapshots).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as any);

    vi.mocked(hooks.useDownloadRosbag).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    renderComponent('FAULT_001');

    expect(screen.getByText(/Failed to load fault snapshot/)).toBeInTheDocument();
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('should display snapshot data when loaded', async () => {
    vi.mocked(hooks.useFaultSnapshots).mockReturnValue({
      data: mockSnapshot,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useDownloadRosbag).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    renderComponent('FAULT_001');

    await waitFor(() => {
      expect(screen.getByText('Fault Snapshot')).toBeInTheDocument();
    });

    // Check fault code is displayed
    expect(screen.getByText('FAULT_001')).toBeInTheDocument();

    // Check sections are present
    expect(screen.getByText('System State at Fault Occurrence')).toBeInTheDocument();
    expect(screen.getByText('Topic Data')).toBeInTheDocument();

    // Check download button is present
    expect(screen.getByRole('button', { name: /Download rosbag file/i })).toBeInTheDocument();
  });

  it('should display message when no snapshot data available', () => {
    vi.mocked(hooks.useFaultSnapshots).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useDownloadRosbag).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    renderComponent('FAULT_001');

    expect(screen.getByText('No snapshot data available for this fault.')).toBeInTheDocument();
  });

  it('should render JsonInspector components for system state and topic data', async () => {
    vi.mocked(hooks.useFaultSnapshots).mockReturnValue({
      data: mockSnapshot,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useDownloadRosbag).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);

    renderComponent('FAULT_001');

    await waitFor(() => {
      expect(screen.getByText('System State at Fault Occurrence')).toBeInTheDocument();
    });

    // JsonInspector should render the data
    expect(screen.getByText('Topic Data')).toBeInTheDocument();
  });
});
