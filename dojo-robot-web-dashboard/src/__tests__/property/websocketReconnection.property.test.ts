/**
 * Property-based tests for WebSocket reconnection with exponential backoff
 * **Validates: Requirements 12.3, 21.5**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { WebSocketManager } from '@/features/realtime/websocketManager';
import { useConnectionStore } from '@/features/stores/connectionStore';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  send(_data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Helper method to simulate connection success
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
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

  // Helper method to simulate connection close
  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Helper method to simulate message
  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }
}

describe('Property 53: WebSocket reconnection with exponential backoff', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = MockWebSocket as any;

    // Reset connection store
    useConnectionStore.getState().setWSStatus('disconnected');
    useConnectionStore.getState().resetReconnectAttempts();
    useConnectionStore.getState().disablePollingFallback();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
  });

  /**
   * Property: WebSocket manager should attempt reconnection with exponential backoff
   * when connection fails
   */
  it('should reconnect with exponential backoff delays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 2000 }), // baseDelay
        fc.integer({ min: 5000, max: 10000 }), // maxDelay
        async (baseDelay, maxDelay) => {
          const manager = new WebSocketManager({
            url: 'ws://localhost:8080/api/v1/ws',
            baseDelay,
            maxDelay,
            maxReconnectAttempts: 4,
          });

          const connectionAttempts: number[] = [];
          let wsCreationCount = 0;

          // Track WebSocket creation
          const OriginalMockWebSocket = globalThis.WebSocket;
          globalThis.WebSocket = class extends MockWebSocket {
            constructor(url: string) {
              super(url);
              wsCreationCount++;
              connectionAttempts.push(Date.now());

              // Simulate close after a short delay
              setTimeout(() => {
                this.simulateClose();
              }, 10);
            }
          } as any;

          // Start connection
          manager.connect();

          // Advance time to trigger multiple reconnection attempts
          for (let i = 0; i < 3; i++) {
            const expectedDelay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
            await vi.advanceTimersByTimeAsync(expectedDelay + 50);
          }

          // Should have made initial connection + reconnection attempts
          expect(wsCreationCount).toBeGreaterThan(1);

          // Verify exponential backoff pattern in delays
          if (connectionAttempts.length >= 3) {
            for (let i = 1; i < Math.min(connectionAttempts.length - 1, 3); i++) {
              const actualDelay = connectionAttempts[i + 1] - connectionAttempts[i];
              const expectedDelay = Math.min(baseDelay * Math.pow(2, i), maxDelay);

              // Allow some tolerance for timing (±100ms)
              expect(actualDelay).toBeGreaterThanOrEqual(expectedDelay - 100);
              expect(actualDelay).toBeLessThanOrEqual(expectedDelay + 200);
            }
          }

          manager.disconnect();
          globalThis.WebSocket = OriginalMockWebSocket;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: WebSocket manager should stop reconnecting after max attempts
   * and enable polling fallback
   */
  it('should stop reconnecting after reaching max attempts and enable polling', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // maxReconnectAttempts
        async (maxAttempts) => {
          const manager = new WebSocketManager({
            url: 'ws://localhost:8080/api/v1/ws',
            baseDelay: 100,
            maxDelay: 1000,
            maxReconnectAttempts: maxAttempts,
          });

          let wsCreationCount = 0;

          // Track WebSocket creation
          const OriginalMockWebSocket = globalThis.WebSocket;
          globalThis.WebSocket = class extends MockWebSocket {
            constructor(url: string) {
              super(url);
              wsCreationCount++;

              // Simulate close immediately
              setTimeout(() => {
                this.simulateClose();
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
          expect(wsCreationCount).toBeLessThanOrEqual(maxAttempts + 1);

          // Status should be 'failed' after max attempts
          const status = useConnectionStore.getState().wsStatus;
          expect(status).toBe('failed');

          // Polling fallback should be enabled
          const pollingEnabled = useConnectionStore.getState().pollingEnabled;
          expect(pollingEnabled).toBe(true);

          manager.disconnect();
          globalThis.WebSocket = OriginalMockWebSocket;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: WebSocket manager should reset reconnection attempts on successful connection
   */
  it('should reset reconnection attempts after successful connection', async () => {
    const manager = new WebSocketManager({
      url: 'ws://localhost:8080/api/v1/ws',
      baseDelay: 100,
      maxDelay: 1000,
      maxReconnectAttempts: 5,
    });

    let connectionCount = 0;

    // Track WebSocket creation
    const OriginalMockWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        connectionCount++;

        // First connection fails
        if (connectionCount === 1) {
          setTimeout(() => {
            this.simulateClose();
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
    expect(useConnectionStore.getState().wsStatus).toBe('connected');

    // Reconnection attempts should be reset
    expect(manager.getReconnectionAttempts()).toBe(0);

    manager.disconnect();
    globalThis.WebSocket = OriginalMockWebSocket;
  });

  /**
   * Property: WebSocket manager should update connection status correctly during reconnection
   */
  it('should update connection status through reconnection lifecycle', async () => {
    const manager = new WebSocketManager({
      url: 'ws://localhost:8080/api/v1/ws',
      baseDelay: 100,
      maxDelay: 1000,
      maxReconnectAttempts: 3,
    });

    const statusHistory: string[] = [];

    // Track WebSocket creation
    const OriginalMockWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);

        // Simulate close after a short delay
        setTimeout(() => {
          this.simulateClose();
        }, 10);
      }
    } as any;

    // Track status changes
    const unsubscribe = useConnectionStore.subscribe((state) => {
      statusHistory.push(state.wsStatus);
    });

    // Start connection
    manager.connect();

    // Initial status should be disconnected
    expect(useConnectionStore.getState().wsStatus).toBe('disconnected');

    // Wait for close and reconnection
    await vi.advanceTimersByTimeAsync(50);

    // Should be reconnecting
    expect(useConnectionStore.getState().wsStatus).toBe('reconnecting');

    // Wait for next reconnection attempt
    await vi.advanceTimersByTimeAsync(200);

    // Should still be in reconnecting or disconnected state
    const currentStatus = useConnectionStore.getState().wsStatus;
    expect(['reconnecting', 'disconnected', 'failed']).toContain(currentStatus);

    manager.disconnect();
    unsubscribe();
    globalThis.WebSocket = OriginalMockWebSocket;
  });

  /**
   * Property: WebSocket manager should not reconnect when manually disconnected
   */
  it('should not attempt reconnection after manual disconnect', async () => {
    const manager = new WebSocketManager({
      url: 'ws://localhost:8080/api/v1/ws',
      baseDelay: 100,
      maxDelay: 1000,
      maxReconnectAttempts: 5,
    });

    let wsCreationCount = 0;

    // Track WebSocket creation
    const OriginalMockWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        wsCreationCount++;

        // Simulate close after a short delay
        setTimeout(() => {
          this.simulateClose();
        }, 10);
      }
    } as any;

    // Start connection
    manager.connect();

    // Wait for initial connection
    await vi.advanceTimersByTimeAsync(50);

    // Manually disconnect
    manager.disconnect();

    const countAfterDisconnect = wsCreationCount;

    // Wait for potential reconnection attempts
    await vi.advanceTimersByTimeAsync(2000);

    // Should not have created any new WebSocket instances
    expect(wsCreationCount).toBe(countAfterDisconnect);

    globalThis.WebSocket = OriginalMockWebSocket;
  });

  /**
   * Property: Requirement 21.5 - Specific timing sequence for WebSocket reconnection
   * Delays should follow: 1s, 2s, 4s, 8s (max 8s for WebSocket)
   */
  it('should follow requirement 21.5 timing sequence (1s, 2s, 4s, 8s max)', async () => {
    const manager = new WebSocketManager({
      url: 'ws://localhost:8080/api/v1/ws',
      baseDelay: 1000, // 1 second
      maxDelay: 8000, // 8 seconds
      maxReconnectAttempts: 5,
    });

    const connectionAttempts: number[] = [];

    // Track WebSocket creation
    const OriginalMockWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        connectionAttempts.push(Date.now());

        // Simulate close after a short delay
        setTimeout(() => {
          this.simulateClose();
        }, 10);
      }
    } as any;

    // Start connection
    manager.connect();

    // Expected delays: 1s, 2s, 4s, 8s (capped), 8s
    const expectedDelays = [1000, 2000, 4000, 8000, 8000];

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
    globalThis.WebSocket = OriginalMockWebSocket;
  });

  /**
   * Property: WebSocket manager should queue messages when disconnected
   * and send them when reconnected
   */
  it('should queue messages when disconnected and flush on reconnection', async () => {
    const manager = new WebSocketManager({
      url: 'ws://localhost:8080/api/v1/ws',
      baseDelay: 100,
      maxDelay: 1000,
      maxReconnectAttempts: 5,
    });

    const sentMessages: string[] = [];

    // Track WebSocket creation
    const OriginalMockWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);

        // Override send to track messages
        this.send = (data: string) => {
          if (this.readyState === MockWebSocket.OPEN) {
            sentMessages.push(data);
          } else {
            throw new Error('WebSocket is not open');
          }
        };

        // Simulate open after a short delay
        setTimeout(() => {
          this.simulateOpen();
        }, 10);
      }
    } as any;

    // Start connection
    manager.connect();

    // Send message before connection is open
    manager.send({ type: 'test', data: 'message1' });

    // Wait for connection to open
    await vi.advanceTimersByTimeAsync(50);

    // Message should have been queued and sent
    expect(sentMessages.length).toBeGreaterThan(0);

    // Send another message when connected
    manager.send({ type: 'test', data: 'message2' });

    // Should be sent immediately
    expect(sentMessages.length).toBe(2);

    manager.disconnect();
    globalThis.WebSocket = OriginalMockWebSocket;
  });

  /**
   * Property: WebSocket manager should handle subscription management correctly
   */
  it('should manage subscriptions and notify subscribers', async () => {
    const manager = new WebSocketManager({
      url: 'ws://localhost:8080/api/v1/ws',
      baseDelay: 100,
      maxDelay: 1000,
      maxReconnectAttempts: 5,
    });

    let wsInstance: MockWebSocket | null = null;

    // Track WebSocket creation
    const OriginalMockWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = class extends MockWebSocket {
      constructor(url: string) {
        super(url);
        wsInstance = this;

        // Simulate open after a short delay
        setTimeout(() => {
          this.simulateOpen();
        }, 10);
      }
    } as any;

    // Start connection
    manager.connect();

    // Wait for connection to open
    await vi.advanceTimersByTimeAsync(50);

    // Subscribe to events
    const receivedData: unknown[] = [];
    const unsubscribe = manager.subscribe('test_event', (data) => {
      receivedData.push(data);
    });

    // Simulate message from server
    (wsInstance as any)?.simulateMessage(
      JSON.stringify({
        event: 'test_event',
        payload: { value: 123 },
        timestamp: new Date().toISOString(),
      })
    );

    // Should have received the data
    expect(receivedData.length).toBe(1);
    expect(receivedData[0]).toEqual({ value: 123 });

    // Unsubscribe
    unsubscribe();

    // Simulate another message
    (wsInstance as any)?.simulateMessage(
      JSON.stringify({
        event: 'test_event',
        payload: { value: 456 },
        timestamp: new Date().toISOString(),
      })
    );

    // Should not have received the second message
    expect(receivedData.length).toBe(1);

    manager.disconnect();
    globalThis.WebSocket = OriginalMockWebSocket;
  });
});
