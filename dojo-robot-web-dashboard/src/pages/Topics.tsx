import { useState } from 'react';
import { useComponents } from '../features/api/hooks';
import { TopicViewer } from '../components/topics/TopicViewer';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState, EmptyErrorState } from '../components/common/EmptyState';
import { Activity, Box } from 'lucide-react';

export function Topics() {
  const { data: components, isLoading, error } = useComponents();
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  if (isLoading) {
    return <LoadingState type="spinner" message="Loading components for topic monitoring..." />;
  }

  if (error) {
    return (
      <EmptyErrorState
        title="Failed to load components"
        description="Could not retrieve the list of components. Please check the API connection."
      />
    );
  }

  if (!components || components.length === 0) {
    return (
      <EmptyState
        icon={Box}
        title="No components available"
        description="There are currently no active components to monitor."
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-6 md:flex-row">
      {/* Sidebar: Component Selection */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 border-r pr-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Topic Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a component to view streams
          </p>
        </div>

        <div className="overflow-y-auto pr-2 pb-4 flex-1 space-y-1">
          {components.map((component) => (
            <button
              key={component.id}
              onClick={() => setSelectedComponentId(component.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${selectedComponentId === component.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-foreground'
                }`}
            >
              <Activity className="h-4 w-4 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{component.name}</span>
                <span className={`text-xs truncate ${selectedComponentId === component.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {component.identifier}
                </span>
              </div>
              {component.status === 'active' && (
                <div className="ml-auto h-2 w-2 rounded-full bg-green-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area: Topic Viewer */}
      <div className="flex-1 overflow-hidden rounded-lg border bg-card/50 shadow-sm relative">
        {selectedComponentId ? (
          <div className="absolute inset-0 overflow-auto p-4">
            <TopicViewer componentId={selectedComponentId} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <EmptyState
              icon={Activity}
              title="Select a component"
              description="Choose a component from the sidebar to monitor its real-time topic data"
            />
          </div>
        )}
      </div>
    </div>
  );
}
