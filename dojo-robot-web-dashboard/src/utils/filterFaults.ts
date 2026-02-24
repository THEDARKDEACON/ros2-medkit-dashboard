/**
 * Utility functions for filtering faults
 * Implements Property 35: Fault Filtering Accuracy
 */

import type { Fault } from '../types/api';
import type { FaultSeverity } from '../features/stores/filterStore';

export interface FaultFilterCriteria {
  severity: FaultSeverity;
  componentId: string | null;
  startTime: string | null;
  endTime: string | null;
}

/**
 * Filter faults based on filter criteria
 * All active filters must match (AND logic)
 * 
 * @param faults - Array of faults to filter
 * @param filters - Filter criteria
 * @returns Filtered array of faults
 */
export function filterFaults(
  faults: Fault[],
  filters: FaultFilterCriteria
): Fault[] {
  return faults.filter((fault) => {
    // Severity filter
    if (filters.severity !== 'all' && fault.severity !== filters.severity) {
      return false;
    }

    // Component filter
    if (filters.componentId !== null && fault.componentId !== filters.componentId) {
      return false;
    }

    // Time range filter
    const faultTime = new Date(fault.timestamp).getTime();
    
    if (filters.startTime !== null) {
      const startTime = new Date(filters.startTime).getTime();
      if (faultTime < startTime) {
        return false;
      }
    }

    if (filters.endTime !== null) {
      const endTime = new Date(filters.endTime).getTime();
      if (faultTime > endTime) {
        return false;
      }
    }

    // All filters passed
    return true;
  });
}

/**
 * Get unique component IDs from a list of faults
 * 
 * @param faults - Array of faults
 * @returns Sorted array of unique component IDs
 */
export function getUniqueComponentIds(faults: Fault[]): string[] {
  const componentIds = new Set<string>();
  faults.forEach((fault) => {
    componentIds.add(fault.componentId);
  });
  return Array.from(componentIds).sort();
}
