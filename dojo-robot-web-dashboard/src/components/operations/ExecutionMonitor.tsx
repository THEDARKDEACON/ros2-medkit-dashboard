import { useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, Ban } from 'lucide-react';
import { useExecutionStatus, useCancelExecution } from '@/features/api/hooks';
import type { Execution } from '@/types/api';

interface ExecutionMonitorProps {
  /**
   * The ID of the component
   */
  componentId: string;
  /**
   * The ID of the operation
   */
  operationId: string;
  /**
   * The ID of the execution to monitor
   */
  executionId: string;
  /**
   * Polling interval in milliseconds (default: 1000)
   */
  pollingInterval?: number;
}

/**
 * Get status color classes
 */
function getStatusColor(status: Execution['status']): string {
  switch (status) {
    case 'succeeded':
      return 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20';
    case 'failed':
      return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
    case 'cancelled':
      return 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/20';
    case 'running':
      return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: Execution['status']) {
  switch (status) {
    case 'succeeded':
      return CheckCircle;
    case 'failed':
      return XCircle;
    case 'cancelled':
      return Ban;
    case 'running':
      return Loader2;
    case 'pending':
      return Clock;
    default:
      return Clock;
  }
}

/**
 * ExecutionMonitor - Monitor and display action execution status
 * 
 * Features:
 * - Display action status (pending, running, succeeded, failed, cancelled)
 * - Show progress bar and feedback data
 * - Add cancel button for active actions
 * - Poll execution status at regular intervals
 */
export function ExecutionMonitor({
  componentId,
  operationId,
  executionId,
  pollingInterval = 1000,
}: ExecutionMonitorProps) {
  const cancelExecution = useCancelExecution();

  // Determine if we should poll based on execution status
  const {
    data: execution,
    isLoading,
    error,
  } = useExecutionStatus(componentId, operationId, executionId, {
    refetchInterval: pollingInterval,
    enabled: true, // The hook itself will stop polling when execution is complete
  });

  // Handle cancel
  const handleCancel = async () => {
    try {
      await cancelExecution.mutateAsync({
        componentId,
        operationId,
        executionId,
      });
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  };

  // Loading state
  if (isLoading && !execution) {
    return (
      <div className="border border-border rounded-lg bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="text-sm">Loading execution status...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border border-destructive/20 rounded-lg bg-destructive/10 p-4">
        <div className="flex items-start gap-2">
          <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">
              Failed to load execution status
            </p>
            <p className="text-sm text-destructive/80 mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No execution data
  if (!execution) {
    return null;
  }

  const StatusIcon = getStatusIcon(execution.status);
  const statusColor = getStatusColor(execution.status);
  const isActive = execution.status === 'pending' || execution.status === 'running';
  const isComplete = execution.status === 'succeeded' || execution.status === 'failed' || execution.status === 'cancelled';

  return (
    <div className="border border-border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" aria-hidden="true" />
              Action Execution
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              ID: {executionId}
            </p>
          </div>

          {/* Cancel Button */}
          {isActive && (
            <button
              onClick={handleCancel}
              disabled={cancelExecution.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-destructive text-destructive rounded-md hover:bg-destructive/10 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel execution"
            >
              <Ban className="h-4 w-4" aria-hidden="true" />
              {cancelExecution.isPending ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="p-4 space-y-4">
        {/* Status Badge */}
        <div className={`flex items-center gap-2 p-3 border rounded-md ${statusColor}`}>
          <StatusIcon
            className={`h-5 w-5 flex-shrink-0 ${execution.status === 'running' ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium capitalize">
              {execution.status}
            </p>
            {execution.startTime && (
              <p className="text-xs opacity-80 mt-0.5">
                Started: {new Date(execution.startTime).toLocaleString()}
              </p>
            )}
            {execution.endTime && (
              <p className="text-xs opacity-80 mt-0.5">
                Ended: {new Date(execution.endTime).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {execution.progress !== undefined && isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">
                {Math.round(execution.progress * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${execution.progress * 100}%` }}
                role="progressbar"
                aria-valuenow={execution.progress * 100}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {/* Feedback Data */}
        {execution.feedback && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Feedback
            </label>
            <pre className="p-3 bg-muted border border-border rounded-md text-xs font-mono overflow-auto max-h-48">
              {JSON.stringify(execution.feedback, null, 2)}
            </pre>
          </div>
        )}

        {/* Result Data */}
        {execution.result && execution.status === 'succeeded' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Result
            </label>
            <pre className="p-3 bg-muted border border-border rounded-md text-xs font-mono overflow-auto max-h-48">
              {JSON.stringify(execution.result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error Message */}
        {execution.error && execution.status === 'failed' && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <XCircle
              className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                Execution Failed
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {execution.error}
              </p>
            </div>
          </div>
        )}

        {/* Polling Indicator */}
        {isActive && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            <span>Polling for updates every {pollingInterval}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}
