/**
 * Property-based tests for SSE reconnection with exponential backoff
 * **Validates: Requirements 7.11**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SSEManager } from '@/features/realtime/sseManager';
import { useConnectionStore } from '@/features/stores/connectionStore';

// Mock EventSource
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  readyState = MockEventSource.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Helper method to simulate connection success
  simulateOpen() {
    this.readyState = MockEventSource.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  // Helper method to simulate connection error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  // Helper method to simulate message
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }
}

describe('Property 39: SSE reconnection with exponential backoff', () => {
  let originalEventSource: typeof EventSource;

  beforeEach(() => {
    vi.useFakeTimers();
    originalEventSource = global.EventSource;
    global.EventSource = MockEventSource as any;
    
    // Reset connection store
    useConnectionStore.getState().setSSEStatus('disconnected');
    useConnectionStore.getState().resetReconnectAttempts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    global.EventSource = originalEventSource;
  });

  /**
   * Property: SSE manager should attempt reconnection with exponential backoff
   * when connection fails
   */
  it('should reconnect with exponential backoff delays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 2000 }), // baseDelay
        fc.integer({ min: 5000, max: 30000 }), // maxDelay
        async (baseDelay, maxDelay) => {
          const manager = new SSEManager({
            url: 'http://localhost:8080/api/v1/faults/stream',
            baseDelay,
            maxDelay,
            maxReconnectAttempts: 5,
          });

          const connectionAttempts: number[] = [];
          let eventSourceCreationCount = 0;

          // Track EventSource creation
          const OriginalMockEventSource = global.EventSource;
          global.EventSource = class extends MockEventSource {
            constructor(url: string) {
              super(url);
              eventSourceCreationCount++;
              connectionAttempts.push(Date.now());
              
              // Simulate error after a short delay
              setTimeout(() => {
                this.simulateError();
              }, 10);
            }
          } as any;

          // Start connection
          manager.connect();

          // Advance time to trigger multiple reconnection attempts
          for (let i = 0; i < 4; i++) {
            const expectedDelay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
            await vi.advanceTimersByTimeAsync(expectedDelay + 50);
          }

          // Should have made initial connection + reconnection attempts
          expect(eventSourceCreationCount).toBeGreaterThan(1);

          // Verify exponential backoff pattern in delays
          if (connectionAttempts.length >= 3) {
            for (let i = 1; i < Math.min(connectionAttempts.length - 1, 4); i++) {
              const actualDelay = connectionAttempts[i + 1] - connectionAttempts[i];
              const expectedDelay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
              
              // Allow some tolerance for timing (±100ms)
              expect(actualDelay).toBeGreaterThanOrEqual(expectedDelay - 100);
              expect(actualDelay).toBeLessThanOrEqual(expectedDelay + 200);
            }
          }

          manager.disconnect();
          global.EventSource = OriginalMockEventSource;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: SSE manager should stop reconnecting after max attempts
   */
  it('should stop reconnecting after reaching max attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // maxReconnectAttempts
        async (maxAttempts) => {
          const manager = new SSEManager({
            url: 'http://localhost:8080/api/v1/faults/stream',
            baseDelay: 100,
            maxDelay: 1000,
            maxReconnectAttempts: maxAttempts,
          });

          let eventSourceCreationCount = 0;

          // Track EventSource creation
          const OriginalMockEventSource = global.EventSource;
          global.EventSource = class extends MockEventSource {
            constructor(url: string) {
              super(url);
              eventSourceCreationCount++;
              
              // Simulate error immediately
              setTimeout(() => {
                this.simulateError();
              }, 10);
            }
          } as any;

          // Start connection
          manager.connect();

          // Advance time enough for all reconnection attempts
          for (let i = 0; i < maxAttempts + 2; i++) {
            await vi.advanceTimersByTimeAsync(2000);
          }

          // Should have made initial connection + max reconnection attempts
          // Total should be maxAttempts + 1 (initial attempt)
          expect(eventSourceCreationCount).toBeLessThanOrEqual(maxAttempts + 1);

          // Status should be 'failed' after max attempts
          const status = useConnectionStore.getState().sseStatus;
          expect(status).toBe('failed');

          manager.disconnect();
          global.EventSource = OriginalMockEventSource;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: SSE manager should reset reconnection attempts on successful connection
   */
  it('should reset reconnection attempts after successful connection', async () => {
    const manager = new SSEManager({
      url: 'http://localhost:8080/api/v1/faults/stream',
      baseDelay: 100,
      maxDelay: 1000,
      maxReconnectAttempts: 5,
    });

    let eventSourceInstance: MockEventSource | null = null;
    let connectionCount = 0;

    // Track EventSource creation
    const OriginalMockEventSource = global.EventSource;
    global.EventSource = class extends MockEventSource {
      constructor(url: string) {
        super(url);
        eventSourceInstance = this;
        connectionCount++;
        
        // First connection fails
        if (connectionCount === 1) {
          setTimeout(() => {
            this.simulateError();
          }, 10);
        }
        // Second connection succeeds
        else if (connectionCount === 2) {
          setTimeout(() => {
            this.simulateOpen();
          }, 10);
        }
      }
    } as any;

    // Start connection
    manager.connect();

    // Wait for first connection to fail
    await vi.advanceTimersByTimeAsync(50);

    // Wait for reconnection
    await vi.advanceTimersByTimeAsync(200);

    // Should have connected successfully
    expect(useConnectionStore.getState().sseStatus).toBe('connected');
    
    // Reconnection attempts should be reset
    expect(manager.getReconnectionAttempts()).toBe(0);

    manager.disconnect();
    global.EventSource = OriginalMockEventSource;
  });

  /**
   * Property: SSE manager should update connection status correctly during reconnection
   */
  it('should update connection status through reconnection lifecycle', async () => {
    const manager = new SSEManager({
      url: 'http://localhost:8080/api/v1/faults/stream',
      baseDelay: 100,
      maxDelay: 1000,
      maxReconnectAttempts: 3,
    });

    const statusHistory: string[] = [];
    let eventSourceInstance: MockEventSource | null = null;

    // Track EventSource creation
    const OriginalMockEventSource = global.EventSource;
    global.EventSource = class extends MockEventSource {
      constructor(url: string) {
        super(url);
        eventSourceInstance = this;
        
        // Simulate error after a short delay
        setTimeout(() => {
          this.simulateError();
        }, 10);
      }
    } as any;

    // Track status changes
    const unsubscribe = useConnectionStore.subscribe((state) => {
      statusHistory.push(state.sseStatus);
    });

    // Start connection
    manager.connect();

    // Initial status should be disconnected or connecting
    expect(useConnectionStore.getState().sseStatus).toBe('disconnected');

    // Wait for error and reconnection
    await vi.advanceTimersByTimeAsync(50);
    
    // Should be reconnecting
    expect(useConnectionStore.getState().sseStatus).toBe('reconnecting');

    // Wait for next reconnection attempt
    await vi.advanceTimersByTimeAsync(200);

    // Should still be in reconnecting or disconnected state
    const currentStatus = useConnectionStore.getState().sseStatus;
    expect(['reconnecting', 'disconnected', 'failed']).toContain(currentStatus);

    manager.disconnect();
    unsubscribe();
    global.EventSource = OriginalMockEventSource;
  });

  /**
   * Property: SSE manager should not reconnect when manually disconnected
   */
  it('should not attempt reconnection after manual disconnect', async () => {
    const manager = new SSEManager({
      url: 'http://localhost:8080/api/v1/faults/stream',
      baseDelay: 100,
      maxDelay: 1000,
      maxReconnectAttempts: 5,
    });

    let eventSourceCreationCount = 0;

    // Track EventSource creation
    const OriginalMockEventSource = global.EventSource;
    global.EventSource = class extends MockEventSource {
      constructor(url: string) {
        super(url);
        eventSourceCreationCount++;
        
        // Simulate error after a short delay
        setTimeout(() => {
          this.simulateError();
        }, 10);
      }
    } as any;

    // Start connection
    manager.connect();

    // Wait for initial connection
    await vi.advanceTimersByTimeAsync(50);

    // Manually disconnect
    manager.disconnect();

    const countAfterDisconnect = eventSourceCreationCount;

    // Wait for potential reconnection attempts
    await vi.advanceTimersByTimeAsync(2000);

    // Should not have created any new EventSource instances
    expect(eventSourceCreationCount).toBe(countAfterDisconnect);

    global.EventSource = OriginalMockEventSource;
  });

  /**
   * Property: Requirement 7.11 - Specific timing sequence for SSE reconnection
   * Delays should follow: 1s, 2s, 4s, 8s, 16s, max 30s
   */
  it('should follow requirement 7.11 timing sequence (1s, 2s, 4s, 8s, 16s, max 30s)', async () => {
    const manager = new SSEManager({
      url: 'http://localhost:8080/api/v1/faults/stream',
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      maxReconnectAttempts: 7,
    });

    const connectionAttempts: number[] = [];

    // Track EventSource creation
    const OriginalMockEventSource = global.EventSource;
    global.EventSource = class extends MockEventSource {
      constructor(url: string) {
        super(url);
        connectionAttempts.push(Date.now());
        
        // Simulate error after a short delay
        setTimeout(() => {
          this.simulateError();
        }, 10);
      }
    } as any;

    // Start connection
    manager.connect();

    // Expected delays: 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s
    const expectedDelays = [1000, 2000, 4000, 8000, 16000, 30000, 30000];

    // Advance time for each expected delay
    for (let i = 0; i < expectedDelays.length; i++) {
      await vi.advanceTimersByTimeAsync(expectedDelays[i] + 50);
    }

    // Verify delays match expected pattern
    if (connectionAttempts.length >= 3) {
      for (let i = 0; i < Math.min(connectionAttempts.length - 1, expectedDelays.length); i++) {
        const actualDelay = connectionAttempts[i + 1] - connectionAttempts[i];
        const expectedDelay = expectedDelays[i];
        
        // Allow some tolerance for timing (±100ms)
        expect(actualDelay).toBeGreaterThanOrEqual(expectedDelay - 100);
        expect(actualDelay).toBeLessThanOrEqual(expectedDelay + 200);
      }
    }

    manager.disconnect();
    global.EventSource = OriginalMockEventSource;
  });
});
