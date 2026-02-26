/**
 * Property-based tests for component display
 * **Validates: Requirements 2.6, 2.7**
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComponentDetail } from '@/components/components/ComponentDetail';
import { ComponentTree } from '@/components/components/ComponentTree';
import * as hooks from '@/features/api/hooks';
import type { Component, Area } from '@/types/api';

// Mock the API hooks
vi.mock('@/features/api/hooks');

// Arbitraries for generating test data
const componentStatusArbitrary = fc.constantFrom('active', 'inactive', 'error');

// Generate readable names without special characters that could cause DOM issues
// Use word-like patterns that are easy to find in the DOM
const readableNameArbitrary = fc.oneof(
  fc.constant('Navigation Controller'),
  fc.constant('Perception Module'),
  fc.constant('Safety Monitor'),
  fc.constant('Sensor Manager'),
  fc.constant('Motion Planner'),
  fc.constant('Localization System'),
  fc.constant('Mapping Service'),
  fc.constant('Path Planner'),
  fc.constant('Obstacle Detector'),
  fc.constant('Camera Driver'),
  fc.stringMatching(/^[A-Z][a-z]{3,10} [A-Z][a-z]{3,10}$/), // Two words pattern
);

// const _componentArbitrary: fc.Arbitrary<Component> = fc.record({
//   id: fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/),
//   name: readableNameArbitrary,
//   identifier: fc.stringMatching(/^[a-z][a-z0-9_/]{2,50}$/),
//   areaId: fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/),
//   status: componentStatusArbitrary,
//   metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), {
//     nil: undefined,
//   }),
// });

const _areaArbitrary: fc.Arbitrary<Area> = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/),
  name: readableNameArbitrary,
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
    nil: undefined,
  }),
  componentCount: fc.nat({ max: 100 }),
});

/**
 * Helper to create a test wrapper with router and query client
 */
function createDetailWrapper(componentId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/components/${componentId}/topics`]}>
        <Routes>
          <Route path="/components/:componentId/:tab" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/**
 * Helper to create a test wrapper for ComponentTree
 */
function createTreeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Property 3: Component Metadata Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any component displayed in the UI, the rendered output should
   * include the component's name, identifier, and area association.
   */
  it('should display component name, identifier, and area for any valid component', () => {
    // Use concrete test data for UI rendering tests
    const testCases = [
      {
        component: {
          id: 'comp1',
          name: 'Navigation Controller',
          identifier: 'nav_controller',
          areaId: 'area1',
          status: 'active' as const,
        },
        area: {
          id: 'area1',
          name: 'Navigation',
          componentCount: 1,
        },
      },
      {
        component: {
          id: 'comp2',
          name: 'Perception Module',
          identifier: 'perception_module',
          areaId: 'area2',
          status: 'inactive' as const,
        },
        area: {
          id: 'area2',
          name: 'Perception',
          componentCount: 1,
        },
      },
      {
        component: {
          id: 'comp3',
          name: 'Safety Monitor',
          identifier: 'safety/monitor',
          areaId: 'area3',
          status: 'error' as const,
        },
        area: {
          id: 'area3',
          name: 'Safety',
          componentCount: 1,
        },
      },
    ];

    testCases.forEach(({ component, area }) => {
      vi.mocked(hooks.useComponents).mockReturnValue({
        data: [component],
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(hooks.useAreas).mockReturnValue({
        data: [area],
        isLoading: false,
        error: null,
      } as any);

      const { container, unmount } = render(<ComponentDetail />, {
        wrapper: createDetailWrapper(component.id),
      });

      // Component name should be displayed
      const nameElements = screen.getAllByText(component.name);
      expect(nameElements.length).toBeGreaterThan(0);

      // Component identifier should be displayed
      expect(screen.getByText(component.identifier)).toBeInTheDocument();

      // Area name should be displayed
      expect(screen.getByText(area.name)).toBeInTheDocument();

      // Verify all three pieces of metadata are present in the DOM
      const htmlContent = container.innerHTML;
      expect(htmlContent).toContain(component.name);
      expect(htmlContent).toContain(component.identifier);
      expect(htmlContent).toContain(area.name);

      unmount();
    });
  });

  /**
   * Property: Component status should be displayed for any component
   */
  it('should display component status for any component', () => {
    const statuses: Array<'active' | 'inactive' | 'error'> = ['active', 'inactive', 'error'];

    statuses.forEach((status) => {
      const component: Component = {
        id: `comp_${status}`,
        name: `Test Component ${status}`,
        identifier: `test_${status}`,
        areaId: 'area1',
        status,
      };

      const area: Area = {
        id: 'area1',
        name: 'Test Area',
        componentCount: 1,
      };

      vi.mocked(hooks.useComponents).mockReturnValue({
        data: [component],
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(hooks.useAreas).mockReturnValue({
        data: [area],
        isLoading: false,
        error: null,
      } as any);

      const { unmount } = render(<ComponentDetail />, {
        wrapper: createDetailWrapper(component.id),
      });

      // Status should be displayed as text
      expect(screen.getByText(status)).toBeInTheDocument();

      unmount();
    });
  });

  /**
   * Property: Component metadata should be complete even when area description is missing
   */
  it('should display complete metadata even when optional fields are missing', () => {
    const component: Component = {
      id: 'comp1',
      name: 'Test Component',
      identifier: 'test_component',
      areaId: 'area1',
      status: 'active',
      // metadata is optional and omitted
    };

    const area: Area = {
      id: 'area1',
      name: 'Test Area',
      componentCount: 1,
      // description is optional and omitted
    };

    vi.mocked(hooks.useComponents).mockReturnValue({
      data: [component],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: [area],
      isLoading: false,
      error: null,
    } as any);

    render(<ComponentDetail />, {
      wrapper: createDetailWrapper(component.id),
    });

    // All required metadata should still be present
    expect(screen.getAllByText(component.name).length).toBeGreaterThan(0);
    expect(screen.getByText(component.identifier)).toBeInTheDocument();
    expect(screen.getByText(area.name)).toBeInTheDocument();
  });

  /**
   * Property: Component identifier should be displayed in a code format
   */
  it('should display component identifier in code format', () => {
    const component: Component = {
      id: 'comp1',
      name: 'Test Component',
      identifier: 'test_component',
      areaId: 'area1',
      status: 'active',
    };

    const area: Area = {
      id: 'area1',
      name: 'Test Area',
      componentCount: 1,
    };

    vi.mocked(hooks.useComponents).mockReturnValue({
      data: [component],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: [area],
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(<ComponentDetail />, {
      wrapper: createDetailWrapper(component.id),
    });

    // Identifier should be in a code element
    const codeElement = container.querySelector('code');
    expect(codeElement).toBeTruthy();
    expect(codeElement?.textContent).toBe(component.identifier);
  });
});

describe('Property 4: Component Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any component in the component list, clicking on that component
   * should trigger navigation to the detailed component view with the correct
   * component ID in the URL.
   */
  it('should navigate to component detail with correct ID when component is clicked', async () => {
    const testCases = [
      {
        component: {
          id: 'comp1',
          name: 'Navigation Controller',
          identifier: 'nav_controller',
          areaId: 'area1',
          status: 'active' as const,
        },
        area: {
          id: 'area1',
          name: 'Navigation',
          componentCount: 1,
        },
      },
      {
        component: {
          id: 'comp2',
          name: 'Perception Module',
          identifier: 'perception_module',
          areaId: 'area2',
          status: 'inactive' as const,
        },
        area: {
          id: 'area2',
          name: 'Perception',
          componentCount: 1,
        },
      },
    ];

    for (const { component, area } of testCases) {
      const onComponentSelect = vi.fn();

      vi.mocked(hooks.useComponents).mockReturnValue({
        data: [component],
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(hooks.useAreas).mockReturnValue({
        data: [area],
        isLoading: false,
        error: null,
      } as any);

      const user = userEvent.setup();

      const { unmount } = render(
        <ComponentTree
          onComponentSelect={onComponentSelect}
          showSearch={false}
        />,
        { wrapper: createTreeWrapper() }
      );

      // Wait for component tree to render
      await waitFor(() => {
        expect(screen.getByRole('tree')).toBeInTheDocument();
      });

      // Find and expand the area containing the component
      const areaButton = screen.getByRole('treeitem', {
        name: new RegExp(`${area.name} area`, 'i'),
      });
      await user.click(areaButton);

      // Wait for area to expand and component to appear
      await waitFor(() => {
        const componentButton = screen.getByRole('treeitem', {
          name: new RegExp(`${component.name} component`, 'i'),
        });
        expect(componentButton).toBeInTheDocument();
      });

      // Click on the component
      const componentButton = screen.getByRole('treeitem', {
        name: new RegExp(`${component.name} component`, 'i'),
      });
      await user.click(componentButton);

      // Verify navigation callback was called with correct component
      expect(onComponentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: component.id,
          name: component.name,
        })
      );

      unmount();
    }
  });

  /**
   * Property: Clicking on any component should trigger the selection callback
   */
  it('should call onComponentSelect for any clicked component', async () => {
    const component: Component = {
      id: 'comp1',
      name: 'Test Component',
      identifier: 'test_component',
      areaId: 'area1',
      status: 'active',
    };

    const area: Area = {
      id: 'area1',
      name: 'Test Area',
      componentCount: 1,
    };

    const onComponentSelect = vi.fn();

    vi.mocked(hooks.useComponents).mockReturnValue({
      data: [component],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: [area],
      isLoading: false,
      error: null,
    } as any);

    const user = userEvent.setup();

    render(
      <ComponentTree
        onComponentSelect={onComponentSelect}
        showSearch={false}
      />,
      { wrapper: createTreeWrapper() }
    );

    // Expand the area
    const areaButton = screen.getByRole('treeitem', {
      name: new RegExp(`${area.name} area`, 'i'),
    });
    await user.click(areaButton);

    // Wait for component to appear
    await waitFor(() => {
      const componentButton = screen.getByRole('treeitem', {
        name: new RegExp(`${component.name} component`, 'i'),
      });
      expect(componentButton).toBeInTheDocument();
    });

    // Click the component
    const componentButton = screen.getByRole('treeitem', {
      name: new RegExp(`${component.name} component`, 'i'),
    });
    await user.click(componentButton);

    // Verify callback was called
    expect(onComponentSelect).toHaveBeenCalledTimes(1);
    expect(onComponentSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: component.id,
      })
    );
  });

  /**
   * Property: Selected component should be visually highlighted
   */
  it('should highlight the selected component in the tree', async () => {
    const component: Component = {
      id: 'comp1',
      name: 'Test Component',
      identifier: 'test_component',
      areaId: 'area1',
      status: 'active',
    };

    const area: Area = {
      id: 'area1',
      name: 'Test Area',
      componentCount: 1,
    };

    vi.mocked(hooks.useComponents).mockReturnValue({
      data: [component],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(hooks.useAreas).mockReturnValue({
      data: [area],
      isLoading: false,
      error: null,
    } as any);

    const user = userEvent.setup();

    render(
      <ComponentTree
        selectedComponentId={component.id}
        showSearch={false}
      />,
      { wrapper: createTreeWrapper() }
    );

    // Expand the area
    const areaButton = screen.getByRole('treeitem', {
      name: new RegExp(`${area.name} area`, 'i'),
    });
    await user.click(areaButton);

    // Wait for component to appear
    await waitFor(() => {
      const componentButton = screen.getByRole('treeitem', {
        name: new RegExp(`${component.name} component`, 'i'),
      });
      expect(componentButton).toBeInTheDocument();
    });

    // Check that selected component has selection styling
    const componentButton = screen.getByRole('treeitem', {
      name: new RegExp(`${component.name} component`, 'i'),
    });

    expect(componentButton).toHaveAttribute('aria-selected', 'true');
    expect(componentButton).toHaveClass('bg-primary/10');
  });

  /**
   * Property: Navigation should work for components with any valid ID format
   */
  it('should handle navigation for components with various ID formats', async () => {
    const testCases = [
      { id: 'comp1', name: 'Component One' },
      { id: 'comp12345', name: 'Component Two' },
      { id: 'nav_controller', name: 'Component Three' },
    ];

    for (const { id, name } of testCases) {
      const component: Component = {
        id,
        name,
        identifier: `${name.toLowerCase().replace(/\s+/g, '_')}`,
        areaId: 'area1',
        status: 'active',
      };

      const area: Area = {
        id: 'area1',
        name: 'Test Area',
        componentCount: 1,
      };

      const onComponentSelect = vi.fn();

      vi.mocked(hooks.useComponents).mockReturnValue({
        data: [component],
        isLoading: false,
        error: null,
      } as any);

      vi.mocked(hooks.useAreas).mockReturnValue({
        data: [area],
        isLoading: false,
        error: null,
      } as any);

      const user = userEvent.setup();

      const { unmount } = render(
        <ComponentTree
          onComponentSelect={onComponentSelect}
          showSearch={false}
        />,
        { wrapper: createTreeWrapper() }
      );

      // Expand area and click component
      const areaButton = screen.getByRole('treeitem', {
        name: new RegExp(`${area.name} area`, 'i'),
      });
      await user.click(areaButton);

      await waitFor(() => {
        const componentButton = screen.getByRole('treeitem', {
          name: new RegExp(`${component.name} component`, 'i'),
        });
        expect(componentButton).toBeInTheDocument();
      });

      const componentButton = screen.getByRole('treeitem', {
        name: new RegExp(`${component.name} component`, 'i'),
      });
      await user.click(componentButton);

      // Verify the correct component ID was passed
      expect(onComponentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id,
        })
      );

      unmount();
    }
  });
});
