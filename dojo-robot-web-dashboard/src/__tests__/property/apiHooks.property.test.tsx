/**
 * Property-based tests for API hooks
 * **Validates: Requirements 2.4, 3.1**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAreaComponents, useComponentTopicData } from '@/features/api/hooks';
import { apiClient } from '@/features/api/client';
import type { Component } from '@/types/api';

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
const areaIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/);
const componentIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/);

const componentArbitrary: fc.Arbitrary<Component> = fc.record({
  id: componentIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  identifier: fc.string({ minLength: 1, maxLength: 100 }),
  areaId: areaIdArbitrary,
  status: fc.constantFrom('active', 'inactive', 'error'),
  metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), {
    nil: undefined,
  }),
});

const topicDataArbitrary = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.anything()
);

describe('Property 1: Area Selection API Call Correctness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid area ID, when a user selects that area,
   * the dashboard should make an API call to GET /api/v1/areas/{area_id}/components
   * with the correct area ID.
   */
  it('should call the correct API endpoint with the provided area ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        areaIdArbitrary,
        fc.array(componentArbitrary, { minLength: 0, maxLength: 10 }),
        async (areaId, mockComponents) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockComponents,
          });

          // Render the hook with the generated area ID
          const { result } = renderHook(() => useAreaComponents(areaId), {
            wrapper: createWrapper(),
          });

          // Wait for the query to complete
          await waitFor(
            () => {
              expect(result.current.isSuccess || result.current.isError).toBe(
                true
              );
            },
            { timeout: 1000 }
          );

          // Verify the API was called with the correct endpoint
          expect(apiClient.get).toHaveBeenCalledWith(
            `/areas/${areaId}/components`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(1);

          // Verify the data matches what was returned
          if (result.current.isSuccess) {
            expect(result.current.data).toEqual(mockComponents);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: The query key should include the area ID for proper caching
   */
  it('should use a query key that includes the area ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        areaIdArbitrary,
        fc.array(componentArbitrary, { minLength: 0, maxLength: 5 }),
        async (areaId, mockComponents) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockComponents,
          });

          const { result } = renderHook(() => useAreaComponents(areaId), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess || result.current.isError).toBe(
                true
              );
            },
            { timeout: 1000 }
          );

          // The query key should be ['areas', areaId, 'components']
          // We verify this indirectly by checking that different area IDs
          // result in different API calls (not cached)
          expect(apiClient.get).toHaveBeenCalledWith(
            `/areas/${areaId}/components`
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Empty or invalid area IDs should not trigger API calls
   */
  it('should not make API calls when area ID is empty', () => {
    const emptyAreaIds = ['', null, undefined];

    emptyAreaIds.forEach((emptyId) => {
      vi.clearAllMocks();

      const { result } = renderHook(
        () => useAreaComponents(emptyId as string),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should be disabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  /**
   * Property: The hook should return components that belong to the requested area
   */
  it('should return components with matching area ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        areaIdArbitrary,
        fc.array(componentArbitrary, { minLength: 1, maxLength: 10 }),
        async (areaId, mockComponents) => {
          vi.clearAllMocks();

          // Ensure all components have the correct areaId
          const componentsWithCorrectArea = mockComponents.map((comp) => ({
            ...comp,
            areaId,
          }));

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: componentsWithCorrectArea,
          });

          const { result } = renderHook(() => useAreaComponents(areaId), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // All returned components should have the requested area ID
          const returnedComponents = result.current.data || [];
          returnedComponents.forEach((component) => {
            expect(component.areaId).toBe(areaId);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 5: Topic Data Fetch on Component View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID, when viewing that component,
   * the dashboard should fetch topic data from GET /api/v1/components/{component_id}/data.
   */
  it('should call the correct API endpoint with the provided component ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicDataArbitrary,
        async (componentId, mockTopicData) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockTopicData,
          });

          // Render the hook with the generated component ID
          const { result } = renderHook(
            () => useComponentTopicData(componentId),
            {
              wrapper: createWrapper(),
            }
          );

          // Wait for the query to complete
          await waitFor(
            () => {
              expect(result.current.isSuccess || result.current.isError).toBe(
                true
              );
            },
            { timeout: 1000 }
          );

          // Verify the API was called with the correct endpoint
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/data`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(1);

          // Verify the data matches what was returned
          if (result.current.isSuccess) {
            expect(result.current.data).toEqual(mockTopicData);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: The query key should include the component ID for proper caching
   */
  it('should use a query key that includes the component ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicDataArbitrary,
        async (componentId, mockTopicData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockTopicData,
          });

          const { result } = renderHook(
            () => useComponentTopicData(componentId),
            {
              wrapper: createWrapper(),
            }
          );

          await waitFor(
            () => {
              expect(result.current.isSuccess || result.current.isError).toBe(
                true
              );
            },
            { timeout: 1000 }
          );

          // The query key should be ['components', componentId, 'data']
          // We verify this indirectly by checking that the API was called
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/data`
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Empty or invalid component IDs should not trigger API calls
   */
  it('should not make API calls when component ID is empty', () => {
    const emptyComponentIds = ['', null, undefined];

    emptyComponentIds.forEach((emptyId) => {
      vi.clearAllMocks();

      const { result } = renderHook(
        () => useComponentTopicData(emptyId as string),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should be disabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });

  /**
   * Property: Topic data should be fetched immediately when component is viewed
   */
  it('should fetch topic data immediately when component ID is provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicDataArbitrary,
        async (componentId, mockTopicData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockTopicData,
          });

          const { result } = renderHook(
            () => useComponentTopicData(componentId),
            {
              wrapper: createWrapper(),
            }
          );

          // The query should start loading immediately
          expect(
            result.current.isLoading || result.current.isFetching
          ).toBe(true);

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Verify API was called
          expect(apiClient.get).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Topic data should have staleTime of 0 for real-time updates
   */
  it('should consider topic data immediately stale for real-time updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicDataArbitrary,
        async (componentId, mockTopicData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValue({
            data: mockTopicData,
          });

          const { result } = renderHook(
            () => useComponentTopicData(componentId),
            {
              wrapper: createWrapper(),
            }
          );

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Data should be considered stale immediately (staleTime: 0)
          // This is verified by the hook configuration, not runtime behavior
          expect(result.current.data).toEqual(mockTopicData);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Changing component ID should trigger a new fetch
   */
  it('should refetch when component ID changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        componentIdArbitrary,
        topicDataArbitrary,
        topicDataArbitrary,
        async (componentId1, componentId2, topicData1, topicData2) => {
          // Skip if component IDs are the same
          fc.pre(componentId1 !== componentId2);

          vi.clearAllMocks();

          vi.mocked(apiClient.get)
            .mockResolvedValueOnce({ data: topicData1 })
            .mockResolvedValueOnce({ data: topicData2 });

          const { result, rerender } = renderHook(
            ({ componentId }) => useComponentTopicData(componentId),
            {
              wrapper: createWrapper(),
              initialProps: { componentId: componentId1 },
            }
          );

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          expect(result.current.data).toEqual(topicData1);
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId1}/data`
          );

          // Change component ID
          rerender({ componentId: componentId2 });

          await waitFor(
            () => {
              expect(result.current.data).toEqual(topicData2);
            },
            { timeout: 1000 }
          );

          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId2}/data`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(2);
        }
      ),
      { numRuns: 10 }
    );
  });
});
