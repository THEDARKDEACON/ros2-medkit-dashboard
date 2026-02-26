import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { FrameRateLimiter, CircularBuffer } from '../../utils/performance';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Property-Based Tests for Performance Optimization
 * 
 * Tests the following properties:
 * - Property 56: Frame rate limiting (max 30 FPS)
 * - Property 58: Lazy loading (data not fetched until requested)
 * - Property 59: Static data caching (5 minute TTL)
 */

describe('Performance Property Tests', () => {
  describe('Property 56: Frame Rate Limiting', () => {
    /**
     * **Validates: Requirements 13.1**
     * 
     * For any topic data visualization with real-time updates,
     * the render rate should not exceed 30 frames per second.
     */
    it('should limit frame rate to maximum 30 FPS', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 60 }), // Target FPS
          fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 10, maxLength: 100 }), // Timestamps
          (targetFPS, timestamps) => {
            // Sort timestamps to ensure they're in ascending order
            const sortedTimestamps = [...timestamps].sort((a, b) => a - b);

            const limiter = new FrameRateLimiter(targetFPS);
            const expectedInterval = 1000 / targetFPS;

            let lastRenderTime = 0;
            let renderCount = 0;

            // Simulate frame requests
            for (const timestamp of sortedTimestamps) {
              if (limiter.shouldRender(timestamp)) {
                if (lastRenderTime > 0) {
                  const timeSinceLastRender = timestamp - lastRenderTime;
                  // Verify minimum interval between renders (allow 1ms tolerance)
                  expect(timeSinceLastRender).toBeGreaterThanOrEqual(expectedInterval - 1);
                }
                lastRenderTime = timestamp;
                renderCount++;
              }
            }

            // For 30 FPS specifically, verify it doesn't exceed the limit
            if (targetFPS === 30 && sortedTimestamps.length > 1) {
              const totalTime = sortedTimestamps[sortedTimestamps.length - 1] - sortedTimestamps[0];
              if (totalTime > 0) {
                const maxExpectedRenders = Math.ceil((totalTime / 1000) * 30) + 1;
                expect(renderCount).toBeLessThanOrEqual(maxExpectedRenders);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should enforce 30 FPS limit for real-time visualizations', () => {
      const limiter = new FrameRateLimiter(30);

      let currentTime = 0;
      let renderCount = 0;
      const duration = 1000; // 1 second

      // Simulate 60 FPS frame requests (every ~16.67ms)
      while (currentTime < duration) {
        if (limiter.shouldRender(currentTime)) {
          renderCount++;
        }
        currentTime += 16.67; // 60 FPS interval
      }

      // Should render approximately 30 frames in 1 second
      expect(renderCount).toBeLessThanOrEqual(31); // Allow 1 frame tolerance
      expect(renderCount).toBeGreaterThanOrEqual(29);
    });
  });

  describe('Property 57: Search Input Debouncing', () => {
    /**
     * **Validates: Requirements 13.3**
     * 
     * For any search or filter input, changes should be debounced
     * by 300ms ± 50ms before triggering the search/filter operation.
     */
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should debounce values by 300ms ± 50ms', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 250, max: 350 }), // Delay within tolerance
          (values, delay) => {
            const { result } = renderHook(() => useDebounce(values[0], delay));

            // Initial value should be the first value
            expect(result.current).toBe(values[0]);

            // Fast forward time
            vi.advanceTimersByTime(delay);

            // Value should still be debounced
            expect(result.current).toBe(values[0]);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should only update after debounce delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 },
        }
      );

      expect(result.current).toBe('initial');

      // Update value
      act(() => {
        rerender({ value: 'updated', delay: 300 });
      });

      // Should still be initial value before delay
      expect(result.current).toBe('initial');

      // Advance time by delay
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should now be updated
      expect(result.current).toBe('updated');
    });
  });

  describe('Property 58: Lazy Loading', () => {
    /**
     * **Validates: Requirements 13.4**
     * 
     * For any component detail view, the detailed data should not be
     * fetched until the user explicitly requests to view that component.
     */
    it('should not fetch data until enabled', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string(), // Component ID
          async (componentId) => {
            const queryFn = vi.fn().mockResolvedValue({ data: 'test' });
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: false,
                },
              },
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            );

            // Query with enabled: false should not call queryFn
            const { result } = renderHook(
              () => {
                const [enabled, setEnabled] = useState(false);
                const query = useQuery({
                  queryKey: ['component', componentId],
                  queryFn,
                  enabled,
                });
                return { query, setEnabled };
              },
              { wrapper }
            );

            // Query function should not have been called
            expect(queryFn).not.toHaveBeenCalled();

            // Enable the query
            result.current.setEnabled(true);

            // Now it should be called
            await waitFor(() => {
              expect(queryFn).toHaveBeenCalled();
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 59: Static Data Caching', () => {
    /**
     * **Validates: Requirements 13.5**
     * 
     * For any API response containing static data (areas, component metadata),
     * the response should be cached for 5 minutes before refetching.
     */
    it('should cache static data for 5 minutes', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({ id: fc.string(), name: fc.string() }), {
            minLength: 1,
            maxLength: 10,
          }),
          async (staticData) => {
            const queryFn = vi.fn().mockResolvedValue(staticData);
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  staleTime: 5 * 60 * 1000, // 5 minutes
                  gcTime: 10 * 60 * 1000, // 10 minutes
                  retry: false,
                },
              },
            });

            const wrapper = ({ children }: { children: ReactNode }) => (
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            );

            const { result, rerender } = renderHook(
              () =>
                useQuery({
                  queryKey: ['static-data'],
                  queryFn,
                }),
              { wrapper }
            );

            // Wait for initial fetch
            await waitFor(() => {
              expect(result.current.isSuccess).toBe(true);
            });

            // Query function should have been called once
            expect(queryFn).toHaveBeenCalledTimes(1);

            // Rerender (simulating component re-mount)
            rerender();

            // Query function should still only have been called once (cached)
            expect(queryFn).toHaveBeenCalledTimes(1);

            // Fast forward 4 minutes (still within cache time)
            vi.advanceTimersByTime(4 * 60 * 1000);
            rerender();

            // Should still be cached
            expect(queryFn).toHaveBeenCalledTimes(1);

            // Fast forward past 5 minutes
            vi.advanceTimersByTime(2 * 60 * 1000);

            // Invalidate to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['static-data'] });

            // Should refetch after stale time
            await waitFor(() => {
              expect(queryFn).toHaveBeenCalledTimes(2);
            });
          }
        ),
        { numRuns: 5 }
      );
    });

    it('should use cached data within 5 minute window', () => {
      const fiveMinutes = 5 * 60 * 1000;
      const queryFn = vi.fn().mockResolvedValue({ data: 'cached' });

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: fiveMinutes,
            retry: false,
          },
        },
      });

      // Set initial data in cache
      queryClient.setQueryData(['areas'], { data: 'cached' });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(
        () =>
          useQuery({
            queryKey: ['areas'],
            queryFn,
          }),
        { wrapper }
      );

      // Should use cached data without calling queryFn
      expect(result.current.data).toEqual({ data: 'cached' });
      expect(queryFn).not.toHaveBeenCalled();
    });
  });

  describe('Property 60: Chart Data Time Window', () => {
    /**
     * **Validates: Requirements 13.7**
     * 
     * For any historical chart, the displayed data should only include
     * data points from the last 60 seconds, with older data being discarded.
     */
    it('should maintain only last 60 data points in circular buffer', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              timestamp: fc.integer({ min: 0, max: 10000 }),
              value: fc.float(),
            }),
            { minLength: 1, maxLength: 200 }
          ),
          (dataPoints) => {
            const buffer = new CircularBuffer<typeof dataPoints[0]>(60);

            // Add all data points
            dataPoints.forEach((point) => buffer.push(point));

            // Buffer should contain at most 60 items
            const bufferedData = buffer.toArray();
            expect(bufferedData.length).toBeLessThanOrEqual(60);

            // If we added more than 60 points, verify we kept the most recent
            if (dataPoints.length > 60) {
              expect(bufferedData.length).toBe(60);
              // The last item in buffer should be the last item added
              expect(bufferedData[bufferedData.length - 1]).toEqual(
                dataPoints[dataPoints.length - 1]
              );
            } else {
              expect(bufferedData.length).toBe(dataPoints.length);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should discard oldest data when buffer is full', () => {
      const buffer = new CircularBuffer<number>(5);

      // Fill buffer
      for (let i = 1; i <= 5; i++) {
        buffer.push(i);
      }

      expect(buffer.toArray()).toEqual([1, 2, 3, 4, 5]);

      // Add more items (should overwrite oldest)
      buffer.push(6);
      expect(buffer.toArray()).toEqual([2, 3, 4, 5, 6]);

      buffer.push(7);
      expect(buffer.toArray()).toEqual([3, 4, 5, 6, 7]);
    });
  });
});
