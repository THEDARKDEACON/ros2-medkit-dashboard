import { useState } from 'react';
import { useComponents } from '../features/api/hooks';
import { OperationList } from '../components/operations/OperationList';
import { OperationExecutor } from '../components/operations/OperationExecutor';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState, EmptyErrorState } from '../components/common/EmptyState';
import { Activity, Box, TerminalSquare } from 'lucide-react';
import type { Operation } from '../types/api';

export function Operations() {
  const { data: components, isLoading, error } = useComponents();
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);

  // Handle component selection change
  const handleComponentSelect = (id: string) => {
    setSelectedComponentId(id);
    setSelectedOperation(null); // Reset operation when component changes
  };

  if (isLoading) {
    return <LoadingState type="spinner" message="Loading components for operations..." />;
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
        description="There are currently no active components to manage operations for."
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-6 md:flex-row">
      {/* Sidebar: Component Selection */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 border-r pr-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execute services and actions
          </p>
        </div>

        <div className="overflow-y-auto pr-2 pb-4 flex-1 space-y-1">
          {components.map((component) => (
            <button
              key={component.id}
              onClick={() => handleComponentSelect(component.id)}
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

      {/* Main Area: Operations */}
      <div className="flex-1 overflow-hidden relative border rounded-lg bg-card/50 shadow-sm flex flex-col lg:flex-row">
        {selectedComponentId ? (
          <>
            <div className={`overflow-y-auto p-4 ${selectedOperation ? 'hidden lg:block lg:w-1/2 lg:border-r' : 'w-full'}`}>
              <OperationList
                componentId={selectedComponentId}
                onSelectOperation={setSelectedOperation}
                selectedOperationId={selectedOperation?.id}
              />
            </div>
            {selectedOperation && (
              <div className="overflow-y-auto w-full lg:w-1/2 p-4 bg-background">
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="lg:hidden mb-4 text-sm text-primary hover:underline flex items-center gap-1"
                >
                  &larr; Back to operations list
                </button>
                <OperationExecutor
                  componentId={selectedComponentId}
                  operation={selectedOperation}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex w-full h-full items-center justify-center p-6 text-center">
            <EmptyState
              icon={TerminalSquare}
              title="Select a component"
              description="Choose a component from the sidebar to view and execute its available operations"
            />
          </div>
        )}
      </div>
    </div>
  );
}
