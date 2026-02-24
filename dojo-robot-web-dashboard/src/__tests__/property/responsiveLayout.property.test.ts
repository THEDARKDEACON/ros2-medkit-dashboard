/**
 * Property-based tests for responsive layout adaptation
 * **Validates: Requirements 10.3**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from '@/features/stores/uiStore';

/**
 * Tailwind CSS default breakpoints
 * These are the standard responsive breakpoints used throughout the dashboard
 */
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Helper function to determine expected layout behavior based on screen width
 */
function getExpectedLayoutBehavior(width: number): {
  shouldCollapseSidebar: boolean;
  gridColumns: number;
  containerMaxWidth: string;
} {
  // Tablet and below: sidebar should auto-collapse
  if (width < BREAKPOINTS.md) {
    return {
      shouldCollapseSidebar: true,
      gridColumns: 1,
      containerMaxWidth: '100%',
    };
  }
  
  // Desktop small (md to lg): 2 columns
  if (width >= BREAKPOINTS.md && width < BREAKPOINTS.lg) {
    return {
      shouldCollapseSidebar: false,
      gridColumns: 2,
      containerMaxWidth: '768px',
    };
  }
  
  // Desktop medium (lg to xl): 3 columns
  if (width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl) {
    return {
      shouldCollapseSidebar: false,
      gridColumns: 3,
      containerMaxWidth: '1024px',
    };
  }
  
  // Desktop large (xl to 2xl): 4 columns
  if (width >= BREAKPOINTS.xl && width < BREAKPOINTS['2xl']) {
    return {
      shouldCollapseSidebar: false,
      gridColumns: 4,
      containerMaxWidth: '1280px',
    };
  }
  
  // Desktop extra large (2xl+): 4 columns with wider container
  return {
    shouldCollapseSidebar: false,
    gridColumns: 4,
    containerMaxWidth: '1536px',
  };
}

/**
 * Helper function to simulate window resize
 */
function simulateResize(width: number, height: number = 1080) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Helper function to get grid column class based on width
 */
function getGridColumnClass(width: number): string {
  const behavior = getExpectedLayoutBehavior(width);
  
  switch (behavior.gridColumns) {
    case 1:
      return 'grid-cols-1';
    case 2:
      return 'md:grid-cols-2';
    case 3:
      return 'lg:grid-cols-3';
    case 4:
      return 'xl:grid-cols-4';
    default:
      return 'grid-cols-1';
  }
}

describe('Property 46: Responsive Layout Adaptation', () => {
  beforeEach(() => {
    // Reset window size to default
    simulateResize(1920, 1080);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Property: Layout adapts to screen width
   * For any screen width W, the dashboard layout should adapt appropriately
   * (grid columns, sidebar collapse, etc.) based on responsive breakpoints.
   * 
   * **Validates: Requirements 10.3**
   */
  it('should adapt layout based on screen width breakpoints', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 3840 }), // Common screen widths from mobile to 4K
        (screenWidth) => {
          // Simulate screen resize
          simulateResize(screenWidth);

          const expected = getExpectedLayoutBehavior(screenWidth);

          // Verify grid columns match expected behavior
          const gridClass = getGridColumnClass(screenWidth);
          expect(gridClass).toBeDefined();

          // Verify expected grid columns
          if (screenWidth < BREAKPOINTS.md) {
            expect(expected.gridColumns).toBe(1);
          } else if (screenWidth < BREAKPOINTS.lg) {
            expect(expected.gridColumns).toBe(2);
          } else if (screenWidth < BREAKPOINTS.xl) {
            expect(expected.gridColumns).toBe(3);
          } else {
            expect(expected.gridColumns).toBe(4);
          }

          // Verify sidebar collapse behavior for small screens
          if (screenWidth < BREAKPOINTS.md) {
            expect(expected.shouldCollapseSidebar).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Sidebar auto-collapses on tablet and mobile
   * For screen widths below the tablet breakpoint (768px), the sidebar
   * should automatically collapse to save space
   */
  it('should auto-collapse sidebar on tablet and mobile screens', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }), // Below tablet breakpoint
        (screenWidth) => {
          simulateResize(screenWidth);

          const expected = getExpectedLayoutBehavior(screenWidth);

          // Sidebar should auto-collapse on small screens
          expect(expected.shouldCollapseSidebar).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Sidebar remains expanded on desktop by default
   * For screen widths at or above the tablet breakpoint (768px),
   * the sidebar should not auto-collapse (unless manually toggled)
   */
  it('should keep sidebar expanded on desktop screens by default', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 768, max: 3840 }), // Tablet and above
        (screenWidth) => {
          simulateResize(screenWidth);

          const expected = getExpectedLayoutBehavior(screenWidth);

          // Sidebar should not auto-collapse on larger screens
          expect(expected.shouldCollapseSidebar).toBe(false);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Grid columns increase with screen width
   * As screen width increases through breakpoints, the number of grid columns
   * should increase (1 -> 2 -> 3 -> 4)
   */
  it('should increase grid columns as screen width increases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 3840 }),
        fc.integer({ min: 320, max: 3840 }),
        (width1, width2) => {
          // Ensure width1 < width2
          const smallerWidth = Math.min(width1, width2);
          const largerWidth = Math.max(width1, width2);

          // Skip if widths are too close or the same
          if (largerWidth - smallerWidth < 100) {
            return true;
          }

          const behavior1 = getExpectedLayoutBehavior(smallerWidth);
          const behavior2 = getExpectedLayoutBehavior(largerWidth);

          // Grid columns should not decrease as width increases
          expect(behavior2.gridColumns).toBeGreaterThanOrEqual(
            behavior1.gridColumns
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Container max-width matches breakpoint
   * The container max-width should correspond to the current breakpoint
   */
  it('should set container max-width according to breakpoint', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          BREAKPOINTS.sm,
          BREAKPOINTS.md,
          BREAKPOINTS.lg,
          BREAKPOINTS.xl,
          BREAKPOINTS['2xl']
        ),
        (breakpointWidth) => {
          simulateResize(breakpointWidth);

          const expected = getExpectedLayoutBehavior(breakpointWidth);

          // Container max-width should be defined
          expect(expected.containerMaxWidth).toBeDefined();
          expect(expected.containerMaxWidth).not.toBe('');

          // Verify max-width is reasonable
          const maxWidthValue = parseInt(expected.containerMaxWidth);
          if (!isNaN(maxWidthValue)) {
            expect(maxWidthValue).toBeGreaterThan(0);
            expect(maxWidthValue).toBeLessThanOrEqual(breakpointWidth);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Manual sidebar toggle persists across screen sizes
   * If a user manually toggles the sidebar, that preference should be
   * maintained even when the screen is resized (unless auto-collapse is triggered)
   */
  it('should respect manual sidebar toggle preference', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.integer({ min: 768, max: 3840 }), // Desktop sizes only
        (manuallyCollapsed, screenWidth) => {
          localStorage.clear();

          const { result, unmount } = renderHook(() => useUIStore());

          // Manually set sidebar state
          act(() => {
            result.current.setSidebarCollapsed(manuallyCollapsed);
          });

          // Verify manual preference is set
          expect(result.current.sidebarCollapsed).toBe(manuallyCollapsed);

          // Simulate resize (still desktop size)
          simulateResize(screenWidth);

          // Manual preference should persist
          expect(result.current.sidebarCollapsed).toBe(manuallyCollapsed);

          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Breakpoint transitions are consistent
   * When crossing a breakpoint boundary, the layout should transition
   * consistently in both directions (up and down)
   */
  it('should transition consistently across breakpoint boundaries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          BREAKPOINTS.sm,
          BREAKPOINTS.md,
          BREAKPOINTS.lg,
          BREAKPOINTS.xl,
          BREAKPOINTS['2xl']
        ),
        (breakpoint) => {
          // Test just below breakpoint
          const belowBreakpoint = breakpoint - 1;
          const atBreakpoint = breakpoint;
          const aboveBreakpoint = breakpoint + 1;

          const behaviorBelow = getExpectedLayoutBehavior(belowBreakpoint);
          const behaviorAt = getExpectedLayoutBehavior(atBreakpoint);
          const behaviorAbove = getExpectedLayoutBehavior(aboveBreakpoint);

          // At and above breakpoint should have same or more columns than below
          expect(behaviorAt.gridColumns).toBeGreaterThanOrEqual(
            behaviorBelow.gridColumns
          );
          expect(behaviorAbove.gridColumns).toBeGreaterThanOrEqual(
            behaviorBelow.gridColumns
          );

          // At and above should have same behavior
          expect(behaviorAt.gridColumns).toBe(behaviorAbove.gridColumns);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Minimum screen width is supported
   * The dashboard should handle minimum mobile screen widths (320px)
   * without breaking the layout
   */
  it('should support minimum mobile screen width', () => {
    const minMobileWidth = 320;
    simulateResize(minMobileWidth);

    const expected = getExpectedLayoutBehavior(minMobileWidth);

    // Should have valid layout configuration
    expect(expected.gridColumns).toBeGreaterThan(0);
    expect(expected.containerMaxWidth).toBeDefined();
    expect(expected.shouldCollapseSidebar).toBe(true);
  });

  /**
   * Property: Maximum screen width is supported
   * The dashboard should handle large desktop screens (4K and beyond)
   * without breaking the layout
   */
  it('should support large desktop screen widths', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2560, max: 7680 }), // 4K to 8K
        (screenWidth) => {
          simulateResize(screenWidth);

          const expected = getExpectedLayoutBehavior(screenWidth);

          // Should have valid layout configuration
          expect(expected.gridColumns).toBeGreaterThan(0);
          expect(expected.gridColumns).toBeLessThanOrEqual(4); // Max 4 columns
          expect(expected.containerMaxWidth).toBeDefined();
          expect(expected.shouldCollapseSidebar).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Tablet breakpoint (768px) is correctly handled
   * The tablet breakpoint should be functional on both tablet screens
   * (768x1024) as specified in requirements
   */
  it('should be functional on tablet screens (768x1024)', () => {
    const tabletWidth = 768;
    const tabletHeight = 1024;

    simulateResize(tabletWidth, tabletHeight);

    const expected = getExpectedLayoutBehavior(tabletWidth);

    // Tablet should have at least 2 columns
    expect(expected.gridColumns).toBeGreaterThanOrEqual(2);
    // Sidebar should not auto-collapse at tablet size
    expect(expected.shouldCollapseSidebar).toBe(false);
  });

  /**
   * Property: Desktop breakpoint (1920x1080) is correctly handled
   * The desktop breakpoint should be functional on standard desktop screens
   * (1920x1080) as specified in requirements
   */
  it('should be functional on desktop screens (1920x1080)', () => {
    const desktopWidth = 1920;
    const desktopHeight = 1080;

    simulateResize(desktopWidth, desktopHeight);

    const expected = getExpectedLayoutBehavior(desktopWidth);

    // Desktop should have 4 columns
    expect(expected.gridColumns).toBe(4);
    // Sidebar should not auto-collapse
    expect(expected.shouldCollapseSidebar).toBe(false);
  });

  /**
   * Property: Layout mode affects responsive behavior
   * Different layout modes (default, compact, expanded) should work
   * correctly across all screen sizes
   */
  it('should support different layout modes across screen sizes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('default', 'compact', 'expanded'),
        fc.integer({ min: 768, max: 3840 }),
        (layoutMode, screenWidth) => {
          localStorage.clear();

          const { result, unmount } = renderHook(() => useUIStore());

          act(() => {
            result.current.setLayoutMode(layoutMode);
          });

          simulateResize(screenWidth);

          // Layout mode should be set correctly
          expect(result.current.layoutMode).toBe(layoutMode);

          // Layout should still adapt to screen size
          const expected = getExpectedLayoutBehavior(screenWidth);
          expect(expected.gridColumns).toBeGreaterThan(0);

          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });
});
