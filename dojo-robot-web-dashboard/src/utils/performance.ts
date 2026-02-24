/**
 * Performance optimization utilities
 * 
 * Provides helpers for frame rate limiting, lazy loading,
 * and other performance-related functionality.
 */

/**
 * FrameRateLimiter - Limits rendering to a target FPS
 * 
 * Implements Property 56: Frame Rate Limiting (max 30 FPS)
 * 
 * @example
 * ```tsx
 * const limiter = new FrameRateLimiter(30);
 * 
 * function animate(timestamp: number) {
 *   if (limiter.shouldRender(timestamp)) {
 *     // Perform rendering
 *   }
 *   requestAnimationFrame(animate);
 * }
 * ```
 */
export class FrameRateLimiter {
  private lastFrame = 0;
  private targetFPS: number;
  private frameInterval: number;

  constructor(targetFPS: number = 30) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  /**
   * Check if enough time has passed to render the next frame
   */
  shouldRender(timestamp: number): boolean {
    if (timestamp - this.lastFrame >= this.frameInterval) {
      this.lastFrame = timestamp;
      return true;
    }
    return false;
  }

  /**
   * Update the target FPS
   */
  setTargetFPS(fps: number) {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }

  /**
   * Get the current target FPS
   */
  getTargetFPS(): number {
    return this.targetFPS;
  }

  /**
   * Reset the frame timer
   */
  reset() {
    this.lastFrame = 0;
  }
}

/**
 * CircularBuffer - Fixed-size buffer for time-series data
 * 
 * Efficiently stores recent data points with automatic overflow handling.
 * Useful for charts and visualizations that only need recent history.
 * 
 * Implements Property 60: Chart Data Time Window (60 seconds)
 * 
 * @example
 * ```tsx
 * const buffer = new CircularBuffer<DataPoint>(60);
 * buffer.push({ timestamp: Date.now(), value: 42 });
 * const recentData = buffer.toArray();
 * ```
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private head = 0;
  private size = 0;
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add an item to the buffer
   */
  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    this.size = Math.min(this.size + 1, this.capacity);
  }

  /**
   * Get all items in chronological order
   */
  toArray(): T[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size);
    }
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.head = 0;
    this.size = 0;
  }

  /**
   * Get the current number of items
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get the maximum capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Check if the buffer is full
   */
  isFull(): boolean {
    return this.size === this.capacity;
  }

  /**
   * Check if the buffer is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }
}

/**
 * Measure the execution time of a function
 */
export function measurePerformance<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Measure the execution time of an async function
 */
export async function measurePerformanceAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Create a memoized version of a function
 * 
 * Caches results based on argument values to avoid redundant computations.
 */
export function memoize<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult,
  keyFn?: (...args: TArgs) => string
): (...args: TArgs) => TResult {
  const cache = new Map<string, TResult>();

  return (...args: TArgs): TResult => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Batch multiple function calls into a single execution
 * 
 * Useful for reducing the number of API calls or expensive operations.
 */
export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchDelay: number;
  private processFn: (items: T[]) => Promise<R[]>;

  constructor(processFn: (items: T[]) => Promise<R[]>, batchDelay: number = 50) {
    this.processFn = processFn;
    this.batchDelay = batchDelay;
  }

  /**
   * Add an item to the batch queue
   */
  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(item);

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(async () => {
        const items = [...this.queue];
        this.queue = [];

        try {
          const results = await this.processFn(items);
          resolve(results[results.length - 1]);
        } catch (error) {
          reject(error);
        }
      }, this.batchDelay);
    });
  }

  /**
   * Flush the queue immediately
   */
  async flush(): Promise<R[]> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const items = [...this.queue];
    this.queue = [];

    if (items.length === 0) {
      return [];
    }

    return this.processFn(items);
  }
}

/**
 * Monitor memory usage (development only)
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Log memory usage to console (development only)
 */
export function logMemoryUsage(label?: string) {
  const memory = getMemoryUsage();
  if (memory) {
    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
    console.log(
      `[Memory${label ? ` - ${label}` : ''}] Used: ${usedMB}MB / Total: ${totalMB}MB / Limit: ${limitMB}MB`
    );
  }
}
