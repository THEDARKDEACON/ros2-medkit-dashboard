/**
 * Property-based tests for state management persistence
 * **Validates: Requirements 11.4, 15.7**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '@/features/stores/uiStore';
import { useFilterStore } from '@/features/stores/filterStore';
import type { Theme } from '@/features/stores/uiStore';
import type {
  ComponentStatus,
  FaultSeverity,
  OperationType,
} from '@/features/stores/filterStore';

describe('Property 51: Theme Persistence Round-Trip', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * Property: Theme persistence round-trip
   * For any theme preference (light or dark), setting the theme should persist it
   * to local storage, and reloading the page should apply the saved theme.
   */
  it('should persist theme to localStorage and restore on reload', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('light', 'dark'),
        (theme) => {
          // Clear any existing state
          localStorage.clear();

          // First render - set theme
          const { result: result1, unmount: unmount1 } = renderHook(() =>
            useUIStore()
          );

          act(() => {
            result1.current.setTheme(theme);
          });

          // Verify theme is set in memory
          expect(result1.current.theme).toBe(theme);

          // Verify theme is persisted to localStorage
          const storedData = localStorage.getItem('ui-storage');
          expect(storedData).not.toBeNull();

          if (storedData) {
            const parsed = JSON.parse(storedData);
            expect(parsed.state.theme).toBe(theme);
          }

          // Unmount to simulate page unload
          unmount1();

          // Second render - simulate page reload
          const { result: result2, unmount: unmount2 } = renderHook(() =>
            useUIStore()
          );

          // Verify theme is restored from localStorage
          expect(result2.current.theme).toBe(theme);

          // Clean up
          unmount2();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Theme toggle persistence
   * Toggling theme should persist the new value
   */
  it('should persist toggled theme correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('light', 'dark'),
        (initialTheme) => {
          localStorage.clear();

          const { result, unmount } = renderHook(() => useUIStore());

          // Set initial theme
          act(() => {
            result.current.setTheme(initialTheme);
          });

          // Toggle theme
          act(() => {
            result.current.toggleTheme();
          });

          const expectedTheme = initialTheme === 'light' ? 'dark' : 'light';

          // Verify toggled theme is in memory
          expect(result.current.theme).toBe(expectedTheme);

          // Verify toggled theme is persisted
          const storedData = localStorage.getItem('ui-storage');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            expect(parsed.state.theme).toBe(expectedTheme);
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Multiple theme changes preserve last value
   * After multiple theme changes, only the last value should be persisted
   */
  it('should preserve only the last theme value after multiple changes', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<Theme>('light', 'dark'), {
          minLength: 1,
          maxLength: 10,
        }),
        (themeSequence) => {
          localStorage.clear();

          const { result, unmount } = renderHook(() => useUIStore());

          // Apply all theme changes
          themeSequence.forEach((theme) => {
            act(() => {
              result.current.setTheme(theme);
            });
          });

          const lastTheme = themeSequence[themeSequence.length - 1];

          // Verify last theme is in memory
          expect(result.current.theme).toBe(lastTheme);

          // Verify last theme is persisted
          const storedData = localStorage.getItem('ui-storage');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            expect(parsed.state.theme).toBe(lastTheme);
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 71: Filter Persistence Round-Trip', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    sessionStorage.clear();
  });

  /**
   * Property: Component filters persistence round-trip
   * For any set of component filters, they should persist to sessionStorage
   * and be restored on page reload
   */
  it('should persist component filters to sessionStorage and restore on reload', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ComponentStatus>('active', 'inactive', 'error', 'all'),
        fc.string({ minLength: 0, maxLength: 50 }),
        (status, namePattern) => {
          sessionStorage.clear();

          // First render - set filters
          const { result: result1, unmount: unmount1 } = renderHook(() =>
            useFilterStore()
          );

          act(() => {
            result1.current.setComponentStatusFilter(status);
            result1.current.setComponentNameFilter(namePattern);
          });

          // Verify filters are set in memory
          expect(result1.current.componentFilters.status).toBe(status);
          expect(result1.current.componentFilters.namePattern).toBe(
            namePattern
          );

          // Verify filters are persisted to sessionStorage
          const storedData = sessionStorage.getItem('filter-storage');
          expect(storedData).not.toBeNull();

          if (storedData) {
            const parsed = JSON.parse(storedData);
            expect(parsed.state.componentFilters.status).toBe(status);
            expect(parsed.state.componentFilters.namePattern).toBe(
              namePattern
            );
          }

          unmount1();

          // Second render - simulate page reload
          const { result: result2, unmount: unmount2 } = renderHook(() =>
            useFilterStore()
          );

          // Verify filters are restored from sessionStorage
          expect(result2.current.componentFilters.status).toBe(status);
          expect(result2.current.componentFilters.namePattern).toBe(
            namePattern
          );

          unmount2();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Topic filters persistence round-trip
   * For any set of topic filters, they should persist and be restored
   */
  it('should persist topic filters to sessionStorage and restore on reload', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
          nil: null,
        }),
        fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
        fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null }),
        (messageType, minFreq, maxFreq) => {
          sessionStorage.clear();

          const { result: result1, unmount: unmount1 } = renderHook(() =>
            useFilterStore()
          );

          act(() => {
            result1.current.setTopicMessageTypeFilter(messageType);
            result1.current.setTopicFrequencyFilter(minFreq, maxFreq);
          });

          // Verify filters in memory
          expect(result1.current.topicFilters.messageType).toBe(messageType);
          expect(result1.current.topicFilters.minUpdateFrequency).toBe(
            minFreq
          );
          expect(result1.current.topicFilters.maxUpdateFrequency).toBe(
            maxFreq
          );

          unmount1();

          // Simulate reload
          const { result: result2, unmount: unmount2 } = renderHook(() =>
            useFilterStore()
          );

          // Verify restoration
          expect(result2.current.topicFilters.messageType).toBe(messageType);
          expect(result2.current.topicFilters.minUpdateFrequency).toBe(
            minFreq
          );
          expect(result2.current.topicFilters.maxUpdateFrequency).toBe(
            maxFreq
          );

          unmount2();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Fault filters persistence round-trip
   * For any set of fault filters, they should persist and be restored
   */
  it('should persist fault filters to sessionStorage and restore on reload', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<FaultSeverity>('error', 'warning', 'info', 'all'),
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
          nil: null,
        }),
        fc.option(fc.date(), { nil: null }),
        fc.option(fc.date(), { nil: null }),
        (severity, componentId, startDate, endDate) => {
          sessionStorage.clear();

          const startTime = startDate ? startDate.toISOString() : null;
          const endTime = endDate ? endDate.toISOString() : null;

          const { result: result1, unmount: unmount1 } = renderHook(() =>
            useFilterStore()
          );

          act(() => {
            result1.current.setFaultSeverityFilter(severity);
            result1.current.setFaultComponentFilter(componentId);
            result1.current.setFaultTimeRangeFilter(startTime, endTime);
          });

          // Verify filters in memory
          expect(result1.current.faultFilters.severity).toBe(severity);
          expect(result1.current.faultFilters.componentId).toBe(componentId);
          expect(result1.current.faultFilters.startTime).toBe(startTime);
          expect(result1.current.faultFilters.endTime).toBe(endTime);

          unmount1();

          // Simulate reload
          const { result: result2, unmount: unmount2 } = renderHook(() =>
            useFilterStore()
          );

          // Verify restoration
          expect(result2.current.faultFilters.severity).toBe(severity);
          expect(result2.current.faultFilters.componentId).toBe(componentId);
          expect(result2.current.faultFilters.startTime).toBe(startTime);
          expect(result2.current.faultFilters.endTime).toBe(endTime);

          unmount2();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Operation filters persistence round-trip
   * For any set of operation filters, they should persist and be restored
   */
  it('should persist operation filters to sessionStorage and restore on reload', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<OperationType>('service', 'action', 'all'),
        fc.boolean(),
        (type, availableOnly) => {
          sessionStorage.clear();

          const { result: result1, unmount: unmount1 } = renderHook(() =>
            useFilterStore()
          );

          act(() => {
            result1.current.setOperationTypeFilter(type);
            result1.current.setOperationAvailabilityFilter(availableOnly);
          });

          // Verify filters in memory
          expect(result1.current.operationFilters.type).toBe(type);
          expect(result1.current.operationFilters.availableOnly).toBe(
            availableOnly
          );

          unmount1();

          // Simulate reload
          const { result: result2, unmount: unmount2 } = renderHook(() =>
            useFilterStore()
          );

          // Verify restoration
          expect(result2.current.operationFilters.type).toBe(type);
          expect(result2.current.operationFilters.availableOnly).toBe(
            availableOnly
          );

          unmount2();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Global search persistence round-trip
   * Global search term should persist and be restored
   */
  it('should persist global search term to sessionStorage and restore on reload', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (searchTerm) => {
          sessionStorage.clear();

          const { result: result1, unmount: unmount1 } = renderHook(() =>
            useFilterStore()
          );

          act(() => {
            result1.current.setGlobalSearchTerm(searchTerm);
          });

          // Verify in memory
          expect(result1.current.globalSearchTerm).toBe(searchTerm);

          unmount1();

          // Simulate reload
          const { result: result2, unmount: unmount2 } = renderHook(() =>
            useFilterStore()
          );

          // Verify restoration
          expect(result2.current.globalSearchTerm).toBe(searchTerm);

          unmount2();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: All filters persistence round-trip
   * Setting multiple filters simultaneously should persist all correctly
   */
  it('should persist all filter types simultaneously and restore correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.constantFrom<ComponentStatus>('active', 'inactive', 'error', 'all'),
        fc.constantFrom<FaultSeverity>('error', 'warning', 'info', 'all'),
        fc.constantFrom<OperationType>('service', 'action', 'all'),
        (searchTerm, componentStatus, faultSeverity, operationType) => {
          sessionStorage.clear();

          const { result: result1, unmount: unmount1 } = renderHook(() =>
            useFilterStore()
          );

          act(() => {
            result1.current.setGlobalSearchTerm(searchTerm);
            result1.current.setComponentStatusFilter(componentStatus);
            result1.current.setFaultSeverityFilter(faultSeverity);
            result1.current.setOperationTypeFilter(operationType);
          });

          // Verify all filters in memory
          expect(result1.current.globalSearchTerm).toBe(searchTerm);
          expect(result1.current.componentFilters.status).toBe(
            componentStatus
          );
          expect(result1.current.faultFilters.severity).toBe(faultSeverity);
          expect(result1.current.operationFilters.type).toBe(operationType);

          unmount1();

          // Simulate reload
          const { result: result2, unmount: unmount2 } = renderHook(() =>
            useFilterStore()
          );

          // Verify all filters restored
          expect(result2.current.globalSearchTerm).toBe(searchTerm);
          expect(result2.current.componentFilters.status).toBe(
            componentStatus
          );
          expect(result2.current.faultFilters.severity).toBe(faultSeverity);
          expect(result2.current.operationFilters.type).toBe(operationType);

          unmount2();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Clear filters should persist cleared state
   * Clearing filters should persist the default state
   */
  it('should persist cleared filter state correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom<ComponentStatus>('active', 'inactive', 'error'),
        (searchTerm, status) => {
          sessionStorage.clear();

          const { result, unmount } = renderHook(() => useFilterStore());

          // Set some filters
          act(() => {
            result.current.setGlobalSearchTerm(searchTerm);
            result.current.setComponentStatusFilter(status);
          });

          // Clear all filters
          act(() => {
            result.current.clearAllFilters();
          });

          // Verify cleared state in memory
          expect(result.current.globalSearchTerm).toBe('');
          expect(result.current.componentFilters.status).toBe('all');
          expect(result.current.componentFilters.namePattern).toBe('');

          // Verify cleared state is persisted
          const storedData = sessionStorage.getItem('filter-storage');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            expect(parsed.state.globalSearchTerm).toBe('');
            expect(parsed.state.componentFilters.status).toBe('all');
          }

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});
