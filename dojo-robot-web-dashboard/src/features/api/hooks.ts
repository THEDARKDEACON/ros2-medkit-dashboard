/**
 * React Query hooks for API data fetching
 * Provides hooks for areas, components, and other API resources
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Area, Component, Topic, Operation, Execution } from '../../types/api';

/**
 * Fetch all areas
 * 
 * Areas are logical groupings of components. This hook fetches the complete
 * list of areas with their metadata and component counts.
 * 
 * Cache configuration:
 * - staleTime: 5 minutes (areas are relatively static)
 * - gcTime: 10 minutes (keep in cache for 10 minutes after last use)
 * 
 * @returns React Query result with areas data
 * 
 * @example
 * ```tsx
 * const { data: areas, isLoading, error } = useAreas();
 * ```
 */
export const useAreas = () => {
  return useQuery({
    queryKey: ['areas'],
    queryFn: () => apiClient.get<Area[]>('/areas').then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch all components across all areas
 * 
 * This hook fetches the complete list of components without area filtering.
 * Useful for global component search and overview displays.
 * 
 * Cache configuration:
 * - staleTime: 5 minutes (component list is relatively static)
 * - gcTime: 10 minutes (keep in cache for 10 minutes after last use)
 * 
 * @returns React Query result with components data
 * 
 * @example
 * ```tsx
 * const { data: components, isLoading, error } = useComponents();
 * ```
 */
export const useComponents = () => {
  return useQuery({
    queryKey: ['components'],
    queryFn: () =>
      apiClient.get<Component[]>('/components').then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch components for a specific area
 * 
 * This hook fetches components filtered by area ID. The query is only enabled
 * when a valid areaId is provided.
 * 
 * Cache configuration:
 * - staleTime: 5 minutes (component list is relatively static)
 * - gcTime: 10 minutes (keep in cache for 10 minutes after last use)
 * - enabled: Only runs when areaId is truthy
 * 
 * @param areaId - The ID of the area to fetch components for
 * @returns React Query result with area-specific components data
 * 
 * @example
 * ```tsx
 * const { data: components, isLoading } = useAreaComponents('navigation');
 * ```
 */
export const useAreaComponents = (areaId: string) => {
  return useQuery({
    queryKey: ['areas', areaId, 'components'],
    queryFn: () =>
      apiClient
        .get<Component[]>(`/areas/${areaId}/components`)
        .then((res) => res.data),
    enabled: !!areaId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch topic data for a specific component
 * 
 * This hook fetches all topic data for a component. The query is only enabled
 * when a valid componentId is provided.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the component to fetch topic data for
 * @returns React Query result with component topic data
 * 
 * @example
 * ```tsx
 * const { data: topicData, isLoading } = useComponentTopicData('comp1');
 * ```
 */
export const useComponentTopicData = (componentId: string) => {
  return useQuery({
    queryKey: ['components', componentId, 'data'],
    queryFn: () =>
      apiClient
        .get<Record<string, unknown>>(`/components/${componentId}/data`)
        .then((res) => res.data),
    enabled: !!componentId,
    staleTime: 0, // Always consider stale for real-time data
    gcTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Fetch list of topics for a specific component
 * 
 * This hook fetches all available topics for a component, returning topic metadata
 * including message types and current values. This is used to display the topic list
 * in the component detail view.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the component to fetch topics for
 * @returns React Query result with array of topics
 * 
 * @example
 * ```tsx
 * const { data: topics, isLoading } = useTopicList('comp1');
 * ```
 */
export const useTopicList = (componentId: string) => {
  return useQuery({
    queryKey: ['components', componentId, 'topics'],
    queryFn: async () => {
      // Fetch all topic data for the component
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      // Transform the data object into an array of Topic objects
      const topicData = response.data;
      const topics: Topic[] = Object.entries(topicData).map(([name, data]) => ({
        name,
        messageType: typeof data === 'object' && data !== null 
          ? (data as any)._type || 'unknown'
          : typeof data,
        publishRate: 0, // Will be updated by real-time monitoring
        lastUpdate: new Date().toISOString(),
        data,
      }));
      
      return topics;
    },
    enabled: !!componentId,
    staleTime: 0, // Always consider stale for real-time data
    gcTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Fetch data for a specific topic with auto-refresh
 * 
 * This hook fetches data for a specific topic on a component with automatic
 * refresh at configurable intervals. It supports pause/resume functionality
 * through the enabled parameter.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 1 second)
 * - enabled: Only runs when componentId, topicName are truthy and not paused
 * 
 * @param componentId - The ID of the component
 * @param topicName - The name of the topic to fetch
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 1000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with topic data
 * 
 * @example
 * ```tsx
 * // Basic usage with default 1-second refresh
 * const { data, isLoading } = useTopicData('comp1', '/velocity');
 * 
 * // Custom refresh interval (500ms)
 * const { data } = useTopicData('comp1', '/velocity', { refetchInterval: 500 });
 * 
 * // With pause/resume control
 * const [isPaused, setIsPaused] = useState(false);
 * const { data } = useTopicData('comp1', '/velocity', { enabled: !isPaused });
 * ```
 */
export const useTopicData = (
  componentId: string,
  topicName: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 1000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'topics', topicName, 'data'],
    queryFn: () =>
      apiClient
        .get<unknown>(`/components/${componentId}/data/${topicName}`)
        .then((res) => res.data),
    enabled: !!componentId && !!topicName && enabled,
    staleTime: 0, // Always consider stale for real-time data
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Publish a message to a topic
 * 
 * This mutation hook publishes a message to a specific topic on a component.
 * It includes optimistic updates for immediate feedback and automatically
 * invalidates the topic data cache on success.
 * 
 * The mutation sends a PUT request to /api/v1/components/{component_id}/data/{topic_name}
 * with the message payload in the request body.
 * 
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic cache invalidation on success
 * - Error handling with detailed error messages
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const publishTopic = usePublishTopic();
 * 
 * const handlePublish = async () => {
 *   try {
 *     await publishTopic.mutateAsync({
 *       componentId: 'comp1',
 *       topicName: '/velocity',
 *       message: { linear: { x: 1.0, y: 0, z: 0 } }
 *     });
 *     toast.success('Message published successfully');
 *   } catch (error) {
 *     toast.error('Failed to publish message');
 *   }
 * };
 * ```
 */
export const usePublishTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      componentId,
      topicName,
      message,
    }: {
      componentId: string;
      topicName: string;
      message: unknown;
    }) =>
      apiClient
        .put(`/components/${componentId}/data/${topicName}`, message)
        .then((res) => res.data),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for this topic
      await queryClient.cancelQueries({
        queryKey: [
          'components',
          variables.componentId,
          'topics',
          variables.topicName,
          'data',
        ],
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData([
        'components',
        variables.componentId,
        'topics',
        variables.topicName,
        'data',
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        [
          'components',
          variables.componentId,
          'topics',
          variables.topicName,
          'data',
        ],
        variables.message
      );

      // Return context with previous data for rollback
      return { previousData };
    },
    onError: (_err, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(
          [
            'components',
            variables.componentId,
            'topics',
            variables.topicName,
            'data',
          ],
          context.previousData
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate topic data to refetch
      queryClient.invalidateQueries({
        queryKey: [
          'components',
          variables.componentId,
          'topics',
          variables.topicName,
          'data',
        ],
      });
    },
  });
};

/**
 * Fetch operations for a specific component
 * 
 * This hook fetches all available operations (services and actions) for a component.
 * Operations include their type, parameters, and descriptions.
 * 
 * Cache configuration:
 * - staleTime: 5 minutes (operations are relatively static)
 * - gcTime: 10 minutes (keep in cache for 10 minutes after last use)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the component to fetch operations for
 * @returns React Query result with array of operations
 * 
 * @example
 * ```tsx
 * const { data: operations, isLoading } = useOperations('comp1');
 * ```
 */
export const useOperations = (componentId: string) => {
  return useQuery({
    queryKey: ['components', componentId, 'operations'],
    queryFn: () =>
      apiClient
        .get<Operation[]>(`/components/${componentId}/operations`)
        .then((res) => res.data),
    enabled: !!componentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Execute an operation (service or action)
 * 
 * This mutation hook executes an operation on a component with the provided parameters.
 * It sends a POST request to /api/v1/components/{component_id}/operations/{operation_id}/executions.
 * 
 * For services, the response includes the immediate result.
 * For actions, the response includes an execution ID for status polling.
 * 
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic cache invalidation on success
 * - Error handling with detailed error messages
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const executeOperation = useExecuteOperation();
 * 
 * const handleExecute = async () => {
 *   try {
 *     const result = await executeOperation.mutateAsync({
 *       componentId: 'comp1',
 *       operationId: 'navigate_to_pose',
 *       parameters: { x: 1.0, y: 2.0, theta: 0.0 }
 *     });
 *     toast.success('Operation executed successfully');
 *   } catch (error) {
 *     toast.error('Failed to execute operation');
 *   }
 * };
 * ```
 */
export const useExecuteOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      componentId,
      operationId,
      parameters,
    }: {
      componentId: string;
      operationId: string;
      parameters: Record<string, unknown>;
    }) =>
      apiClient
        .post<Execution>(
          `/components/${componentId}/operations/${operationId}/executions`,
          { parameters }
        )
        .then((res) => res.data),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for executions
      await queryClient.cancelQueries({
        queryKey: [
          'components',
          variables.componentId,
          'operations',
          variables.operationId,
          'executions',
        ],
      });

      // Snapshot the previous value for rollback
      const previousExecutions = queryClient.getQueryData([
        'components',
        variables.componentId,
        'operations',
        variables.operationId,
        'executions',
      ]);

      // Optimistically add a pending execution
      queryClient.setQueryData(
        [
          'components',
          variables.componentId,
          'operations',
          variables.operationId,
          'executions',
        ],
        (old: Execution[] = []) => [
          ...old,
          {
            id: 'temp-' + Date.now(),
            operationId: variables.operationId,
            status: 'pending' as const,
            startTime: new Date().toISOString(),
          },
        ]
      );

      // Return context with previous data for rollback
      return { previousExecutions };
    },
    onError: (_err, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousExecutions !== undefined) {
        queryClient.setQueryData(
          [
            'components',
            variables.componentId,
            'operations',
            variables.operationId,
            'executions',
          ],
          context.previousExecutions
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate executions to refetch
      queryClient.invalidateQueries({
        queryKey: [
          'components',
          variables.componentId,
          'operations',
          variables.operationId,
          'executions',
        ],
      });
    },
  });
};

/**
 * Fetch execution status for an operation
 * 
 * This hook fetches the current status of an operation execution.
 * It supports automatic polling for active executions (pending/running status).
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable polling interval (default: 1000ms)
 * - enabled: Only runs when all IDs are truthy and polling is enabled
 * 
 * @param componentId - The ID of the component
 * @param operationId - The ID of the operation
 * @param executionId - The ID of the execution
 * @param options - Configuration options
 * @param options.refetchInterval - Polling interval in milliseconds (default: 1000)
 * @param options.enabled - Whether polling is enabled (default: true)
 * @returns React Query result with execution status
 * 
 * @example
 * ```tsx
 * // Basic usage with default 1-second polling
 * const { data: execution, isLoading } = useExecutionStatus(
 *   'comp1',
 *   'navigate_to_pose',
 *   'exec123'
 * );
 * 
 * // Stop polling when execution is complete
 * const { data: execution } = useExecutionStatus(
 *   'comp1',
 *   'navigate_to_pose',
 *   'exec123',
 *   {
 *     enabled: execution?.status === 'running' || execution?.status === 'pending'
 *   }
 * );
 * ```
 */
export const useExecutionStatus = (
  componentId: string,
  operationId: string,
  executionId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 1000, enabled = true } = options || {};

  return useQuery({
    queryKey: [
      'components',
      componentId,
      'operations',
      operationId,
      'executions',
      executionId,
    ],
    queryFn: () =>
      apiClient
        .get<Execution>(
          `/components/${componentId}/operations/${operationId}/executions/${executionId}`
        )
        .then((res) => res.data),
    enabled: !!componentId && !!operationId && !!executionId && enabled,
    staleTime: 0, // Always consider stale for real-time data
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: (query) => {
      // Stop polling if execution is complete
      const data = query.state.data as Execution | undefined;
      if (
        data &&
        (data.status === 'succeeded' ||
          data.status === 'failed' ||
          data.status === 'cancelled')
      ) {
        return false;
      }
      return enabled ? refetchInterval : false;
    },
  });
};

/**
 * Cancel an active action execution
 * 
 * This mutation hook cancels an active action execution by sending a DELETE request
 * to /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id}.
 * 
 * Only actions with status 'pending' or 'running' can be cancelled.
 * 
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic cache invalidation on success
 * - Error handling with detailed error messages
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const cancelExecution = useCancelExecution();
 * 
 * const handleCancel = async () => {
 *   try {
 *     await cancelExecution.mutateAsync({
 *       componentId: 'comp1',
 *       operationId: 'navigate_to_pose',
 *       executionId: 'exec123'
 *     });
 *     toast.success('Execution cancelled');
 *   } catch (error) {
 *     toast.error('Failed to cancel execution');
 *   }
 * };
 * ```
 */
export const useCancelExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      componentId,
      operationId,
      executionId,
    }: {
      componentId: string;
      operationId: string;
      executionId: string;
    }) =>
      apiClient
        .delete(
          `/components/${componentId}/operations/${operationId}/executions/${executionId}`
        )
        .then((res) => res.data),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for this execution
      await queryClient.cancelQueries({
        queryKey: [
          'components',
          variables.componentId,
          'operations',
          variables.operationId,
          'executions',
          variables.executionId,
        ],
      });

      // Snapshot the previous value for rollback
      const previousExecution = queryClient.getQueryData([
        'components',
        variables.componentId,
        'operations',
        variables.operationId,
        'executions',
        variables.executionId,
      ]);

      // Optimistically update status to cancelled
      queryClient.setQueryData(
        [
          'components',
          variables.componentId,
          'operations',
          variables.operationId,
          'executions',
          variables.executionId,
        ],
        (old: Execution | undefined) =>
          old
            ? {
                ...old,
                status: 'cancelled' as const,
                endTime: new Date().toISOString(),
              }
            : undefined
      );

      // Return context with previous data for rollback
      return { previousExecution };
    },
    onError: (_err, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousExecution !== undefined) {
        queryClient.setQueryData(
          [
            'components',
            variables.componentId,
            'operations',
            variables.operationId,
            'executions',
            variables.executionId,
          ],
          context.previousExecution
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate execution to refetch
      queryClient.invalidateQueries({
        queryKey: [
          'components',
          variables.componentId,
          'operations',
          variables.operationId,
          'executions',
          variables.executionId,
        ],
      });
    },
  });
};
