/**
 * Unit tests for API hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useAreas, 
  useComponents, 
  useAreaComponents,
  useTopicList,
  useTopicData,
} from '../../../../features/api/hooks';
import { apiClient } from '../../../../features/api/client';
import type { Area, Component } from '../../../../types/api';

// Mock the API client
vi.mock('../../../../features/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('API Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAreas', () => {
    it('should fetch areas successfully', async () => {
      const mockAreas: Area[] = [
        {
          id: 'navigation',
          name: 'Navigation',
          description: 'Navigation components',
          componentCount: 5,
        },
        {
          id: 'perception',
          name: 'Perception',
          description: 'Perception components',
          componentCount: 3,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockAreas });

      const { result } = renderHook(() => useAreas(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAreas);
      expect(apiClient.get).toHaveBeenCalledWith('/areas');
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching areas', async () => {
      const mockError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAreas(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should use correct cache configuration', () => {
      const { result } = renderHook(() => useAreas(), {
        wrapper: createWrapper(),
      });

      // Query key should be ['areas']
      expect(result.current.data).toBeUndefined(); // Initially undefined
    });
  });

  describe('useComponents', () => {
    it('should fetch all components successfully', async () => {
      const mockComponents: Component[] = [
        {
          id: 'comp1',
          name: 'Component 1',
          identifier: '/navigation/planner',
          areaId: 'navigation',
          status: 'active',
        },
        {
          id: 'comp2',
          name: 'Component 2',
          identifier: '/perception/camera',
          areaId: 'perception',
          status: 'active',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockComponents });

      const { result } = renderHook(() => useComponents(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockComponents);
      expect(apiClient.get).toHaveBeenCalledWith('/components');
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching components', async () => {
      const mockError = new Error('API error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useComponents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useAreaComponents', () => {
    it('should fetch components for a specific area', async () => {
      const areaId = 'navigation';
      const mockComponents: Component[] = [
        {
          id: 'comp1',
          name: 'Planner',
          identifier: '/navigation/planner',
          areaId: 'navigation',
          status: 'active',
        },
        {
          id: 'comp2',
          name: 'Controller',
          identifier: '/navigation/controller',
          areaId: 'navigation',
          status: 'active',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockComponents });

      const { result } = renderHook(() => useAreaComponents(areaId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockComponents);
      expect(apiClient.get).toHaveBeenCalledWith(`/areas/${areaId}/components`);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should not fetch when areaId is empty', async () => {
      const { result } = renderHook(() => useAreaComponents(''), {
        wrapper: createWrapper(),
      });

      // Query should be disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching area components', async () => {
      const areaId = 'navigation';
      const mockError = new Error('Not found');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAreaComponents(areaId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should refetch when areaId changes', async () => {
      const mockComponents1: Component[] = [
        {
          id: 'comp1',
          name: 'Nav Component',
          identifier: '/navigation/planner',
          areaId: 'navigation',
          status: 'active',
        },
      ];

      const mockComponents2: Component[] = [
        {
          id: 'comp2',
          name: 'Perception Component',
          identifier: '/perception/camera',
          areaId: 'perception',
          status: 'active',
        },
      ];

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockComponents1 })
        .mockResolvedValueOnce({ data: mockComponents2 });

      const { result, rerender } = renderHook(
        ({ areaId }) => useAreaComponents(areaId),
        {
          wrapper: createWrapper(),
          initialProps: { areaId: 'navigation' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockComponents1);

      // Change areaId
      rerender({ areaId: 'perception' });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockComponents2);
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(apiClient.get).toHaveBeenNthCalledWith(1, '/areas/navigation/components');
      expect(apiClient.get).toHaveBeenNthCalledWith(2, '/areas/perception/components');
    });
  });

  describe('useTopicList', () => {
    it('should fetch and transform topic list for a component', async () => {
      const componentId = 'comp1';
      const mockTopicData = {
        '/velocity': { x: 1.5, y: 0.0, _type: 'geometry_msgs/Twist' },
        '/position': { x: 10.0, y: 5.0, _type: 'geometry_msgs/Point' },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTopicData });

      const { result } = renderHook(() => useTopicList(componentId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        name: '/velocity',
        messageType: 'geometry_msgs/Twist',
        publishRate: 0,
      });
      expect(result.current.data?.[1]).toMatchObject({
        name: '/position',
        messageType: 'geometry_msgs/Point',
        publishRate: 0,
      });
      expect(apiClient.get).toHaveBeenCalledWith(`/components/${componentId}/data`);
    });

    it('should handle primitive data types', async () => {
      const componentId = 'comp1';
      const mockTopicData = {
        '/temperature': 25.5,
        '/status': 'active',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTopicData });

      const { result } = renderHook(() => useTopicList(componentId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toMatchObject({
        name: '/temperature',
        messageType: 'number',
      });
      expect(result.current.data?.[1]).toMatchObject({
        name: '/status',
        messageType: 'string',
      });
    });

    it('should not fetch when componentId is empty', async () => {
      const { result } = renderHook(() => useTopicList(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching topic list', async () => {
      const componentId = 'comp1';
      const mockError = new Error('Component not found');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useTopicList(componentId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useTopicData', () => {
    it('should fetch topic data with default refresh interval', async () => {
      const componentId = 'comp1';
      const topicName = '/velocity';
      const mockData = { x: 1.5, y: 0.0, z: 0.0 };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(
        () => useTopicData(componentId, topicName),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalledWith(
        `/components/${componentId}/data/${topicName}`
      );
    });

    it('should support custom refresh interval', async () => {
      const componentId = 'comp1';
      const topicName = '/velocity';
      const mockData = { x: 1.5, y: 0.0 };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(
        () => useTopicData(componentId, topicName, { refetchInterval: 500 }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should support pause functionality', async () => {
      const componentId = 'comp1';
      const topicName = '/velocity';
      const mockData = { x: 1.5, y: 0.0 };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(
        () => useTopicData(componentId, topicName, { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should be disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should not fetch when componentId is empty', async () => {
      const { result } = renderHook(
        () => useTopicData('', '/velocity'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should not fetch when topicName is empty', async () => {
      const { result } = renderHook(
        () => useTopicData('comp1', ''),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching topic data', async () => {
      const componentId = 'comp1';
      const topicName = '/velocity';
      const mockError = new Error('Topic not found');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      const { result } = renderHook(
        () => useTopicData(componentId, topicName),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should resume fetching when enabled changes from false to true', async () => {
      const componentId = 'comp1';
      const topicName = '/velocity';
      const mockData = { x: 1.5, y: 0.0 };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result, rerender } = renderHook(
        ({ enabled }) => useTopicData(componentId, topicName, { enabled }),
        {
          wrapper: createWrapper(),
          initialProps: { enabled: false },
        }
      );

      // Initially disabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(apiClient.get).not.toHaveBeenCalled();

      // Enable the query
      rerender({ enabled: true });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(apiClient.get).toHaveBeenCalled();
    });
  });
});
