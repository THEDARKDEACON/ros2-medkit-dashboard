import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentTree } from '../../../../components/components/ComponentTree';
import * as hooks from '../../../../features/api/hooks';
import type { Area, Component } from '../../../../types/api';

// Mock the API hooks
vi.mock('../../../../features/api/hooks');

const mockAreas: Area[] = [
  {
    id: 'navigation',
    name: 'Navigation',
    description: 'Navigation components',
    componentCount: 2,
  },
  {
    id: 'perception',
    name: 'Perception',
    description: 'Perception components',
    componentCount: 1,
  },
  {
    id: 'empty-area',
    name: 'Empty Area',
    componentCount: 0,
  },
];

const mockComponents: Component[] = [
  {
    id: 'comp1',
    name: 'Path Planner',
    identifier: 'path_planner',
    areaId: 'navigation',
    status: 'active',
  },
  {
    id: 'comp2',
    name: 'Localizer',
    identifier: 'localizer',
    areaId: 'navigation',
    status: 'inactive',
  },
  {
    id: 'comp3',
    name: 'Camera Driver',
    identifier: 'camera_driver',
    areaId: 'perception',
    status: 'error',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('ComponentTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while fetching data', () => {
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<ComponentTree />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading component tree/i)).toBeInTheDocument();
  });

  it('renders error state when areas fail to load', () => {
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load components/i)).toBeInTheDocument();
  });

  it('renders error state when components fail to load', () => {
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    render(<ComponentTree />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load components/i)).toBeInTheDocument();
  });

  it('renders empty state when no areas exist', () => {
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree />, { wrapper: createWrapper() });

    expect(screen.getByText(/no areas found/i)).toBeInTheDocument();
  });

  it('renders areas with component count badges', () => {
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree />, { wrapper: createWrapper() });

    // Check areas are rendered
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Perception')).toBeInTheDocument();
    expect(screen.getByText('Empty Area')).toBeInTheDocument();

    // Check component count badges - each area button has the label
    expect(screen.getByLabelText('2 components')).toBeInTheDocument();
    expect(screen.getByLabelText('1 components')).toBeInTheDocument();
    expect(screen.getByLabelText('0 components')).toBeInTheDocument();
  });

  it('expands and collapses areas on click', async () => {
    const user = userEvent.setup();
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree />, { wrapper: createWrapper() });

    // Initially, components should not be visible
    expect(screen.queryByText('Path Planner')).not.toBeInTheDocument();

    // Click to expand Navigation area
    const navigationButton = screen.getByRole('treeitem', {
      name: /navigation area/i,
    });
    await user.click(navigationButton);

    // Components should now be visible
    await waitFor(() => {
      expect(screen.getByText('Path Planner')).toBeInTheDocument();
      expect(screen.getByText('Localizer')).toBeInTheDocument();
    });

    // Click again to collapse
    await user.click(navigationButton);

    // Components should be hidden again
    await waitFor(() => {
      expect(screen.queryByText('Path Planner')).not.toBeInTheDocument();
    });
  });

  it('displays components with correct status indicators', async () => {
    const user = userEvent.setup();
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree showStatus={true} />, { wrapper: createWrapper() });

    // Expand Navigation area
    const navigationButton = screen.getByRole('treeitem', {
      name: /navigation area/i,
    });
    await user.click(navigationButton);

    // Check status indicators are present
    await waitFor(() => {
      const activeStatus = screen.getByLabelText('Active');
      const inactiveStatus = screen.getByLabelText('Inactive');
      expect(activeStatus).toBeInTheDocument();
      expect(inactiveStatus).toBeInTheDocument();
    });

    // Expand Perception area
    const perceptionButton = screen.getByRole('treeitem', {
      name: /perception area/i,
    });
    await user.click(perceptionButton);

    // Check error status
    await waitFor(() => {
      const errorStatuses = screen.getAllByLabelText('Error');
      expect(errorStatuses.length).toBeGreaterThan(0);
    });
  });

  it('calls onComponentSelect when a component is clicked', async () => {
    const user = userEvent.setup();
    const onComponentSelect = vi.fn();
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree onComponentSelect={onComponentSelect} />, {
      wrapper: createWrapper(),
    });

    // Expand Navigation area
    const navigationButton = screen.getByRole('treeitem', {
      name: /navigation area/i,
    });
    await user.click(navigationButton);

    // Click on a component
    await waitFor(() => {
      const pathPlannerButton = screen.getByRole('treeitem', {
        name: /path planner component/i,
      });
      return user.click(pathPlannerButton);
    });

    // Check callback was called with correct component
    expect(onComponentSelect).toHaveBeenCalledWith(mockComponents[0]);
  });

  it('highlights selected component', async () => {
    const user = userEvent.setup();
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree selectedComponentId="comp1" />, {
      wrapper: createWrapper(),
    });

    // Expand Navigation area
    const navigationButton = screen.getByRole('treeitem', {
      name: /navigation area/i,
    });
    await user.click(navigationButton);

    // Check selected component has aria-selected
    await waitFor(() => {
      const pathPlannerButton = screen.getByRole('treeitem', {
        name: /path planner component/i,
      });
      expect(pathPlannerButton).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('shows empty message for areas with no components', async () => {
    const user = userEvent.setup();
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree />, { wrapper: createWrapper() });

    // Expand Empty Area
    const emptyAreaButton = screen.getByRole('treeitem', {
      name: /empty area/i,
    });
    await user.click(emptyAreaButton);

    // Check empty message
    await waitFor(() => {
      expect(screen.getByText(/no components in this area/i)).toBeInTheDocument();
    });
  });

  it('hides status indicators when showStatus is false', async () => {
    const user = userEvent.setup();
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree showStatus={false} />, { wrapper: createWrapper() });

    // Expand Navigation area
    const navigationButton = screen.getByRole('treeitem', {
      name: /navigation area/i,
    });
    await user.click(navigationButton);

    // Status indicators should not be present
    await waitFor(() => {
      expect(screen.queryByLabelText('Active')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Inactive')).not.toBeInTheDocument();
    });
  });

  it('properly groups components by area', () => {
    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentTree />, { wrapper: createWrapper() });

    // Check that component counts match the actual components
    const navigationBadge = screen.getByLabelText('2 components');
    const perceptionBadge = screen.getByLabelText('1 components');
    const emptyBadge = screen.getByLabelText('0 components');

    expect(navigationBadge).toBeInTheDocument();
    expect(perceptionBadge).toBeInTheDocument();
    expect(emptyBadge).toBeInTheDocument();
  });
});
