import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalSearch } from '../../components/search/GlobalSearch';
import type { Component, Topic, Operation } from '../../types/api';

/**
 * Property-based tests for global search functionality
 * Tests Properties 65, 66, and 73
 */

describe('Global Search Property Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  /**
   * Property 65: Global Search Comprehensiveness
   * **Validates: Requirements 15.1**
   *
   * For any search term, the global search results should include matches
   * from components, topics, and operations (all categories).
   */
  describe('Property 65: Global Search Comprehensiveness', () => {
    it('should search across all categories (components, topics, operations)', async () => {
      const user = userEvent.setup();

      const components: Component[] = [
        {
          id: '1',
          name: 'Navigation Component',
          identifier: 'nav_comp',
          areaId: 'area-1',
          status: 'active',
        },
      ];

      const topics: Topic[] = [
        {
          name: '/navigation/status',
          messageType: 'std_msgs/String',
          publishRate: 10,
          lastUpdate: new Date().toISOString(),
          data: {},
        },
      ];

      const operations: Operation[] = [
        {
          id: 'op-1',
          name: 'navigate_to_goal',
          type: 'action',
          parameters: [],
          description: 'Navigate to a goal position',
        },
      ];

      const { container, unmount } = render(
        <GlobalSearch
          components={components}
          topics={topics}
          operations={operations}
          debounceMs={0}
        />,
      );

      try {
        const searchInput = container.querySelector(
          'input[aria-label="Global search"]',
        ) as HTMLInputElement;

        // Search for "nav" which should match all three categories
        await user.type(searchInput, 'nav');

        await waitFor(() => {
          const text = container.textContent || '';
          expect(text).toContain('Components (1)');
          expect(text).toContain('Topics (1)');
          expect(text).toContain('Operations (1)');
          expect(text).toContain('3 result');
        });
      } finally {
        unmount();
      }
    });
  });

  /**
   * Property 66: Search Match Highlighting
   * **Validates: Requirements 15.2**
   *
   * For any search result item, the matching text should be visually
   * highlighted in the display.
   */
  describe('Property 66: Search Match Highlighting', () => {
    it('should highlight matching text in search results', async () => {
      const user = userEvent.setup();

      const component: Component = {
        id: '1',
        name: 'TestComponent',
        identifier: 'test-component',
        areaId: 'area-1',
        status: 'active',
      };

      const { container, unmount } = render(
        <GlobalSearch
          components={[component]}
          topics={[]}
          operations={[]}
          debounceMs={0}
        />,
      );

      try {
        const searchInput = container.querySelector(
          'input[aria-label="Global search"]',
        ) as HTMLInputElement;

        // Clear any existing value first
        await user.clear(searchInput);
        await user.type(searchInput, 'Test');

        await waitFor(() => {
          const resultsDropdown = container.querySelector('[role="listbox"]');
          expect(resultsDropdown).not.toBeNull();

          const highlightedElements = resultsDropdown!.querySelectorAll(
            '.bg-yellow-200, .dark\\:bg-yellow-900\\/50',
          );

          expect(highlightedElements.length).toBeGreaterThan(0);

          const highlightedText = Array.from(highlightedElements)
            .map((el) => el.textContent)
            .join('');
          expect(highlightedText.toLowerCase()).toContain('test');
        });
      } finally {
        unmount();
      }
    });
  });

  /**
   * Property 73: Real-Time Search Updates
   * **Validates: Requirements 15.10**
   *
   * For any search input with debouncing, as the user types, search results
   * should update in real-time after the debounce delay.
   */
  describe('Property 73: Real-Time Search Updates', () => {
    it('should update search results after debounce delay', async () => {
      const user = userEvent.setup();

      const components: Component[] = [
        {
          id: '1',
          name: 'Alpha',
          identifier: 'alpha',
          areaId: 'area-1',
          status: 'active',
        },
        {
          id: '2',
          name: 'Beta',
          identifier: 'beta',
          areaId: 'area-1',
          status: 'active',
        },
      ];

      const debounceMs = 100;

      const { container, unmount } = render(
        <GlobalSearch
          components={components}
          topics={[]}
          operations={[]}
          debounceMs={debounceMs}
        />,
      );

      try {
        const searchInput = container.querySelector(
          'input[aria-label="Global search"]',
        ) as HTMLInputElement;

        // Clear any existing value first
        await user.clear(searchInput);
        
        // Type first search term - "Alp" should only match Alpha
        await user.type(searchInput, 'Alp');

        // Should not show results immediately
        expect(container.querySelector('[role="listbox"]')).toBeNull();

        // Wait for debounce
        await waitFor(
          () => {
            const text = container.textContent || '';
            expect(text).toContain('1 result');
            expect(text).toContain('Alpha');
          },
          { timeout: debounceMs + 500 },
        );

        // Clear and type new search - "Bet" should only match Beta
        await user.clear(searchInput);
        await user.type(searchInput, 'Bet');

        // Wait for updated results
        await waitFor(
          () => {
            const text = container.textContent || '';
            expect(text).toContain('1 result');
            expect(text).toContain('Beta');
            expect(text).not.toContain('Alpha');
          },
          { timeout: debounceMs + 500 },
        );
      } finally {
        unmount();
      }
    });
  });
});
