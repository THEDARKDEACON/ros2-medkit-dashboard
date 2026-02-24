import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface ComponentSearchProps {
  /**
   * Current search value
   */
  value: string;
  /**
   * Callback when search value changes (debounced)
   */
  onChange: (value: string) => void;
  /**
   * Number of filtered results
   */
  resultCount?: number;
  /**
   * Total number of items before filtering
   */
  totalCount?: number;
  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number;
  /**
   * Placeholder text
   */
  placeholder?: string;
}

/**
 * ComponentSearch provides a debounced search input for filtering components
 * Implements Property 57: Search Input Debouncing (300ms ± 50ms)
 */
export function ComponentSearch({
  value,
  onChange,
  resultCount,
  totalCount,
  debounceMs = 300,
  placeholder = 'Search components...',
}: ComponentSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const isFirstRender = useRef(true);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange callback
  useEffect(() => {
    // Skip debounce on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  const showResultCount = resultCount !== undefined && totalCount !== undefined;
  const isFiltered = localValue.trim().length > 0;

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          aria-label="Search components"
          aria-describedby={showResultCount ? 'search-result-count' : undefined}
        />
        {isFiltered && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Result count */}
      {showResultCount && isFiltered && (
        <div
          id="search-result-count"
          className="text-xs text-muted-foreground px-1"
          role="status"
          aria-live="polite"
        >
          Showing {resultCount} of {totalCount} components
        </div>
      )}
    </div>
  );
}
