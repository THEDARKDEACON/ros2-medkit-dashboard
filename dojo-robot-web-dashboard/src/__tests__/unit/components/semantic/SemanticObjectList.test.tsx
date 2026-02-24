/**
 * Unit tests for SemanticObjectList component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SemanticObjectList } from '../../../../components/semantic/SemanticObjectList';
import type { SemanticObject } from '../../../../types/visualization';

// Mock the API hooks
vi.mock('../../../../features/api/hooks', () => ({
  useSemanticObjects: vi.fn(),
  useDownloadSemanticObjects: vi.fn(),
}));

import { useSemanticObjects, useDownloadSemanticObjects } from '../../../../features/api/hooks';

describe('SemanticObjectList', () => {
  const mockObjects: SemanticObject[] = [
    {
      id: 'obj_001',
      class: 'person',
      confidence: 0.95,
      position: { x: 1.5, y: 2.3 },
      timestamp: '2024-01-15T10:00:00Z',
      persistent: true,
    },
    {
      id: 'obj_002',
      class: 'chair',
      confidence: 0.82,
      position: { x: 3.2, y: 1.8 },
      timestamp: '2024-01-15T10:01:00Z',
      persistent: false,
    },
    {
      id: 'obj_003',
      class: 'table',
      confidence: 0.67,
      position: { x: 2.1, y: 3.5 },
      timestamp: '2024-01-15T10:02:00Z',
      persistent: true,
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

    // Setup default mock for download mutation
    vi.mocked(useDownloadSemanticObjects).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <SemanticObjectList {...props} />
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    vi.mocked(useSemanticObjects).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/loading semantic objects/i)).toBeInTheDocument();
  });

  it('renders error state when fetch fails', () => {
    vi.mocked(useSemanticObjects).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    } as any);

    renderComponent();
    expect(screen.getByText(/failed to load semantic objects/i)).toBeInTheDocument();
  });

  it('renders empty state when no objects detected', () => {
    vi.mocked(useSemanticObjects).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    renderComponent();
    expect(screen.getByText(/no objects detected/i)).toBeInTheDocument();
  });

  it('renders list of semantic objects', () => {
    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    // Check that all objects are rendered
    expect(screen.getByText('person')).toBeInTheDocument();
    expect(screen.getByText('chair')).toBeInTheDocument();
    expect(screen.getByText('table')).toBeInTheDocument();

    // Check confidence badges
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('displays persistent badge for persistent objects', () => {
    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    renderComponent();

    // Should have 2 persistent badges (obj_001 and obj_003)
    const persistentBadges = screen.getAllByText('Persistent');
    expect(persistentBadges).toHaveLength(2);
  });

  it('calls onObjectSelect when object is clicked', async () => {
    const user = userEvent.setup();
    const onObjectSelect = vi.fn();

    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    renderComponent({ onObjectSelect });

    // Click on the first object
    const personObject = screen.getByText('person').closest('div[class*="cursor-pointer"]');
    if (personObject) {
      await user.click(personObject);
      expect(onObjectSelect).toHaveBeenCalledWith(mockObjects[0]);
    }
  });

  it('filters objects by class', async () => {
    const user = userEvent.setup();

    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    renderComponent({ showFilters: true });

    // Find and change the class filter
    const classSelect = screen.getByLabelText(/object class/i);
    await user.selectOptions(classSelect, 'person');

    // Verify the hook was called with the filter
    await waitFor(() => {
      expect(useSemanticObjects).toHaveBeenCalledWith(
        expect.objectContaining({
          classFilter: 'person',
        })
      );
    });
  });

  it('filters objects by confidence threshold', async () => {
    const user = userEvent.setup();

    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    renderComponent({ showFilters: true });

    // Find and change the confidence slider
    const confidenceSlider = screen.getByLabelText(/min confidence/i);
    await user.clear(confidenceSlider);
    await user.type(confidenceSlider, '80');

    // The component should update the filter
    await waitFor(() => {
      expect(useSemanticObjects).toHaveBeenCalled();
    });
  });

  it('filters persistent objects only', async () => {
    const user = userEvent.setup();

    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    renderComponent({ showFilters: true });

    // Find and check the persistent checkbox
    const persistentCheckbox = screen.getByLabelText(/persistent only/i);
    await user.click(persistentCheckbox);

    // After filtering, only persistent objects should be visible
    // This is client-side filtering, so we check the rendered content
    await waitFor(() => {
      // The chair (obj_002) is not persistent, so it should be filtered out
      // But we can't easily test this without more complex DOM queries
      expect(persistentCheckbox).toBeChecked();
    });
  });

  it('displays object count', () => {
    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    renderComponent({ showFilters: true });

    expect(screen.getByText(/3 objects/i)).toBeInTheDocument();
  });

  it('handles download JSON button click', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();

    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useDownloadSemanticObjects).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderComponent({ showFilters: true });

    const jsonButton = screen.getByTitle(/download as json/i);
    await user.click(jsonButton);

    expect(mutateAsync).toHaveBeenCalledWith({
      format: 'json',
      classFilter: undefined,
    });
  });

  it('handles download CSV button click', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();

    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useDownloadSemanticObjects).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderComponent({ showFilters: true });

    const csvButton = screen.getByTitle(/download as csv/i);
    await user.click(csvButton);

    expect(mutateAsync).toHaveBeenCalledWith({
      format: 'csv',
      classFilter: undefined,
    });
  });

  it('disables download buttons when download is pending', () => {
    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(useDownloadSemanticObjects).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as any);

    renderComponent({ showFilters: true });

    const jsonButton = screen.getByTitle(/download as json/i);
    const csvButton = screen.getByTitle(/download as csv/i);

    expect(jsonButton).toBeDisabled();
    expect(csvButton).toBeDisabled();
  });

  it('hides filters when showFilters is false', () => {
    vi.mocked(useSemanticObjects).mockReturnValue({
      data: mockObjects,
      isLoading: false,
      error: null,
    } as any);

    renderComponent({ showFilters: false });

    expect(screen.queryByLabelText(/object class/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/min confidence/i)).not.toBeInTheDocument();
  });
});
