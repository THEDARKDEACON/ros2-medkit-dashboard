import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Box, Activity, AlertCircle } from 'lucide-react';
import { useAreas, useComponents } from '../../features/api/hooks';
import { LoadingState } from '../common/LoadingState';
import { EmptyState, EmptyErrorState } from '../common/EmptyState';
import { VirtualizedList } from '../common/VirtualizedList';
import { ComponentSearch } from './ComponentSearch';
import { filterComponents, highlightMatches } from '../../utils/filterComponents';
import type { Component } from '../../types/api';

interface ComponentTreeProps {
  /**
   * Callback when a component is selected
   */
  onComponentSelect?: (component: Component) => void;
  /**
   * Currently selected component ID
   */
  selectedComponentId?: string;
  /**
   * Whether to show component status indicators
   */
  showStatus?: boolean;
  /**
   * Whether to show search input
   */
  showSearch?: boolean;
}

export function ComponentTree({
  onComponentSelect,
  selectedComponentId,
  showStatus = true,
  showSearch = true,
}: ComponentTreeProps) {
  const { data: areas, isLoading: areasLoading, error: areasError } = useAreas();
  const { data: components, isLoading: componentsLoading, error: componentsError } = useComponents();
  
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter components based on search term
  const filteredComponents = useMemo(() => {
    if (!components) return [];
    return filterComponents(components, searchTerm);
  }, [components, searchTerm]);

  // Toggle area expansion
  const toggleArea = useCallback((areaId: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  }, []);

  // Handle component click
  const handleComponentClick = useCallback((component: Component) => {
    onComponentSelect?.(component);
  }, [onComponentSelect]);

  // Loading state
  if (areasLoading || componentsLoading) {
    return <LoadingState type="skeleton" lines={5} message="Loading component tree..." />;
  }

  // Error state
  if (areasError || componentsError) {
    return (
      <EmptyErrorState
        title="Failed to load components"
        description="Unable to fetch component tree data. Please check your connection."
      />
    );
  }

  // Empty state
  if (!areas || areas.length === 0) {
    return (
      <EmptyState
        icon={Box}
        title="No areas found"
        description="No component areas are currently available."
        size="sm"
      />
    );
  }

  // Group components by area
  const componentsByArea = filteredComponents.reduce((acc, component) => {
    if (!acc[component.areaId]) {
      acc[component.areaId] = [];
    }
    acc[component.areaId].push(component);
    return acc;
  }, {} as Record<string, Component[]>);

  // Auto-expand areas when searching
  useEffect(() => {
    if (searchTerm.trim().length > 0 && areas) {
      // Expand all areas that have matching components
      const areasWithMatches = new Set<string>();
      filteredComponents.forEach((component) => {
        areasWithMatches.add(component.areaId);
      });
      setExpandedAreas(areasWithMatches);
    }
  }, [searchTerm, filteredComponents, areas]);

  // Render highlighted text
  const renderHighlightedText = (text: string) => {
    const segments = highlightMatches(text, searchTerm);
    return (
      <>
        {segments.map((segment, index) => (
          <span
            key={index}
            className={segment.highlighted ? 'bg-yellow-200 dark:bg-yellow-900/50' : ''}
          >
            {segment.text}
          </span>
        ))}
      </>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      {showSearch && (
        <ComponentSearch
          value={searchTerm}
          onChange={setSearchTerm}
          resultCount={filteredComponents.length}
          totalCount={components?.length || 0}
        />
      )}

      {/* Component tree */}
      <div className="space-y-1" role="tree" aria-label="Component hierarchy">
      {areas.map((area) => {
        const isExpanded = expandedAreas.has(area.id);
        const areaComponents = componentsByArea[area.id] || [];
        const actualCount = areaComponents.length;

        return (
          <div key={area.id} className="rounded-md">
            {/* Area header */}
            <button
              onClick={() => toggleArea(area.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors group"
              role="treeitem"
              aria-expanded={isExpanded}
              aria-label={`${area.name} area with ${actualCount} components`}
            >
              {/* Expand/collapse icon */}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              )}

              {/* Area icon */}
              <Box className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />

              {/* Area name */}
              <span className="font-medium text-sm flex-1 truncate">
                {area.name}
              </span>

              {/* Component count badge */}
              <span
                className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full flex-shrink-0"
                aria-label={`${actualCount} components`}
              >
                {actualCount}
              </span>
            </button>

            {/* Area components */}
            {isExpanded && (
              <div
                className="ml-6 mt-1 border-l-2 border-muted pl-2"
                role="group"
                aria-label={`Components in ${area.name}`}
              >
                {areaComponents.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No components in this area
                  </div>
                ) : areaComponents.length > 20 ? (
                  // Use virtualization for large lists (>20 items)
                  <VirtualizedList
                    items={areaComponents}
                    itemHeight={40}
                    height={Math.min(400, areaComponents.length * 40)}
                    renderItem={(component, index, style) => {
                      const isSelected = component.id === selectedComponentId;
                      return (
                        <button
                          key={component.id}
                          onClick={() => handleComponentClick(component)}
                          style={style}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                          role="treeitem"
                          aria-selected={isSelected}
                          aria-label={`${component.name} component, status: ${component.status}`}
                        >
                          {/* Component icon with status */}
                          <div className="relative flex-shrink-0">
                            <Activity className="h-4 w-4" aria-hidden="true" />
                            {showStatus && component.status === 'error' && (
                              <AlertCircle
                                className="h-2 w-2 text-red-500 absolute -top-0.5 -right-0.5"
                                aria-hidden="true"
                              />
                            )}
                          </div>

                          {/* Component name */}
                          <span className="text-sm flex-1 truncate">
                            {renderHighlightedText(component.name)}
                          </span>

                          {/* Status indicator */}
                          {showStatus && (
                            <div className="flex-shrink-0">
                              {component.status === 'active' && (
                                <div
                                  className="h-2 w-2 rounded-full bg-green-500"
                                  aria-label="Active"
                                />
                              )}
                              {component.status === 'inactive' && (
                                <div
                                  className="h-2 w-2 rounded-full bg-gray-400"
                                  aria-label="Inactive"
                                />
                              )}
                              {component.status === 'error' && (
                                <div
                                  className="h-2 w-2 rounded-full bg-red-500"
                                  aria-label="Error"
                                />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    }}
                  />
                ) : (
                  // Regular rendering for small lists
                  <div className="space-y-1">
                    {areaComponents.map((component) => {
                      const isSelected = component.id === selectedComponentId;

                      return (
                        <button
                          key={component.id}
                          onClick={() => handleComponentClick(component)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors ${
                            isSelected
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                          role="treeitem"
                          aria-selected={isSelected}
                          aria-label={`${component.name} component, status: ${component.status}`}
                        >
                          {/* Component icon with status */}
                          <div className="relative flex-shrink-0">
                            <Activity className="h-4 w-4" aria-hidden="true" />
                            {showStatus && component.status === 'error' && (
                              <AlertCircle
                                className="h-2 w-2 text-red-500 absolute -top-0.5 -right-0.5"
                                aria-hidden="true"
                              />
                            )}
                          </div>

                          {/* Component name */}
                          <span className="text-sm flex-1 truncate">
                            {renderHighlightedText(component.name)}
                          </span>

                          {/* Status indicator */}
                          {showStatus && (
                            <div className="flex-shrink-0">
                              {component.status === 'active' && (
                                <div
                                  className="h-2 w-2 rounded-full bg-green-500"
                                  aria-label="Active"
                                />
                              )}
                              {component.status === 'inactive' && (
                                <div
                                  className="h-2 w-2 rounded-full bg-gray-400"
                                  aria-label="Inactive"
                                />
                              )}
                              {component.status === 'error' && (
                                <div
                                  className="h-2 w-2 rounded-full bg-red-500"
                                  aria-label="Error"
                                />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
