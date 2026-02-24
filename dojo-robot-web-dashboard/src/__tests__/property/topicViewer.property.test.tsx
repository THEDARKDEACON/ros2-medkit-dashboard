/**
 * Property-based tests for TopicViewer component
 * **Validates: Requirements 3.7, 3.9**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicViewer } from '@/components/topics/TopicViewer';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', () => ({
  useTopicList: vi.fn(),
  useTopicData: vi.fn(),
}));

// Helper to create a fresh wrapper with QueryClient for each test
const createFreshWrapper = () => {
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

// Helper to click on a topic in the list (handles multiple elements with same text)
const clickTopicInList = async (topicName: string) => {
  const user = userEvent.setup();
  
  // Find all buttons that contain the topic name
  const allButtons = screen.getAllByRole('button');
  const topicButton = allButtons.find(button => button.textContent?.includes(topicName));
  
  if (!topicButton) {
    throw new Error(`Could not find button for topic ${topicName}`);
  }
  
  await user.click(topicButton);
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
  fc.constant('std_msgs/Int32'),
  fc.constant('geometry_msgs/Point')
);

// Generate ISO timestamp strings - use integer timestamps to avoid invalid dates
const timestampArbitrary = fc
  .integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() })
  .map((timestamp) => new Date(timestamp).toISOString());

const topicDataValueArbitrary = fc.oneof(
  fc.record({
    _type: messageTypeArbitrary,
    data: fc.string(),
  }),
  fc.record({
    _type: messageTypeArbitrary,
    linear: fc.record({ 
      x: fc.double({ min: -1000, max: 1000, noNaN: true }), 
      y: fc.double({ min: -1000, max: 1000, noNaN: true }), 
      z: fc.double({ min: -1000, max: 1000, noNaN: true }) 
    }),
    angular: fc.record({ 
      x: fc.double({ min: -10, max: 10, noNaN: true }), 
      y: fc.double({ min: -10, max: 10, noNaN: true }), 
      z: fc.double({ min: -10, max: 10, noNaN: true }) 
    }),
  }),
  fc.record({
    _type: messageTypeArbitrary,
    value: fc.double({ min: -1000000, max: 1000000, noNaN: true }),
  }),
  fc.record({
    _type: messageTypeArbitrary,
    x: fc.double({ min: -1000, max: 1000, noNaN: true }),
    y: fc.double({ min: -1000, max: 1000, noNaN: true }),
    z: fc.double({ min: -1000, max: 1000, noNaN: true }),
  })
);

const topicArbitrary = fc.record({
  name: topicNameArbitrary,
  messageType: messageTypeArbitrary,
  publishRate: fc.integer({ min: 1, max: 100 }),
  lastUpdate: timestampArbitrary,
  data: topicDataValueArbitrary,
});

const topicListArbitrary = fc.array(topicArbitrary, { minLength: 1, maxLength: 10 });

// Error response arbitraries
const errorMessageArbitrary = fc.oneof(
  fc.constant('Network error'),
  fc.constant('Connection timeout'),
  fc.constant('Service unavailable'),
  fc.constant('Internal server error'),
  fc.constant('Topic not found'),
  fc.constant('Failed to fetch data')
);

const httpStatusArbitrary = fc.oneof(
  fc.constant(400), // Bad Request
  fc.constant(404), // Not Found
  fc.constant(500), // Internal Server Error
  fc.constant(502), // Bad Gateway
  fc.constant(503), // Service Unavailable
  fc.constant(504)  // Gateway Timeout
);

describe('Property 10: Topic Timestamp Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: For any topic with data, the TopicViewer displays a timestamp
   * 
   * **Validates: Requirements 3.7**
   */
  it('should display timestamp for any topic with data', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicListArbitrary,
        async (componentId, topics) => {
          vi.clearAllMocks();

          // Mock useTopicList to return topics
          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: topics,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          // Mock useTopicData to return data when topic is selected
          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: topics[0].data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          // Create a fresh wrapper for each test iteration
          const queryClient = new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
              },
            },
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
          );

          render(<TopicViewer componentId={componentId} />, { wrapper });

          // Select the first topic
          const firstTopic = topics[0];
          await clickTopicInList(firstTopic.name);

          // Verify timestamp is displayed
          await waitFor(() => {
            const timestampElement = screen.getByTestId('topic-timestamp');
            expect(timestampElement).toBeInTheDocument();
            expect(timestampElement.textContent).toMatch(/Last update:/);
          }, { timeout: 1000 });

          // Cleanup after each iteration
          cleanup();
        }
      ),
      { numRuns: 5 }
    );
  }, 10000);

  /**
   * Property: Timestamps are formatted correctly as locale strings
   * 
   * **Validates: Requirements 3.7**
   */
  it('should format timestamps as locale strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicArbitrary,
        async (componentId, topic) => {
          vi.clearAllMocks();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [topic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: topic.data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          await waitFor(() => {
            const timestampElement = screen.getByTestId('topic-timestamp');
            expect(timestampElement).toBeInTheDocument();
          }, { timeout: 1000 });

          // Verify the timestamp is formatted as a locale string
          const expectedTimestamp = new Date(topic.lastUpdate).toLocaleString();
          const timestampElement = screen.getByTestId('topic-timestamp');
          expect(timestampElement.textContent).toContain(expectedTimestamp);

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  }, 15000);

  /**
   * Property: Timestamps update when new data arrives
   * 
   * **Validates: Requirements 3.7**
   */
  it('should update timestamp when new data arrives', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicArbitrary,
        timestampArbitrary,
        async (componentId, initialTopic, newTimestamp) => {
          // Ensure timestamps are different
          fc.pre(initialTopic.lastUpdate !== newTimestamp);

          vi.clearAllMocks();

          // Start with initial topic
          const topicListMock = vi.mocked(hooks.useTopicList);
          topicListMock.mockReturnValue({
            data: [initialTopic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: initialTopic.data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(initialTopic.name);

          // Verify initial timestamp
          await waitFor(() => {
            const initialTimestampStr = new Date(initialTopic.lastUpdate).toLocaleString();
            const timestampElement = screen.getByTestId('topic-timestamp');
            expect(timestampElement.textContent).toContain(initialTimestampStr);
          }, { timeout: 1000 });

          // Update the topic list with new timestamp
          const updatedTopic = { ...initialTopic, lastUpdate: newTimestamp };
          topicListMock.mockReturnValue({
            data: [updatedTopic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify timestamp updated
          await waitFor(() => {
            const newTimestampStr = new Date(newTimestamp).toLocaleString();
            const timestampElement = screen.getByTestId('topic-timestamp');
            expect(timestampElement.textContent).toContain(newTimestampStr);
          }, { timeout: 1000 });

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Timestamps are displayed in the correct format
   * 
   * **Validates: Requirements 3.7**
   */
  it('should display timestamps in correct format with "Last update:" label', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicListArbitrary,
        fc.integer({ min: 0, max: 9 }),
        async (componentId, topics, topicIndex) => {
          // Select a valid topic index
          const selectedTopic = topics[topicIndex % topics.length];

          vi.clearAllMocks();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: topics,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: selectedTopic.data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(selectedTopic.name);

          await waitFor(() => {
            // Verify the format includes "Last update:" label
            const timestampElement = screen.getByTestId('topic-timestamp');
            expect(timestampElement).toBeInTheDocument();

            // Verify it contains the formatted timestamp
            const formattedTimestamp = new Date(selectedTopic.lastUpdate).toLocaleString();
            expect(timestampElement.textContent).toContain('Last update:');
            expect(timestampElement.textContent).toContain(formattedTimestamp);
          }, { timeout: 1000 });

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('Property 12: Topic Fetch Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: When topic data fetch fails, an error message is displayed
   * 
   * **Validates: Requirements 3.9**
   */
  it('should display error message when topic data fetch fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicArbitrary,
        errorMessageArbitrary,
        async (componentId, topic, errorMessage) => {
          vi.clearAllMocks();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [topic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error(errorMessage),
            refetch: vi.fn(),
          } as any);

          render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Verify error message is displayed
          await waitFor(() => {
            const errorTitle = screen.getByText('Failed to load topic data');
            expect(errorTitle).toBeInTheDocument();
            const errorDescription = screen.getByText(/Unable to fetch data for this topic/);
            expect(errorDescription).toBeInTheDocument();
          }, { timeout: 1000 });

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: A retry button is available when errors occur
   * 
   * **Validates: Requirements 3.9**
   */
  it('should display retry button when topic data fetch fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicArbitrary,
        errorMessageArbitrary,
        async (componentId, topic, errorMessage) => {
          vi.clearAllMocks();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [topic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error(errorMessage),
            refetch: vi.fn(),
          } as any);

          render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Verify retry button is available
          await waitFor(() => {
            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
          }, { timeout: 1000 });

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Clicking retry triggers a new fetch attempt
   * 
   * **Validates: Requirements 3.9**
   */
  it('should trigger new fetch when retry button is clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicArbitrary,
        errorMessageArbitrary,
        async (componentId, topic, errorMessage) => {
          vi.clearAllMocks();

          const mockRefetch = vi.fn();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [topic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error(errorMessage),
            refetch: mockRefetch,
          } as any);

          render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Click retry button
          await waitFor(() => {
            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
          }, { timeout: 1000 });

          const retryButton = screen.getByRole('button', { name: /retry/i });
          const user = userEvent.setup();
          await user.click(retryButton);

          // Verify refetch was called
          expect(mockRefetch).toHaveBeenCalled();

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Error messages are user-friendly and descriptive
   * 
   * **Validates: Requirements 3.9**
   */
  it('should display user-friendly error messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicArbitrary,
        async (componentId, topic) => {
          vi.clearAllMocks();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [topic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network error'),
            refetch: vi.fn(),
          } as any);

          render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Verify user-friendly error message
          await waitFor(() => {
            // Should have a clear title
            const errorTitle = screen.getByText('Failed to load topic data');
            expect(errorTitle).toBeInTheDocument();

            // Should have a descriptive message
            const errorDescription = screen.getByText(
              /Unable to fetch data for this topic/
            );
            expect(errorDescription).toBeInTheDocument();

            // Message should mention possible causes
            expect(errorDescription.textContent).toMatch(
              /unavailable|connection issue/i
            );
          }, { timeout: 1000 });

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Component handles network errors gracefully
   * 
   * **Validates: Requirements 3.9**
   */
  it('should handle network errors gracefully without crashing', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicListArbitrary,
        fc.integer({ min: 0, max: 9 }),
        async (componentId, topics, topicIndex) => {
          const selectedTopic = topics[topicIndex % topics.length];

          vi.clearAllMocks();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: topics,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network request failed'),
            refetch: vi.fn(),
          } as any);

          render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(selectedTopic.name);

          // Component should still render without crashing
          await waitFor(() => {
            const errorTitle = screen.getByText('Failed to load topic data');
            expect(errorTitle).toBeInTheDocument();
            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
          }, { timeout: 2000 });

          // Topic list should still be visible (check that at least one element with the name exists)
          const topicElements = screen.getAllByText(selectedTopic.name);
          expect(topicElements.length).toBeGreaterThan(0);

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  }, 10000);

  /**
   * Property: Component handles API errors (4xx, 5xx) appropriately
   * 
   * **Validates: Requirements 3.9**
   */
  it('should handle API errors with appropriate error messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicArbitrary,
        httpStatusArbitrary,
        async (componentId, topic, statusCode) => {
          vi.clearAllMocks();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [topic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          // Simulate API error with status code
          const apiError = new Error(`HTTP ${statusCode} error`);
          (apiError as any).response = { status: statusCode };

          vi.mocked(hooks.useTopicData).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: apiError,
            refetch: vi.fn(),
          } as any);

          render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Verify error is handled appropriately
          await waitFor(() => {
            const errorTitle = screen.getByText('Failed to load topic data');
            expect(errorTitle).toBeInTheDocument();
            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
          }, { timeout: 1000 });

          // Component should remain functional
          const topicElements = screen.getAllByText(topic.name);
          expect(topicElements.length).toBeGreaterThan(0);

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Error state can recover when data becomes available
   * 
   * **Validates: Requirements 3.9**
   */
  it('should recover from error state when data becomes available', async () => {
    await fc.assert(
      fc.asyncProperty(
        componentIdArbitrary,
        topicArbitrary,
        async (componentId, topic) => {
          vi.clearAllMocks();

          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [topic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const topicDataMock = vi.mocked(hooks.useTopicData);
          
          // First show error
          topicDataMock.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network error'),
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createFreshWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          await waitFor(() => {
            const errorTitle = screen.getByText('Failed to load topic data');
            expect(errorTitle).toBeInTheDocument();
          }, { timeout: 1000 });

          // Then recover with data
          topicDataMock.mockReturnValue({
            data: topic.data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify error is gone and data is displayed
          await waitFor(() => {
            expect(screen.queryByText('Failed to load topic data')).not.toBeInTheDocument();
            // JsonInspector controls should be visible
            expect(screen.getByText('Expand All')).toBeInTheDocument();
          }, { timeout: 1000 });

          cleanup();
        }
      ),
      { numRuns: 10 }
    );
  });
});
