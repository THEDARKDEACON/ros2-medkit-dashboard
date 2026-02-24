import { X } from 'lucide-react';
import { useFilterStore, type OperationType } from '../../features/stores/filterStore';

interface OperationFilterProps {
  /**
   * Show clear button
   * @default true
   */
  showClear?: boolean;
}

/**
 * OperationFilter provides filtering controls for operations
 * Implements filtering by type (service vs action) and availability
 * Validates: Requirements 15.6, 15.8
 */
export function OperationFilter({ showClear = true }: OperationFilterProps) {
  const {
    operationFilters,
    setOperationTypeFilter,
    setOperationAvailabilityFilter,
    clearOperationFilters,
  } = useFilterStore();

  const hasActiveFilters =
    operationFilters.type !== 'all' || operationFilters.availableOnly;

  const handleClear = () => {
    clearOperationFilters();
  };

  const typeOptions: { value: OperationType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'service', label: 'Services' },
    { value: 'action', label: 'Actions' },
  ];

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Operation Filters</h3>
        {showClear && hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            aria-label="Clear operation filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Type filter */}
        <div>
          <label htmlFor="operation-type-filter" className="block text-xs font-medium mb-1">
            Type
          </label>
          <select
            id="operation-type-filter"
            value={operationFilters.type}
            onChange={(e) => setOperationTypeFilter(e.target.value as OperationType)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Availability filter */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="operation-availability-filter"
              type="checkbox"
              checked={operationFilters.availableOnly}
              onChange={(e) => setOperationAvailabilityFilter(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
            />
            <span className="text-xs font-medium">Available only</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            Show only operations that are currently available
          </p>
        </div>
      </div>
    </div>
  );
}
