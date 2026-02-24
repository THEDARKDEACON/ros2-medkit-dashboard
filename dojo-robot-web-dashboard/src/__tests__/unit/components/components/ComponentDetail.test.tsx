import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentDetail } from '../../../../components/components/ComponentDetail';
import * as hooks from '../../../../features/api/hooks';
import type { Component, Area } from '../../../../types/api';

// Mock the API hooks
vi.mock('../../../../features/api/hooks');

const mockComponents: Component[] = [
  {
    id: 'comp1',
    name: 'Navigation Controller',
    identifier: 'nav_controller',
    areaId: 'area1',
    status: 'active',
    metadata: {},
  },
  {
    id: 'comp2',
    name: 'Perception Module',
    identifier: 'perception',
    areaId: 'area2',
    status: 'error',
    metadata: {},
  },
];

const mockAreas: Area[] = [
  {
    id: 'area1',
    name: 'Navigation',
    description: 'Navigation subsystem',
    componentCount: 1,
  },
  {
    id: 'area2',
    name: 'Perception',
    description: 'Perception subsystem',
    componentCount: 1,
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
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/components/comp1/topics']}>
        <Routes>
          <Route path="/components/:componentId/:tab" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ComponentDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state while fetching data', () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<ComponentDetail />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading component details/i)).toBeInTheDocument();
  });

  it('should display error state when component fetch fails', () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentDetail />, { wrapper: createWrapper() });

    expect(screen.getByText(/failed to load component/i)).toBeInTheDocument();
  });

  it('should display component not found when component does not exist', async () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/components/nonexistent/topics']}>
          <Routes>
            <Route path="/components/:componentId/:tab" element={<ComponentDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/component not found/i)).toBeInTheDocument();
    });
  });

  it('should display component metadata (name, identifier, area)', async () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Component name (appears in multiple places)
      const componentNames = screen.getAllByText('Navigation Controller');
      expect(componentNames.length).toBeGreaterThan(0);
      
      // Component identifier
      expect(screen.getByText('nav_controller')).toBeInTheDocument();
      
      // Area name
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      
      // Status
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('should display all three tabs (Topics, Operations, Parameters)', async () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Topics')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
      expect(screen.getByText('Parameters')).toBeInTheDocument();
    });
  });

  it('should display breadcrumb navigation', async () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Breadcrumb should show Components and component name
      expect(screen.getByText('Components')).toBeInTheDocument();
      const componentNames = screen.getAllByText('Navigation Controller');
      expect(componentNames.length).toBeGreaterThan(0);
    });
  });

  it('should display back button', async () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      const backButtons = screen.getAllByText(/back to components/i);
      expect(backButtons.length).toBeGreaterThan(0);
    });
  });

  it('should display status indicator with correct color', async () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check for status badge
      const statusBadge = screen.getByText('active');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-green-100');
    });
  });

  it('should highlight active tab', async () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      const topicsTab = screen.getByText('Topics').closest('a');
      expect(topicsTab).toHaveClass('border-primary');
      expect(topicsTab).toHaveClass('text-primary');
    });
  });

  it('should display error status component correctly', async () => {
    vi.mocked(hooks.useComponents).mockReturnValue({
      data: mockComponents,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: mockAreas,
      isLoading: false,
      error: null,
    } as any);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/components/comp2/topics']}>
          <Routes>
            <Route path="/components/:componentId/:tab" element={<ComponentDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      const statusBadge = screen.getByText('error');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-red-100');
    });
  });
});
