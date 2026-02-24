import { create } from 'zustand';

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'failed';

interface ConnectionState {
  // API Gateway connection
  apiStatus: ConnectionStatus;
  setAPIStatus: (status: ConnectionStatus) => void;

  // Server-Sent Events connection
  sseStatus: ConnectionStatus;
  setSSEStatus: (status: ConnectionStatus) => void;

  // WebSocket connection
  wsStatus: ConnectionStatus;
  setWSStatus: (status: ConnectionStatus) => void;

  // Polling fallback
  pollingEnabled: boolean;
  enablePollingFallback: () => void;
  disablePollingFallback: () => void;

  // Connection metadata
  lastConnected: string | null;
  setLastConnected: (timestamp: string) => void;
  reconnectAttempts: number;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // Overall connection health
  isHealthy: () => boolean;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  // API Gateway connection state
  apiStatus: 'disconnected',
  setAPIStatus: (status) => {
    set({ apiStatus: status });
    if (status === 'connected') {
      set({
        lastConnected: new Date().toISOString(),
        reconnectAttempts: 0,
      });
    }
  },

  // SSE connection state
  sseStatus: 'disconnected',
  setSSEStatus: (status) => set({ sseStatus: status }),

  // WebSocket connection state
  wsStatus: 'disconnected',
  setWSStatus: (status) => set({ wsStatus: status }),

  // Polling fallback state
  pollingEnabled: false,
  enablePollingFallback: () => set({ pollingEnabled: true }),
  disablePollingFallback: () => set({ pollingEnabled: false }),

  // Connection metadata
  lastConnected: null,
  setLastConnected: (timestamp) => set({ lastConnected: timestamp }),
  reconnectAttempts: 0,
  incrementReconnectAttempts: () =>
    set((state) => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

  // Overall connection health check
  isHealthy: () => {
    const state = get();
    return (
      state.apiStatus === 'connected' &&
      (state.sseStatus === 'connected' ||
        state.wsStatus === 'connected' ||
        state.pollingEnabled)
    );
  },
}));
