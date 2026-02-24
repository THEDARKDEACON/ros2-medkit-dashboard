/**
 * Reconnection manager with exponential backoff
 * Implements automatic reconnection logic for API Gateway failures
 */

export interface ReconnectionConfig {
  baseDelay: number; // Initial delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  maxAttempts?: number; // Maximum number of reconnection attempts (optional)
}

export interface ReconnectionState {
  attempts: number;
  isReconnecting: boolean;
  nextDelay: number;
}

/**
 * Calculate the next delay using exponential backoff
 * Formula: min(baseDelay * 2^attempts, maxDelay)
 */
export const calculateBackoffDelay = (
  attempts: number,
  baseDelay: number,
  maxDelay: number
): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attempts);
  return Math.min(exponentialDelay, maxDelay);
};

/**
 * Reconnection manager class
 * Handles automatic reconnection with exponential backoff
 */
export class ReconnectionManager {
  private attempts = 0;
  private isReconnecting = false;
  private timeoutId: number | null = null;
  private config: Required<ReconnectionConfig>;

  constructor(config: ReconnectionConfig) {
    this.config = {
      baseDelay: config.baseDelay,
      maxDelay: config.maxDelay,
      maxAttempts: config.maxAttempts ?? Infinity,
    };
  }

  /**
   * Get current reconnection state
   */
  getState(): ReconnectionState {
    return {
      attempts: this.attempts,
      isReconnecting: this.isReconnecting,
      nextDelay: this.calculateNextDelay(),
    };
  }

  /**
   * Calculate the next delay based on current attempts
   */
  private calculateNextDelay(): number {
    return calculateBackoffDelay(
      this.attempts,
      this.config.baseDelay,
      this.config.maxDelay
    );
  }

  /**
   * Attempt reconnection with exponential backoff
   * Returns a promise that resolves when reconnection should be attempted
   */
  async scheduleReconnection(): Promise<void> {
    if (this.attempts >= this.config.maxAttempts) {
      throw new Error('Maximum reconnection attempts reached');
    }

    this.isReconnecting = true;
    const delay = this.calculateNextDelay();
    this.attempts++;

    return new Promise((resolve) => {
      this.timeoutId = window.setTimeout(() => {
        this.timeoutId = null;
        this.isReconnecting = false;
        resolve();
      }, delay);
    });
  }

  /**
   * Reset reconnection state after successful connection
   */
  reset(): void {
    this.attempts = 0;
    this.isReconnecting = false;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Cancel pending reconnection attempt
   */
  cancel(): void {
    this.isReconnecting = false;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Get current attempt count
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Check if currently reconnecting
   */
  isCurrentlyReconnecting(): boolean {
    return this.isReconnecting;
  }
}

/**
 * Create a reconnection manager with default configuration
 * Default: 1s base delay, 30s max delay, as per requirement 12.3
 */
export const createReconnectionManager = (
  config?: Partial<ReconnectionConfig>
): ReconnectionManager => {
  return new ReconnectionManager({
    baseDelay: config?.baseDelay ?? 1000, // 1 second
    maxDelay: config?.maxDelay ?? 30000, // 30 seconds
    maxAttempts: config?.maxAttempts,
  });
};
