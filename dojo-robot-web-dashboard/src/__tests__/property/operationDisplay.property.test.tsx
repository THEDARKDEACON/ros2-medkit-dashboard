/**
 * Property-based tests for operation display
 * **Validates: Requirements 5.2, 5.3**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, within, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OperationList } from '@/components/operations/OperationList';
import { apiClient } from '@/features/api/client';
import type { Operation } from '@/types/api';

// Mock the API client
vi.mock('@/features/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Arbitraries for generating test data
const componentIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/);
const operationIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9_-]{2,30}$/);

const parameterDefinitionArbitrary = fc.record({
  name: fc.string({ minLength: 2, maxLength: 30 }).filter(s => /[a-zA-Z0-9]/.test(s)),
  type: fc.constantFrom('string', 'number', 'boolean', 'object', 'array'),
  required: fc.boolean(),
  description: fc.option(fc.string({ minLength: 5, maxLength: 100 }), {
    nil: undefined,
  }),
  default: fc.option(fc.anything(), { nil: undefined }),
});

const operationArbitrary: fc.Arbitrary<Operation> = fc.record({
  id: operationIdArbitrary,
  name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /[a-zA-Z]/.test(s)),
  type: fc.constantFrom('service', 'action'),
  parameters: fc.array(parameterDefinitionArbitrary, {
    minLength: 0,
    maxLength: 5,
  }),
  description: fc.option(fc.string({ minLength: 10, maxLength: 200 }), {
    nil: undefined,
  }),
});

describe('Property 17: Operation Display Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any operation displayed, the rendered output should include
   * the operation's type (service or action) and its parameters.
   */
  it('should display operation type for all operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        fc.array(operationArbitrary, { minLength: 1, maxLength: 5 }),
        async (componentId, mockOperations) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockOperations,
          });

          // Render the component
          const { container } = render(
            <OperationList componentId={componentId} />,
            { wrapper: createWrapper() }
          );

          // Wait for operations to load
          await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
          });

          // Verify that all operations have type badges
          const serviceBadges = container.querySelectorAll('[class*="bg-blue"]');
          const actionBadges = container.querySelectorAll('[class*="bg-purple"]');
          
          const serviceCount = mockOperations.filter(op => op.type === 'service').length;
          const actionCount = mockOperations.filter(op => op.type === 'action').length;
          
          // At least the expected number of badges should be present
          expect(serviceBadges.length).toBeGreaterThanOrEqual(serviceCount);
          expect(actionBadges.length).toBeGreaterThanOrEqual(actionCount);
        }
      ),
      { numRuns: 5 }
    );
  }, 15000);

  /**
   * Property: Operations with parameters should display parameter information
   */
  it('should display parameters for operations that have them', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        fc.array(
          operationArbitrary.filter((op) => op.parameters.length > 0),
          { minLength: 1, maxLength: 3 }
        ),
        async (componentId, mockOperations) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockOperations,
          });

          const { container } = render(
            <OperationList componentId={componentId} />,
            { wrapper: createWrapper() }
          );

          await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
          });

          // Verify that "Parameters:" label appears for operations with parameters
          const parametersLabels = screen.getAllByText(/parameters:/i);
          expect(parametersLabels.length).toBeGreaterThanOrEqual(1);
          
          // Verify that parameter badges are displayed
          const paramBadges = container.querySelectorAll('[class*="bg-muted"][class*="border-border"]');
          expect(paramBadges.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 5 }
    );
  }, 15000);
});

describe('Property 18: Service vs Action Visual Distinction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any two operations where one is a service and one is an action,
   * the visual rendering should be distinguishable (different styling, icons, or labels).
   */
  it('should visually distinguish services from actions', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        operationArbitrary.filter((op) => op.type === 'service'),
        operationArbitrary.filter((op) => op.type === 'action'),
        async (componentId, serviceOp, actionOp) => {
          vi.clearAllMocks();

          // Create a list with both types
          const mockOperations = [serviceOp, actionOp];

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockOperations,
          });

          render(
            <OperationList componentId={componentId} />,
            { wrapper: createWrapper() }
          );

          await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
          });

          // Find both operation cards
          const serviceElement = screen.getByText((content, element) => {
            return element?.tagName === 'H4' && content.trim() === serviceOp.name.trim();
          });
          const actionElement = screen.getByText((content, element) => {
            return element?.tagName === 'H4' && content.trim() === actionOp.name.trim();
          });

          const serviceCard = serviceElement.closest('button');
          const actionCard = actionElement.closest('button');

          expect(serviceCard).toBeInTheDocument();
          expect(actionCard).toBeInTheDocument();

          // Verify service has "Service" badge
          const serviceBadge = within(serviceCard!).getByText('Service');
          expect(serviceBadge).toBeInTheDocument();

          // Verify action has "Action" badge
          const actionBadge = within(actionCard!).getByText('Action');
          expect(actionBadge).toBeInTheDocument();

          // Verify badges have different styling (check class names)
          const serviceBadgeClasses = serviceBadge.className;
          const actionBadgeClasses = actionBadge.className;

          // The badges should have different color classes
          expect(serviceBadgeClasses).not.toBe(actionBadgeClasses);

          // Service should have blue styling
          expect(serviceBadgeClasses).toMatch(/blue/);

          // Action should have purple styling
          expect(actionBadgeClasses).toMatch(/purple/);
        }
      ),
      { numRuns: 10 }
    );
  }, 15000);

  /**
   * Property: Services should have a consistent visual indicator across all instances
   */
  it('should apply consistent styling to all services', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        fc.array(
          operationArbitrary.filter((op) => op.type === 'service'),
          { minLength: 2, maxLength: 3 }
        ),
        async (componentId, mockServices) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockServices,
          });

          const { container } = render(
            <OperationList componentId={componentId} />,
            { wrapper: createWrapper() }
          );

          await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
          });

          // Get all service badges (within operation cards, not in the filter dropdown)
          const operationCards = container.querySelectorAll('button[aria-pressed]');
          const serviceBadges: HTMLElement[] = [];
          operationCards.forEach((card) => {
            const badge = within(card as HTMLElement).queryByText('Service');
            if (badge) serviceBadges.push(badge);
          });
          
          expect(serviceBadges.length).toBe(mockServices.length);

          // All service badges should have the same styling
          const firstBadgeClasses = serviceBadges[0].className;
          serviceBadges.forEach((badge) => {
            expect(badge.className).toBe(firstBadgeClasses);
          });
        }
      ),
      { numRuns: 5 }
    );
  }, 15000);

  /**
   * Property: Actions should have a consistent visual indicator across all instances
   */
  it('should apply consistent styling to all actions', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        fc.array(
          operationArbitrary.filter((op) => op.type === 'action'),
          { minLength: 2, maxLength: 3 }
        ),
        async (componentId, mockActions) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockActions,
          });

          const { container } = render(
            <OperationList componentId={componentId} />,
            { wrapper: createWrapper() }
          );

          await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
          });

          // Get all action badges (within operation cards, not in the filter dropdown)
          const operationCards = container.querySelectorAll('button[aria-pressed]');
          const actionBadges: HTMLElement[] = [];
          operationCards.forEach((card) => {
            const badge = within(card as HTMLElement).queryByText('Action');
            if (badge) actionBadges.push(badge);
          });
          
          expect(actionBadges.length).toBe(mockActions.length);

          // All action badges should have the same styling
          const firstBadgeClasses = actionBadges[0].className;
          actionBadges.forEach((badge) => {
            expect(badge.className).toBe(firstBadgeClasses);
          });
        }
      ),
      { numRuns: 5 }
    );
  }, 15000);
});

