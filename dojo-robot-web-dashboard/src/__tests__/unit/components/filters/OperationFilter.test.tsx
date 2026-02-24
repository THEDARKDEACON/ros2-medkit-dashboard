import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OperationFilter } from '../../../../components/filters/OperationFilter';
import { useFilterStore } from '../../../../features/stores/filterStore';

describe('OperationFilter', () => {
  beforeEach(() => {
    // Reset filter store before each test
    useFilterStore.getState().clearOperationFilters();
  });

  it('renders all filter controls', () => {
    render(<OperationFilter />);

    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Available only')).toBeInTheDocument();
  });

  it('displays operation type options', () => {
    render(<OperationFilter />);

    const typeSelect = screen.getByLabelText('Type') as HTMLSelectElement;
    expect(typeSelect.options).toHaveLength(3);
    expect(typeSelect.options[0].text).toBe('All Types');
    expect(typeSelect.options[1].text).toBe('Services');
    expect(typeSelect.options[2].text).toBe('Actions');
  });

  it('updates type filter when selection changes', async () => {
    const user = userEvent.setup();
    render(<OperationFilter />);

    const typeSelect = screen.getByLabelText('Type');
    await user.selectOptions(typeSelect, 'service');

    const state = useFilterStore.getState();
    expect(state.operationFilters.type).toBe('service');
  });

  it('updates availability filter when checkbox changes', async () => {
    const user = userEvent.setup();
    render(<OperationFilter />);

    const checkbox = screen.getByLabelText('Available only');
    await user.click(checkbox);

    const state = useFilterStore.getState();
    expect(state.operationFilters.availableOnly).toBe(true);
  });

  it('shows clear button when filters are active', () => {
    // Set some filters
    useFilterStore.getState().setOperationTypeFilter('service');

    render(<OperationFilter />);

    expect(screen.getByLabelText('Clear operation filters')).toBeInTheDocument();
  });

  it('hides clear button when no filters are active', () => {
    render(<OperationFilter />);

    expect(screen.queryByLabelText('Clear operation filters')).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();

    // Set some filters
    useFilterStore.getState().setOperationTypeFilter('action');
    useFilterStore.getState().setOperationAvailabilityFilter(true);

    render(<OperationFilter />);

    const clearButton = screen.getByLabelText('Clear operation filters');
    await user.click(clearButton);

    const state = useFilterStore.getState();
    expect(state.operationFilters.type).toBe('all');
    expect(state.operationFilters.availableOnly).toBe(false);
  });

  it('can hide clear button via prop', () => {
    useFilterStore.getState().setOperationTypeFilter('service');

    render(<OperationFilter showClear={false} />);

    expect(screen.queryByLabelText('Clear operation filters')).not.toBeInTheDocument();
  });

  it('shows availability filter description', () => {
    render(<OperationFilter />);

    expect(
      screen.getByText('Show only operations that are currently available'),
    ).toBeInTheDocument();
  });
});
