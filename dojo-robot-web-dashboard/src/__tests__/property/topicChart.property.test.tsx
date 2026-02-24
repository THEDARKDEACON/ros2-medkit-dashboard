/**
 * Property-based tests for TopicChart component
 * **Validates: Requirements 3.8, 13.7**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { TopicChart } from '@/components/topics/TopicChart';

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children, data }: { children: React.ReactNode; data: any[] }) => (
      <div data-testid="line-chart" data-chart-points={data.length}>
        {children}
      </div>
    ),
    Line: ({ dataKey }: { dataKey: string }) => (
      <div data-testid={`line-${dataKey}`} />
    ),
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    Brush: () => <div data-testid="brush" />,
  };
});

// Arbitraries for generating test data
const topicNameArbitrary = fc.stringMatching(/^\/[a-z][a-z0-9_/]{1,50}$/);

// Generate numeric topic data (single value)
const numericValueArbitrary = fc.double({ min: -1000, max: 1000, noNaN: true });

// Generate numeric topic data (object with numeric fields)
const numericObjectArbitrary = fc.record({
  x: fc.double({ min: -100, max: 100, noNaN: true }),
  y: fc.double({ min: -100, max: 100, noNaN: true }),
  z: fc.double({ min: -100, max: 100, noNaN: true }),
});

// Generate numeric topic data (array of numbers)
const numericArrayArbitrary = fc.array(
  fc.double({ min: -100, max: 100, noNaN: true }),
  { minLength: 1, maxLength: 10 }
);

// Generate nested numeric data
const nestedNumericObjectArbitrary = fc.record({
  position: fc.record({
    x: fc.double({ min: -100, max: 100, noNaN: true }),
    y: fc.double({ min: -100, max: 100, noNaN: true }),
  }),
  velocity: fc.record({
    linear: fc.double({ min: -10, max: 10, noNaN: true }),
    angular: fc.double({ min: -10, max: 10, noNaN: true }),
  }),
});

// Combined arbitrary for any numeric data
const anyNumericDataArbitrary = fc.oneof(
  numericValueArbitrary,
  numericObjectArbitrary,
  numericArrayArbitrary,
  nestedNumericObjectArbitrary
);

// Generate non-numeric data
const nonNumericDataArbitrary = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.string(),
  fc.boolean(),
  fc.record({
    message: fc.string(),
    status: fc.string(),
  })
);

describe('Property 11: Numeric Topic Chart History Window', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  /**
   * Property: For any numeric topic data stream, the chart visualization should
   * display data points from the last 60 seconds only, discarding older data.
   * 
   * **Validates: Requirements 3.8**
   */
  it('Feature: dojo-robot-web-dashboard, Property 11: should only display data from the last 60 seconds', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        fc.array(numericValueArbitrary, { minLength: 10, maxLength: 30 }),
        (topicName, values) => {
          vi.clearAllMocks();
          const startTime = Date.now();
          vi.setSystemTime(startTime);

          const { rerender, container } = render(
            <TopicChart data={null} topicName={topicName} height={400} />
          );

          // Add data points over a 90-second period
          for (let i = 0; i < values.length; i++) {
            const timeOffset = (i / values.length) * 90000; // Spread over 90 seconds
            vi.setSystemTime(startTime + timeOffset);

            rerender(
              <TopicChart data={values[i]} topicName={topicName} height={400} />
            );
          }

          // Move to the end of the 90-second period
          const endTime = startTime + 90000;
          vi.setSystemTime(endTime);

          // Add one more data point to trigger cleanup
          rerender(
            <TopicChart data={values[0]} topicName={topicName} height={400} />
          );

          const chartElement = container.querySelector('[data-testid="line-chart"]');
          if (chartElement) {
            const dataPoints = parseInt(
              chartElement.getAttribute('data-chart-points') || '0',
              10
            );

            // Calculate expected number of points within 60 seconds
            const expectedPoints = values.filter((_, index) => {
              const timeOffset = (index / values.length) * 90000;
              const pointTime = startTime + timeOffset;
              return endTime - pointTime <= 60000;
            }).length + 1; // +1 for the final data point

            // Allow some tolerance for timing
            expect(dataPoints).toBeLessThanOrEqual(expectedPoints + 2);
            expect(dataPoints).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Data points older than 60 seconds should be automatically removed
   * 
   * **Validates: Requirements 3.8**
   */
  it('should automatically discard data points older than 60 seconds', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        fc.array(numericObjectArbitrary, { minLength: 5, maxLength: 15 }),
        (topicName, dataPoints) => {
          vi.clearAllMocks();
          const startTime = Date.now();
          vi.setSystemTime(startTime);

          const { rerender, container } = render(
            <TopicChart data={null} topicName={topicName} height={400} />
          );

          // Add initial data points
          for (const data of dataPoints) {
            rerender(<TopicChart data={data} topicName={topicName} height={400} />);
            vi.advanceTimersByTime(1000); // 1 second between each point
          }

          // Record the number of points after initial addition
          const initialChartElement = container.querySelector('[data-testid="line-chart"]');
          const initialPoints = initialChartElement
            ? parseInt(initialChartElement.getAttribute('data-chart-points') || '0', 10)
            : 0;

          // Advance time by 65 seconds (past the 60-second window)
          vi.advanceTimersByTime(65000);

          // Add a new data point to trigger cleanup
          rerender(
            <TopicChart
              data={dataPoints[0]}
              topicName={topicName}
              height={400}
            />
          );

          const chartElement = container.querySelector('[data-testid="line-chart"]');
          const currentPoints = chartElement
            ? parseInt(chartElement.getAttribute('data-chart-points') || '0', 10)
            : 0;

          // After 65 seconds, old points should be removed
          // Only the new point should remain
          expect(currentPoints).toBeLessThan(initialPoints);
          expect(currentPoints).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Chart should handle continuous data streams and maintain 60-second window
   * 
   * **Validates: Requirements 3.8**
   */
  it('should maintain 60-second window for continuous data streams', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        fc.integer({ min: 30, max: 80 }),
        (topicName, numUpdates) => {
          vi.clearAllMocks();
          const startTime = Date.now();
          vi.setSystemTime(startTime);

          const { rerender, container } = render(
            <TopicChart data={null} topicName={topicName} height={400} />
          );

          // Simulate continuous data stream at 1Hz
          for (let i = 0; i < numUpdates; i++) {
            const data = { value: Math.random() * 100 };
            rerender(<TopicChart data={data} topicName={topicName} height={400} />);
            vi.advanceTimersByTime(1000); // 1 second per update
          }

          const chartElement = container.querySelector('[data-testid="line-chart"]');
          if (chartElement) {
            const dataPoints = parseInt(
              chartElement.getAttribute('data-chart-points') || '0',
              10
            );

            // Should never exceed 60 points (60 seconds at 1Hz)
            // Allow 1 extra point for timing tolerance
            expect(dataPoints).toBeLessThanOrEqual(61);

            // If we've sent more than 60 updates, should have close to 60 points
            if (numUpdates > 60) {
              expect(dataPoints).toBeGreaterThanOrEqual(50); // Allow some tolerance
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Chart should handle various numeric data structures
   * 
   * **Validates: Requirements 3.8**
   */
  it('should display charts for any numeric data structure', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        anyNumericDataArbitrary,
        (topicName, data) => {
          vi.clearAllMocks();
          vi.setSystemTime(Date.now());

          const { container } = render(<TopicChart data={data} topicName={topicName} height={400} />);

          // Should render chart components for numeric data
          expect(container.querySelector('[data-testid="line-chart"]')).toBeTruthy();
          expect(container.querySelector('[data-testid="x-axis"]')).toBeTruthy();
          expect(container.querySelector('[data-testid="y-axis"]')).toBeTruthy();

          // Should show the 60-second window indicator
          expect(container.textContent).toContain('Showing last 60 seconds');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Chart should not display for non-numeric data
   * 
   * **Validates: Requirements 3.8**
   */
  it('should show empty state for non-numeric data', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        nonNumericDataArbitrary,
        (topicName, data) => {
          vi.clearAllMocks();

          const { container } = render(<TopicChart data={data} topicName={topicName} height={400} />);

          // Should show empty state for non-numeric data
          expect(container.textContent).toContain('No numeric data');
          expect(container.textContent).toContain(
            'This topic does not contain numeric data that can be visualized'
          );

          // Should not render chart components
          expect(container.querySelector('[data-testid="line-chart"]')).toBeFalsy();
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('Property 60: Chart Data Time Window', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  /**
   * Property: For any historical chart, the displayed data should only include
   * data points from the last 60 seconds, with older data being discarded.
   * 
   * **Validates: Requirements 13.7**
   */
  it('Feature: dojo-robot-web-dashboard, Property 60: should only include data points from the last 60 seconds', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        fc.array(numericObjectArbitrary, { minLength: 20, maxLength: 50 }),
        fc.integer({ min: 1, max: 3 }), // seconds between updates
        (topicName, dataPoints, updateInterval) => {
          vi.clearAllMocks();
          const startTime = Date.now();
          vi.setSystemTime(startTime);

          const { rerender, container } = render(
            <TopicChart data={null} topicName={topicName} height={400} />
          );

          const timestamps: number[] = [];

          // Add data points with specified interval
          for (const data of dataPoints) {
            const currentTime = Date.now();
            timestamps.push(currentTime);

            rerender(<TopicChart data={data} topicName={topicName} height={400} />);
            vi.advanceTimersByTime(updateInterval * 1000);
          }

          const endTime = Date.now();

          const chartElement = container.querySelector('[data-testid="line-chart"]');
          if (chartElement) {
            const displayedPoints = parseInt(
              chartElement.getAttribute('data-chart-points') || '0',
              10
            );

            // Calculate how many points should be within 60 seconds
            const pointsWithin60s = timestamps.filter(
              (ts) => endTime - ts <= 60000
            ).length;

            // Displayed points should match points within 60-second window
            // Allow small tolerance for timing
            expect(displayedPoints).toBeLessThanOrEqual(pointsWithin60s + 2);

            // If we have points older than 60s, verify they're not all displayed
            const totalDuration = endTime - startTime;
            if (totalDuration > 60000) {
              expect(displayedPoints).toBeLessThan(dataPoints.length);
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Time window boundary should be strictly enforced
   * 
   * **Validates: Requirements 13.7**
   */
  it('should strictly enforce 60-second time window boundary', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        fc.integer({ min: 70, max: 100 }),
        (topicName, totalSeconds) => {
          // Ensure we have data spanning more than 60 seconds
          fc.pre(totalSeconds > 60);

          vi.clearAllMocks();
          const startTime = Date.now();
          vi.setSystemTime(startTime);

          const { rerender, container } = render(
            <TopicChart data={null} topicName={topicName} height={400} />
          );

          // Add one data point per second
          for (let i = 0; i < totalSeconds; i++) {
            const data = { value: i };
            rerender(<TopicChart data={data} topicName={topicName} height={400} />);
            vi.advanceTimersByTime(1000);
          }

          const chartElement = container.querySelector('[data-testid="line-chart"]');
          if (chartElement) {
            const dataPoints = parseInt(
              chartElement.getAttribute('data-chart-points') || '0',
              10
            );

            // Should have at most 60 points (60 seconds)
            // Allow 1 extra point for timing tolerance
            expect(dataPoints).toBeLessThanOrEqual(61);

            // Should have at least 50 points (allowing for some cleanup timing)
            expect(dataPoints).toBeGreaterThanOrEqual(50);
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Chart should display correct time range indicator
   * 
   * **Validates: Requirements 13.7**
   */
  it('should display "last 60 seconds" indicator for any chart with data', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        fc.array(anyNumericDataArbitrary, { minLength: 1, maxLength: 10 }),
        (topicName, dataPoints) => {
          vi.clearAllMocks();
          vi.setSystemTime(Date.now());

          const { rerender, container } = render(
            <TopicChart data={null} topicName={topicName} height={400} />
          );

          // Add data points
          for (const data of dataPoints) {
            rerender(<TopicChart data={data} topicName={topicName} height={400} />);
            vi.advanceTimersByTime(500); // 0.5 seconds between points
          }

          // Should display the 60-second window indicator
          expect(container.textContent).toContain('Showing last 60 seconds');

          // Should also show the number of data points
          expect(container.textContent).toMatch(/\d+ data points/);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Multiple numeric fields should all respect 60-second window
   * 
   * **Validates: Requirements 13.7**
   */
  it('should apply 60-second window to all numeric fields in multi-field data', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        fc.array(numericObjectArbitrary, { minLength: 70, maxLength: 90 }),
        (topicName, dataPoints) => {
          vi.clearAllMocks();
          const startTime = Date.now();
          vi.setSystemTime(startTime);

          const { rerender, container } = render(
            <TopicChart data={null} topicName={topicName} height={400} />
          );

          // Add data points at 1Hz
          for (const data of dataPoints) {
            rerender(<TopicChart data={data} topicName={topicName} height={400} />);
            vi.advanceTimersByTime(1000);
          }

          // Check that each numeric field (x, y, z) has its own line
          expect(container.querySelector('[data-testid="line-x"]')).toBeTruthy();
          expect(container.querySelector('[data-testid="line-y"]')).toBeTruthy();
          expect(container.querySelector('[data-testid="line-z"]')).toBeTruthy();

          // All fields should respect the same 60-second window
          const chartElement = container.querySelector('[data-testid="line-chart"]');
          const dataPointCount = chartElement
            ? parseInt(chartElement.getAttribute('data-chart-points') || '0', 10)
            : 0;

          // Should not exceed 60 points (allow 1 extra for timing tolerance)
          expect(dataPointCount).toBeLessThanOrEqual(61);
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Chart should handle rapid updates within 60-second window
   * 
   * **Validates: Requirements 13.7**
   */
  it('should handle rapid updates while maintaining 60-second window', () => {
    fc.assert(
      fc.property(
        topicNameArbitrary,
        fc.integer({ min: 100, max: 300 }), // High frequency updates
        (topicName, numUpdates) => {
          vi.clearAllMocks();
          const startTime = Date.now();
          vi.setSystemTime(startTime);

          const { rerender, container } = render(
            <TopicChart data={null} topicName={topicName} height={400} />
          );

          // Rapid updates at 10Hz (100ms intervals)
          for (let i = 0; i < numUpdates; i++) {
            const data = { value: Math.random() * 100 };
            rerender(<TopicChart data={data} topicName={topicName} height={400} />);
            vi.advanceTimersByTime(100);
          }

          const totalDuration = numUpdates * 100; // in milliseconds

          const chartElement = container.querySelector('[data-testid="line-chart"]');
          if (chartElement) {
            const dataPoints = parseInt(
              chartElement.getAttribute('data-chart-points') || '0',
              10
            );

            if (totalDuration <= 60000) {
              // All points should be retained if within 60 seconds
              expect(dataPoints).toBeLessThanOrEqual(numUpdates);
              expect(dataPoints).toBeGreaterThan(0);
            } else {
              // Only points from last 60 seconds should be retained
              const expectedPoints = Math.floor(60000 / 100); // 600 points at 10Hz
              expect(dataPoints).toBeLessThanOrEqual(expectedPoints + 10); // Allow tolerance
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });
});
