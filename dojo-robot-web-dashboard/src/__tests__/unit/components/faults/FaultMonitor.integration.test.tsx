/**
 * Integration tests for FaultMonitor with FaultFilter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FaultMonitor } from '../../../../components/faults/FaultMonitor';
import { useFilterStore } from '../../../../features/stores/filterStore';
import type { Fault } from '../../../../types/api';

// Mock the API hooks
vi.mock('../../../../features/api/hooks', () => ({
  useFaults: vi.fn(),
}));

// Mock the SSE manager
vi.mock('../../../../features/realtime/sseManager', () => ({
  getFaultSSEManager: vi.fn(() => ({
    connect: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    disconnect: vi.fn(),
  })),
}));

// Mock the filter store
vi.mock('../../../../features/stores/filterStore');

import { useFaults } from '../../../../features/api/hooks';

describe('FaultMonitor with FaultFilter integration', () => {
  const mockFaults: Fault[] = [
    {
      code: 'ERR001',
      message: 'Navigation error',
      severity: 'error',
      componentId: 'nav_component',
      timestamp: '2024-01-15T10:00:00Z',
    },
    {
      code: 'WARN001',
      message: 'Low battery warning',
      severity: 'warning',
      componentId: 'power_component',
      timestamp: '2024-01-15T11:00:00Z',
    },
    {
      code: 'INFO001',
      message: 'System initialized',
      severity: 'info',
      componentId: 'nav_component',
      timestamp: '2024-01-15T09:00:00Z',
    },
  ];

  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Setup default filter store mock
    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'all',
        componentId: null,
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: vi.fn(),
      setFaultComponentFilter: vi.fn(),
      setFaultTimeRangeFilter: vi.fn(),
      clearFaultFilters: vi.fn(),
      globalSearchTerm: '',
      setGlobalSearchTerm: vi.fn(),
      clearGlobalSearch: vi.fn(),
      componentFilters: {
        areaId: null,
        status: 'all',
        namePattern: '',
      },
      setComponentAreaFilter: vi.fn(),
      setComponentStatusFilter: vi.fn(),
      setComponentNameFilter: vi.fn(),
      clearComponentFilters: vi.fn(),
      topicFilters: {
        messageType: null,
        minUpdateFrequency: null,
        maxUpdateFrequency: null,
      },
      setTopicMessageTypeFilter: vi.fn(),
      setTopicFrequencyFilter: vi.fn(),
      clearTopicFilters: vi.fn(),
      operationFilters: {
        type: 'all',
        availableOnly: false,
      },
      setOperationTypeFilter: vi.fn(),
      setOperationAvailabilityFilter: vi.fn(),
      clearOperationFilters: vi.fn(),
      clearAllFilters: vi.fn(),
    });

    // Setup default API mock
    vi.mocked(useFaults).mockReturnValue({
      data: mockFaults,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      status: 'success',
    } as any);
  });

  it('should display all faults when no filters are active', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FaultMonitor showFilter={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ERR001')).toBeInTheDocument();
      expect(screen.getByText('WARN001')).toBeInTheDocument();
      expect(screen.getByText('INFO001')).toBeInTheDocument();
    });
  });

  it('should filter faults by severity', async () => {
    // Mock filter store with error severity filter
    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'error',
        componentId: null,
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: vi.fn(),
      setFaultComponentFilter: vi.fn(),
      setFaultTimeRangeFilter: vi.fn(),
      clearFaultFilters: vi.fn(),
      globalSearchTerm: '',
      setGlobalSearchTerm: vi.fn(),
      clearGlobalSearch: vi.fn(),
      componentFilters: {
        areaId: null,
        status: 'all',
        namePattern: '',
      },
      setComponentAreaFilter: vi.fn(),
      setComponentStatusFilter: vi.fn(),
      setComponentNameFilter: vi.fn(),
      clearComponentFilters: vi.fn(),
      topicFilters: {
        messageType: null,
        minUpdateFrequency: null,
        maxUpdateFrequency: null,
      },
      setTopicMessageTypeFilter: vi.fn(),
      setTopicFrequencyFilter: vi.fn(),
      clearTopicFilters: vi.fn(),
      operationFilters: {
        type: 'all',
        availableOnly: false,
      },
      setOperationTypeFilter: vi.fn(),
      setOperationAvailabilityFilter: vi.fn(),
      clearOperationFilters: vi.fn(),
      clearAllFilters: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FaultMonitor showFilter={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ERR001')).toBeInTheDocument();
      expect(screen.queryByText('WARN001')).not.toBeInTheDocument();
      expect(screen.queryByText('INFO001')).not.toBeInTheDocument();
    });
  });

  it('should filter faults by component', async () => {
    // Mock filter store with component filter
    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'all',
        componentId: 'nav_component',
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: vi.fn(),
      setFaultComponentFilter: vi.fn(),
      setFaultTimeRangeFilter: vi.fn(),
      clearFaultFilters: vi.fn(),
      globalSearchTerm: '',
      setGlobalSearchTerm: vi.fn(),
      clearGlobalSearch: vi.fn(),
      componentFilters: {
        areaId: null,
        status: 'all',
        namePattern: '',
      },
      setComponentAreaFilter: vi.fn(),
      setComponentStatusFilter: vi.fn(),
      setComponentNameFilter: vi.fn(),
      clearComponentFilters: vi.fn(),
      topicFilters: {
        messageType: null,
        minUpdateFrequency: null,
        maxUpdateFrequency: null,
      },
      setTopicMessageTypeFilter: vi.fn(),
      setTopicFrequencyFilter: vi.fn(),
      clearTopicFilters: vi.fn(),
      operationFilters: {
        type: 'all',
        availableOnly: false,
      },
      setOperationTypeFilter: vi.fn(),
      setOperationAvailabilityFilter: vi.fn(),
      clearOperationFilters: vi.fn(),
      clearAllFilters: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FaultMonitor showFilter={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('ERR001')).toBeInTheDocument();
      expect(screen.queryByText('WARN001')).not.toBeInTheDocument();
      expect(screen.getByText('INFO001')).toBeInTheDocument();
    });
  });

  it('should display result count when filters are active', async () => {
    // Mock filter store with severity filter
    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'error',
        componentId: null,
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: vi.fn(),
      setFaultComponentFilter: vi.fn(),
      setFaultTimeRangeFilter: vi.fn(),
      clearFaultFilters: vi.fn(),
      globalSearchTerm: '',
      setGlobalSearchTerm: vi.fn(),
      clearGlobalSearch: vi.fn(),
      componentFilters: {
        areaId: null,
        status: 'all',
        namePattern: '',
      },
      setComponentAreaFilter: vi.fn(),
      setComponentStatusFilter: vi.fn(),
      setComponentNameFilter: vi.fn(),
      clearComponentFilters: vi.fn(),
      topicFilters: {
        messageType: null,
        minUpdateFrequency: null,
        maxUpdateFrequency: null,
      },
      setTopicMessageTypeFilter: vi.fn(),
      setTopicFrequencyFilter: vi.fn(),
      clearTopicFilters: vi.fn(),
      operationFilters: {
        type: 'all',
        availableOnly: false,
      },
      setOperationTypeFilter: vi.fn(),
      setOperationAvailabilityFilter: vi.fn(),
      clearOperationFilters: vi.fn(),
      clearAllFilters: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FaultMonitor showFilter={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 error fault
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 total faults
    });
  });

  it('should show empty state when no faults match filters', async () => {
    // Mock filter store with filter that matches nothing
    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'error',
        componentId: 'nonexistent_component',
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: vi.fn(),
      setFaultComponentFilter: vi.fn(),
      setFaultTimeRangeFilter: vi.fn(),
      clearFaultFilters: vi.fn(),
      globalSearchTerm: '',
      setGlobalSearchTerm: vi.fn(),
      clearGlobalSearch: vi.fn(),
      componentFilters: {
        areaId: null,
        status: 'all',
        namePattern: '',
      },
      setComponentAreaFilter: vi.fn(),
      setComponentStatusFilter: vi.fn(),
      setComponentNameFilter: vi.fn(),
      clearComponentFilters: vi.fn(),
      topicFilters: {
        messageType: null,
        minUpdateFrequency: null,
        maxUpdateFrequency: null,
      },
      setTopicMessageTypeFilter: vi.fn(),
      setTopicFrequencyFilter: vi.fn(),
      clearTopicFilters: vi.fn(),
      operationFilters: {
        type: 'all',
        availableOnly: false,
      },
      setOperationTypeFilter: vi.fn(),
      setOperationAvailabilityFilter: vi.fn(),
      clearOperationFilters: vi.fn(),
      clearAllFilters: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <FaultMonitor showFilter={true} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No faults match filters')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filter criteria')).toBeInTheDocument();
    });
  });

  it('should hide filter when showFilter is false', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <FaultMonitor showFilter={false} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Filter Faults')).not.toBeInTheDocument();
      expect(screen.getByText('ERR001')).toBeInTheDocument();
    });
  });
});
