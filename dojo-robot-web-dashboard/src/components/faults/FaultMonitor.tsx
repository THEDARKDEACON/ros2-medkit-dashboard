/**
 * FaultMonitor Component
 * Displays real-time faults with severity indicators
 * Implements Requirements 7.3, 7.4, 7.5
 */

import { useEffect, useState, useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useFaults } from '../../features/api/hooks';
import { getFaultSSEManager } from '../../features/realtime/sseManager';
import { useFilterStore } from '../../features/stores/filterStore';
import { filterFaults, getUniqueComponentIds } from '../../utils/filterFaults';
import type { Fault } from '../../types/api';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { FaultFilter } from './FaultFilter';

interface FaultMonitorProps {
  className?: string;
  onFaultSelect?: (fault: Fault) => void;
  showFilter?: boolean;
}

/**
 * Get severity icon component
 */
const getSeverityIcon = (severity: Fault['severity']) => {
  switch (severity) {
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

/**
 * Get severity badge styling
 */
const getSeverityBadgeClass = (severity: Fault['severity']) => {
  switch (severity) {
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
};

/**
 * Sort faults by severity (error > warning > info) then by timestamp (most recent first)
 */
const sortFaults = (faults: Fault[]): Fault[] => {
  const severityOrder = { error: 0, warning: 1, info: 2 };
  
  return [...faults].sort((a, b) => {
    // First sort by severity
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Then sort by timestamp (most recent first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else {
    return date.toLocaleString();
  }
};

export const FaultMonitor: React.FC<FaultMonitorProps> = ({
  className = '',
  onFaultSelect,
  showFilter = true,
}) => {
  const { data: initialFaults, isLoading, error } = useFaults();
  const [faults, setFaults] = useState<Fault[]>([]);
  const { faultFilters } = useFilterStore();

  // Initialize faults from API
  useEffect(() => {
    if (initialFaults) {
      setFaults(sortFaults(initialFaults));
    }
  }, [initialFaults]);

  // Subscribe to real-time fault updates via SSE
  useEffect(() => {
    const sseManager = getFaultSSEManager();
    
    // Connect to SSE stream
    sseManager.connect();

    // Subscribe to fault events
    const unsubscribe = sseManager.subscribe('fault', (data) => {
      const newFault = data as Fault;
      
      setFaults((prevFaults) => {
        // Check if fault already exists (by code)
        const existingIndex = prevFaults.findIndex(f => f.code === newFault.code);
        
        let updatedFaults: Fault[];
        if (existingIndex >= 0) {
          // Update existing fault
          updatedFaults = [...prevFaults];
          updatedFaults[existingIndex] = newFault;
        } else {
          // Add new fault
          updatedFaults = [...prevFaults, newFault];
        }
        
        // Re-sort after update
        return sortFaults(updatedFaults);
      });
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      // Note: We don't disconnect SSE here as other components might be using it
    };
  }, []);

  // Apply filters to faults
  const filteredFaults = useMemo(() => {
    return filterFaults(faults, faultFilters);
  }, [faults, faultFilters]);

  // Get unique component IDs for filter dropdown
  const componentIds = useMemo(() => {
    return getUniqueComponentIds(faults);
  }, [faults]);

  if (isLoading) {
    return <LoadingState message="Loading faults..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">
          Failed to load faults: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (faults.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No faults detected"
        description="System is operating normally"
      />
    );
  }

  if (filteredFaults.length === 0 && faults.length > 0) {
    return (
      <div className="space-y-4">
        {showFilter && (
          <FaultFilter
            componentIds={componentIds}
            resultCount={0}
            totalCount={faults.length}
          />
        )}
        <EmptyState
          icon={AlertCircle}
          title="No faults match filters"
          description="Try adjusting your filter criteria"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls */}
      {showFilter && (
        <FaultFilter
          componentIds={componentIds}
          resultCount={filteredFaults.length}
          totalCount={faults.length}
        />
      )}

      {/* Fault List */}
      <div className="space-y-2">
        {filteredFaults.map((fault) => (
          <div
            key={`${fault.code}-${fault.timestamp}`}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onFaultSelect?.(fault)}
          >
            <div className="flex items-start gap-3">
              {/* Severity Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(fault.severity)}
              </div>

              {/* Fault Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Fault Code */}
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                    {fault.code}
                  </span>
                  
                  {/* Severity Badge */}
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityBadgeClass(
                      fault.severity
                    )}`}
                  >
                    {fault.severity.toUpperCase()}
                  </span>
                </div>

                {/* Fault Message */}
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {fault.message}
                </p>

                {/* Component and Timestamp */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Component: <span className="font-medium" data-testid={`fault-component-${fault.code}`}>{fault.componentId}</span>
                  </span>
                  <span>{formatTimestamp(fault.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
