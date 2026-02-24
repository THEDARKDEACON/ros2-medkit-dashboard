import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicFilter } from '../../../../components/filters/TopicFilter';
import { useFilterStore } from '../../../../features/stores/filterStore';

describe('TopicFilter', () => {
  const mockMessageTypes = ['std_msgs/String', 'sensor_msgs/Image', 'geometry_msgs/Pose'];

  beforeEach(() => {
    // Reset filter store before each test
    useFilterStore.getState().clearTopicFilters();
  });

  it('renders all filter controls', () => {
    render(<TopicFilter messageTypes={mockMessageTypes} />);

    expect(screen.getByLabelText('Message Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum update frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum update frequency')).toBeInTheDocument();
  });

  it('displays available message types in dropdown', () => {
    render(<TopicFilter messageTypes={mockMessageTypes} />);

    const typeSelect = screen.getByLabelText('Message Type') as HTMLSelectElement;
    expect(typeSelect.options).toHaveLength(4); // "All Types" + 3 types
    expect(typeSelect.options[0].text).toBe('All Types');
    expect(typeSelect.options[1].text).toBe('std_msgs/String');
    expect(typeSelect.options[2].text).toBe('sensor_msgs/Image');
    expect(typeSelect.options[3].text).toBe('geometry_msgs/Pose');
  });

  it('updates message type filter when selection changes', async () => {
    const user = userEvent.setup();
    render(<TopicFilter messageTypes={mockMessageTypes} />);

    const typeSelect = screen.getByLabelText('Message Type');
    await user.selectOptions(typeSelect, 'std_msgs/String');

    const state = useFilterStore.getState();
    expect(state.topicFilters.messageType).toBe('std_msgs/String');
  });

  it('updates min frequency filter when input changes', async () => {
    const user = userEvent.setup();
    render(<TopicFilter messageTypes={mockMessageTypes} />);

    const minInput = screen.getByLabelText('Minimum update frequency');
    await user.type(minInput, '1.5');

    const state = useFilterStore.getState();
    expect(state.topicFilters.minUpdateFrequency).toBe(1.5);
  });

  it('updates max frequency filter when input changes', async () => {
    const user = userEvent.setup();
    render(<TopicFilter messageTypes={mockMessageTypes} />);

    const maxInput = screen.getByLabelText('Maximum update frequency');
    await user.type(maxInput, '10.0');

    const state = useFilterStore.getState();
    expect(state.topicFilters.maxUpdateFrequency).toBe(10.0);
  });

  it('shows clear button when filters are active', () => {
    // Set some filters
    useFilterStore.getState().setTopicMessageTypeFilter('std_msgs/String');

    render(<TopicFilter messageTypes={mockMessageTypes} />);

    expect(screen.getByLabelText('Clear topic filters')).toBeInTheDocument();
  });

  it('hides clear button when no filters are active', () => {
    render(<TopicFilter messageTypes={mockMessageTypes} />);

    expect(screen.queryByLabelText('Clear topic filters')).not.toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();

    // Set some filters
    useFilterStore.getState().setTopicMessageTypeFilter('std_msgs/String');
    useFilterStore.getState().setTopicFrequencyFilter(1.0, 10.0);

    render(<TopicFilter messageTypes={mockMessageTypes} />);

    const clearButton = screen.getByLabelText('Clear topic filters');
    await user.click(clearButton);

    const state = useFilterStore.getState();
    expect(state.topicFilters.messageType).toBeNull();
    expect(state.topicFilters.minUpdateFrequency).toBeNull();
    expect(state.topicFilters.maxUpdateFrequency).toBeNull();
  });

  it('handles clearing frequency inputs', async () => {
    const user = userEvent.setup();

    // Set frequency filters
    useFilterStore.getState().setTopicFrequencyFilter(1.0, 10.0);

    render(<TopicFilter messageTypes={mockMessageTypes} />);

    const minInput = screen.getByLabelText('Minimum update frequency');
    await user.clear(minInput);

    const state = useFilterStore.getState();
    expect(state.topicFilters.minUpdateFrequency).toBeNull();
    expect(state.topicFilters.maxUpdateFrequency).toBe(10.0);
  });

  it('can hide clear button via prop', () => {
    useFilterStore.getState().setTopicMessageTypeFilter('std_msgs/String');

    render(<TopicFilter messageTypes={mockMessageTypes} showClear={false} />);

    expect(screen.queryByLabelText('Clear topic filters')).not.toBeInTheDocument();
  });
});
