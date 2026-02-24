/**
 * Server-Sent Events (SSE) Manager
 * Handles real-time fault streaming with automatic reconnection
 * Implements Requirements 7.2, 7.11
 */

import { ReconnectionManager, createReconnectionManager } from '../api/reconnection';
import { useConnectionStore } from '../stores/connectionStore';

export interface SSEMessage {
  type: 'fault' | 'component_status' | 'topic_update';
  data: unknown;
  timestamp: string;
}

export type SSEEventType = SSEMessage['type'];

export type SSEEventCallback = (data: unknown) => void;

export interface SSEManagerConfig {
  url: string;
  maxReconnectAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

/**
 * SSE Manager class
 * Manages Server-Sent Events connection with automatic reconnection
 */
export class SSEManager {
  private eventSource: EventSource | null = null;
  private reconnectionManager: ReconnectionManager;
  private listeners: Map<SSEEventType, Set<SSEEventCallback>> = new Map();
  private url: string;
  private maxReconnectAttempts: number;
  private isManuallyDisconnected = false;

  constructor(config: SSEManagerConfig) {
    this.url = config.url;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 10;
    this.reconnectionManager = createReconnectionManager({
      baseDelay: config.baseDelay ?? 1000, // 1 second
      maxDelay: config.maxDelay ?? 30000, // 30 seconds
      maxAttempts: this.maxReconnectAttempts,
    });
  }

  /**
   * Connect to SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.isManuallyDisconnected = false;

    try {
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = () => {
        console.log('[SSE] Connected to', this.url);
        this.reconnectionManager.reset();
        useConnectionStore.getState().setSSEStatus('connected');
        useConnectionStore.getState().resetReconnectAttempts();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.notifyListeners(message.type, message.data);
        } catch (error) {
          console.error('[SSE] Failed to parse message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        useConnectionStore.getState().setSSEStatus('disconnected');
        
        // Only attempt reconnection if not manually disconnected
        if (!this.isManuallyDisconnected) {
          this.handleReconnection();
        }
      };
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      useConnectionStore.getState().setSSEStatus('failed');
      
      if (!this.isManuallyDisconnected) {
        this.handleReconnection();
      }
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private async handleReconnection(): Promise<void> {
    const attempts = this.reconnectionManager.getAttempts();
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached');
      useConnectionStore.getState().setSSEStatus('failed');
      return;
    }

    useConnectionStore.getState().setSSEStatus('reconnecting');
    useConnectionStore.getState().incrementReconnectAttempts();

    const state = this.reconnectionManager.getState();
    console.log(
      `[SSE] Reconnecting in ${state.nextDelay}ms (attempt ${state.attempts + 1}/${this.maxReconnectAttempts})`
    );

    try {
      await this.reconnectionManager.scheduleReconnection();
      
      // Only reconnect if not manually disconnected
      if (!this.isManuallyDisconnected) {
        this.connect();
      }
    } catch (error) {
      console.error('[SSE] Reconnection scheduling failed:', error);
      useConnectionStore.getState().setSSEStatus('failed');
    }
  }

  /**
   * Subscribe to SSE events
   * @param eventType - Type of event to subscribe to
   * @param callback - Callback function to invoke when event is received
   * @returns Unsubscribe function
   */
  subscribe(eventType: SSEEventType, callback: SSEEventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
      
      // Clean up empty listener sets
      if (this.listeners.get(eventType)?.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Notify all listeners for a specific event type
   */
  private notifyListeners(eventType: SSEEventType, data: unknown): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SSE] Error in listener callback for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Disconnect from SSE endpoint
   */
  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.reconnectionManager.cancel();
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      useConnectionStore.getState().setSSEStatus('disconnected');
      console.log('[SSE] Disconnected');
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): 'connected' | 'disconnected' | 'reconnecting' | 'failed' {
    return useConnectionStore.getState().sseStatus;
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
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Get number of active listeners
   */
  getListenerCount(): number {
    let count = 0;
    this.listeners.forEach((listeners) => {
      count += listeners.size;
    });
    return count;
  }
}

/**
 * Create SSE manager instance for fault streaming
 * Default URL: /api/v1/faults/stream
 */
export const createFaultSSEManager = (
  baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
): SSEManager => {
  return new SSEManager({
    url: `${baseUrl}/faults/stream`,
    maxReconnectAttempts: 10,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
  });
};

// Singleton instance for fault streaming
let faultSSEManagerInstance: SSEManager | null = null;

/**
 * Get or create the singleton fault SSE manager instance
 */
export const getFaultSSEManager = (): SSEManager => {
  if (!faultSSEManagerInstance) {
    faultSSEManagerInstance = createFaultSSEManager();
  }
  return faultSSEManagerInstance;
};

/**
 * Reset the singleton instance (useful for testing)
 */
export const resetFaultSSEManager = (): void => {
  if (faultSSEManagerInstance) {
    faultSSEManagerInstance.disconnect();
    faultSSEManagerInstance = null;
  }
};
