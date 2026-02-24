import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useRobotStore = create<RobotState>()(
  persist(
    (set, get) => ({
      // Initial state
      robots: [],
      activeRobotId: null,

      // Add a new robot instance
      addRobot: (name: string, apiUrl: string) => {
        const id = `robot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newRobot: RobotInstance = {
          id,
          name,
          apiUrl,
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
