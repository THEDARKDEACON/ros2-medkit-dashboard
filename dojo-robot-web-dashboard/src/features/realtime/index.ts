/**
 * Real-time communication module
 * Exports SSE manager and related utilities
 */

export {
  SSEManager,
  createFaultSSEManager,
  getFaultSSEManager,
  resetFaultSSEManager,
  type SSEMessage,
  type SSEEventType,
  type SSEEventCallback,
  type SSEManagerConfig,
} from './sseManager';
