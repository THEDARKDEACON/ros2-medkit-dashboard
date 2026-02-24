import { describe, it, expect, beforeEach } from 'vitest';
import { useConnectionStore } from '../../../features/stores/connectionStore';

describe('connectionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useConnectionStore.setState({
      apiStatus: 'disconnected',
      sseStatus: 'disconnected',
      wsStatus: 'disconnected',
      pollingEnabled: false,
      lastConnected: null,
      reconnectAttempts: 0,
    });
  });

  describe('API connection status', () => {
    it('should set API status', () => {
      const { setAPIStatus } = useConnectionStore.getState();
      setAPIStatus('connected');
      expect(useConnectionStore.getState().apiStatus).toBe('connected');
    });

    it('should update lastConnected when API connects', () => {
      const { setAPIStatus } = useConnectionStore.getState();
      setAPIStatus('connected');
      expect(useConnectionStore.getState().lastConnected).not.toBeNull();
    });

    it('should reset reconnect attempts when API connects', () => {
      const { setAPIStatus, incrementReconnectAttempts } =
        useConnectionStore.getState();
      incrementReconnectAttempts();
      incrementReconnectAttempts();
      expect(useConnectionStore.getState().reconnectAttempts).toBe(2);
      setAPIStatus('connected');
      expect(useConnectionStore.getState().reconnectAttempts).toBe(0);
    });
  });

  describe('SSE connection status', () => {
    it('should set SSE status', () => {
      const { setSSEStatus } = useConnectionStore.getState();
      setSSEStatus('connected');
      expect(useConnectionStore.getState().sseStatus).toBe('connected');
    });
  });

  describe('WebSocket connection status', () => {
    it('should set WebSocket status', () => {
      const { setWSStatus } = useConnectionStore.getState();
      setWSStatus('connected');
      expect(useConnectionStore.getState().wsStatus).toBe('connected');
    });
  });

  describe('polling fallback', () => {
    it('should enable polling fallback', () => {
      const { enablePollingFallback } = useConnectionStore.getState();
      enablePollingFallback();
      expect(useConnectionStore.getState().pollingEnabled).toBe(true);
    });

    it('should disable polling fallback', () => {
      const { enablePollingFallback, disablePollingFallback } =
        useConnectionStore.getState();
      enablePollingFallback();
      disablePollingFallback();
      expect(useConnectionStore.getState().pollingEnabled).toBe(false);
    });
  });

  describe('reconnect attempts', () => {
    it('should increment reconnect attempts', () => {
      const { incrementReconnectAttempts } =
        useConnectionStore.getState();
      incrementReconnectAttempts();
      expect(useConnectionStore.getState().reconnectAttempts).toBe(1);
      incrementReconnectAttempts();
      expect(useConnectionStore.getState().reconnectAttempts).toBe(2);
    });

    it('should reset reconnect attempts', () => {
      const { incrementReconnectAttempts, resetReconnectAttempts } =
        useConnectionStore.getState();
      incrementReconnectAttempts();
      incrementReconnectAttempts();
      resetReconnectAttempts();
      expect(useConnectionStore.getState().reconnectAttempts).toBe(0);
    });
  });

  describe('connection health', () => {
    it('should be healthy when API and SSE are connected', () => {
      const { setAPIStatus, setSSEStatus, isHealthy } =
        useConnectionStore.getState();
      setAPIStatus('connected');
      setSSEStatus('connected');
      expect(isHealthy()).toBe(true);
    });

    it('should be healthy when API and WebSocket are connected', () => {
      const { setAPIStatus, setWSStatus, isHealthy } =
        useConnectionStore.getState();
      setAPIStatus('connected');
      setWSStatus('connected');
      expect(isHealthy()).toBe(true);
    });

    it('should be healthy when API is connected and polling is enabled', () => {
      const { setAPIStatus, enablePollingFallback, isHealthy } =
        useConnectionStore.getState();
      setAPIStatus('connected');
      enablePollingFallback();
      expect(isHealthy()).toBe(true);
    });

    it('should not be healthy when API is disconnected', () => {
      const { setSSEStatus, isHealthy } = useConnectionStore.getState();
      setSSEStatus('connected');
      expect(isHealthy()).toBe(false);
    });

    it('should not be healthy when no real-time connection exists', () => {
      const { setAPIStatus, isHealthy } = useConnectionStore.getState();
      setAPIStatus('connected');
      expect(isHealthy()).toBe(false);
    });
  });
});
