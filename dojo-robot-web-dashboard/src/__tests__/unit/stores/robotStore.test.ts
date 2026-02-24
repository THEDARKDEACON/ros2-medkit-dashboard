import { describe, it, expect, beforeEach } from 'vitest';
import { useRobotStore } from '@/features/stores/robotStore';

describe('robotStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useRobotStore.setState({
      robots: [],
      activeRobotId: null,
    });
  });

  describe('addRobot', () => {
    it('should add a new robot instance', () => {
      const { addRobot, robots } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');

      const state = useRobotStore.getState();
      expect(state.robots).toHaveLength(1);
      expect(state.robots[0]).toMatchObject({
        id,
        name: 'Test Robot',
        apiUrl: 'http://localhost:8080',
        isActive: false,
      });
    });

    it('should generate unique IDs for each robot', () => {
      const { addRobot } = useRobotStore.getState();
      const id1 = addRobot('Robot 1', 'http://localhost:8080');
      const id2 = addRobot('Robot 2', 'http://localhost:8081');

      expect(id1).not.toBe(id2);
    });

    it('should allow multiple robots with different URLs', () => {
      const { addRobot } = useRobotStore.getState();
      addRobot('Robot 1', 'http://localhost:8080');
      addRobot('Robot 2', 'http://localhost:8081');
      addRobot('Robot 3', 'http://localhost:8082');

      const state = useRobotStore.getState();
      expect(state.robots).toHaveLength(3);
    });
  });

  describe('removeRobot', () => {
    it('should remove a robot by ID', () => {
      const { addRobot, removeRobot } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');

      removeRobot(id);

      const state = useRobotStore.getState();
      expect(state.robots).toHaveLength(0);
    });

    it('should clear activeRobotId when removing active robot', () => {
      const { addRobot, switchRobot, removeRobot } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');
      switchRobot(id);

      removeRobot(id);

      const state = useRobotStore.getState();
      expect(state.activeRobotId).toBeNull();
    });

    it('should preserve activeRobotId when removing non-active robot', () => {
      const { addRobot, switchRobot, removeRobot } = useRobotStore.getState();
      const id1 = addRobot('Robot 1', 'http://localhost:8080');
      const id2 = addRobot('Robot 2', 'http://localhost:8081');
      switchRobot(id1);

      removeRobot(id2);

      const state = useRobotStore.getState();
      expect(state.activeRobotId).toBe(id1);
    });

    it('should handle removing non-existent robot gracefully', () => {
      const { addRobot, removeRobot } = useRobotStore.getState();
      addRobot('Test Robot', 'http://localhost:8080');

      removeRobot('non-existent-id');

      const state = useRobotStore.getState();
      expect(state.robots).toHaveLength(1);
    });
  });

  describe('switchRobot', () => {
    it('should activate the selected robot', () => {
      const { addRobot, switchRobot } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');

      switchRobot(id);

      const state = useRobotStore.getState();
      expect(state.activeRobotId).toBe(id);
      expect(state.robots[0].isActive).toBe(true);
    });

    it('should deactivate previously active robot', () => {
      const { addRobot, switchRobot } = useRobotStore.getState();
      const id1 = addRobot('Robot 1', 'http://localhost:8080');
      const id2 = addRobot('Robot 2', 'http://localhost:8081');

      switchRobot(id1);
      switchRobot(id2);

      const state = useRobotStore.getState();
      const robot1 = state.robots.find((r) => r.id === id1);
      const robot2 = state.robots.find((r) => r.id === id2);

      expect(robot1?.isActive).toBe(false);
      expect(robot2?.isActive).toBe(true);
      expect(state.activeRobotId).toBe(id2);
    });

    it('should update lastConnected timestamp when switching', () => {
      const { addRobot, switchRobot } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');

      const beforeSwitch = new Date().toISOString();
      switchRobot(id);
      const afterSwitch = new Date().toISOString();

      const state = useRobotStore.getState();
      const robot = state.robots[0];

      expect(robot.lastConnected).toBeDefined();
      expect(robot.lastConnected! >= beforeSwitch).toBe(true);
      expect(robot.lastConnected! <= afterSwitch).toBe(true);
    });

    it('should handle switching to non-existent robot', () => {
      const { addRobot, switchRobot } = useRobotStore.getState();
      addRobot('Test Robot', 'http://localhost:8080');

      switchRobot('non-existent-id');

      const state = useRobotStore.getState();
      expect(state.activeRobotId).toBeNull();
    });
  });

  describe('updateRobot', () => {
    it('should update robot properties', () => {
      const { addRobot, updateRobot } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');

      updateRobot(id, { name: 'Updated Robot', apiUrl: 'http://localhost:9090' });

      const state = useRobotStore.getState();
      expect(state.robots[0]).toMatchObject({
        id,
        name: 'Updated Robot',
        apiUrl: 'http://localhost:9090',
      });
    });

    it('should update only specified properties', () => {
      const { addRobot, updateRobot } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');

      updateRobot(id, { name: 'Updated Name' });

      const state = useRobotStore.getState();
      expect(state.robots[0]).toMatchObject({
        id,
        name: 'Updated Name',
        apiUrl: 'http://localhost:8080',
      });
    });

    it('should not affect other robots', () => {
      const { addRobot, updateRobot } = useRobotStore.getState();
      const id1 = addRobot('Robot 1', 'http://localhost:8080');
      const id2 = addRobot('Robot 2', 'http://localhost:8081');

      updateRobot(id1, { name: 'Updated Robot 1' });

      const state = useRobotStore.getState();
      const robot2 = state.robots.find((r) => r.id === id2);
      expect(robot2?.name).toBe('Robot 2');
    });
  });

  describe('getActiveRobot', () => {
    it('should return the active robot', () => {
      const { addRobot, switchRobot, getActiveRobot } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');
      switchRobot(id);

      const activeRobot = getActiveRobot();

      expect(activeRobot).toMatchObject({
        id,
        name: 'Test Robot',
        apiUrl: 'http://localhost:8080',
        isActive: true,
      });
    });

    it('should return null when no robot is active', () => {
      const { addRobot, getActiveRobot } = useRobotStore.getState();
      addRobot('Test Robot', 'http://localhost:8080');

      const activeRobot = getActiveRobot();

      expect(activeRobot).toBeNull();
    });

    it('should return null when robots list is empty', () => {
      const { getActiveRobot } = useRobotStore.getState();

      const activeRobot = getActiveRobot();

      expect(activeRobot).toBeNull();
    });
  });

  describe('getRobotById', () => {
    it('should return robot by ID', () => {
      const { addRobot, getRobotById } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');

      const robot = getRobotById(id);

      expect(robot).toMatchObject({
        id,
        name: 'Test Robot',
        apiUrl: 'http://localhost:8080',
      });
    });

    it('should return undefined for non-existent ID', () => {
      const { addRobot, getRobotById } = useRobotStore.getState();
      addRobot('Test Robot', 'http://localhost:8080');

      const robot = getRobotById('non-existent-id');

      expect(robot).toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('should persist robots and activeRobotId', () => {
      const { addRobot, switchRobot } = useRobotStore.getState();
      const id = addRobot('Test Robot', 'http://localhost:8080');
      switchRobot(id);

      const state = useRobotStore.getState();
      expect(state.robots).toHaveLength(1);
      expect(state.activeRobotId).toBe(id);
    });
  });
});
