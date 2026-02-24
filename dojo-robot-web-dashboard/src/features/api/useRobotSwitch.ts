import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRobotStore } from '@/features/stores/robotStore';
import { updateApiBaseUrl } from './client';
import { resetFaultSSEManager } from '../realtime/sseManager';
import { resetWebSocketManager } from '../realtime/websocketManager';

/**
 * Hook to handle robot switching
 * - Updates API client base URL
 * - Clears React Query cache
 * - Disconnects real-time connections
 */
export const useRobotSwitch = () => {
  const queryClient = useQueryClient();
  const activeRobotId = useRobotStore((state) => state.activeRobotId);
  const getActiveRobot = useRobotStore((state) => state.getActiveRobot);

  useEffect(() => {
    const activeRobot = getActiveRobot();

    if (activeRobot) {
      // Update API client base URL
      const baseUrl = activeRobot.apiUrl.endsWith('/')
        ? `${activeRobot.apiUrl}api/v1`
        : `${activeRobot.apiUrl}/api/v1`;
      
      updateApiBaseUrl(baseUrl);

      // Clear React Query cache to remove stale data from previous robot
      queryClient.clear();

      // Disconnect and reset real-time connections
      resetFaultSSEManager();
      resetWebSocketManager();

      console.log(`[Robot Switch] Switched to robot: ${activeRobot.name} (${activeRobot.apiUrl})`);
    }
  }, [activeRobotId, getActiveRobot, queryClient]);
};
