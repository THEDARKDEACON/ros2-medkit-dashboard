import { useCallback, useRef } from 'react';

/**
 * useThrottle - Throttle a callback function
 * 
 * Returns a throttled version of the callback that will only execute
 * at most once per specified delay period. Subsequent calls within the
 * delay period are ignored.
 * 
 * Useful for scroll handlers, resize handlers, and other high-frequency
 * events where you want to limit the rate of execution.
 * 
 * @param callback - The function to throttle
 * @param delay - Minimum delay between executions in milliseconds (default: 300ms)
 * @returns A throttled version of the callback
 * 
 * @example
 * ```tsx
 * const handleScroll = useThrottle((event) => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 300);
 * 
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        // Enough time has passed, execute immediately
        callback(...args);
        lastRun.current = now;
      } else {
        // Not enough time has passed, schedule for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  ) as T;
}
