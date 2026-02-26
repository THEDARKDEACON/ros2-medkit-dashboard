import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateApiBaseUrl } from '../api/client';
import { QueryClient } from '@tanstack/react-query';

// Reference to the app's QueryClient, set by the app on startup
let queryClientRef: QueryClient | null = null;
export const setQueryClientRef = (qc: QueryClient) => {
  queryClientRef = qc;
};

export interface RobotInstance {
  id: string;
  name: string;
  apiUrl: string;
  isActive: boolean;
  lastConnected?: string;
}

interface RobotState {
  // Robot instances
  robots: RobotInstance[];
  activeRobotId: string | null;

  // Actions
  addRobot: (name: string, apiUrl: string) => string;
  removeRobot: (id: string) => void;
  switchRobot: (id: string) => void;
  updateRobot: (id: string, updates: Partial<Omit<RobotInstance, 'id'>>) => void;
  getActiveRobot: () => RobotInstance | null;
  getRobotById: (id: string) => RobotInstance | undefined;
}

/**
 * Normalize a user-entered API URL to a base URL for axios.
 * Accepts formats like:
 *   http://localhost:8080/api/v1/
 *   http://localhost:8080/api/v1
 *   http://localhost:8080/
 *   http://localhost:8080
 * Always returns the full URL with /api/v1 path.
 */
function normalizeApiUrl(url: string): string {
  let normalized = url.trim().replace(/\/+$/, ''); // strip trailing slashes
  // If it already ends with /api/v1, use as-is
  if (normalized.endsWith('/api/v1')) {
    return normalized;
  }
  // If it ends with /api, append /v1
  if (normalized.endsWith('/api')) {
    return normalized + '/v1';
  }
  // Otherwise append /api/v1
  return normalized + '/api/v1';
}

export const useRobotStore = create<RobotState>()(
  persist(
    (set, get) => ({
      // Initial state
      robots: [],
      activeRobotId: null,

      // Add a new robot instance
      addRobot: (name: string, apiUrl: string) => {
        const id = `robot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const normalizedUrl = normalizeApiUrl(apiUrl);
        const newRobot: RobotInstance = {
          id,
          name,
          apiUrl: normalizedUrl,
          isActive: false,
          lastConnected: undefined,
        };

        set((state) => ({
          robots: [...state.robots, newRobot],
        }));

        return id;
      },

      // Remove a robot instance
      removeRobot: (id: string) => {
        set((state) => {
          const newRobots = state.robots.filter((robot) => robot.id !== id);
          const newActiveRobotId =
            state.activeRobotId === id ? null : state.activeRobotId;

          // If the removed robot was active, reset to default
          if (state.activeRobotId === id) {
            updateApiBaseUrl('/api/v1');
          }

          return {
            robots: newRobots,
            activeRobotId: newActiveRobotId,
          };
        });
      },

      // Switch to a different robot
      switchRobot: (id: string) => {
        set((state) => {
          const robot = state.robots.find((r) => r.id === id);
          if (!robot) {
            console.warn(`Robot with id ${id} not found`);
            return state;
          }

          // Update axios base URL to the robot's API URL
          updateApiBaseUrl(robot.apiUrl);
          console.log(`[Robot] Switched to ${robot.name} at ${robot.apiUrl}`);

          // Invalidate all react-query caches to refetch for new robot
          if (queryClientRef) {
            queryClientRef.invalidateQueries();
          }

          // Deactivate all robots and activate the selected one
          const updatedRobots = state.robots.map((r) => ({
            ...r,
            isActive: r.id === id,
            lastConnected: r.id === id ? new Date().toISOString() : r.lastConnected,
          }));

          return {
            robots: updatedRobots,
            activeRobotId: id,
          };
        });
      },

      // Update robot properties
      updateRobot: (id: string, updates: Partial<Omit<RobotInstance, 'id'>>) => {
        set((state) => ({
          robots: state.robots.map((robot) =>
            robot.id === id ? { ...robot, ...updates } : robot
          ),
        }));
      },

      // Get the currently active robot
      getActiveRobot: () => {
        const state = get();
        if (!state.activeRobotId) return null;
        return state.robots.find((r) => r.id === state.activeRobotId) || null;
      },

      // Get robot by ID
      getRobotById: (id: string) => {
        const state = get();
        return state.robots.find((r) => r.id === id);
      },
    }),
    {
      name: 'robot-storage', // localStorage key
      partialize: (state) => ({
        robots: state.robots,
        activeRobotId: state.activeRobotId,
      }),
    }
  )
);
