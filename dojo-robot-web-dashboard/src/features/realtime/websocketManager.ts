/**
 * WebSocket Manager
 * Handles bidirectional real-time communication with automatic reconnection
 * Implements Requirements 21.1, 21.2, 21.3, 21.4, 21.5, 21.6
 */

import { ReconnectionManager, createReconnectionManager } from '../api/reconnection';
import { useConnectionStore } from '../stores/connectionStore';

export interface WebSocketMessage {
  event: string;
  payload: unknown;
  timestamp: string;
}

export type WebSocketEventCallback = (data: unknown) => void;

export interface WebSocketManagerConfig {
  url: string;
  maxReconnectAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  heartbeatInterval?: number;
}

/**
 * WebSocket Manager class
 * Manages WebSocket connection with automatic reconnection and subscription management
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectionManager: ReconnectionManager;
  private subscriptions: Map<string, Set<WebSocketEventCallback>> = new Map();
  private messageQueue: unknown[] = [];
  private heartbeatInterval: number | null = null;
  private url: string;
  private maxReconnectAttempts: number;
  private heartbeatIntervalMs: number;
  private isManuallyDisconnected = false;

  constructor(config: WebSocketManagerConfig) {
    this.url = config.url;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 3;
    this.heartbeatIntervalMs = config.heartbeatInterval ?? 30000; // 30 seconds
    this.reconnectionManager = createReconnectionManager({
      baseDelay: config.baseDelay ?? 1000, // 1 second
      maxDelay: config.maxDelay ?? 8000, // 8 seconds (exponential: 1s, 2s, 4s, 8s)
      maxAttempts: this.maxReconnectAttempts,
    });
  }

  /**
   * Connect to WebSocket endpoint
   */
  connect(): void {
    if (this.ws) {
      this.disconnect();
    }

    this.isManuallyDisconnected = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS] Connected to', this.url);
        this.reconnectionManager.reset();
        useConnectionStore.getState().setWSStatus('connected');
        useConnectionStore.getState().resetReconnectAttempts();
        this.startHeartbeat();
        this.flushMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle heartbeat response
          if (message.event === 'pong') {
            return;
          }

          this.notifySubscribers(message.event, message.payload);
        } catch (error) {
          console.error('[WS] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Connection error:', error);
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        useConnectionStore.getState().setWSStatus('disconnected');
        this.stopHeartbeat();

        // Only attempt reconnection if not manually disconnected
        if (!this.isManuallyDisconnected) {
          this.handleReconnection();
        }
      };
    } catch (error) {
      console.error('[WS] Failed to create WebSocket:', error);
      useConnectionStore.getState().setWSStatus('failed');

      if (!this.isManuallyDisconnected) {
        this.handleReconnection();
      }
    }
  }

  /**
   * Handle reconnection with exponential backoff
   * Falls back to HTTP polling after max attempts
   */
  private async handleReconnection(): Promise<void> {
    const attempts = this.reconnectionManager.getAttempts();

    if (attempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnection attempts reached, falling back to polling');
      useConnectionStore.getState().setWSStatus('failed');
      useConnectionStore.getState().enablePollingFallback();
      return;
    }

    useConnectionStore.getState().setWSStatus('reconnecting');
    useConnectionStore.getState().incrementReconnectAttempts();

    const state = this.reconnectionManager.getState();
    console.log(
      `[WS] Reconnecting in ${state.nextDelay}ms (attempt ${state.attempts + 1}/${this.maxReconnectAttempts})`
    );

    try {
      await this.reconnectionManager.scheduleReconnection();

      // Only reconnect if not manually disconnected
      if (!this.isManuallyDisconnected) {
        this.connect();
      }
    } catch (error) {
      console.error('[WS] Reconnection scheduling failed:', error);
      useConnectionStore.getState().setWSStatus('failed');
      useConnectionStore.getState().enablePollingFallback();
    }
  }

  /**
   * Subscribe to WebSocket events
   * @param event - Event name to subscribe to
   * @param callback - Callback function to invoke when event is received
   * @returns Unsubscribe function
   */
  subscribe(event: string, callback: WebSocketEventCallback): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
      // Send subscription message to server
      this.send({ type: 'subscribe', event });
    }

    this.subscriptions.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(event)?.delete(callback);

      // Clean up empty subscription sets and notify server
      if (this.subscriptions.get(event)?.size === 0) {
        this.send({ type: 'unsubscribe', event });
        this.subscriptions.delete(event);
      }
    };
  }

  /**
   * Send message to WebSocket server
   * Queues message if not connected
   */
  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Queue message for sending when connected
      this.messageQueue.push(data);
    }
  }

  /**
   * Flush queued messages when connection is established
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatIntervalMs);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Notify all subscribers for a specific event
   */
  private notifySubscribers(event: string, data: unknown): void {
    const subscribers = this.subscriptions.get(event);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WS] Error in subscriber callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket endpoint
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.reconnectionManager.cancel();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
      useConnectionStore.getState().setWSStatus('disconnected');
      console.log('[WS] Disconnected');
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): 'connected' | 'disconnected' | 'reconnecting' | 'failed' {
    return useConnectionStore.getState().wsStatus;
  }

  /**
   * Get current reconnection attempts
   */
  getReconnectionAttempts(): number {
    return this.reconnectionManager.getAttempts();
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get number of active subscriptions
   */
  getSubscriptionCount(): number {
    let count = 0;
    this.subscriptions.forEach((subscribers) => {
      count += subscribers.size;
    });
    return count;
  }

  /**
   * Get queued message count
   */
  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }
}

/**
 * Create WebSocket manager instance
 * Default URL: ws://localhost:8080/api/v1/ws
 */
export const createWebSocketManager = (
  baseUrl: string = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/v1/ws'
): WebSocketManager => {
  return new WebSocketManager({
    url: baseUrl,
    maxReconnectAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 8000, // 8 seconds
    heartbeatInterval: 30000, // 30 seconds
  });
};

// Singleton instance for WebSocket connection
let wsManagerInstance: WebSocketManager | null = null;

/**
 * Get or create the singleton WebSocket manager instance
 */
export const getWebSocketManager = (): WebSocketManager => {
  if (!wsManagerInstance) {
    wsManagerInstance = createWebSocketManager();
  }
  return wsManagerInstance;
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetWebSocketManager = (): void => {
  if (wsManagerInstance) {
    wsManagerInstance.disconnect();
    wsManagerInstance = null;
  }
};
