/**
 * Property-based tests for API client reconnection exponential backoff
 * **Validates: Requirements 12.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { calculateBackoffDelay } from '@/features/api/reconnection';

describe('Property 53: Reconnection Exponential Backoff Timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: Exponential backoff delay calculation
   * For any number of attempts, the delay should follow exponential growth
   * Formula: min(baseDelay * 2^attempts, maxDelay)
   */
  it('should calculate exponential backoff delays correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }), // attempts
        fc.integer({ min: 100, max: 5000 }), // baseDelay
        fc.integer({ min: 10000, max: 60000 }), // maxDelay
        (attempts, baseDelay, maxDelay) => {
          const delay = calculateBackoffDelay(attempts, baseDelay, maxDelay);

          // Delay should never be negative
          expect(delay).toBeGreaterThanOrEqual(0);

          // Delay should never exceed maxDelay
          expect(delay).toBeLessThanOrEqual(maxDelay);

          // For attempt 0, delay should equal baseDelay (or maxDelay if baseDelay > maxDelay)
          if (attempts === 0) {
            expect(delay).toBe(Math.min(baseDelay, maxDelay));
          }

          // Delay should follow exponential formula when not capped
          const expectedDelay = baseDelay * Math.pow(2, attempts);
          if (expectedDelay <= maxDelay) {
            expect(delay).toBe(expectedDelay);
          } else {
            expect(delay).toBe(maxDelay);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Delay sequence follows exponential pattern
   * Each subsequent delay should be double the previous (until max is reached)
   */
  it('should produce exponentially increasing delay sequence', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }), // baseDelay
        fc.integer({ min: 10000, max: 60000 }), // maxDelay
        (baseDelay, maxDelay) => {
          const delays: number[] = [];
          let attempts = 0;

          // Generate sequence until we hit maxDelay
          while (attempts < 10) {
            const delay = calculateBackoffDelay(attempts, baseDelay, maxDelay);
            delays.push(delay);

            if (delay === maxDelay) {
              break;
            }
            attempts++;
          }

          // Check that each delay (before hitting max) is double the previous
          for (let i = 1; i < delays.length; i++) {
            if (delays[i] < maxDelay && delays[i - 1] < maxDelay) {
              expect(delays[i]).toBe(delays[i - 1] * 2);
            }
          }

          // Once maxDelay is reached, all subsequent delays should equal maxDelay
          const maxDelayIndex = delays.findIndex((d) => d === maxDelay);
          if (maxDelayIndex !== -1) {
            for (let i = maxDelayIndex; i < delays.length; i++) {
              expect(delays[i]).toBe(maxDelay);
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Requirement 12.3 - Specific timing sequence
   * For API Gateway failures, delays should be: 1s, 2s, 4s, 8s, 16s, max 30s
   */
  it('should follow requirement 12.3 timing sequence (1s, 2s, 4s, 8s, 16s, max 30s)', () => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    const expectedSequence = [
      1000, // 1s (2^0 * 1000)
      2000, // 2s (2^1 * 1000)
      4000, // 4s (2^2 * 1000)
      8000, // 8s (2^3 * 1000)
      16000, // 16s (2^4 * 1000)
      30000, // 30s (2^5 * 1000 = 32000, capped at 30000)
      30000, // 30s (stays at max)
    ];

    expectedSequence.forEach((expectedDelay, attempts) => {
      const delay = calculateBackoffDelay(attempts, baseDelay, maxDelay);
      expect(delay).toBe(expectedDelay);
    });
  });

  /**
   * Property: Max delay cap is always respected
   * No matter how many attempts, delay should never exceed maxDelay
   */
  it('should never exceed maxDelay regardless of attempts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }), // large number of attempts
        fc.integer({ min: 100, max: 1000 }), // baseDelay
        fc.integer({ min: 5000, max: 30000 }), // maxDelay
        (attempts, baseDelay, maxDelay) => {
          const delay = calculateBackoffDelay(attempts, baseDelay, maxDelay);
          expect(delay).toBeLessThanOrEqual(maxDelay);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Monotonic increase until max
   * Delays should never decrease until maxDelay is reached
   */
  it('should produce monotonically increasing delays until maxDelay', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // baseDelay
        fc.integer({ min: 5000, max: 30000 }), // maxDelay
        (baseDelay, maxDelay) => {
          let previousDelay = 0;

          for (let attempts = 0; attempts < 20; attempts++) {
            const currentDelay = calculateBackoffDelay(
              attempts,
              baseDelay,
              maxDelay
            );

            // Current delay should be >= previous delay
            expect(currentDelay).toBeGreaterThanOrEqual(previousDelay);

            // If we haven't hit maxDelay, current should be > previous
            if (previousDelay < maxDelay && attempts > 0) {
              expect(currentDelay).toBeGreaterThan(previousDelay);
            }

            previousDelay = currentDelay;

            // Once we hit maxDelay, all subsequent delays should equal maxDelay
            if (currentDelay === maxDelay) {
              break;
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
