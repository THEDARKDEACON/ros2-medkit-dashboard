/**
 * React Query hooks for API data fetching
 * Provides hooks for areas, components, and other API resources
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { generateRequestId } from './utils';
import type { Area, Component, Topic, Operation, Execution, Parameter, Fault, FaultSnapshot } from '../../types/api';

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

/**
 * Fetch parameters for a specific component
 * 
 * This hook fetches all parameters for a component from the configurations endpoint.
 * Parameters include their name, value, type, description, and constraints.
 * 
 * Cache configuration:
 * - staleTime: 30 seconds (parameters can change but not too frequently)
 * - gcTime: 5 minutes (keep in cache for 5 minutes after last use)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the component to fetch parameters for
 * @returns React Query result with array of parameters
 * 
 * @example
 * ```tsx
 * const { data: parameters, isLoading } = useParameters('comp1');
 * ```
 */
export const useParameters = (componentId: string) => {
  return useQuery({
    queryKey: ['components', componentId, 'parameters'],
    queryFn: () =>
      apiClient
        .get<Parameter[]>(`/components/${componentId}/configurations`)
        .then((res) => res.data),
    enabled: !!componentId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch detailed information for a specific parameter
 * 
 * This hook fetches detailed information for a single parameter, including
 * its current value, type, description, constraints, and namespace.
 * 
 * Cache configuration:
 * - staleTime: 30 seconds (parameter details can change but not too frequently)
 * - gcTime: 5 minutes (keep in cache for 5 minutes after last use)
 * - enabled: Only runs when componentId and paramName are truthy
 * 
 * @param componentId - The ID of the component
 * @param paramName - The name of the parameter
 * @returns React Query result with parameter details
 * 
 * @example
 * ```tsx
 * const { data: parameter, isLoading } = useParameterDetail('comp1', 'max_speed');
 * ```
 */
export const useParameterDetail = (componentId: string, paramName: string) => {
  return useQuery({
    queryKey: ['components', componentId, 'parameters', paramName],
    queryFn: () =>
      apiClient
        .get<Parameter>(`/components/${componentId}/configurations/${paramName}`)
        .then((res) => res.data),
    enabled: !!componentId && !!paramName,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Update a parameter value
 * 
 * This mutation hook updates a parameter value by sending a PUT request to
 * /api/v1/components/{component_id}/configurations/{param_name} with the new value.
 * 
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic cache invalidation on success
 * - Rollback on error to maintain data consistency
 * - Error handling with detailed error messages
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const updateParameter = useUpdateParameter();
 * 
 * const handleUpdate = async () => {
 *   try {
 *     await updateParameter.mutateAsync({
 *       componentId: 'comp1',
 *       paramName: 'max_speed',
 *       value: 2.5
 *     });
 *     toast.success('Parameter updated successfully');
 *   } catch (error) {
 *     toast.error('Failed to update parameter');
 *   }
 * };
 * ```
 */
export const useUpdateParameter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      componentId,
      paramName,
      value,
    }: {
      componentId: string;
      paramName: string;
      value: unknown;
    }) =>
      apiClient
        .put<Parameter>(
          `/components/${componentId}/configurations/${paramName}`,
          { value }
        )
        .then((res) => res.data),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for parameters
      await queryClient.cancelQueries({
        queryKey: ['components', variables.componentId, 'parameters'],
      });

      // Snapshot the previous value for rollback
      const previousParameters = queryClient.getQueryData([
        'components',
        variables.componentId,
        'parameters',
      ]);

      // Optimistically update the parameter value in the list
      queryClient.setQueryData(
        ['components', variables.componentId, 'parameters'],
        (old: Parameter[] = []) =>
          old.map((p) =>
            p.name === variables.paramName ? { ...p, value: variables.value } : p
          )
      );

      // Also update the individual parameter detail cache if it exists
      queryClient.setQueryData(
        ['components', variables.componentId, 'parameters', variables.paramName],
        (old: Parameter | undefined) =>
          old ? { ...old, value: variables.value } : undefined
      );

      // Return context with previous data for rollback
      return { previousParameters };
    },
    onError: (_err, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousParameters !== undefined) {
        queryClient.setQueryData(
          ['components', variables.componentId, 'parameters'],
          context.previousParameters
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate parameters to refetch
      queryClient.invalidateQueries({
        queryKey: ['components', variables.componentId, 'parameters'],
      });
      // Also invalidate the individual parameter detail
      queryClient.invalidateQueries({
        queryKey: [
          'components',
          variables.componentId,
          'parameters',
          variables.paramName,
        ],
      });
    },
  });
};

/**
 * Reset a parameter to its default value
 * 
 * This mutation hook resets a parameter to its default value by sending a DELETE request
 * to /api/v1/components/{component_id}/configurations/{param_name}.
 * 
 * Features:
 * - Automatic cache invalidation on success
 * - Error handling with detailed error messages
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const resetParameter = useResetParameter();
 * 
 * const handleReset = async () => {
 *   try {
 *     await resetParameter.mutateAsync({
 *       componentId: 'comp1',
 *       paramName: 'max_speed'
 *     });
 *     toast.success('Parameter reset to default');
 *   } catch (error) {
 *     toast.error('Failed to reset parameter');
 *   }
 * };
 * ```
 */
export const useResetParameter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      componentId,
      paramName,
    }: {
      componentId: string;
      paramName: string;
    }) =>
      apiClient
        .delete<{ success: boolean }>(
          `/components/${componentId}/configurations/${paramName}`
        )
        .then((res) => res.data),
    onSuccess: (_, variables) => {
      // Invalidate parameters to refetch with default value
      queryClient.invalidateQueries({
        queryKey: ['components', variables.componentId, 'parameters'],
      });
      // Also invalidate the individual parameter detail
      queryClient.invalidateQueries({
        queryKey: [
          'components',
          variables.componentId,
          'parameters',
          variables.paramName,
        ],
      });
    },
  });
};

/**
 * Fetch all current faults
 * 
 * This hook fetches all active faults from the system. Faults include
 * error, warning, and info severity levels with component source information.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable polling interval (default: 5000ms)
 * 
 * @param options - Configuration options
 * @param options.refetchInterval - Polling interval in milliseconds (default: 5000)
 * @param options.enabled - Whether polling is enabled (default: true)
 * @returns React Query result with array of faults
 * 
 * @example
 * ```tsx
 * // Basic usage with default 5-second polling
 * const { data: faults, isLoading } = useFaults();
 * 
 * // Custom polling interval (2 seconds)
 * const { data: faults } = useFaults({ refetchInterval: 2000 });
 * 
 * // Disable polling
 * const { data: faults } = useFaults({ enabled: false });
 * ```
 */
export const useFaults = (options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  const { refetchInterval = 5000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['faults'],
    queryFn: () =>
      apiClient.get<Fault[]>('/faults').then((res) => res.data),
    staleTime: 0, // Always consider stale for real-time data
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch fault snapshots for a specific fault code
 * 
 * This hook fetches detailed snapshot data for a specific fault, including
 * system state and topic data at the time of fault occurrence.
 * 
 * Cache configuration:
 * - staleTime: 5 minutes (snapshots are historical and don't change)
 * - gcTime: 10 minutes (keep in cache for 10 minutes after last use)
 * - enabled: Only runs when faultCode is truthy
 * 
 * @param faultCode - The fault code to fetch snapshots for
 * @returns React Query result with fault snapshot data
 * 
 * @example
 * ```tsx
 * const { data: snapshot, isLoading } = useFaultSnapshots('FAULT_001');
 * ```
 */
export const useFaultSnapshots = (faultCode: string) => {
  return useQuery({
    queryKey: ['faults', faultCode, 'snapshots'],
    queryFn: () =>
      apiClient
        .get<FaultSnapshot>(`/faults/${faultCode}/snapshots`)
        .then((res) => res.data),
    enabled: !!faultCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Fetch aggregated system health data
 * 
 * This hook aggregates data from multiple sources to provide a comprehensive
 * system health overview. It fetches areas, components, topics, and faults data
 * with automatic refresh every 2 seconds.
 * 
 * The hook combines multiple queries and returns aggregated metrics including:
 * - Total counts of areas, components, and topics
 * - Active component count
 * - Fault counts by severity
 * - Overall system health status
 * 
 * Cache configuration:
 * - refetchInterval: 2 seconds (auto-refresh for real-time monitoring)
 * - staleTime: 0 (always consider stale for real-time data)
 * 
 * @param options - Configuration options
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns Object containing aggregated system health data and loading states
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSystemHealth();
 * 
 * if (data) {
 *   console.log(`Total components: ${data.totalComponents}`);
 *   console.log(`Active components: ${data.activeComponents}`);
 *   console.log(`System status: ${data.systemStatus}`);
 * }
 * ```
 */
export const useSystemHealth = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {};

  // Fetch all data sources with 2-second refresh
  const areasQuery = useQuery({
    queryKey: ['areas'],
    queryFn: () => apiClient.get<Area[]>('/areas').then((res) => res.data),
    staleTime: 0,
    refetchInterval: enabled ? 2000 : false,
  });

  const componentsQuery = useQuery({
    queryKey: ['components'],
    queryFn: () =>
      apiClient.get<Component[]>('/components').then((res) => res.data),
    staleTime: 0,
    refetchInterval: enabled ? 2000 : false,
  });

  const faultsQuery = useQuery({
    queryKey: ['faults'],
    queryFn: () => apiClient.get<Fault[]>('/faults').then((res) => res.data),
    staleTime: 0,
    refetchInterval: enabled ? 2000 : false,
  });

  // Aggregate topic count from all components
  const topicCount = componentsQuery.data?.reduce((total, component) => {
    // Each component can have multiple topics
    // For now, we'll estimate based on component data endpoint
    return total + 1; // Simplified - in real implementation would fetch actual topic counts
  }, 0) || 0;

  // Calculate metrics
  const totalAreas = areasQuery.data?.length || 0;
  const totalComponents = componentsQuery.data?.length || 0;
  const activeComponents =
    componentsQuery.data?.filter((c) => c.status === 'active').length || 0;
  const totalTopics = topicCount;

  // Calculate fault counts by severity
  const faultCounts = {
    error: faultsQuery.data?.filter((f) => f.severity === 'error').length || 0,
    warning: faultsQuery.data?.filter((f) => f.severity === 'warning').length || 0,
    info: faultsQuery.data?.filter((f) => f.severity === 'info').length || 0,
  };

  // Determine overall system status
  let systemStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (faultCounts.error > 0) {
    systemStatus = 'critical';
  } else if (faultCounts.warning > 0 || activeComponents < totalComponents) {
    systemStatus = 'degraded';
  }

  return {
    data: {
      totalAreas,
      totalComponents,
      activeComponents,
      totalTopics,
      faultCounts,
      systemStatus,
      areas: areasQuery.data || [],
      components: componentsQuery.data || [],
      faults: faultsQuery.data || [],
    },
    isLoading:
      areasQuery.isLoading ||
      componentsQuery.isLoading ||
      faultsQuery.isLoading,
    error: areasQuery.error || componentsQuery.error || faultsQuery.error,
    refetch: () => {
      areasQuery.refetch();
      componentsQuery.refetch();
      faultsQuery.refetch();
    },
  };
};

/**
 * Download rosbag file for a specific fault
 * 
 * This mutation hook downloads a rosbag file for a fault with progress tracking.
 * It uses the Fetch API with ReadableStream to track download progress.
 * 
 * The mutation sends a GET request to /api/v1/faults/{fault_code}/snapshots/bag
 * and streams the response to a file download.
 * 
 * Features:
 * - Progress tracking via ReadableStream
 * - Automatic file download with proper filename
 * - Error handling with detailed error messages
 * - Support for large file downloads
 * 
 * @returns React Query mutation result with progress callback support
 * 
 * @example
 * ```tsx
 * const downloadRosbag = useDownloadRosbag();
 * const [progress, setProgress] = useState(0);
 * 
 * const handleDownload = async () => {
 *   try {
 *     await downloadRosbag.mutateAsync(
 *       { faultCode: 'FAULT_001' },
 *       { onProgress: (progress) => setProgress(progress) }
 *     );
 *     toast.success('Rosbag downloaded successfully');
 *   } catch (error) {
 *     toast.error('Failed to download rosbag');
 *   }
 * };
 * ```
 */
export const useDownloadRosbag = () => {
  return useMutation({
    mutationFn: async ({
      faultCode,
      onProgress,
    }: {
      faultCode: string;
      onProgress?: (progress: number) => void;
    }) => {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
      const url = `${baseURL}/faults/${faultCode}/snapshots/bag`;

      // Use fetch API for streaming support
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Request-ID': generateRequestId(),
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get content length for progress calculation
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
      const filename = filenameMatch?.[1] || `${faultCode}_rosbag.bag`;

      // Read the response body as a stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      // Read chunks and track progress
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Report progress
        if (total > 0 && onProgress) {
          const progress = (receivedLength / total) * 100;
          onProgress(progress);
        }
      }

      // Combine chunks into a single Uint8Array
      const blob = new Blob(chunks as BlobPart[]);

      // Create download link and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);

      return { filename, size: receivedLength };
    },
  });
};

/**
 * Fetch semantic objects with optional filtering
 * 
 * This hook fetches detected semantic objects from YOLO or other detection systems.
 * Supports filtering by object class and confidence threshold.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable polling interval (default: 2000ms)
 * 
 * @param options - Configuration options
 * @param options.classFilter - Filter by object class (e.g., 'person', 'chair')
 * @param options.minConfidence - Minimum confidence threshold (0-1)
 * @param options.refetchInterval - Polling interval in milliseconds (default: 2000)
 * @param options.enabled - Whether polling is enabled (default: true)
 * @returns React Query result with array of semantic objects
 * 
 * @example
 * ```tsx
 * // Fetch all semantic objects with default 2-second refresh
 * const { data: objects, isLoading } = useSemanticObjects();
 * 
 * // Filter by class
 * const { data: people } = useSemanticObjects({ classFilter: 'person' });
 * 
 * // Filter by confidence threshold
 * const { data: highConfidence } = useSemanticObjects({ minConfidence: 0.8 });
 * 
 * // Combined filters
 * const { data: filtered } = useSemanticObjects({
 *   classFilter: 'chair',
 *   minConfidence: 0.7,
 *   refetchInterval: 1000
 * });
 * ```
 */
export const useSemanticObjects = (options?: {
  classFilter?: string;
  minConfidence?: number;
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  const {
    classFilter,
    minConfidence,
    refetchInterval = 2000,
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: ['semantic-objects', classFilter, minConfidence],
    queryFn: async () => {
      // Fetch semantic objects from the API
      const response = await apiClient.get<SemanticObject[]>('/semantic-objects');
      let objects = response.data;

      // Apply client-side filtering
      if (classFilter) {
        objects = objects.filter(
          (obj) => obj.class.toLowerCase() === classFilter.toLowerCase()
        );
      }

      if (minConfidence !== undefined) {
        objects = objects.filter((obj) => obj.confidence >= minConfidence);
      }

      return objects;
    },
    staleTime: 0, // Always consider stale for real-time data
    gcTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: enabled ? refetchInterval : false,
    enabled,
  });
};

/**
 * Fetch detailed information for a specific semantic object
 * 
 * This hook fetches detailed information for a single semantic object, including
 * persistence data (first seen, last seen, observation count) and annotated images.
 * 
 * Cache configuration:
 * - staleTime: 30 seconds (object details don't change too frequently)
 * - gcTime: 5 minutes (keep in cache for 5 minutes after last use)
 * - enabled: Only runs when objectId is truthy
 * 
 * @param objectId - The ID of the semantic object
 * @returns React Query result with detailed object information
 * 
 * @example
 * ```tsx
 * const { data: objectDetail, isLoading } = useSemanticObjectDetail('obj_001');
 * ```
 */
export const useSemanticObjectDetail = (objectId: string) => {
  return useQuery({
    queryKey: ['semantic-objects', objectId],
    queryFn: async () => {
      const response = await apiClient.get<SemanticObjectDetail>(
        `/semantic-objects/${objectId}`
      );
      return response.data;
    },
    enabled: !!objectId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch semantic object detection timeline
 * 
 * This hook fetches a timeline of object detection events over a specified time range.
 * Useful for visualizing detection history and patterns.
 * 
 * Cache configuration:
 * - staleTime: 1 minute (timeline data is historical)
 * - gcTime: 5 minutes (keep in cache for 5 minutes after last use)
 * - enabled: Only runs when startTime and endTime are provided
 * 
 * @param options - Configuration options
 * @param options.startTime - Start of time range (ISO string)
 * @param options.endTime - End of time range (ISO string)
 * @param options.classFilter - Optional filter by object class
 * @returns React Query result with timeline data
 * 
 * @example
 * ```tsx
 * const { data: timeline } = useSemanticObjectTimeline({
 *   startTime: '2024-01-01T00:00:00Z',
 *   endTime: '2024-01-01T23:59:59Z',
 *   classFilter: 'person'
 * });
 * ```
 */
export const useSemanticObjectTimeline = (options: {
  startTime?: string;
  endTime?: string;
  classFilter?: string;
}) => {
  const { startTime, endTime, classFilter } = options;

  return useQuery({
    queryKey: ['semantic-objects', 'timeline', startTime, endTime, classFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startTime) params.append('start', startTime);
      if (endTime) params.append('end', endTime);
      if (classFilter) params.append('class', classFilter);

      const response = await apiClient.get<SemanticObjectTimelineEvent[]>(
        `/semantic-objects/timeline?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!startTime && !!endTime,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Download semantic object detection data
 * 
 * This mutation hook downloads semantic object detection data in JSON or CSV format.
 * Supports filtering by time range and object class.
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const downloadObjects = useDownloadSemanticObjects();
 * 
 * const handleDownload = async () => {
 *   try {
 *     await downloadObjects.mutateAsync({
 *       format: 'json',
 *       startTime: '2024-01-01T00:00:00Z',
 *       endTime: '2024-01-01T23:59:59Z',
 *       classFilter: 'person'
 *     });
 *     toast.success('Data downloaded successfully');
 *   } catch (error) {
 *     toast.error('Failed to download data');
 *   }
 * };
 * ```
 */
export const useDownloadSemanticObjects = () => {
  return useMutation({
    mutationFn: async ({
      format = 'json',
      startTime,
      endTime,
      classFilter,
    }: {
      format?: 'json' | 'csv';
      startTime?: string;
      endTime?: string;
      classFilter?: string;
    }) => {
      const params = new URLSearchParams();
      params.append('format', format);
      if (startTime) params.append('start', startTime);
      if (endTime) params.append('end', endTime);
      if (classFilter) params.append('class', classFilter);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/semantic-objects/export?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'X-Request-ID': generateRequestId(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
      const filename =
        filenameMatch?.[1] || `semantic_objects_${Date.now()}.${format}`;

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { filename, size: blob.size };
    },
  });
};

// Type definitions for semantic objects (imported from visualization types)
import type { SemanticObject } from '../../types/visualization';

/**
 * Extended semantic object detail with persistence information
 */
export interface SemanticObjectDetail extends SemanticObject {
  firstSeen: string;
  lastSeen: string;
  observationCount: number;
  annotatedImages?: AnnotatedImage[];
}

/**
 * Annotated camera image with bounding boxes
 */
export interface AnnotatedImage {
  imageUrl: string;
  timestamp: string;
  cameraId: string;
  boundingBoxes: {
    x: number;
    y: number;
    width: number;
    height: number;
    class: string;
    confidence: number;
  }[];
}

/**
 * Timeline event for object detection
 */
export interface SemanticObjectTimelineEvent {
  timestamp: string;
  objectId: string;
  class: string;
  confidence: number;
  position: { x: number; y: number };
  eventType: 'detected' | 'lost' | 'updated';
}

/**
 * Navigation status data structure
 */
export interface NavigationStatus {
  status: 'exploring' | 'planning' | 'idle' | 'error';
  currentGoal?: {
    x: number;
    y: number;
    theta: number;
  };
  plannedPath?: Array<{
    x: number;
    y: number;
    theta: number;
  }>;
  localizationQuality?: number;
  pathPlanningState?: string;
  obstacleDetected?: boolean;
}

/**
 * Exploration statistics data structure
 */
export interface ExplorationStats {
  exploredArea: number;
  totalArea: number;
  explorationProgress: number;
  frontierClusters?: Array<{
    id: string;
    centroid: { x: number; y: number };
    size: number;
  }>;
  estimatedTimeRemaining?: number;
}

/**
 * Robot velocity data structure
 */
export interface RobotVelocity {
  linear: {
    x: number;
    y: number;
    z: number;
  };
  angular: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * Battery status data structure
 */
export interface BatteryStatus {
  level: number;
  voltage: number;
  current: number;
  charging: boolean;
}

/**
 * Fetch navigation status for a component
 * 
 * This hook fetches the current navigation status including exploration state,
 * current goal, planned path, and localization quality.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 1 second)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the navigation component
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 1000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with navigation status data
 * 
 * @example
 * ```tsx
 * const { data: navStatus, isLoading } = useNavigationStatus('nav_component');
 * ```
 */
export const useNavigationStatus = (
  componentId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 1000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'navigation', 'status'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      // Extract navigation-related data from component data
      const data = response.data;
      
      // Map the raw data to NavigationStatus structure
      const status = (data.exploration_status as string) || 'idle';
      const navStatus: NavigationStatus = {
        status: (status === 'exploring' || status === 'planning' || status === 'error') 
          ? status 
          : 'idle',
        currentGoal: data.current_goal as NavigationStatus['currentGoal'],
        plannedPath: data.planned_path as NavigationStatus['plannedPath'],
        localizationQuality: data.localization_quality as number,
        pathPlanningState: data.path_planning_state as string,
        obstacleDetected: data.obstacle_detected as boolean,
      };
      
      return navStatus;
    },
    enabled: !!componentId && enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch exploration statistics for a component
 * 
 * This hook fetches exploration statistics including explored area, progress,
 * frontier clusters, and estimated time remaining.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 2 seconds)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the navigation component
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 2000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with exploration statistics data
 * 
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useExplorationStats('nav_component');
 * ```
 */
export const useExplorationStats = (
  componentId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 2000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'navigation', 'exploration-stats'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      // Extract exploration statistics from component data
      const data = response.data;
      
      const stats: ExplorationStats = {
        exploredArea: (data.explored_area as number) || 0,
        totalArea: (data.total_area as number) || 0,
        explorationProgress: (data.exploration_progress as number) || 0,
        frontierClusters: data.frontier_clusters as ExplorationStats['frontierClusters'],
        estimatedTimeRemaining: data.estimated_time_remaining as number,
      };
      
      return stats;
    },
    enabled: !!componentId && enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch robot velocity for a component
 * 
 * This hook fetches the current robot velocity including linear and angular components.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 500ms for high-frequency updates)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the navigation component
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 500)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with velocity data
 * 
 * @example
 * ```tsx
 * const { data: velocity, isLoading } = useRobotVelocity('nav_component');
 * ```
 */
export const useRobotVelocity = (
  componentId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 500, enabled = true } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'velocity'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      const data = response.data;
      
      const velocity: RobotVelocity = {
        linear: (data.velocity_linear as RobotVelocity['linear']) || { x: 0, y: 0, z: 0 },
        angular: (data.velocity_angular as RobotVelocity['angular']) || { x: 0, y: 0, z: 0 },
      };
      
      return velocity;
    },
    enabled: !!componentId && enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch battery status for a component
 * 
 * This hook fetches the current battery status including level, voltage, and charging state.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 5 seconds)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the component with battery data
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 5000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with battery status data
 * 
 * @example
 * ```tsx
 * const { data: battery, isLoading } = useBatteryStatus('power_component');
 * ```
 */
export const useBatteryStatus = (
  componentId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 5000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'battery'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      const data = response.data;
      
      const battery: BatteryStatus = {
        level: (data.battery_level as number) || 0,
        voltage: (data.battery_voltage as number) || 0,
        current: (data.battery_current as number) || 0,
        charging: (data.battery_charging as boolean) || false,
      };
      
      return battery;
    },
    enabled: !!componentId && enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Safety system status data structure
 */
export interface SafetyStatus {
  emergencyStopActive: boolean;
  collisionDetected: boolean;
  safetyZoneViolation: boolean;
  proximityWarnings: Array<{
    direction: string;
    distance: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  lastSafetyCheck: string;
}

/**
 * Behavior tree node data structure
 */
export interface BehaviorTreeNode {
  id: string;
  name: string;
  type: 'sequence' | 'selector' | 'action' | 'condition' | 'decorator';
  status: 'running' | 'success' | 'failure' | 'idle';
  children?: BehaviorTreeNode[];
  metadata?: Record<string, unknown>;
}

/**
 * Behavior tree state data structure
 */
export interface BehaviorTreeState {
  rootNode: BehaviorTreeNode;
  activeBehaviors: Array<{
    id: string;
    name: string;
    status: 'running' | 'success' | 'failure';
    startTime: string;
  }>;
  lastUpdate: string;
}

/**
 * Safety event data structure
 */
export interface SafetyEvent {
  id: string;
  type: 'emergency_stop' | 'collision' | 'zone_violation' | 'proximity_warning' | 'system_health';
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Safety metrics data structure
 */
export interface SafetyMetrics {
  totalEvents: number;
  emergencyStops: number;
  collisions: number;
  zoneViolations: number;
  averageResponseTime: number;
  systemUptime: number;
}

/**
 * Fetch safety status for a component
 * 
 * This hook fetches the current safety system status including emergency stop state,
 * collision detection, safety zone violations, and proximity warnings.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 1 second)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the safety component
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 1000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with safety status data
 * 
 * @example
 * ```tsx
 * const { data: safetyStatus, isLoading } = useSafetyStatus('safety_component');
 * ```
 */
export const useSafetyStatus = (
  componentId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 1000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'safety', 'status'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      const data = response.data;
      
      const safetyStatus: SafetyStatus = {
        emergencyStopActive: (data.emergency_stop_active as boolean) || false,
        collisionDetected: (data.collision_detected as boolean) || false,
        safetyZoneViolation: (data.safety_zone_violation as boolean) || false,
        proximityWarnings: (data.proximity_warnings as SafetyStatus['proximityWarnings']) || [],
        systemHealth: (data.system_health as SafetyStatus['systemHealth']) || 'healthy',
        lastSafetyCheck: (data.last_safety_check as string) || new Date().toISOString(),
      };
      
      return safetyStatus;
    },
    enabled: !!componentId && enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch behavior tree state for a component
 * 
 * This hook fetches the current behavior tree state including the tree structure,
 * active behaviors, and their execution status.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 1 second)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the safety component
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 1000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with behavior tree state data
 * 
 * @example
 * ```tsx
 * const { data: behaviorTree, isLoading } = useBehaviorTree('safety_component');
 * ```
 */
export const useBehaviorTree = (
  componentId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 1000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'safety', 'behavior-tree'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      const data = response.data;
      
      const behaviorTree: BehaviorTreeState = {
        rootNode: (data.behavior_tree_root as BehaviorTreeNode) || {
          id: 'root',
          name: 'Root',
          type: 'sequence',
          status: 'idle',
          children: [],
        },
        activeBehaviors: (data.active_behaviors as BehaviorTreeState['activeBehaviors']) || [],
        lastUpdate: (data.behavior_tree_last_update as string) || new Date().toISOString(),
      };
      
      return behaviorTree;
    },
    enabled: !!componentId && enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch safety events for a component
 * 
 * This hook fetches recent safety events including emergency stops, collisions,
 * zone violations, and system health events.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 2 seconds)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the safety component
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 2000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @param options.limit - Maximum number of events to fetch (default: 50)
 * @returns React Query result with safety events data
 * 
 * @example
 * ```tsx
 * const { data: events, isLoading } = useSafetyEvents('safety_component');
 * ```
 */
export const useSafetyEvents = (
  componentId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
    limit?: number;
  }
) => {
  const { refetchInterval = 2000, enabled = true, limit = 50 } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'safety', 'events', limit],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      const data = response.data;
      const events = (data.safety_events as SafetyEvent[]) || [];
      
      // Return the most recent events up to the limit
      return events.slice(0, limit);
    },
    enabled: !!componentId && enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch safety metrics for a component
 * 
 * This hook fetches safety system health metrics and diagnostics including
 * event counts, response times, and system uptime.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 5 seconds)
 * - enabled: Only runs when componentId is truthy
 * 
 * @param componentId - The ID of the safety component
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 5000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with safety metrics data
 * 
 * @example
 * ```tsx
 * const { data: metrics, isLoading } = useSafetyMetrics('safety_component');
 * ```
 */
export const useSafetyMetrics = (
  componentId: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
) => {
  const { refetchInterval = 5000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['components', componentId, 'safety', 'metrics'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        `/components/${componentId}/data`
      );
      
      const data = response.data;
      
      const metrics: SafetyMetrics = {
        totalEvents: (data.safety_total_events as number) || 0,
        emergencyStops: (data.safety_emergency_stops as number) || 0,
        collisions: (data.safety_collisions as number) || 0,
        zoneViolations: (data.safety_zone_violations as number) || 0,
        averageResponseTime: (data.safety_avg_response_time as number) || 0,
        systemUptime: (data.safety_system_uptime as number) || 0,
      };
      
      return metrics;
    },
    enabled: !!componentId && enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Trigger emergency stop
 * 
 * This mutation hook triggers the emergency stop system by sending a POST request
 * to the safety component's emergency stop operation.
 * 
 * Features:
 * - Automatic cache invalidation on success
 * - Error handling with detailed error messages
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const triggerEmergencyStop = useTriggerEmergencyStop();
 * 
 * const handleEmergencyStop = async () => {
 *   try {
 *     await triggerEmergencyStop.mutateAsync({
 *       componentId: 'safety_component'
 *     });
 *     toast.success('Emergency stop activated');
 *   } catch (error) {
 *     toast.error('Failed to activate emergency stop');
 *   }
 * };
 * ```
 */
export const useTriggerEmergencyStop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ componentId }: { componentId: string }) =>
      apiClient
        .post(`/components/${componentId}/operations/emergency_stop/executions`, {
          parameters: {},
        })
        .then((res) => res.data),
    onSuccess: (_, variables) => {
      // Invalidate safety status to refetch
      queryClient.invalidateQueries({
        queryKey: ['components', variables.componentId, 'safety', 'status'],
      });
      // Invalidate safety events to show the new event
      queryClient.invalidateQueries({
        queryKey: ['components', variables.componentId, 'safety', 'events'],
      });
    },
  });
};

/**
 * Performance metrics data structure
 */
export interface PerformanceMetrics {
  cpuUsage: Array<{
    componentId: string;
    componentName: string;
    usage: number; // Percentage (0-100)
    trend: 'up' | 'down' | 'stable';
  }>;
  memoryUsage: Array<{
    componentId: string;
    componentName: string;
    usage: number; // MB
    trend: 'up' | 'down' | 'stable';
  }>;
  networkBandwidth: Array<{
    topicName: string;
    bytesPerSecond: number;
    messagesPerSecond: number;
  }>;
  messageRates: Array<{
    topicName: string;
    publishRate: number; // Hz
    subscribeRate: number; // Hz
  }>;
  latency: Array<{
    nodeId: string;
    nodeName: string;
    processingLatency: number; // ms
    callbackExecutionTime: number; // ms
  }>;
  tfMetrics: {
    updateRate: number; // Hz
    latency: number; // ms
    transformCount: number;
  };
  diskIO: {
    readBytesPerSecond: number;
    writeBytesPerSecond: number;
    loggingRate: number; // MB/s
  };
  timestamp: string;
}

/**
 * Performance alert data structure
 */
export interface PerformanceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'network' | 'latency' | 'disk';
  severity: 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  componentId?: string;
  timestamp: string;
}

/**
 * Performance alert threshold configuration
 */
export interface PerformanceThresholds {
  cpuWarning: number; // Percentage
  cpuCritical: number; // Percentage
  memoryWarning: number; // MB
  memoryCritical: number; // MB
  latencyWarning: number; // ms
  latencyCritical: number; // ms
  diskIOWarning: number; // MB/s
  diskIOCritical: number; // MB/s
}

/**
 * Fetch performance metrics
 * 
 * This hook fetches comprehensive performance metrics including CPU usage,
 * memory usage, network bandwidth, message rates, latency, tf metrics, and disk I/O.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 30 seconds)
 * - enabled: Only runs when enabled is true
 * 
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 30000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with performance metrics data
 * 
 * @example
 * ```tsx
 * const { data: metrics, isLoading } = usePerformanceMetrics();
 * ```
 */
export const usePerformanceMetrics = (options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  const { refetchInterval = 30000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['performance', 'metrics'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        '/performance/metrics'
      );
      
      const data = response.data;
      
      const metrics: PerformanceMetrics = {
        cpuUsage: (data.cpu_usage as PerformanceMetrics['cpuUsage']) || [],
        memoryUsage: (data.memory_usage as PerformanceMetrics['memoryUsage']) || [],
        networkBandwidth: (data.network_bandwidth as PerformanceMetrics['networkBandwidth']) || [],
        messageRates: (data.message_rates as PerformanceMetrics['messageRates']) || [],
        latency: (data.latency as PerformanceMetrics['latency']) || [],
        tfMetrics: (data.tf_metrics as PerformanceMetrics['tfMetrics']) || {
          updateRate: 0,
          latency: 0,
          transformCount: 0,
        },
        diskIO: (data.disk_io as PerformanceMetrics['diskIO']) || {
          readBytesPerSecond: 0,
          writeBytesPerSecond: 0,
          loggingRate: 0,
        },
        timestamp: (data.timestamp as string) || new Date().toISOString(),
      };
      
      return metrics;
    },
    enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch performance alerts
 * 
 * This hook fetches active performance alerts based on configured thresholds.
 * 
 * Cache configuration:
 * - staleTime: 0 (always consider stale for real-time data)
 * - gcTime: 1 minute (keep in cache for 1 minute after last use)
 * - refetchInterval: Configurable (default 10 seconds)
 * - enabled: Only runs when enabled is true
 * 
 * @param options - Configuration options
 * @param options.refetchInterval - Refresh interval in milliseconds (default: 10000)
 * @param options.enabled - Whether auto-refresh is enabled (default: true)
 * @returns React Query result with performance alerts data
 * 
 * @example
 * ```tsx
 * const { data: alerts, isLoading } = usePerformanceAlerts();
 * ```
 */
export const usePerformanceAlerts = (options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) => {
  const { refetchInterval = 10000, enabled = true } = options || {};

  return useQuery({
    queryKey: ['performance', 'alerts'],
    queryFn: async () => {
      const response = await apiClient.get<PerformanceAlert[]>(
        '/performance/alerts'
      );
      
      return response.data;
    },
    enabled,
    staleTime: 0,
    gcTime: 1 * 60 * 1000,
    refetchInterval: enabled ? refetchInterval : false,
  });
};

/**
 * Fetch performance alert thresholds
 * 
 * This hook fetches the configured thresholds for performance alerts.
 * 
 * Cache configuration:
 * - staleTime: 5 minutes (thresholds don't change frequently)
 * - gcTime: 10 minutes (keep in cache for 10 minutes after last use)
 * - enabled: Only runs when enabled is true
 * 
 * @param options - Configuration options
 * @param options.enabled - Whether the query is enabled (default: true)
 * @returns React Query result with performance thresholds data
 * 
 * @example
 * ```tsx
 * const { data: thresholds, isLoading } = usePerformanceThresholds();
 * ```
 */
export const usePerformanceThresholds = (options?: {
  enabled?: boolean;
}) => {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ['performance', 'thresholds'],
    queryFn: async () => {
      const response = await apiClient.get<Record<string, unknown>>(
        '/performance/thresholds'
      );
      
      const data = response.data;
      
      const thresholds: PerformanceThresholds = {
        cpuWarning: (data.cpu_warning as number) || 70,
        cpuCritical: (data.cpu_critical as number) || 90,
        memoryWarning: (data.memory_warning as number) || 1024,
        memoryCritical: (data.memory_critical as number) || 2048,
        latencyWarning: (data.latency_warning as number) || 100,
        latencyCritical: (data.latency_critical as number) || 500,
        diskIOWarning: (data.disk_io_warning as number) || 50,
        diskIOCritical: (data.disk_io_critical as number) || 100,
      };
      
      return thresholds;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Update performance alert thresholds
 * 
 * This mutation hook updates the configured thresholds for performance alerts.
 * 
 * Features:
 * - Automatic cache invalidation on success
 * - Error handling with detailed error messages
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const updateThresholds = useUpdatePerformanceThresholds();
 * 
 * const handleUpdate = async () => {
 *   try {
 *     await updateThresholds.mutateAsync({
 *       cpuWarning: 75,
 *       cpuCritical: 95,
 *     });
 *     toast.success('Thresholds updated');
 *   } catch (error) {
 *     toast.error('Failed to update thresholds');
 *   }
 * };
 * ```
 */
export const useUpdatePerformanceThresholds = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (thresholds: Partial<PerformanceThresholds>) =>
      apiClient
        .put('/performance/thresholds', thresholds)
        .then((res) => res.data),
    onSuccess: () => {
      // Invalidate thresholds to refetch
      queryClient.invalidateQueries({
        queryKey: ['performance', 'thresholds'],
      });
      // Invalidate alerts as they depend on thresholds
      queryClient.invalidateQueries({
        queryKey: ['performance', 'alerts'],
      });
    },
  });
};

/**
 * Export performance data
 * 
 * This mutation hook exports performance data for offline analysis.
 * 
 * Features:
 * - Downloads data as JSON file
 * - Includes metadata and timestamp
 * 
 * @returns React Query mutation result
 * 
 * @example
 * ```tsx
 * const exportData = useExportPerformanceData();
 * 
 * const handleExport = async () => {
 *   try {
 *     await exportData.mutateAsync({
 *       startTime: '2024-01-01T00:00:00Z',
 *       endTime: '2024-01-02T00:00:00Z',
 *     });
 *     toast.success('Performance data exported');
 *   } catch (error) {
 *     toast.error('Failed to export data');
 *   }
 * };
 * ```
 */
export const useExportPerformanceData = () => {
  return useMutation({
    mutationFn: async ({
      startTime,
      endTime,
    }: {
      startTime: string;
      endTime: string;
    }) => {
      const response = await apiClient.get('/performance/export', {
        params: { start_time: startTime, end_time: endTime },
        responseType: 'blob',
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-data-${startTime}-${endTime}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
  });
};
