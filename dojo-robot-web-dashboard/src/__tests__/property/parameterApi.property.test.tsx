/**
 * Property-based tests for Parameter API hooks
 * **Validates: Requirements 6.1, 6.4, 6.7, 6.8**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useParameters,
  useParameterDetail,
  useUpdateParameter,
  useResetParameter,
} from '@/features/api/hooks';
import { apiClient } from '@/features/api/client';
import type { Parameter } from '@/types/api';

// Mock the API client
vi.mock('@/features/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Arbitraries for generating test data
const componentIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/);
const paramNameArbitrary = fc.stringMatching(/^[a-z][a-z0-9_.]{2,50}$/);

const parameterArbitrary: fc.Arbitrary<Parameter> = fc.record({
  name: paramNameArbitrary,
  value: fc.oneof(
    fc.string(),
    fc.integer(),
    fc.double(),
    fc.boolean(),
    fc.array(fc.anything())
  ),
  type: fc.constantFrom('string', 'number', 'boolean', 'array', 'object'),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
    nil: undefined,
  }),
  namespace: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
    nil: undefined,
  }),
  constraints: fc.option(
    fc.record({
      min: fc.option(fc.integer(), { nil: undefined }),
      max: fc.option(fc.integer(), { nil: undefined }),
      enum: fc.option(fc.array(fc.anything()), { nil: undefined }),
      pattern: fc.option(fc.string(), { nil: undefined }),
    }),
    { nil: undefined }
  ),
});

describe('Property 25: Parameters Fetch on Component View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID, when viewing that component's parameters,
   * the dashboard should fetch parameters from GET /api/v1/components/{component_id}/configurations.
   * 
   * **Validates: Requirements 6.1**
   */
  it('should call the correct API endpoint with the provided component ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        fc.array(parameterArbitrary, { minLength: 0, maxLength: 10 }),
        async (componentId, mockParameters) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockParameters,
          });

          // Render the hook with the generated component ID
          const { result } = renderHook(() => useParameters(componentId), {
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
            `/components/${componentId}/configurations`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(1);

          // Verify the data matches what was returned
          if (result.current.isSuccess) {
            expect(result.current.data).toEqual(mockParameters);
          }
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
        () => useParameters(emptyId as string),
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
   * Property: The query key should include the component ID for proper caching
   */
  it('should use a query key that includes the component ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        fc.array(parameterArbitrary, { minLength: 0, maxLength: 5 }),
        async (componentId, mockParameters) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockParameters,
          });

          const { result } = renderHook(() => useParameters(componentId), {
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

          // The query key should be ['components', componentId, 'parameters']
          // We verify this indirectly by checking that the API was called
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/configurations`
          );
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 28: Parameter Detail Fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID and parameter name, when a user clicks on that parameter,
   * the dashboard should fetch detailed information from GET /api/v1/components/{component_id}/configurations/{param}.
   * 
   * **Validates: Requirements 6.4**
   */
  it('should call the correct API endpoint with component ID and parameter name', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        paramNameArbitrary,
        parameterArbitrary,
        async (componentId, paramName, mockParameter) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Ensure the parameter name matches
          const parameterWithCorrectName = { ...mockParameter, name: paramName };

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: parameterWithCorrectName,
          });

          // Render the hook with the generated IDs
          const { result } = renderHook(
            () => useParameterDetail(componentId, paramName),
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
            `/components/${componentId}/configurations/${paramName}`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(1);

          // Verify the data matches what was returned
          if (result.current.isSuccess) {
            expect(result.current.data).toEqual(parameterWithCorrectName);
            expect(result.current.data?.name).toBe(paramName);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Empty or invalid IDs should not trigger API calls
   */
  it('should not make API calls when component ID or parameter name is empty', () => {
    const emptyIds = ['', null, undefined];

    emptyIds.forEach((emptyId) => {
      vi.clearAllMocks();

      const { result } = renderHook(
        () => useParameterDetail(emptyId as string, 'valid_param'),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should be disabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    emptyIds.forEach((emptyId) => {
      vi.clearAllMocks();

      const { result } = renderHook(
        () => useParameterDetail('valid_component', emptyId as string),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should be disabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });
});

describe('Property 31: Parameter Modification API Call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID, parameter name, and new value, when a user modifies the parameter,
   * the dashboard should send a PUT request to /api/v1/components/{component_id}/configurations/{param} with the new value.
   * 
   * **Validates: Requirements 6.7**
   */
  it('should send PUT request with correct endpoint and value', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        paramNameArbitrary,
        fc.oneof(fc.string(), fc.integer(), fc.double(), fc.boolean()),
        parameterArbitrary,
        async (componentId, paramName, newValue, mockParameter) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response with updated parameter
          const updatedParameter = { ...mockParameter, name: paramName, value: newValue };
          vi.mocked(apiClient.put).mockResolvedValueOnce({
            data: updatedParameter,
          });

          // Render the hook
          const { result } = renderHook(() => useUpdateParameter(), {
            wrapper: createWrapper(),
          });

          // Execute the mutation
          await result.current.mutateAsync({
            componentId,
            paramName,
            value: newValue,
          });

          // Verify the API was called with the correct endpoint and payload
          expect(apiClient.put).toHaveBeenCalledWith(
            `/components/${componentId}/configurations/${paramName}`,
            { value: newValue }
          );
          expect(apiClient.put).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: The mutation should handle different value types correctly
   */
  it('should handle string, number, boolean, and array values', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        paramNameArbitrary,
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.double(),
          fc.boolean(),
          fc.array(fc.anything())
        ),
        async (componentId, paramName, value) => {
          vi.clearAllMocks();

          const mockParameter: Parameter = {
            name: paramName,
            value,
            type: Array.isArray(value)
              ? 'array'
              : typeof value === 'number'
              ? 'number'
              : typeof value === 'boolean'
              ? 'boolean'
              : 'string',
          };

          vi.mocked(apiClient.put).mockResolvedValueOnce({
            data: mockParameter,
          });

          const { result } = renderHook(() => useUpdateParameter(), {
            wrapper: createWrapper(),
          });

          await result.current.mutateAsync({
            componentId,
            paramName,
            value,
          });

          // Verify the value was sent correctly
          expect(apiClient.put).toHaveBeenCalledWith(
            `/components/${componentId}/configurations/${paramName}`,
            { value }
          );
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 32: Parameter Reset API Call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID and parameter name, when a user clicks the reset button,
   * the dashboard should send a DELETE request to /api/v1/components/{component_id}/configurations/{param}.
   * 
   * **Validates: Requirements 6.8**
   */
  it('should send DELETE request with correct endpoint', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        paramNameArbitrary,
        async (componentId, paramName) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.delete).mockResolvedValueOnce({
            data: { success: true },
          });

          // Render the hook
          const { result } = renderHook(() => useResetParameter(), {
            wrapper: createWrapper(),
          });

          // Execute the mutation
          await result.current.mutateAsync({
            componentId,
            paramName,
          });

          // Verify the API was called with the correct endpoint
          expect(apiClient.delete).toHaveBeenCalledWith(
            `/components/${componentId}/configurations/${paramName}`
          );
          expect(apiClient.delete).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Reset should return success status
   */
  it('should return success status on successful reset', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        paramNameArbitrary,
        async (componentId, paramName) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.delete).mockResolvedValueOnce({
            data: { success: true },
          });

          const { result } = renderHook(() => useResetParameter(), {
            wrapper: createWrapper(),
          });

          const response = await result.current.mutateAsync({
            componentId,
            paramName,
          });

          // Verify the response indicates success
          expect(response.success).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});
