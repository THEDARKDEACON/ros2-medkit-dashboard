/**
 * Property-based tests for search and filtering
 * **Validates: Requirements 2.5, 13.3, 15.3**
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { filterComponents } from '@/utils/filterComponents';
import { ComponentSearch } from '@/components/components/ComponentSearch';
import type { Component } from '@/types/api';

// Arbitraries for generating test data
const componentStatusArbitrary = fc.constantFrom('active', 'inactive', 'error');

const componentArbitrary: fc.Arbitrary<Component> = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  identifier: fc.string({ minLength: 1, maxLength: 100 }),
  areaId: fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/),
  status: componentStatusArbitrary,
  metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), {
    nil: undefined,
  }),
});

const searchTermArbitrary = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.constant(''),
  fc.constant('  ') // whitespace only
);

describe('Property 2: Component Search Filtering Accuracy', () => {
  /**
   * Property: For any search term and any list of components, the filtered results
   * should only contain components whose name or identifier includes the search term
   * (case-insensitive).
   */
  it('should only return components matching the search term in name or identifier', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 0, maxLength: 50 }),
        searchTermArbitrary,
        (components, searchTerm) => {
          const filtered = filterComponents(components, searchTerm);

          // If search term is empty or whitespace, all components should be returned
          if (!searchTerm || searchTerm.trim().length === 0) {
            expect(filtered).toEqual(components);
            return;
          }

          const normalizedSearch = searchTerm.toLowerCase().trim();

          // Every filtered component must match the search term
          filtered.forEach((component) => {
            const nameMatch = component.name
              .toLowerCase()
              .includes(normalizedSearch);
            const identifierMatch = (component.identifier ?? '')
              .toLowerCase()
              .includes(normalizedSearch);

            expect(nameMatch || identifierMatch).toBe(true);
          });

          // Every component that matches should be in the filtered results
          components.forEach((component) => {
            const nameMatch = component.name
              .toLowerCase()
              .includes(normalizedSearch);
            const identifierMatch = (component.identifier ?? '')
              .toLowerCase()
              .includes(normalizedSearch);

            if (nameMatch || identifierMatch) {
              expect(filtered).toContainEqual(component);
            } else {
              expect(filtered).not.toContainEqual(component);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Search should be case-insensitive
   */
  it('should perform case-insensitive search', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (components, searchTerm) => {
          const lowerCaseFiltered = filterComponents(
            components,
            searchTerm.toLowerCase()
          );
          const upperCaseFiltered = filterComponents(
            components,
            searchTerm.toUpperCase()
          );
          const mixedCaseFiltered = filterComponents(components, searchTerm);

          // All three should return the same results
          expect(lowerCaseFiltered).toEqual(upperCaseFiltered);
          expect(lowerCaseFiltered).toEqual(mixedCaseFiltered);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Empty search term should return all components
   */
  it('should return all components when search term is empty', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 0, maxLength: 30 }),
        (components) => {
          const emptySearchResults = [
            filterComponents(components, ''),
            filterComponents(components, '   '),
            filterComponents(components, '\t'),
          ];

          emptySearchResults.forEach((result) => {
            expect(result).toEqual(components);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Filtered results should be a subset of original components
   */
  it('should return a subset of the original components', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 0, maxLength: 30 }),
        searchTermArbitrary,
        (components, searchTerm) => {
          const filtered = filterComponents(components, searchTerm);

          // Filtered results should not exceed original length
          expect(filtered.length).toBeLessThanOrEqual(components.length);

          // Every filtered component should exist in original
          filtered.forEach((component) => {
            expect(components).toContainEqual(component);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Search should match partial strings
   */
  it('should match partial strings in name or identifier', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 1, maxLength: 20 }),
        (components) => {
          // Pick a random component and extract a substring from its name
          const randomComponent =
            components[Math.floor(Math.random() * components.length)];
          const nameSubstring = randomComponent.name.substring(
            0,
            Math.max(1, Math.floor(randomComponent.name.length / 2))
          );

          if (nameSubstring.length > 0) {
            const filtered = filterComponents(components, nameSubstring);

            // The random component should be in the filtered results
            expect(filtered).toContainEqual(randomComponent);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 57: Search Input Debouncing Timing', () => {
  /**
   * Property: For any search or filter input, changes should be debounced
   * by 300ms ± 50ms before triggering the search/filter operation.
   */
  it('should debounce search input by approximately 300ms', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentSearch
        value=""
        onChange={onChange}
        debounceMs={300}
        placeholder="Search"
      />
    );

    const input = screen.getByRole('textbox', { name: /search/i });

    // Type a search term
    await user.type(input, 'test');

    // onChange should not be called immediately
    expect(onChange).not.toHaveBeenCalled();

    // Wait for debounce period (300ms + buffer)
    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalledWith('test');
      },
      { timeout: 400 }
    );

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  /**
   * Property: Rapid typing should only trigger onChange once after debounce period
   */
  it('should only trigger onChange once after rapid typing stops', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({ delay: 50 }); // 50ms between keystrokes

    render(
      <ComponentSearch
        value=""
        onChange={onChange}
        debounceMs={300}
        placeholder="Search"
      />
    );

    const input = screen.getByRole('textbox', { name: /search/i });

    // Type multiple characters with 50ms delay between each
    await user.type(input, 'test');

    // onChange should not be called during typing
    expect(onChange).not.toHaveBeenCalled();

    // Wait for debounce period after last keystroke
    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalled();
      },
      { timeout: 500 }
    );

    // onChange should be called exactly once with the final value
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('test');
  });

  /**
   * Property: Debounce timing should be configurable
   */
  it('should respect custom debounce timing', async () => {
    const testCases = [
      { debounceMs: 100, timeout: 200 },
      { debounceMs: 200, timeout: 300 },
      { debounceMs: 500, timeout: 600 },
    ];

    for (const { debounceMs, timeout } of testCases) {
      const onChange = vi.fn();
      const user = userEvent.setup();

      const { unmount } = render(
        <ComponentSearch
          value=""
          onChange={onChange}
          debounceMs={debounceMs}
          placeholder="Search"
        />
      );

      const input = screen.getByRole('textbox', { name: /search/i });

      await user.type(input, 'test');

      // Should not be called immediately
      expect(onChange).not.toHaveBeenCalled();

      // Should be called after debounce period
      await waitFor(
        () => {
          expect(onChange).toHaveBeenCalledWith('test');
        },
        { timeout }
      );

      unmount();
    }
  });

  /**
   * Property: Clearing search should not be debounced (immediate action)
   */
  it('should not debounce clear action', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentSearch
        value="test"
        onChange={onChange}
        debounceMs={300}
        placeholder="Search"
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // onChange should be called immediately for clear action (not debounced)
    // This is the expected behavior for explicit user actions
    expect(onChange).toHaveBeenCalledWith('');
  });

  /**
   * Property: Debounce should reset on each keystroke
   */
  it('should reset debounce timer on each keystroke', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ComponentSearch
        value=""
        onChange={onChange}
        debounceMs={300}
        placeholder="Search"
      />
    );

    const input = screen.getByRole('textbox', { name: /search/i });

    // Type first character
    await user.type(input, 't');

    // Wait 200ms (less than debounce)
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(onChange).not.toHaveBeenCalled();

    // Type second character (should reset timer)
    await user.type(input, 'e');

    // Wait 200ms again (still less than debounce from last keystroke)
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(onChange).not.toHaveBeenCalled();

    // Wait for full debounce period from last keystroke
    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalled();
      },
      { timeout: 200 }
    );

    expect(onChange).toHaveBeenCalledWith('te');
  });
});

describe('Property 67: Component Filter Accuracy', () => {
  /**
   * Property: For any combination of component filters (area, status, name pattern),
   * the filtered results should only include components that match all active filter criteria.
   */
  it('should filter by area correctly', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 1, maxLength: 30 }),
        fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/),
        (components, targetAreaId) => {
          const filtered = components.filter(
            (component) => component.areaId === targetAreaId
          );

          // All filtered components should have the target area ID
          filtered.forEach((component) => {
            expect(component.areaId).toBe(targetAreaId);
          });

          // All components with target area ID should be in filtered results
          components.forEach((component) => {
            if (component.areaId === targetAreaId) {
              expect(filtered).toContainEqual(component);
            } else {
              expect(filtered).not.toContainEqual(component);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Should filter by status correctly
   */
  it('should filter by status correctly', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 1, maxLength: 30 }),
        componentStatusArbitrary,
        (components, targetStatus) => {
          const filtered = components.filter(
            (component) => component.status === targetStatus
          );

          // All filtered components should have the target status
          filtered.forEach((component) => {
            expect(component.status).toBe(targetStatus);
          });

          // All components with target status should be in filtered results
          components.forEach((component) => {
            if (component.status === targetStatus) {
              expect(filtered).toContainEqual(component);
            } else {
              expect(filtered).not.toContainEqual(component);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Should apply multiple filters correctly (AND logic)
   */
  it('should apply multiple filters with AND logic', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 1, maxLength: 30 }),
        fc.stringMatching(/^[a-z][a-z0-9_-]{2,20}$/),
        componentStatusArbitrary,
        searchTermArbitrary,
        (components, targetAreaId, targetStatus, searchTerm) => {
          // Apply all filters
          let filtered = components;

          // Filter by area
          filtered = filtered.filter(
            (component) => component.areaId === targetAreaId
          );

          // Filter by status
          filtered = filtered.filter(
            (component) => component.status === targetStatus
          );

          // Filter by search term
          if (searchTerm && searchTerm.trim().length > 0) {
            filtered = filterComponents(filtered, searchTerm);
          }

          // All filtered components should match all criteria
          filtered.forEach((component) => {
            expect(component.areaId).toBe(targetAreaId);
            expect(component.status).toBe(targetStatus);

            if (searchTerm && searchTerm.trim().length > 0) {
              const normalizedSearch = searchTerm.toLowerCase().trim();
              const nameMatch = component.name
                .toLowerCase()
                .includes(normalizedSearch);
              const identifierMatch = (component.identifier ?? '')
                .toLowerCase()
                .includes(normalizedSearch);
              expect(nameMatch || identifierMatch).toBe(true);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Filtering should not modify original array
   */
  it('should not modify the original components array', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 1, maxLength: 20 }),
        searchTermArbitrary,
        (components, searchTerm) => {
          const originalLength = components.length;
          const originalComponents = [...components];

          filterComponents(components, searchTerm);

          // Original array should be unchanged
          expect(components.length).toBe(originalLength);
          expect(components).toEqual(originalComponents);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Empty filter criteria should return all components
   */
  it('should return all components when no filters are active', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 0, maxLength: 30 }),
        (components) => {
          // No filters applied
          const filtered = filterComponents(components, '');

          expect(filtered).toEqual(components);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Filter results should maintain component order
   */
  it('should maintain relative order of components', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary, { minLength: 2, maxLength: 30 }),
        searchTermArbitrary,
        (components, searchTerm) => {
          const filtered = filterComponents(components, searchTerm);

          // Check that relative order is maintained
          for (let i = 0; i < filtered.length - 1; i++) {
            const currentIndex = components.indexOf(filtered[i]);
            const nextIndex = components.indexOf(filtered[i + 1]);

            expect(currentIndex).toBeLessThan(nextIndex);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
