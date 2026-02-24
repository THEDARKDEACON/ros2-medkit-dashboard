import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopicViewer } from '@/components/topics/TopicViewer';
import * as hooks from '@/features/api/hooks';

// Mock the API hooks
vi.mock('@/features/api/hooks', () => ({
  useTopicList: vi.fn(),
  useTopicData: vi.fn(),
}));

describe('TopicViewer', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockTopics = [
    {
      name: '/velocity',
      messageType: 'geometry_msgs/Twist',
      publishRate: 10,
      lastUpdate: '2024-01-15T10:30:00Z',
      data: { linear: { x: 1.0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0.5 } },
    },
    {
      name: '/position',
      messageType: 'geometry_msgs/Point',
      publishRate: 5,
      lastUpdate: '2024-01-15T10:30:05Z',
      data: { x: 10.5, y: 20.3, z: 0 },
    },
    {
      name: '/status',
      messageType: 'std_msgs/String',
      publishRate: 1,
      lastUpdate: '2024-01-15T10:30:10Z',
      data: { data: 'active' },
    },
  ];

  it('should display loading state while fetching topics', () => {
    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useTopicData).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TopicViewer componentId="comp-1" />, { wrapper });

    expect(screen.getByText('Loading topics...')).toBeInTheDocument();
  });

  it('should display error state when topic list fails to load', () => {
    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useTopicData).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TopicViewer componentId="comp-1" />, { wrapper });

    expect(screen.getByText('Failed to load topics')).toBeInTheDocument();
    expect(
      screen.getByText('Unable to fetch the topic list. Please try again.')
    ).toBeInTheDocument();
  });

  it('should display empty state when no topics are available', () => {
    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useTopicData).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TopicViewer componentId="comp-1" />, { wrapper });

    expect(screen.getByText('No topics available')).toBeInTheDocument();
    expect(
      screen.getByText('This component has no topics to display.')
    ).toBeInTheDocument();
  });

  it('should display topic list with message types', () => {
    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useTopicData).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TopicViewer componentId="comp-1" />, { wrapper });

    // Check topic count
    expect(screen.getByText('3 topics available')).toBeInTheDocument();

    // Check each topic is displayed with its message type
    expect(screen.getByText('/velocity')).toBeInTheDocument();
    expect(screen.getByText('geometry_msgs/Twist')).toBeInTheDocument();

    expect(screen.getByText('/position')).toBeInTheDocument();
    expect(screen.getByText('geometry_msgs/Point')).toBeInTheDocument();

    expect(screen.getByText('/status')).toBeInTheDocument();
    expect(screen.getByText('std_msgs/String')).toBeInTheDocument();
  });

  it('should display "Select a topic" message when no topic is selected', () => {
    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useTopicData).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TopicViewer componentId="comp-1" />, { wrapper });

    expect(screen.getByText('Select a topic')).toBeInTheDocument();
    expect(
      screen.getByText('Choose a topic from the list to view its real-time data.')
    ).toBeInTheDocument();
  });

  it('should display topic data when a topic is selected', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const mockUseTopicData = vi.fn();
    vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

    // Initial state - no topic selected
    mockUseTopicData.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { rerender } = render(<TopicViewer componentId="comp-1" />, {
      wrapper,
    });

    // Click on a topic
    const topicButton = screen.getByText('/velocity');
    await user.click(topicButton);

    // Update mock to return data for selected topic
    mockUseTopicData.mockReturnValue({
      data: mockTopics[0].data,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    rerender(<TopicViewer componentId="comp-1" />);

    await waitFor(() => {
      // Check that topic name is displayed in header
      const headers = screen.getAllByText('/velocity');
      expect(headers.length).toBeGreaterThan(1); // One in list, one in header
    });

    // Check that message type is displayed
    expect(screen.getByText(/Type: geometry_msgs\/Twist/)).toBeInTheDocument();
  });

  it('should display timestamp for selected topic', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
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

    const { rerender } = render(<TopicViewer componentId="comp-1" />, {
      wrapper,
    });

    // Select a topic
    await user.click(screen.getByText('/velocity'));

    mockUseTopicData.mockReturnValue({
      data: mockTopics[0].data,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    rerender(<TopicViewer componentId="comp-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Last update:/)).toBeInTheDocument();
    });
  });

  it('should display refresh rate controls', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useTopicData).mockReturnValue({
      data: mockTopics[0].data,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TopicViewer componentId="comp-1" />, { wrapper });

    // Select a topic
    await user.click(screen.getByText('/velocity'));

    await waitFor(() => {
      // Check for refresh rate selector
      const select = screen.getByLabelText('Refresh rate');
      expect(select).toBeInTheDocument();
    });
  });

  it('should allow changing refresh rate', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const mockUseTopicData = vi.fn();
    vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

    mockUseTopicData.mockReturnValue({
      data: mockTopics[0].data,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { rerender } = render(<TopicViewer componentId="comp-1" />, {
      wrapper,
    });

    // Select a topic
    await user.click(screen.getByText('/velocity'));

    await waitFor(() => {
      expect(screen.getByLabelText('Refresh rate')).toBeInTheDocument();
    });

    // Change refresh rate
    const select = screen.getByLabelText('Refresh rate');
    await user.selectOptions(select, '2000');

    rerender(<TopicViewer componentId="comp-1" />);

    // Verify the hook was called with new interval
    await waitFor(() => {
      const lastCall = mockUseTopicData.mock.calls[mockUseTopicData.mock.calls.length - 1];
      expect(lastCall[2]?.refetchInterval).toBe(2000);
    });
  });

  it('should display pause/resume button', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useTopicData).mockReturnValue({
      data: mockTopics[0].data,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TopicViewer componentId="comp-1" />, { wrapper });

    // Select a topic
    await user.click(screen.getByText('/velocity'));

    await waitFor(() => {
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });
  });

  it('should toggle between pause and resume', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const mockUseTopicData = vi.fn();
    vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

    mockUseTopicData.mockReturnValue({
      data: mockTopics[0].data,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { rerender } = render(<TopicViewer componentId="comp-1" />, {
      wrapper,
    });

    // Select a topic
    await user.click(screen.getByText('/velocity'));

    await waitFor(() => {
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });

    // Click pause
    const pauseButton = screen.getByText('Pause');
    await user.click(pauseButton);

    rerender(<TopicViewer componentId="comp-1" />);

    await waitFor(() => {
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    // Verify the hook was called with enabled: false
    const lastCall = mockUseTopicData.mock.calls[mockUseTopicData.mock.calls.length - 1];
    expect(lastCall[2]?.enabled).toBe(false);
  });

  it('should display error state when topic data fails to load', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const mockUseTopicData = vi.fn();
    vi.mocked(hooks.useTopicData).mockImplementation(mockUseTopicData);

    // Initial state
    mockUseTopicData.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    const { rerender } = render(<TopicViewer componentId="comp-1" />, {
      wrapper,
    });

    // Select a topic
    await user.click(screen.getByText('/velocity'));

    // Update to error state
    mockUseTopicData.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    } as any);

    rerender(<TopicViewer componentId="comp-1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load topic data')).toBeInTheDocument();
    });
  });

  it('should allow retrying when topic data fails to load', async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
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

    const { rerender } = render(<TopicViewer componentId="comp-1" />, {
      wrapper,
    });

    // Select a topic
    await user.click(screen.getByText('/velocity'));

    // Update to error state with refetch function
    mockUseTopicData.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    } as any);

    rerender(<TopicViewer componentId="comp-1" />);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should highlight selected topic in the list', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(hooks.useTopicData).mockReturnValue({
      data: mockTopics[0].data,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    render(<TopicViewer componentId="comp-1" />, { wrapper });

    // Select a topic
    const topicButton = screen.getByText('/velocity').closest('button');
    await user.click(topicButton!);

    await waitFor(() => {
      expect(topicButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('should integrate with JsonInspector for data display', async () => {
    const user = userEvent.setup();

    vi.mocked(hooks.useTopicList).mockReturnValue({
      data: mockTopics,
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

    const { rerender } = render(<TopicViewer componentId="comp-1" />, {
      wrapper,
    });

    // Select a topic
    await user.click(screen.getByText('/velocity'));

    // Update with data
    mockUseTopicData.mockReturnValue({
      data: mockTopics[0].data,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    rerender(<TopicViewer componentId="comp-1" />);

    await waitFor(() => {
      // JsonInspector should be rendered (check for its controls)
      expect(screen.getByText('Expand All')).toBeInTheDocument();
      expect(screen.getByText('Collapse All')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });
  });
});
