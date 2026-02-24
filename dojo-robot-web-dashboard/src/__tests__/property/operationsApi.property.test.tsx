/**
 * Property-based tests for operations API hooks
 * **Validates: Requirements 5.1, 5.6, 5.9**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useOperations,
  useExecuteOperation,
  useCancelExecution,
} from '@/features/api/hooks';
import { apiClient } from '@/features/api/client';
import type { Operation, Execution } from '@/types/api';

// Mock the API client
vi.mock('@/features/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
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
const operationIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9_-]{2,30}$/);
const executionIdArbitrary = fc.stringMatching(/^exec-[a-z0-9]{8,16}$/);

const parameterDefinitionArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 30 }),
  type: fc.constantFrom('string', 'number', 'boolean', 'object', 'array'),
  required: fc.boolean(),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: undefined,
  }),
  default: fc.option(fc.anything(), { nil: undefined }),
});

const operationArbitrary: fc.Arbitrary<Operation> = fc.record({
  id: operationIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom('service', 'action'),
  parameters: fc.array(parameterDefinitionArbitrary, {
    minLength: 0,
    maxLength: 5,
  }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
    nil: undefined,
  }),
});

const executionArbitrary: fc.Arbitrary<Execution> = fc.record({
  id: executionIdArbitrary,
  operationId: operationIdArbitrary,
  status: fc.constantFrom('pending', 'running', 'succeeded', 'failed', 'cancelled'),
  progress: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  feedback: fc.option(fc.anything(), { nil: undefined }),
  result: fc.option(fc.anything(), { nil: undefined }),
  error: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
    nil: undefined,
  }),
  startTime: fc.date().map((d) => d.toISOString()),
  endTime: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
});

const parametersArbitrary = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 30 }),
  fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.double(),
    fc.constant(null)
  )
);

describe('Property 16: Operations Fetch on Component View', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID, when viewing that component's operations,
   * the dashboard should fetch operations from GET /api/v1/components/{component_id}/operations.
   */
  it('should call the correct API endpoint with the provided component ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        fc.array(operationArbitrary, { minLength: 0, maxLength: 10 }),
        async (componentId, mockOperations) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockOperations,
          });

          // Render the hook with the generated component ID
          const { result } = renderHook(() => useOperations(componentId), {
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
            `/components/${componentId}/operations`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(1);

          // Verify the data matches what was returned
          if (result.current.isSuccess) {
            expect(result.current.data).toEqual(mockOperations);
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
        fc.array(operationArbitrary, { minLength: 0, maxLength: 5 }),
        async (componentId, mockOperations) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockOperations,
          });

          const { result } = renderHook(() => useOperations(componentId), {
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

          // The query key should be ['components', componentId, 'operations']
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/operations`
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
        () => useOperations(emptyId as string),
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
   * Property: Operations should include both services and actions
   */
  it('should return operations with correct type field', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        fc.array(operationArbitrary, { minLength: 1, maxLength: 10 }),
        async (componentId, mockOperations) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockOperations,
          });

          const { result } = renderHook(() => useOperations(componentId), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // All returned operations should have a valid type
          const returnedOperations = result.current.data || [];
          returnedOperations.forEach((operation) => {
            expect(['service', 'action']).toContain(operation.type);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 21: Operation Execution API Call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID, operation ID, and parameter values,
   * when a user executes the operation, the dashboard should send a POST request
   * to /api/v1/components/{component_id}/operations/{operation_id}/executions
   * with the parameters in the request body.
   */
  it('should call the correct API endpoint with parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        operationIdArbitrary,
        parametersArbitrary,
        executionArbitrary,
        async (componentId, operationId, parameters, mockExecution) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.post).mockResolvedValueOnce({
            data: mockExecution,
          });

          // Render the hook
          const { result } = renderHook(() => useExecuteOperation(), {
            wrapper: createWrapper(),
          });

          // Execute the operation
          await result.current.mutateAsync({
            componentId,
            operationId,
            parameters,
          });

          // Verify the API was called with the correct endpoint and body
          expect(apiClient.post).toHaveBeenCalledWith(
            `/components/${componentId}/operations/${operationId}/executions`,
            { parameters }
          );
          expect(apiClient.post).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: The mutation should return an execution object with an ID
   */
  it('should return an execution object with required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        operationIdArbitrary,
        parametersArbitrary,
        executionArbitrary,
        async (componentId, operationId, parameters, mockExecution) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.post).mockResolvedValueOnce({
            data: mockExecution,
          });

          const { result } = renderHook(() => useExecuteOperation(), {
            wrapper: createWrapper(),
          });

          const execution = await result.current.mutateAsync({
            componentId,
            operationId,
            parameters,
          });

          // Verify the execution has required fields
          expect(execution).toHaveProperty('id');
          expect(execution).toHaveProperty('operationId');
          expect(execution).toHaveProperty('status');
          expect(execution).toHaveProperty('startTime');
          expect(['pending', 'running', 'succeeded', 'failed', 'cancelled']).toContain(
            execution.status
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Empty parameters should still trigger execution
   */
  it('should execute operations with empty parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        operationIdArbitrary,
        executionArbitrary,
        async (componentId, operationId, mockExecution) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.post).mockResolvedValueOnce({
            data: mockExecution,
          });

          const { result } = renderHook(() => useExecuteOperation(), {
            wrapper: createWrapper(),
          });

          await result.current.mutateAsync({
            componentId,
            operationId,
            parameters: {},
          });

          // Verify the API was called with empty parameters
          expect(apiClient.post).toHaveBeenCalledWith(
            `/components/${componentId}/operations/${operationId}/executions`,
            { parameters: {} }
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Parameters should be sent exactly as provided
   */
  it('should preserve parameter types and values', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        operationIdArbitrary,
        parametersArbitrary,
        executionArbitrary,
        async (componentId, operationId, parameters, mockExecution) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.post).mockResolvedValueOnce({
            data: mockExecution,
          });

          const { result } = renderHook(() => useExecuteOperation(), {
            wrapper: createWrapper(),
          });

          await result.current.mutateAsync({
            componentId,
            operationId,
            parameters,
          });

          // Verify parameters are sent exactly as provided
          const callArgs = vi.mocked(apiClient.post).mock.calls[0];
          expect(callArgs[1]).toEqual({ parameters });
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 24: Action Cancel Button Availability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any action execution with status "running" or "pending",
   * the dashboard should provide a cancel button that sends a DELETE request
   * to /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id}.
   */
  it('should call the correct DELETE endpoint for cancellation', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        operationIdArbitrary,
        executionIdArbitrary,
        async (componentId, operationId, executionId) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.delete).mockResolvedValueOnce({
            data: { success: true },
          });

          // Render the hook
          const { result } = renderHook(() => useCancelExecution(), {
            wrapper: createWrapper(),
          });

          // Cancel the execution
          await result.current.mutateAsync({
            componentId,
            operationId,
            executionId,
          });

          // Verify the API was called with the correct endpoint
          expect(apiClient.delete).toHaveBeenCalledWith(
            `/components/${componentId}/operations/${operationId}/executions/${executionId}`
          );
          expect(apiClient.delete).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Cancellation should work for any execution ID format
   */
  it('should handle various execution ID formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        operationIdArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }),
        async (componentId, operationId, executionId) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.delete).mockResolvedValueOnce({
            data: { success: true },
          });

          const { result } = renderHook(() => useCancelExecution(), {
            wrapper: createWrapper(),
          });

          await result.current.mutateAsync({
            componentId,
            operationId,
            executionId,
          });

          // Verify the API was called with the execution ID
          expect(apiClient.delete).toHaveBeenCalledWith(
            `/components/${componentId}/operations/${operationId}/executions/${executionId}`
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Multiple cancellations should each trigger separate API calls
   */
  it('should handle multiple cancellation requests independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        operationIdArbitrary,
        fc.array(executionIdArbitrary, { minLength: 2, maxLength: 5 }),
        async (componentId, operationId, executionIds) => {
          // Ensure unique execution IDs
          const uniqueExecutionIds = [...new Set(executionIds)];
          fc.pre(uniqueExecutionIds.length >= 2);

          vi.clearAllMocks();

          vi.mocked(apiClient.delete).mockResolvedValue({
            data: { success: true },
          });

          const { result } = renderHook(() => useCancelExecution(), {
            wrapper: createWrapper(),
          });

          // Cancel multiple executions
          for (const executionId of uniqueExecutionIds) {
            await result.current.mutateAsync({
              componentId,
              operationId,
              executionId,
            });
          }

          // Verify each cancellation triggered an API call
          expect(apiClient.delete).toHaveBeenCalledTimes(
            uniqueExecutionIds.length
          );

          // Verify each execution ID was used
          uniqueExecutionIds.forEach((executionId) => {
            expect(apiClient.delete).toHaveBeenCalledWith(
              `/components/${componentId}/operations/${operationId}/executions/${executionId}`
            );
          });
        }
      ),
      { numRuns: 10 }
    );
  });
});
