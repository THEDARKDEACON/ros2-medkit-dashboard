import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentFilter } from '../../../../components/filters/ComponentFilter';
import { useFilterStore } from '../../../../features/stores/filterStore';
import type { Area } from '../../../../types/api';

describe('ComponentFilter', () => {
  const mockAreas: Area[] = [
    { id: 'area1', name: 'Navigation', description: 'Nav area', componentCount: 5 },
    { id: 'area2', name: 'Perception', description: 'Perception area', componentCount: 3 },
  ];

  beforeEach(() => {
    // Reset filter store before each test
    useFilterStore.getState().clearComponentFilters();
  });

  it('renders all filter controls', () => {
    render(<ComponentFilter areas={mockAreas} />);

    expect(screen.getByLabelText('Area')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Name Pattern')).toBeInTheDocument();
  });

  it('displays available areas in dropdown', () => {
    render(<ComponentFilter areas={mockAreas} />);

    const areaSelect = screen.getByLabelText('Area') as HTMLSelectElement;
    expect(areaSelect.options).toHaveLength(3); // "All Areas" + 2 areas
    expect(areaSelect.options[0].text).toBe('All Areas');
    expect(areaSelect.options[1].text).toBe('Navigation');
    expect(areaSelect.options[2].text).toBe('Perception');
  });

  it('updates area filter when selection changes', async () => {
    const user = userEvent.setup();
    render(<ComponentFilter areas={mockAreas} />);

    const areaSelect = screen.getByLabelText('Area');
    await user.selectOptions(areaSelect, 'area1');

    const state = useFilterStore.getState();
    expect(state.componentFilters.areaId).toBe('area1');
  });

  it('updates status filter when selection changes', async () => {
    const user = userEvent.setup();
    render(<ComponentFilter areas={mockAreas} />);

    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, 'active');

    const state = useFilterStore.getState();
    expect(state.componentFilters.status).toBe('active');
  });

  it('updates name pattern filter when input changes', async () => {
    const user = userEvent.setup();
    render(<ComponentFilter areas={mockAreas} />);

    const nameInput = screen.getByLabelText('Name Pattern');
    await user.type(nameInput, 'test');

    const state = useFilterStore.getState();
    expect(state.componentFilters.namePattern).toBe('test');
  });

  it('shows clear button when filters are active', () => {
    // Set some filters
    useFilterStore.getState().setComponentAreaFilter('area1');

    render(<ComponentFilter areas={mockAreas} />);

    expect(screen.getByLabelText('Clear component filters')).toBeInTheDocument();
  });

  it('hides clear button when no filters are active', () => {
    render(<ComponentFilter areas={mockAreas} />);

    expect(screen.queryByLabelText('Clear component filters')).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();

    // Set some filters
    useFilterStore.getState().setComponentAreaFilter('area1');
    useFilterStore.getState().setComponentStatusFilter('active');
    useFilterStore.getState().setComponentNameFilter('test');

    render(<ComponentFilter areas={mockAreas} />);

    const clearButton = screen.getByLabelText('Clear component filters');
    await user.click(clearButton);

    const state = useFilterStore.getState();
    expect(state.componentFilters.areaId).toBeNull();
    expect(state.componentFilters.status).toBe('all');
    expect(state.componentFilters.namePattern).toBe('');
  });

  it('can hide clear button via prop', () => {
    useFilterStore.getState().setComponentAreaFilter('area1');

    render(<ComponentFilter areas={mockAreas} showClear={false} />);

    expect(screen.queryByLabelText('Clear component filters')).not.toBeInTheDocument();
  });
});
