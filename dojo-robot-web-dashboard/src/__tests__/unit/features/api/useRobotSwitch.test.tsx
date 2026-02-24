import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRobotSwitch } from '@/features/api/useRobotSwitch';
import { useRobotStore } from '@/features/stores/robotStore';
import { updateApiBaseUrl } from '@/features/api/client';
import { resetFaultSSEManager } from '@/features/realtime/sseManager';
import { resetWebSocketManager } from '@/features/realtime/websocketManager';

// Mock the modules
vi.mock('@/features/api/client', () => ({
  updateApiBaseUrl: vi.fn(),
}));

vi.mock('@/features/realtime/sseManager', () => ({
  resetFaultSSEManager: vi.fn(),
}));

vi.mock('@/features/realtime/websocketManager', () => ({
  resetWebSocketManager: vi.fn(),
}));

describe('useRobotSwitch', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset store state
    useRobotStore.setState({
      robots: [],
      activeRobotId: null,
    });

    // Create fresh query client
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should not update anything when no robot is active', () => {
    renderHook(() => useRobotSwitch(), { wrapper });

    expect(updateApiBaseUrl).not.toHaveBeenCalled();
    expect(resetFaultSSEManager).not.toHaveBeenCalled();
    expect(resetWebSocketManager).not.toHaveBeenCalled();
  });

  it('should update API base URL when robot is activated', async () => {
    const { addRobot, switchRobot } = useRobotStore.getState();
    const id = addRobot('Test Robot', 'http://localhost:8080');

    renderHook(() => useRobotSwitch(), { wrapper });

    switchRobot(id);

    await waitFor(() => {
      expect(updateApiBaseUrl).toHaveBeenCalledWith('http://localhost:8080/api/v1');
    });
  });

  it('should handle API URL with trailing slash', async () => {
    const { addRobot, switchRobot } = useRobotStore.getState();
    const id = addRobot('Test Robot', 'http://localhost:8080/');

    renderHook(() => useRobotSwitch(), { wrapper });

    switchRobot(id);

    await waitFor(() => {
      expect(updateApiBaseUrl).toHaveBeenCalledWith('http://localhost:8080/api/v1');
    });
  });

  it('should clear React Query cache when switching robots', async () => {
    const { addRobot, switchRobot } = useRobotStore.getState();
    const id = addRobot('Test Robot', 'http://localhost:8080');

    // Add some data to cache
    queryClient.setQueryData(['test'], { data: 'test' });
    expect(queryClient.getQueryData(['test'])).toBeDefined();

    renderHook(() => useRobotSwitch(), { wrapper });

    switchRobot(id);

    // Cache should be cleared
    await waitFor(() => {
      expect(queryClient.getQueryData(['test'])).toBeUndefined();
    });
  });

  it('should disconnect real-time connections when switching robots', async () => {
    const { addRobot, switchRobot } = useRobotStore.getState();
    const id = addRobot('Test Robot', 'http://localhost:8080');

    renderHook(() => useRobotSwitch(), { wrapper });

    switchRobot(id);

    await waitFor(() => {
      expect(resetFaultSSEManager).toHaveBeenCalled();
      expect(resetWebSocketManager).toHaveBeenCalled();
    });
  });

  it('should update when switching between robots', async () => {
    const { addRobot, switchRobot } = useRobotStore.getState();
    const id1 = addRobot('Robot 1', 'http://localhost:8080');
    const id2 = addRobot('Robot 2', 'http://localhost:8081');

    renderHook(() => useRobotSwitch(), { wrapper });

    // Switch to first robot
    switchRobot(id1);
    await waitFor(() => {
      expect(updateApiBaseUrl).toHaveBeenCalledWith('http://localhost:8080/api/v1');
    });

    // Switch to second robot
    switchRobot(id2);
    await waitFor(() => {
      expect(updateApiBaseUrl).toHaveBeenCalledWith('http://localhost:8081/api/v1');
      expect(updateApiBaseUrl).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle HTTPS URLs', async () => {
    const { addRobot, switchRobot } = useRobotStore.getState();
    const id = addRobot('Secure Robot', 'https://robot.example.com:8080');

    renderHook(() => useRobotSwitch(), { wrapper });

    switchRobot(id);

    await waitFor(() => {
      expect(updateApiBaseUrl).toHaveBeenCalledWith('https://robot.example.com:8080/api/v1');
    });
  });
});
