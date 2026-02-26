import { useState, useMemo } from 'react';
import { Clock, RefreshCw, AlertCircle, Pause, Play } from 'lucide-react';
import { useTopicList, useTopicData } from '@/features/api/hooks';
import { JsonInspector } from '@/components/common/JsonInspector';
import { VirtualizedList } from '@/components/common/VirtualizedList';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState, EmptyErrorState } from '@/components/common/EmptyState';

interface TopicViewerProps {
  /**
   * The ID of the component to view topics for
   */
  componentId: string;
}

/**
 * TopicViewer - Display and monitor ROS2 topics for a component
 * 
 * Features:
 * - List of available topics with message types
 * - Topic selection and detail view
 * - Real-time data updates with configurable refresh rate
 * - Timestamps for messages
 * - Error handling with retry logic
 * - Pause/resume functionality
 */
export function TopicViewer({ componentId }: TopicViewerProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(1000); // Default 1 second
  const [isPaused, setIsPaused] = useState(false);

  // Fetch topic list
  const {
    data: topics,
    isLoading: isLoadingTopics,
    error: topicsError,
    refetch: refetchTopics,
  } = useTopicList(componentId);

  // Fetch selected topic data with auto-refresh
  const {
    data: topicData,
    isLoading: isLoadingData,
    error: dataError,
    refetch: refetchData,
  } = useTopicData(componentId, selectedTopic || '', {
    refetchInterval: refreshInterval,
    enabled: !!selectedTopic && !isPaused,
  });

  // Get the selected topic object
  const selectedTopicObj = useMemo(() => {
    if (!selectedTopic || !topics) return null;
    return topics.find((t) => t.name === selectedTopic) || null;
  }, [selectedTopic, topics]);

  // Handle topic selection
  const handleSelectTopic = (topicName: string) => {
    setSelectedTopic(topicName);
    setIsPaused(false); // Resume when selecting a new topic
  };

  // Handle refresh rate change
  const handleRefreshRateChange = (rate: number) => {
    setRefreshInterval(rate);
  };

  // Toggle pause/resume
  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Handle retry for topic list
  const handleRetryTopics = () => {
    refetchTopics();
  };

  // Handle retry for topic data
  const handleRetryData = () => {
    refetchData();
  };

  // Loading state for topic list
  if (isLoadingTopics) {
    return <LoadingState message="Loading topics..." />;
  }

  // Error state for topic list
  if (topicsError) {
    return (
      <EmptyErrorState
        title="Failed to load topics"
        description="Unable to fetch the topic list. Please try again."
        onRetry={handleRetryTopics}
      />
    );
  }

  // Empty state - no topics
  if (!topics || topics.length === 0) {
    return (
      <EmptyState
        title="No topics available"
        description="This component has no topics to display."
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Topic List Sidebar */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="border border-border rounded-lg bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Topics</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {topics.length} topic{topics.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {topics.length > 20 ? (
              // Use virtualization for large topic lists (>20 items)
              <VirtualizedList
                items={topics}
                itemHeight={64}
                height={Math.min(600, topics.length * 64)}
                renderItem={(topic, _index, style) => (
                  <button
                    key={topic.name}
                    onClick={() => handleSelectTopic(topic.name)}
                    style={style}
                    className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset ${selectedTopic === topic.name
                        ? 'bg-muted border-l-4 border-l-primary'
                        : ''
                      }`}
                    aria-pressed={selectedTopic === topic.name}
                  >
                    <div className="font-medium text-sm text-foreground truncate">
                      {topic.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {topic.messageType}
                    </div>
                  </button>
                )}
              />
            ) : (
              // Regular rendering for small lists
              topics.map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => handleSelectTopic(topic.name)}
                  className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset ${selectedTopic === topic.name
                      ? 'bg-muted border-l-4 border-l-primary'
                      : ''
                    }`}
                  aria-pressed={selectedTopic === topic.name}
                >
                  <div className="font-medium text-sm text-foreground truncate">
                    {topic.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {topic.messageType}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Topic Detail View */}
      <div className="flex-1 min-w-0">
        {!selectedTopic ? (
          <EmptyState
            title="Select a topic"
            description="Choose a topic from the list to view its real-time data."
            size="lg"
          />
        ) : (
          <div className="border border-border rounded-lg bg-card">
            {/* Topic Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {selectedTopic}
                  </h3>
                  {selectedTopicObj && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Type: {selectedTopicObj.messageType}
                    </p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Pause/Resume Button */}
                  <button
                    onClick={handleTogglePause}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label={isPaused ? 'Resume updates' : 'Pause updates'}
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4" aria-hidden="true" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" aria-hidden="true" />
                        Pause
                      </>
                    )}
                  </button>

                  {/* Refresh Rate Selector */}
                  <div className="inline-flex items-center gap-2">
                    <RefreshCw
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <select
                      value={refreshInterval}
                      onChange={(e) =>
                        handleRefreshRateChange(Number(e.target.value))
                      }
                      className="px-2 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label="Refresh rate"
                    >
                      <option value={500}>0.5s</option>
                      <option value={1000}>1s</option>
                      <option value={2000}>2s</option>
                      <option value={5000}>5s</option>
                      <option value={10000}>10s</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              {selectedTopicObj && (
                <div
                  className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground"
                  data-testid="topic-timestamp"
                >
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span>
                    Last update:{' '}
                    {new Date(selectedTopicObj.lastUpdate).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Topic Data Display */}
            <div className="p-4">
              {isLoadingData && !topicData ? (
                <LoadingState message="Loading topic data..." />
              ) : dataError ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle
                      className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-destructive">
                        Failed to load topic data
                      </h4>
                      <p className="text-sm text-destructive/80 mt-1">
                        Unable to fetch data for this topic. The topic may be
                        unavailable or there may be a connection issue.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRetryData}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Retry
                  </button>
                </div>
              ) : topicData !== undefined ? (
                <JsonInspector
                  data={topicData}
                  searchable={true}
                  copyable={true}
                  maxExpandDepth={2}
                />
              ) : (
                <EmptyState
                  title="No data available"
                  description="This topic has no data to display."
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
