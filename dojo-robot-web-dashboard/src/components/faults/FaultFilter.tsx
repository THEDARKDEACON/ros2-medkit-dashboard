/**
 * FaultFilter Component
 * Provides filtering controls for faults by severity, component, and time range
 * Implements Requirement 7.6
 */

import { X } from 'lucide-react';
import { useFilterStore } from '../../features/stores/filterStore';
import type { FaultSeverity } from '../../features/stores/filterStore';

interface FaultFilterProps {
  /**
   * Available component IDs for filtering
   */
  componentIds: string[];
  /**
   * Number of filtered results
   */
  resultCount?: number;
  /**
   * Total number of faults before filtering
   */
  totalCount?: number;
}

/**
 * FaultFilter provides UI controls for filtering faults
 * Filters are persisted in session storage via filterStore
 */
export const FaultFilter: React.FC<FaultFilterProps> = ({
  componentIds,
  resultCount,
  totalCount,
}) => {
  const {
    faultFilters,
    setFaultSeverityFilter,
    setFaultComponentFilter,
    setFaultTimeRangeFilter,
    clearFaultFilters,
  } = useFilterStore();

  const hasActiveFilters =
    faultFilters.severity !== 'all' ||
    faultFilters.componentId !== null ||
    faultFilters.startTime !== null ||
    faultFilters.endTime !== null;

  const showResultCount = resultCount !== undefined && totalCount !== undefined;

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Filter Faults
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFaultFilters}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Severity Filter */}
      <div className="space-y-2">
        <label
          htmlFor="severity-filter"
          className="block text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          Severity
        </label>
        <select
          id="severity-filter"
          value={faultFilters.severity}
          onChange={(e) =>
            setFaultSeverityFilter(e.target.value as FaultSeverity)
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Severities</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Component Filter */}
      <div className="space-y-2">
        <label
          htmlFor="component-filter"
          className="block text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          Component
        </label>
        <select
          id="component-filter"
          value={faultFilters.componentId || ''}
          onChange={(e) =>
            setFaultComponentFilter(e.target.value || null)
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Components</option>
          {componentIds.map((componentId) => (
            <option key={componentId} value={componentId}>
              {componentId}
            </option>
          ))}
        </select>
      </div>

      {/* Time Range Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Time Range
        </label>
        <div className="space-y-2">
          <div>
            <label
              htmlFor="start-time"
              className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
            >
              From
            </label>
            <input
              id="start-time"
              type="datetime-local"
              value={faultFilters.startTime || ''}
              onChange={(e) =>
                setFaultTimeRangeFilter(
                  e.target.value || null,
                  faultFilters.endTime
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="end-time"
              className="block text-xs text-gray-600 dark:text-gray-400 mb-1"
            >
              To
            </label>
            <input
              id="end-time"
              type="datetime-local"
              value={faultFilters.endTime || ''}
              onChange={(e) =>
                setFaultTimeRangeFilter(
                  faultFilters.startTime,
                  e.target.value || null
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Result Count */}
      {showResultCount && hasActiveFilters && (
        <div
          className="pt-3 border-t border-gray-200 dark:border-gray-700"
          role="status"
          aria-live="polite"
        >
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-gray-100">{resultCount}</span> of{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">{totalCount}</span> faults
          </p>
        </div>
      )}
    </div>
  );
};
