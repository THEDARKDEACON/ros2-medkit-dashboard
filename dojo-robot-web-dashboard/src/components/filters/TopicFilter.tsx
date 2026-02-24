import { X } from 'lucide-react';
import { useFilterStore } from '../../features/stores/filterStore';

interface TopicFilterProps {
  /**
   * Available message types for filtering
   */
  messageTypes?: string[];
  /**
   * Show clear button
   * @default true
   */
  showClear?: boolean;
}

/**
 * TopicFilter provides filtering controls for topics
 * Implements filtering by message type and update frequency
 * Validates: Requirements 15.4, 15.8
 */
export function TopicFilter({ messageTypes = [], showClear = true }: TopicFilterProps) {
  const {
    topicFilters,
    setTopicMessageTypeFilter,
    setTopicFrequencyFilter,
    clearTopicFilters,
  } = useFilterStore();

  const hasActiveFilters =
    topicFilters.messageType !== null ||
    topicFilters.minUpdateFrequency !== null ||
    topicFilters.maxUpdateFrequency !== null;

  const handleClear = () => {
    clearTopicFilters();
  };

  const handleMinFrequencyChange = (value: string) => {
    const min = value === '' ? null : parseFloat(value);
    setTopicFrequencyFilter(min, topicFilters.maxUpdateFrequency);
  };

  const handleMaxFrequencyChange = (value: string) => {
    const max = value === '' ? null : parseFloat(value);
    setTopicFrequencyFilter(topicFilters.minUpdateFrequency, max);
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Topic Filters</h3>
        {showClear && hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            aria-label="Clear topic filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Message type filter */}
        <div>
          <label htmlFor="topic-message-type-filter" className="block text-xs font-medium mb-1">
            Message Type
          </label>
          <select
            id="topic-message-type-filter"
            value={topicFilters.messageType || ''}
            onChange={(e) => setTopicMessageTypeFilter(e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Types</option>
            {messageTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Update frequency filter */}
        <div>
          <label className="block text-xs font-medium mb-1">Update Frequency (Hz)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                id="topic-min-frequency-filter"
                type="number"
                value={topicFilters.minUpdateFrequency ?? ''}
                onChange={(e) => handleMinFrequencyChange(e.target.value)}
                placeholder="Min"
                min="0"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Minimum update frequency"
              />
            </div>
            <div>
              <input
                id="topic-max-frequency-filter"
                type="number"
                value={topicFilters.maxUpdateFrequency ?? ''}
                onChange={(e) => handleMaxFrequencyChange(e.target.value)}
                placeholder="Max"
                min="0"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Maximum update frequency"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
