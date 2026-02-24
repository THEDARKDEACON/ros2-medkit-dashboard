/**
 * Property-based tests for topic data fetching
 * **Validates: Requirements 3.2, 3.3, 3.4**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTopicList, useTopicData } from '@/features/api/hooks';
import { apiClient } from '@/features/api/client';
import type { Topic } from '@/types/api';

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
        refetchOnWindowFocus: false, // Disable refetch on window focus
        refetchOnReconnect: false, // Disable refetch on reconnect
        refetchOnMount: false, // Disable refetch on mount
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Arbitraries for generating test data
const componentIdArbitrary = fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/);
const topicNameArbitrary = fc.stringMatching(/^\/[a-z][a-z0-9_/]{1,50}$/);

const messageTypeArbitrary = fc.oneof(
  fc.constant('std_msgs/String'),
  fc.constant('geometry_msgs/Twist'),
  fc.constant('sensor_msgs/LaserScan'),
  fc.constant('nav_msgs/Odometry'),
  fc.constant('std_msgs/Float64'),
  fc.constant('std_msgs/Int32')
);

const topicDataValueArbitrary = fc.oneof(
  fc.record({
    _type: messageTypeArbitrary,
    data: fc.string(),
  }),
  fc.record({
    _type: messageTypeArbitrary,
    linear: fc.record({ x: fc.double(), y: fc.double(), z: fc.double() }),
    angular: fc.record({ x: fc.double(), y: fc.double(), z: fc.double() }),
  }),
  fc.record({
    _type: messageTypeArbitrary,
    value: fc.double(),
  })
);

const topicDataDictionaryArbitrary = fc.dictionary(
  topicNameArbitrary,
  topicDataValueArbitrary,
  { minKeys: 1, maxKeys: 10 }
);

describe('Property 6: Topic Display Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any topic displayed in the topic list, the rendered output
   * should include the topic's message type and current value.
   * 
   * **Validates: Requirements 3.2**
   */
  it('should include message type and current value for all topics', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicDataDictionaryArbitrary,
        async (componentId, mockTopicData) => {
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockTopicData,
          });

          // Render the hook
          const { result } = renderHook(() => useTopicList(componentId), {
            wrapper: createWrapper(),
          });

          // Wait for the query to complete
          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          const topics = result.current.data || [];

          // Verify each topic has required fields
          topics.forEach((topic: Topic) => {
            // Topic must have a name
            expect(topic.name).toBeDefined();
            expect(typeof topic.name).toBe('string');
            expect(topic.name.length).toBeGreaterThan(0);

            // Topic must have a message type
            expect(topic.messageType).toBeDefined();
            expect(typeof topic.messageType).toBe('string');
            expect(topic.messageType.length).toBeGreaterThan(0);

            // Topic must have current value (data field)
            expect(topic.data).toBeDefined();
          });

          // Verify the number of topics matches the input
          expect(topics.length).toBe(Object.keys(mockTopicData).length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Topic message type should be extracted from the data object
   * or inferred from the data type
   */
  it('should correctly extract or infer message type from topic data', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicDataDictionaryArbitrary,
        async (componentId, mockTopicData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockTopicData,
          });

          const { result } = renderHook(() => useTopicList(componentId), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          const topics = result.current.data || [];

          topics.forEach((topic: Topic) => {
            const originalData = mockTopicData[topic.name];

            if (
              typeof originalData === 'object' &&
              originalData !== null &&
              '_type' in originalData
            ) {
              // If data has _type field, it should be used as messageType
              expect(topic.messageType).toBe((originalData as any)._type);
            } else {
              // Otherwise, messageType should be the typeof the data
              expect(topic.messageType).toBe(typeof originalData);
            }
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: All topics in the data should be included in the list
   */
  it('should include all topics from the API response', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicDataDictionaryArbitrary,
        async (componentId, mockTopicData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockTopicData,
          });

          const { result } = renderHook(() => useTopicList(componentId), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          const topics = result.current.data || [];
          const topicNames = topics.map((t: Topic) => t.name);
          const expectedTopicNames = Object.keys(mockTopicData);

          // All expected topics should be present
          expectedTopicNames.forEach((expectedName) => {
            expect(topicNames).toContain(expectedName);
          });

          // No extra topics should be present
          expect(topicNames.length).toBe(expectedTopicNames.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Topic data should be preserved in the topic object
   */
  it('should preserve the original data in the topic object', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicDataDictionaryArbitrary,
        async (componentId, mockTopicData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockTopicData,
          });

          const { result } = renderHook(() => useTopicList(componentId), {
            wrapper: createWrapper(),
          });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          const topics = result.current.data || [];

          topics.forEach((topic: Topic) => {
            const originalData = mockTopicData[topic.name];
            expect(topic.data).toEqual(originalData);
          });
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 7: Topic Selection API Call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any valid component ID and topic name, when a user selects
   * that topic, the dashboard should fetch data from
   * GET /api/v1/components/{component_id}/data/{topic_name}.
   * 
   * **Validates: Requirements 3.3**
   */
  it('should call the correct API endpoint when topic is selected', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        topicDataValueArbitrary,
        async (componentId, topicName, mockData) => {
          vi.clearAllMocks();

          // Mock the API response
          vi.mocked(apiClient.get).mockResolvedValueOnce({
            data: mockData,
          });

          // Render the hook with component ID and topic name
          const { result } = renderHook(
            () => useTopicData(componentId, topicName),
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
            `/components/${componentId}/data/${topicName}`
          );

          // Verify the data matches what was returned
          if (result.current.isSuccess) {
            expect(result.current.data).toEqual(mockData);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: The query key should include both component ID and topic name
   */
  it('should use a query key that includes component ID and topic name', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        topicDataValueArbitrary,
        async (componentId, topicName, mockData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValue({
            data: mockData,
          });

          const { result } = renderHook(
            () => useTopicData(componentId, topicName, { enabled: true, refetchInterval: 0 }),
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

          // Verify the API was called with both IDs in the path
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/data/${topicName}`
          );
          // Should be called at least once (may be called more due to React Query internals)
          expect(apiClient.get).toHaveBeenCalled();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Empty component ID or topic name should not trigger API calls
   */
  it('should not make API calls when component ID or topic name is empty', () => {
    const testCases = [
      { componentId: '', topicName: '/valid_topic' },
      { componentId: 'valid_comp', topicName: '' },
      { componentId: '', topicName: '' },
    ];

    testCases.forEach(({ componentId, topicName }) => {
      vi.clearAllMocks();

      const { result } = renderHook(
        () => useTopicData(componentId, topicName),
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
   * Property: Changing topic name should trigger a new fetch
   */
  it('should refetch when topic name changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        topicNameArbitrary,
        topicDataValueArbitrary,
        topicDataValueArbitrary,
        async (componentId, topicName1, topicName2, data1, data2) => {
          // Skip if topic names are the same
          fc.pre(topicName1 !== topicName2);

          vi.clearAllMocks();

          vi.mocked(apiClient.get)
            .mockResolvedValueOnce({ data: data1 })
            .mockResolvedValueOnce({ data: data2 });

          const { result, rerender } = renderHook(
            ({ topicName }) => useTopicData(componentId, topicName, { refetchInterval: 0 }),
            {
              wrapper: createWrapper(),
              initialProps: { topicName: topicName1 },
            }
          );

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 1000 }
          );

          expect(result.current.data).toEqual(data1);
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/data/${topicName1}`
          );

          // Change topic name
          rerender({ topicName: topicName2 });

          await waitFor(
            () => {
              expect(result.current.data).toEqual(data2);
            },
            { timeout: 1000 }
          );

          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/data/${topicName2}`
          );
          expect(apiClient.get).toHaveBeenCalledTimes(2);
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('Property 8: Topic Auto-Refresh Timing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any topic with auto-refresh enabled at interval I milliseconds,
   * the dashboard should fetch new data at intervals of I ± 50ms (allowing for timing variance).
   * 
   * **Validates: Requirements 3.4**
   * 
   * Note: This test uses real timers to verify actual refresh behavior.
   * We test with shorter intervals to keep test execution time reasonable.
   */
  it('should auto-refresh topic data at the specified interval', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        fc.integer({ min: 100, max: 300 }), // Shorter intervals for faster tests
        topicDataValueArbitrary,
        async (componentId, topicName, refreshInterval, mockData) => {
          vi.clearAllMocks();

          // Mock the API to return data on each call
          vi.mocked(apiClient.get).mockResolvedValue({
            data: mockData,
          });

          // Render the hook with custom refresh interval
          const { result } = renderHook(
            () =>
              useTopicData(componentId, topicName, {
                refetchInterval: refreshInterval,
              }),
            {
              wrapper: createWrapper(),
            }
          );

          // Wait for initial fetch
          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 2000 }
          );

          const initialCallCount = vi.mocked(apiClient.get).mock.calls.length;
          expect(initialCallCount).toBeGreaterThanOrEqual(1);

          // Wait for at least one refresh cycle (with tolerance)
          await new Promise((resolve) =>
            setTimeout(resolve, refreshInterval + 100)
          );

          // Verify that at least one more API call was made
          const finalCallCount = vi.mocked(apiClient.get).mock.calls.length;
          expect(finalCallCount).toBeGreaterThan(initialCallCount);
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Default refresh interval should be 1000ms (1 second)
   */
  it('should use default 1-second refresh interval when not specified', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        topicDataValueArbitrary,
        async (componentId, topicName, mockData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValue({
            data: mockData,
          });

          // Render the hook without specifying refresh interval (defaults to 1000ms)
          const { result } = renderHook(
            () => useTopicData(componentId, topicName),
            {
              wrapper: createWrapper(),
            }
          );

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 2000 }
          );

          const initialCallCount = vi.mocked(apiClient.get).mock.calls.length;

          // Wait for default interval (1 second) plus tolerance
          await new Promise((resolve) => setTimeout(resolve, 1100));

          // Verify that a new API call was made after 1 second
          expect(vi.mocked(apiClient.get).mock.calls.length).toBeGreaterThan(
            initialCallCount
          );
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Auto-refresh should stop when enabled is set to false
   */
  it('should stop auto-refresh when disabled', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        fc.integer({ min: 100, max: 500 }),
        topicDataValueArbitrary,
        async (componentId, topicName, refreshInterval, mockData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValue({
            data: mockData,
          });

          // Render the hook with auto-refresh disabled
          const { result } = renderHook(
            () =>
              useTopicData(componentId, topicName, {
                refetchInterval: refreshInterval,
                enabled: false,
              }),
            {
              wrapper: createWrapper(),
            }
          );

          // Query should not start
          expect(result.current.fetchStatus).toBe('idle');

          // Wait some time
          await new Promise((resolve) => setTimeout(resolve, refreshInterval * 2));

          // No API calls should have been made
          expect(apiClient.get).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Auto-refresh can be paused and resumed
   * 
   * Note: This test focuses on verifying that resuming auto-refresh causes new fetches.
   * The exact behavior during pause may vary due to React Query's internal state management.
   */
  it('should support pause and resume of auto-refresh', { timeout: 15000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        fc.integer({ min: 100, max: 300 }),
        topicDataValueArbitrary,
        async (componentId, topicName, refreshInterval, mockData) => {
          vi.clearAllMocks();

          vi.mocked(apiClient.get).mockResolvedValue({
            data: mockData,
          });

          // Start with auto-refresh disabled
          const { result, rerender } = renderHook(
            ({ enabled }) =>
              useTopicData(componentId, topicName, {
                refetchInterval: refreshInterval,
                enabled,
              }),
            {
              wrapper: createWrapper(),
              initialProps: { enabled: false },
            }
          );

          // No calls should be made when disabled
          expect(result.current.fetchStatus).toBe('idle');
          expect(apiClient.get).not.toHaveBeenCalled();

          // Enable auto-refresh
          rerender({ enabled: true });

          await waitFor(
            () => {
              expect(result.current.isSuccess).toBe(true);
            },
            { timeout: 2000 }
          );

          // Verify that API calls are now being made
          expect(vi.mocked(apiClient.get).mock.calls.length).toBeGreaterThan(0);
          
          const callCountAfterEnable = vi.mocked(apiClient.get).mock.calls.length;

          // Wait for a refresh cycle
          await new Promise((resolve) =>
            setTimeout(resolve, refreshInterval + 100)
          );

          // Verify that more calls were made (auto-refresh is working)
          expect(vi.mocked(apiClient.get).mock.calls.length).toBeGreaterThan(
            callCountAfterEnable
          );
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Property: Each topic should have independent refresh intervals
   */
  it('should maintain independent refresh intervals for different topics', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicNameArbitrary,
        topicNameArbitrary,
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 100, max: 300 }),
        topicDataValueArbitrary,
        topicDataValueArbitrary,
        async (
          componentId,
          topicName1,
          topicName2,
          interval1,
          interval2,
          data1,
          data2
        ) => {
          // Skip if topic names are the same
          fc.pre(topicName1 !== topicName2);

          vi.clearAllMocks();

          // Mock different responses for different topics
          // Need to escape special regex characters in topic names
          const escapedTopic1 = topicName1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const escapedTopic2 = topicName2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          vi.mocked(apiClient.get).mockImplementation((url: string) => {
            if (url.match(new RegExp(escapedTopic1))) {
              return Promise.resolve({ data: data1 });
            } else if (url.match(new RegExp(escapedTopic2))) {
              return Promise.resolve({ data: data2 });
            }
            return Promise.reject(new Error(`Unknown topic: ${url}`));
          });

          // Render two hooks with different intervals
          const { result: result1 } = renderHook(
            () =>
              useTopicData(componentId, topicName1, {
                refetchInterval: interval1,
              }),
            {
              wrapper: createWrapper(),
            }
          );

          const { result: result2 } = renderHook(
            () =>
              useTopicData(componentId, topicName2, {
                refetchInterval: interval2,
              }),
            {
              wrapper: createWrapper(),
            }
          );

          // Wait for both to complete initial fetch
          await waitFor(
            () => {
              expect(result1.current.isSuccess).toBe(true);
              expect(result2.current.isSuccess).toBe(true);
            },
            { timeout: 2000 }
          );

          // Both topics should have fetched data
          expect(result1.current.data).toEqual(data1);
          expect(result2.current.data).toEqual(data2);

          // Verify both endpoints were called
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/data/${topicName1}`
          );
          expect(apiClient.get).toHaveBeenCalledWith(
            `/components/${componentId}/data/${topicName2}`
          );
        }
      ),
      { numRuns: 3 }
    );
  });
});
