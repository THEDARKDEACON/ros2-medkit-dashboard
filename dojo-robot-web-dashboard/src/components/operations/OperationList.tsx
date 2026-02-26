import { useState, useMemo } from 'react';
import { Zap, Clock, Search, Filter } from 'lucide-react';
import { useOperations } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState, EmptyErrorState } from '@/components/common/EmptyState';
import type { Operation } from '@/types/api';

interface OperationListProps {
  /**
   * The ID of the component to view operations for
   */
  componentId: string;
  /**
   * Callback when an operation is selected
   */
  onSelectOperation?: (operation: Operation) => void;
  /**
   * Currently selected operation ID
   */
  selectedOperationId?: string;
}

/**
 * OperationList - Display and filter ROS2 services and actions for a component
 * 
 * Features:
 * - List of available operations with type indicators
 * - Visual distinction between services and actions
 * - Operation parameters and descriptions
 * - Search and filter functionality
 * - Operation selection
 * - Error handling with retry logic
 */
export function OperationList({
  componentId,
  onSelectOperation,
  selectedOperationId,
}: OperationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'service' | 'action'>('all');

  // Fetch operations
  const {
    data: operations,
    isLoading,
    error,
    refetch,
  } = useOperations(componentId);

  // Filter operations based on search and type filter
  const filteredOperations = useMemo(() => {
    if (!operations) return [];

    return operations.filter((op) => {
      // Type filter
      if (typeFilter !== 'all' && op.type !== typeFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          op.name.toLowerCase().includes(searchLower) ||
          op.description?.toLowerCase().includes(searchLower) ||
          op.parameters?.some((p) =>
            p.name.toLowerCase().includes(searchLower)
          )
        );
      }

      return true;
    });
  }, [operations, searchTerm, typeFilter]);

  // Count operations by type
  const operationCounts = useMemo(() => {
    if (!operations) return { services: 0, actions: 0 };
    return {
      services: operations.filter((op) => op.type === 'service').length,
      actions: operations.filter((op) => op.type === 'action').length,
    };
  }, [operations]);

  // Handle operation selection
  const handleSelectOperation = (operation: Operation) => {
    onSelectOperation?.(operation);
  };

  // Handle retry
  const handleRetry = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading operations..." />;
  }

  // Error state
  if (error) {
    return (
      <EmptyErrorState
        title="Failed to load operations"
        description="Unable to fetch the operations list. Please try again."
        onRetry={handleRetry}
      />
    );
  }

  // Empty state - no operations
  if (!operations || operations.length === 0) {
    return (
      <EmptyState
        title="No operations available"
        description="This component has no services or actions to display."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with counts */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-foreground">Operations</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {operationCounts.services} service{operationCounts.services !== 1 ? 's' : ''},{' '}
            {operationCounts.actions} action{operationCounts.actions !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search operations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Search operations"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'service' | 'action')}
            className="px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="service">Services Only</option>
            <option value="action">Actions Only</option>
          </select>
        </div>
      </div>

      {/* Operations List */}
      {filteredOperations.length === 0 ? (
        <EmptyState
          title="No matching operations"
          description="Try adjusting your search or filter criteria."
          size="sm"
        />
      ) : (
        <div className="space-y-2">
          {filteredOperations.map((operation) => (
            <button
              key={operation.id}
              onClick={() => handleSelectOperation(operation)}
              className={`w-full text-left p-4 border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${selectedOperationId === operation.id
                  ? 'bg-muted border-primary shadow-sm'
                  : 'border-border hover:bg-muted/50 hover:border-muted-foreground/20'
                }`}
              aria-pressed={selectedOperationId === operation.id}
            >
              {/* Operation Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-foreground truncate">
                      {operation.name}
                    </h4>
                    {/* Type Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${operation.type === 'service'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}
                    >
                      {operation.type === 'service' ? (
                        <>
                          <Zap className="h-3 w-3" aria-hidden="true" />
                          Service
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          Action
                        </>
                      )}
                    </span>
                  </div>

                  {/* Description */}
                  {operation.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {operation.description}
                    </p>
                  )}

                  {/* Parameters Summary */}
                  {(operation.parameters?.length ?? 0) > 0 && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Parameters:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {operation.parameters?.slice(0, 3).map((param) => (
                          <span
                            key={param.name}
                            className="inline-flex items-center px-2 py-0.5 text-xs bg-muted border border-border rounded"
                          >
                            {param.name}
                            {param.required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </span>
                        ))}
                        {(operation.parameters?.length ?? 0) > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{(operation.parameters?.length ?? 0) - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
