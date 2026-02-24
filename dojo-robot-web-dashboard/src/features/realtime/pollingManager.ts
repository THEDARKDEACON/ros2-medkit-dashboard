/**
 * Polling Manager
 * Provides HTTP polling fallback when WebSocket connection fails
 * Implements Requirements 21.6
 */

export type PollingCallback = (data: unknown) => void;

export interface PollingConfig {
  key: string;
  fetchFn: () => Promise<unknown>;
  callback: PollingCallback;
  interval?: number;
}

/**
 * Polling Manager class
 * Manages HTTP polling as a fallback mechanism for real-time updates
 */
export class PollingManager {
  private intervals: Map<string, number> = new Map();
  private defaultInterval = 2000; // 2 seconds

  /**
   * Start polling for a specific key
   * @param key - Unique identifier for this polling task
   * @param fetchFn - Function to fetch data
   * @param callback - Callback to invoke with fetched data
   * @param interval - Polling interval in milliseconds (default: 2000ms)
   */
  startPolling(
    key: string,
    fetchFn: () => Promise<unknown>,
    callback: PollingCallback,
    interval: number = this.defaultInterval
  ): void {
    // Stop existing polling for this key if any
    if (this.intervals.has(key)) {
      this.stopPolling(key);
    }

    const poll = async () => {
      try {
        const data = await fetchFn();
        callback(data);
      } catch (error) {
        console.error(`[Polling] Error for ${key}:`, error);
      }
    };

    // Initial fetch
    poll();

    // Set up interval
    const intervalId = window.setInterval(poll, interval);
    this.intervals.set(key, intervalId);

    console.log(`[Polling] Started polling for ${key} with interval ${interval}ms`);
  }

  /**
   * Stop polling for a specific key
   * @param key - Unique identifier for the polling task to stop
   */
  stopPolling(key: string): void {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
      console.log(`[Polling] Stopped polling for ${key}`);
    }
  }

  /**
   * Stop all active polling tasks
   */
  stopAll(): void {
    this.intervals.forEach((intervalId, key) => {
      clearInterval(intervalId);
      console.log(`[Polling] Stopped polling for ${key}`);
    });
    this.intervals.clear();
  }

  /**
   * Check if polling is active for a specific key
   * @param key - Unique identifier to check
   * @returns true if polling is active for this key
   */
  isPolling(key: string): boolean {
    return this.intervals.has(key);
  }

  /**
   * Get the number of active polling tasks
   * @returns Number of active polling tasks
   */
  getActiveCount(): number {
    return this.intervals.size;
  }

  /**
   * Get all active polling keys
   * @returns Array of active polling keys
   */
  getActiveKeys(): string[] {
    return Array.from(this.intervals.keys());
  }

  /**
   * Update the interval for an existing polling task
   * @param key - Unique identifier for the polling task
   * @param newInterval - New interval in milliseconds
   */
  updateInterval(key: string, newInterval: number): void {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      // Store the current config (we need to recreate the polling)
      console.log(`[Polling] Updating interval for ${key} to ${newInterval}ms`);
      // Note: To properly update interval, the caller should stop and restart polling
      // This is a placeholder for future enhancement
    }
  }
}

// Singleton instance
let pollingManagerInstance: PollingManager | null = null;

/**
 * Get or create the singleton polling manager instance
 */
export const getPollingManager = (): PollingManager => {
  if (!pollingManagerInstance) {
    pollingManagerInstance = new PollingManager();
  }
  return pollingManagerInstance;
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetPollingManager = (): void => {
  if (pollingManagerInstance) {
    pollingManagerInstance.stopAll();
    pollingManagerInstance = null;
  }
};

/**
 * Helper function to start polling with a config object
 */
export const startPolling = (config: PollingConfig): void => {
  const manager = getPollingManager();
  manager.startPolling(
    config.key,
    config.fetchFn,
    config.callback,
    config.interval
  );
};

/**
 * Helper function to stop polling by key
 */
export const stopPolling = (key: string): void => {
  const manager = getPollingManager();
  manager.stopPolling(key);
};
