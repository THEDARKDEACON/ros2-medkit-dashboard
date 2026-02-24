import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useFilterStore } from '../../features/stores/filterStore';
import { useDebounce } from '../../hooks/useDebounce';
import { highlightMatches } from '../../utils/filterComponents';
import type { Component, Topic, Operation } from '../../types/api';

export interface SearchResult {
  type: 'component' | 'topic' | 'operation';
  id: string;
  name: string;
  description?: string;
  metadata?: string;
}

interface GlobalSearchProps {
  /**
   * Available components to search
   */
  components?: Component[];
  /**
   * Available topics to search
   */
  topics?: Topic[];
  /**
   * Available operations to search
   */
  operations?: Operation[];
  /**
   * Callback when a result is selected
   */
  onResultSelect?: (result: SearchResult) => void;
  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number;
}

/**
 * GlobalSearch provides a comprehensive search across components, topics, and operations
 * Implements Property 65: Global Search Comprehensiveness
 * Implements Property 66: Search Match Highlighting
 * Implements Property 73: Real-Time Search Updates
 */
export function GlobalSearch({
  components = [],
  topics = [],
  operations = [],
  onResultSelect,
  debounceMs = 300,
}: GlobalSearchProps) {
  const { setGlobalSearchTerm } = useFilterStore();
  const [localValue, setLocalValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(localValue, debounceMs);

  // Update global search term when debounced value changes
  useEffect(() => {
    setGlobalSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setGlobalSearchTerm]);

  // Perform search when search term changes
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTerm = debouncedSearchTerm.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search components
    components.forEach((component) => {
      if (
        component.name.toLowerCase().includes(searchTerm) ||
        component.identifier.toLowerCase().includes(searchTerm)
      ) {
        searchResults.push({
          type: 'component',
          id: component.id,
          name: component.name,
          description: component.identifier,
          metadata: `Area: ${component.areaId}`,
        });
      }
    });

    // Search topics
    topics.forEach((topic) => {
      if (
        topic.name.toLowerCase().includes(searchTerm) ||
        topic.messageType.toLowerCase().includes(searchTerm)
      ) {
        searchResults.push({
          type: 'topic',
          id: topic.name,
          name: topic.name,
          description: topic.messageType,
          metadata: `Rate: ${topic.publishRate.toFixed(1)} Hz`,
        });
      }
    });

    // Search operations
    operations.forEach((operation) => {
      if (
        operation.name.toLowerCase().includes(searchTerm) ||
        operation.description?.toLowerCase().includes(searchTerm)
      ) {
        searchResults.push({
          type: 'operation',
          id: operation.id,
          name: operation.name,
          description: operation.description,
          metadata: operation.type === 'service' ? 'Service' : 'Action',
        });
      }
    });

    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
  }, [debouncedSearchTerm, components, topics, operations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setLocalValue('');
    setResults([]);
    setIsOpen(false);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    onResultSelect?.(result);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const isFiltered = localValue.trim().length > 0;

  // Group results by type
  const componentResults = results.filter((r) => r.type === 'component');
  const topicResults = results.filter((r) => r.type === 'topic');
  const operationResults = results.filter((r) => r.type === 'operation');

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
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
          onFocus={handleInputFocus}
          placeholder="Search components, topics, operations... (Ctrl+K)"
          className="w-full pl-9 pr-9 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-controls="search-results"
          data-keyboard-shortcut="global-search"
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

      {/* Search results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          id="search-results"
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-md shadow-lg max-h-96 overflow-y-auto z-50"
          role="listbox"
        >
          {/* Components section */}
          {componentResults.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                Components ({componentResults.length})
              </div>
              {componentResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  searchTerm={debouncedSearchTerm}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}

          {/* Topics section */}
          {topicResults.length > 0 && (
            <div className="p-2 border-t border-border">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                Topics ({topicResults.length})
              </div>
              {topicResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  searchTerm={debouncedSearchTerm}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}

          {/* Operations section */}
          {operationResults.length > 0 && (
            <div className="p-2 border-t border-border">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                Operations ({operationResults.length})
              </div>
              {operationResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  searchTerm={debouncedSearchTerm}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}

          {/* Total count */}
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && isFiltered && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-md shadow-lg p-4 z-50"
          role="status"
        >
          <p className="text-sm text-muted-foreground text-center">
            No results found for "{localValue}"
          </p>
        </div>
      )}
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  searchTerm: string;
  onClick: () => void;
}

function SearchResultItem({
  result,
  searchTerm,
  onClick,
}: SearchResultItemProps) {
  const nameSegments = highlightMatches(result.name, searchTerm);
  const descriptionSegments = result.description
    ? highlightMatches(result.description, searchTerm)
    : [];

  return (
    <button
      onClick={onClick}
      className="w-full px-2 py-2 text-left rounded hover:bg-accent transition-colors"
      role="option"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Name with highlighting */}
          <div className="text-sm font-medium truncate">
            {nameSegments.map((segment, index) => (
              <span
                key={index}
                className={
                  segment.highlighted
                    ? 'bg-yellow-200 dark:bg-yellow-900/50 text-foreground'
                    : ''
                }
              >
                {segment.text}
              </span>
            ))}
          </div>

          {/* Description with highlighting */}
          {result.description && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {descriptionSegments.map((segment, index) => (
                <span
                  key={index}
                  className={
                    segment.highlighted
                      ? 'bg-yellow-200 dark:bg-yellow-900/50 text-foreground'
                      : ''
                  }
                >
                  {segment.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Metadata badge */}
        {result.metadata && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
              {result.metadata}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
