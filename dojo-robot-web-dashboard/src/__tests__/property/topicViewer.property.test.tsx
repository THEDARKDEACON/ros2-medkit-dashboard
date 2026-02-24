/**
 * Property-based tests for TopicViewer component
 * **Validates: Requirements 3.7, 3.9**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicViewer } from '@/components/topics/TopicViewer';
import * as hooks from '@/features/api/hooks';
import type { Topic } from '@/types/api';

// Mock the API hooks
vi.mock('@/features/api/hooks', () => ({
  useTopicList: vi.fn(),
  useTopicData: vi.fn(),
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

// Helper to click on a topic in the list (handles multiple elements with same text)
const clickTopicInList = async (topicName: string) => {
  const user = userEvent.setup();
  // Wait for the topic to appear in the list
  await waitFor(() => {
    const elements = screen.queryAllByText(topicName);
    expect(elements.length).toBeGreaterThan(0);
  });
  
  const topicButtons = screen.getAllByText(topicName);
  const button = topicButtons[0].closest('button');
  if (!button) throw new Error(`Could not find button for topic ${topicName}`);
  await user.click(button);
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

// Generate ISO timestamp strings
const timestampArbitrary = fc
  .date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
  .map((date) => date.toISOString());

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
  }),
  fc.record({
    _type: messageTypeArbitrary,
    x: fc.double(),
    y: fc.double(),
    z: fc.double(),
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: topics,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          // Initially no topic selected
          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the first topic
          const firstTopic = topics[0];
          await clickTopicInList(firstTopic.name);

          // Update mock to return data for selected topic
          mockUseTopicData.mockReturnValue({
            data: firstTopic.data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify timestamp is displayed
          await waitFor(() => {
            const timestampElements = screen.queryAllByText(/Last update:/);
            expect(timestampElements.length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          // Verify the timestamp text contains a formatted date
          const timestampElements = screen.getAllByText(/Last update:/);
          expect(timestampElements[0].textContent).toMatch(/Last update:/);
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          mockUseTopicData.mockReturnValue({
            data: topic.data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          await waitFor(() => {
            expect(screen.getByText(/Last update:/)).toBeInTheDocument();
          });

          // Verify the timestamp is formatted as a locale string
          const expectedTimestamp = new Date(topic.lastUpdate).toLocaleString();
          const timestampElement = screen.getByText(/Last update:/);
          expect(timestampElement.textContent).toContain(expectedTimestamp);
        }
      ),
      { numRuns: 10 }
    );
  });

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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [initialTopic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(initialTopic.name);

          mockUseTopicData.mockReturnValue({
            data: initialTopic.data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify initial timestamp
          await waitFor(() => {
            const initialTimestampStr = new Date(initialTopic.lastUpdate).toLocaleString();
            expect(screen.getByText(new RegExp(initialTimestampStr))).toBeInTheDocument();
          });

          // Update the topic list with new timestamp
          const updatedTopic = { ...initialTopic, lastUpdate: newTimestamp };
          vi.mocked(hooks.useTopicList).mockReturnValue({
            data: [updatedTopic],
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify timestamp updated
          await waitFor(() => {
            const newTimestampStr = new Date(newTimestamp).toLocaleString();
            expect(screen.getByText(new RegExp(newTimestampStr))).toBeInTheDocument();
          });
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(selectedTopic.name);

          mockUseTopicData.mockReturnValue({
            data: selectedTopic.data,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          await waitFor(() => {
            // Verify the format includes "Last update:" label
            const timestampElement = screen.getByText(/Last update:/);
            expect(timestampElement).toBeInTheDocument();

            // Verify it contains the formatted timestamp
            const formattedTimestamp = new Date(selectedTopic.lastUpdate).toLocaleString();
            expect(timestampElement.textContent).toContain('Last update:');
            expect(timestampElement.textContent).toContain(formattedTimestamp);
          });
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          // Initially no error
          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Update to error state
          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error(errorMessage),
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify error message is displayed
          await waitFor(() => {
            expect(screen.getByText('Failed to load topic data')).toBeInTheDocument();
            expect(
              screen.getByText(/Unable to fetch data for this topic/)
            ).toBeInTheDocument();
          });
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Update to error state
          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error(errorMessage),
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify retry button is available
          await waitFor(() => {
            expect(screen.getByText('Retry')).toBeInTheDocument();
          });
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Update to error state with refetch function
          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error(errorMessage),
            refetch: mockRefetch,
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Click retry button
          await waitFor(() => {
            expect(screen.getByText('Retry')).toBeInTheDocument();
          });

          const retryButton = screen.getByText('Retry');
          const user = userEvent.setup();
          await user.click(retryButton);

          // Verify refetch was called
          expect(mockRefetch).toHaveBeenCalled();
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Update to error state
          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network error'),
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify user-friendly error message
          await waitFor(() => {
            // Should have a clear title
            expect(screen.getByText('Failed to load topic data')).toBeInTheDocument();

            // Should have a descriptive message
            const errorDescription = screen.getByText(
              /Unable to fetch data for this topic/
            );
            expect(errorDescription).toBeInTheDocument();

            // Message should mention possible causes
            expect(errorDescription.textContent).toMatch(
              /unavailable|connection issue/i
            );
          });
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(selectedTopic.name);

          // Simulate network error
          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network request failed'),
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Component should still render without crashing
          await waitFor(() => {
            expect(screen.getByText('Failed to load topic data')).toBeInTheDocument();
            expect(screen.getByText('Retry')).toBeInTheDocument();
          });

          // Topic list should still be visible
          expect(screen.getByText(selectedTopic.name)).toBeInTheDocument();
        }
      ),
      { numRuns: 10 }
    );
  });

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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // Simulate API error with status code
          const apiError = new Error(`HTTP ${statusCode} error`);
          (apiError as any).response = { status: statusCode };

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: apiError,
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          // Verify error is handled appropriately
          await waitFor(() => {
            expect(screen.getByText('Failed to load topic data')).toBeInTheDocument();
            expect(screen.getByText('Retry')).toBeInTheDocument();
          });

          // Component should remain functional
          const topicElements = screen.getAllByText(topic.name);
          expect(topicElements.length).toBeGreaterThan(0);
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

          const mockUseTopicData = vi.fn();
          vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
          } as any);

          const { rerender } = render(<TopicViewer componentId={componentId} />, {
            wrapper: createWrapper(),
          });

          // Select the topic
          await clickTopicInList(topic.name);

          // First show error
          mockUseTopicData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network error'),
            refetch: vi.fn(),
          } as any);

          rerender(<TopicViewer componentId={componentId} />);

          await waitFor(() => {
            expect(screen.getByText('Failed to load topic data')).toBeInTheDocument();
          });

          // Then recover with data
          mockUseTopicData.mockReturnValue({
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
          });
        }
      ),
      { numRuns: 10 }
    );
  });
});
