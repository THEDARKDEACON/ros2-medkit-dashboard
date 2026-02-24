import { X } from 'lucide-react';
import { useFilterStore, type ComponentStatus } from '../../features/stores/filterStore';
import type { Area } from '../../types/api';

interface ComponentFilterProps {
  /**
   * Available areas for filtering
   */
  areas?: Area[];
  /**
   * Show clear button
   * @default true
   */
  showClear?: boolean;
}

/**
 * ComponentFilter provides filtering controls for components
 * Implements filtering by area, status, and name pattern
 * Validates: Requirements 15.3, 15.8
 */
export function ComponentFilter({ areas = [], showClear = true }: ComponentFilterProps) {
  const {
    componentFilters,
    setComponentAreaFilter,
    setComponentStatusFilter,
    setComponentNameFilter,
    clearComponentFilters,
  } = useFilterStore();

  const hasActiveFilters =
    componentFilters.areaId !== null ||
    componentFilters.status !== 'all' ||
    componentFilters.namePattern !== '';

  const handleClear = () => {
    clearComponentFilters();
  };

  const statusOptions: { value: ComponentStatus; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'error', label: 'Error' },
  ];

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Component Filters</h3>
        {showClear && hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            aria-label="Clear component filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Area filter */}
        <div>
          <label htmlFor="component-area-filter" className="block text-xs font-medium mb-1">
            Area
          </label>
          <select
            id="component-area-filter"
            value={componentFilters.areaId || ''}
            onChange={(e) => setComponentAreaFilter(e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <label htmlFor="component-status-filter" className="block text-xs font-medium mb-1">
            Status
          </label>
          <select
            id="component-status-filter"
            value={componentFilters.status}
            onChange={(e) => setComponentStatusFilter(e.target.value as ComponentStatus)}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Name pattern filter */}
        <div>
          <label htmlFor="component-name-filter" className="block text-xs font-medium mb-1">
            Name Pattern
          </label>
          <input
            id="component-name-filter"
            type="text"
            value={componentFilters.namePattern}
            onChange={(e) => setComponentNameFilter(e.target.value)}
            placeholder="Filter by name..."
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}
