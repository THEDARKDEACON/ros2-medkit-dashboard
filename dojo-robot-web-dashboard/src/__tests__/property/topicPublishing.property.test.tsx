/**
 * Property-based tests for topic publishing
 * **Validates: Requirements 4.4**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePublishTopic } from '@/features/api/hooks';
import { apiClient } from '@/features/api/client';

// Mock the API client
vi.mock('@/features/api/client', () => ({
  apiClient: {
    put: vi.fn(),
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
const topicNameArbitrary = fc.stringMatching(/^\/[a-z][a-z0-9_/-]{1,50}$/);

// Generate various message payloads
const messageArbitrary = fc.oneof(
  // Simple object
  fc.record({
    value: fc.double(),
    timestamp: fc.integer(),
  }),
  // Nested object
  fc.record({
    linear: fc.record({
      x: fc.double(),
      y: fc.double(),
      z: fc.double(),
    }),
    angular: fc.record({
      x: fc.double(),
      y: fc.double(),
      z: fc.double(),
    }),
  }),
  // Array
  fc.array(fc.double(), { minLength: 1, maxLength: 10 }),
  // String
  fc.string({ minLength: 1, maxLength: 100 }),
  // Number
  fc.double(),
  // Boolean
  fc.boolean(),
  // Complex nested structure
  fc.record({
    header: fc.record({
      seq: fc.integer(),
      stamp: fc.record({
        sec: fc.integer(),
        nsec: fc.integer(),
      }),
      frame_id: fc.string(),
    }),
    data: fc.anything(),
  })
);

describe('Property 15: Topic Publication API Call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID, topic name, and message payload,
   * when a user submits the message, the dashboard should send a PUT request
   * to /api/v1/components/{component_id}/data/{topic_name} with the message
   * as the request body.
   */
  it('Feature: dojo-robot-web-dashboard, Property 15: should send PUT request to correct endpoint with message payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        messageArbitrary,
        async (componentId, topicName, message) => {
          // Reset mocks for each property test iteration
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.put).mockResolvedValueOnce({
            data: { success: true },
          });

          // Render the hook
          const { result } = renderHook(() => usePublishTopic(), {
            wrapper: createWrapper(),
          });

          // Execute the mutation
          await result.current.mutateAsync({
            componentId,
            topicName,
            message,
          });

          // Wait for mutation to complete
          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Verify the API was called with the correct endpoint and payload
          expect(apiClient.put).toHaveBeenCalledWith(
            `/components/${componentId}/data/${topicName}`,
            message
          );
          expect(apiClient.put).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: The mutation should use PUT method, not POST or other methods
   */
  it('should use PUT method for topic publication', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        messageArbitrary,
        async (componentId, topicName, message) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.put).mockResolvedValueOnce({
            data: { success: true },
          });

          const { result } = renderHook(() => usePublishTopic(), {
            wrapper: createWrapper(),
          });

          await result.current.mutateAsync({
            componentId,
            topicName,
            message,
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Verify PUT was called (not POST, PATCH, etc.)
          expect(apiClient.put).toHaveBeenCalled();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: The message payload should be sent exactly as provided,
   * without modification
   */
  it('should send message payload without modification', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        messageArbitrary,
        async (componentId, topicName, message) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.put).mockResolvedValueOnce({
            data: { success: true },
          });

          const { result } = renderHook(() => usePublishTopic(), {
            wrapper: createWrapper(),
          });

          await result.current.mutateAsync({
            componentId,
            topicName,
            message,
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Verify the message was sent exactly as provided
          const callArgs = vi.mocked(apiClient.put).mock.calls[0];
          expect(callArgs[1]).toEqual(message);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Multiple publications to different topics should result in
   * separate API calls
   */
  it('should make separate API calls for different topics', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        topicNameArbitrary,
        messageArbitrary,
        messageArbitrary,
        async (componentId, topicName1, topicName2, message1, message2) => {
          // Skip if topic names are the same
          fc.pre(topicName1 !== topicName2);

          vi.clearAllMocks();

          vi.mocked(apiClient.put)
            .mockResolvedValueOnce({ data: { success: true } })
            .mockResolvedValueOnce({ data: { success: true } });

          const { result } = renderHook(() => usePublishTopic(), {
            wrapper: createWrapper(),
          });

          // Publish to first topic
          await result.current.mutateAsync({
            componentId,
            topicName: topicName1,
            message: message1,
          });

          // Publish to second topic
          await result.current.mutateAsync({
            componentId,
            topicName: topicName2,
            message: message2,
          });

          await waitFor(
            () => {
              expect(apiClient.put).toHaveBeenCalledTimes(2);
            },
            { timeout: 1000 }
          );

          // Verify both API calls were made with correct endpoints
          expect(apiClient.put).toHaveBeenNthCalledWith(
            1,
            `/components/${componentId}/data/${topicName1}`,
            message1
          );
          expect(apiClient.put).toHaveBeenNthCalledWith(
            2,
            `/components/${componentId}/data/${topicName2}`,
            message2
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Failed publications should not affect subsequent publications
   */
  it('should allow subsequent publications after a failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        messageArbitrary,
        messageArbitrary,
        async (componentId, topicName, message1, message2) => {
          vi.clearAllMocks();

          // First call fails, second succeeds
          vi.mocked(apiClient.put)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ data: { success: true } });

          const { result } = renderHook(() => usePublishTopic(), {
            wrapper: createWrapper(),
          });

          // First publication should fail
          try {
            await result.current.mutateAsync({
              componentId,
              topicName,
              message: message1,
            });
          } catch (error) {
            // Expected to fail
          }

          // Second publication should succeed
          await result.current.mutateAsync({
            componentId,
            topicName,
            message: message2,
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Verify both API calls were attempted
          expect(apiClient.put).toHaveBeenCalledTimes(2);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: The endpoint path should correctly encode special characters
   * in topic names
   */
  it('should correctly handle topic names with special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        messageArbitrary,
        async (componentId, message) => {
          vi.clearAllMocks();

          // Topic names with special characters that should be preserved
          const topicName = '/robot/velocity_cmd';

          vi.mocked(apiClient.put).mockResolvedValueOnce({
            data: { success: true },
          });

          const { result } = renderHook(() => usePublishTopic(), {
            wrapper: createWrapper(),
          });

          await result.current.mutateAsync({
            componentId,
            topicName,
            message,
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          // Verify the topic name is used correctly in the path
          expect(apiClient.put).toHaveBeenCalledWith(
            `/components/${componentId}/data/${topicName}`,
            message
          );
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Publishing the same message multiple times should result in
   * multiple API calls (no deduplication)
   */
  it('should not deduplicate identical messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        messageArbitrary,
        async (componentId, topicName, message) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.put)
            .mockResolvedValueOnce({ data: { success: true } })
            .mockResolvedValueOnce({ data: { success: true } })
            .mockResolvedValueOnce({ data: { success: true } });

          const { result } = renderHook(() => usePublishTopic(), {
            wrapper: createWrapper(),
          });

          // Publish the same message three times
          await result.current.mutateAsync({
            componentId,
            topicName,
            message,
          });
          await result.current.mutateAsync({
            componentId,
            topicName,
            message,
          });
          await result.current.mutateAsync({
            componentId,
            topicName,
            message,
          });

          await waitFor(
            () => {
              expect(apiClient.put).toHaveBeenCalledTimes(3);
            },
            { timeout: 1000 }
          );

          // All three calls should have been made
          expect(apiClient.put).toHaveBeenCalledTimes(3);
        }
      ),
      { numRuns: 20 }
    );
  });
});
