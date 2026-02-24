/**
 * Unit tests for FaultFilter component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaultFilter } from '../../../../components/faults/FaultFilter';
import { useFilterStore } from '../../../../features/stores/filterStore';

// Mock the filter store
vi.mock('../../../../features/stores/filterStore');

describe('FaultFilter', () => {
  const mockSetFaultSeverityFilter = vi.fn();
  const mockSetFaultComponentFilter = vi.fn();
  const mockSetFaultTimeRangeFilter = vi.fn();
  const mockClearFaultFilters = vi.fn();

  const mockComponentIds = ['nav_component', 'power_component', 'sensor_component'];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementation
    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'all',
        componentId: null,
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: mockSetFaultSeverityFilter,
      setFaultComponentFilter: mockSetFaultComponentFilter,
      setFaultTimeRangeFilter: mockSetFaultTimeRangeFilter,
      clearFaultFilters: mockClearFaultFilters,
      // Add other required store properties with mock values
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
  });

  it('should render filter controls', () => {
    render(
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={10}
        totalCount={20}
      />
    );

    expect(screen.getByText('Filter Faults')).toBeInTheDocument();
    expect(screen.getByLabelText('Severity')).toBeInTheDocument();
    expect(screen.getByLabelText('Component')).toBeInTheDocument();
    expect(screen.getByText('Time Range')).toBeInTheDocument();
  });

  it('should display all severity options', () => {
    render(
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={10}
        totalCount={20}
      />
    );

    const severitySelect = screen.getByLabelText('Severity') as HTMLSelectElement;
    const options = Array.from(severitySelect.options).map((opt) => opt.value);

    expect(options).toEqual(['all', 'error', 'warning', 'info']);
  });

  it('should display all component options', () => {
    render(
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={10}
        totalCount={20}
      />
    );

    const componentSelect = screen.getByLabelText('Component') as HTMLSelectElement;
    const options = Array.from(componentSelect.options).map((opt) => opt.value);

    expect(options).toEqual(['', ...mockComponentIds]);
  });

  it('should call setFaultSeverityFilter when severity is changed', async () => {
    const user = userEvent.setup();

    render(
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={10}
        totalCount={20}
      />
    );

    const severitySelect = screen.getByLabelText('Severity');
    await user.selectOptions(severitySelect, 'error');

    expect(mockSetFaultSeverityFilter).toHaveBeenCalledWith('error');
  });

  it('should call setFaultComponentFilter when component is changed', async () => {
    const user = userEvent.setup();

    render(
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={10}
        totalCount={20}
      />
    );

    const componentSelect = screen.getByLabelText('Component');
    await user.selectOptions(componentSelect, 'nav_component');

    expect(mockSetFaultComponentFilter).toHaveBeenCalledWith('nav_component');
  });

  it('should call setFaultTimeRangeFilter when start time is changed', async () => {
    const user = userEvent.setup();

    render(
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={10}
        totalCount={20}
      />
    );

    const startTimeInput = screen.getByLabelText('From');
    await user.type(startTimeInput, '2024-01-15T10:00');

    expect(mockSetFaultTimeRangeFilter).toHaveBeenCalledWith(
      '2024-01-15T10:00',
      null
    );
  });

  it('should call setFaultTimeRangeFilter when end time is changed', async () => {
    const user = userEvent.setup();

    render(
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={10}
        totalCount={20}
      />
    );

    const endTimeInput = screen.getByLabelText('To');
    await user.type(endTimeInput, '2024-01-15T12:00');

    expect(mockSetFaultTimeRangeFilter).toHaveBeenCalledWith(
      null,
      '2024-01-15T12:00'
    );
  });

  it('should show clear filters button when filters are active', () => {
    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'error',
        componentId: null,
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: mockSetFaultSeverityFilter,
      setFaultComponentFilter: mockSetFaultComponentFilter,
      setFaultTimeRangeFilter: mockSetFaultTimeRangeFilter,
      clearFaultFilters: mockClearFaultFilters,
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
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={5}
        totalCount={20}
      />
    );

    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
  });

  it('should call clearFaultFilters when clear button is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'error',
        componentId: null,
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: mockSetFaultSeverityFilter,
      setFaultComponentFilter: mockSetFaultComponentFilter,
      setFaultTimeRangeFilter: mockSetFaultTimeRangeFilter,
      clearFaultFilters: mockClearFaultFilters,
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
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={5}
        totalCount={20}
      />
    );

    const clearButton = screen.getByLabelText('Clear all filters');
    await user.click(clearButton);

    expect(mockClearFaultFilters).toHaveBeenCalled();
  });

  it('should display result count when filters are active', () => {
    vi.mocked(useFilterStore).mockReturnValue({
      faultFilters: {
        severity: 'error',
        componentId: null,
        startTime: null,
        endTime: null,
      },
      setFaultSeverityFilter: mockSetFaultSeverityFilter,
      setFaultComponentFilter: mockSetFaultComponentFilter,
      setFaultTimeRangeFilter: mockSetFaultTimeRangeFilter,
      clearFaultFilters: mockClearFaultFilters,
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
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={5}
        totalCount={20}
      />
    );

    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('should not display result count when no filters are active', () => {
    render(
      <FaultFilter
        componentIds={mockComponentIds}
        resultCount={20}
        totalCount={20}
      />
    );

    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });
});
