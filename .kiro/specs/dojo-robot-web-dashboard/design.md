# Design Document: Dojo Robot Web Dashboard

## Overview

The Dojo Robot Web Dashboard is a sophisticated, real-time monitoring and control interface for autonomous robot systems. This design document outlines a production-ready architecture that combines modern web technologies with creative visualization techniques to deliver an exceptional user experience for robot operators, developers, and researchers.

The dashboard serves as a mission control center, providing comprehensive visibility into robot operations through an elegant, responsive interface that handles high-frequency data streams, complex 3D visualizations, and real-time fault monitoring. The architecture prioritizes performance, maintainability, and extensibility while delivering a visually stunning user experience.

### Design Philosophy

1. **Performance First**: Optimized for real-time data streaming with minimal latency
2. **Progressive Enhancement**: Core functionality works everywhere, advanced features enhance capable browsers
3. **Resilient Architecture**: Graceful degradation when connections fail or data is unavailable
4. **Developer Experience**: Clean abstractions, type safety, and comprehensive testing
5. **Visual Excellence**: Stunning UI that makes complex data comprehensible at a glance

## Architecture

### High-Level System Architecture

The dashboard follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │ Visualizations│  │  3D Viewers  │      │
│  │  Components  │  │   (Charts)    │  │  (Three.js)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    State Management Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Zustand    │  │  React Query │  │   Local      │      │
│  │    Stores    │  │    Cache     │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Client  │  │  SSE Manager │  │   WebSocket  │      │
│  │   (Axios)    │  │  (EventSrc)  │  │    Client    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │   ros2_medkit Gateway    │
              │   http://localhost:8080  │
              └──────────────────────────┘
```


### Technology Stack Rationale

**Core Framework: React 18 + TypeScript**
- React 18's concurrent features enable smooth UI updates during high-frequency data streams
- TypeScript provides compile-time safety for complex data structures and API contracts
- Hooks-based architecture simplifies state management and side effects

**Build Tool: Vite**
- Lightning-fast HMR for excellent developer experience
- Optimized production builds with automatic code splitting
- Native ESM support reduces bundle size
- Built-in TypeScript support without additional configuration

**Styling: Tailwind CSS + shadcn/ui**
- Utility-first approach enables rapid UI development
- shadcn/ui provides accessible, customizable components
- Consistent design system with minimal CSS overhead
- Dark mode support built-in with CSS variables

**State Management: Zustand + React Query**
- Zustand for global UI state (theme, layout, preferences)
- React Query for server state management with automatic caching
- Separation of concerns: UI state vs server state
- Built-in optimistic updates and background refetching

**Data Visualization: Recharts + Three.js**
- Recharts for 2D charts with React-friendly API
- Three.js via React Three Fiber for 3D visualizations
- GPU-accelerated rendering for point clouds and Gaussian splats
- Declarative 3D scene composition

**Real-time Communication**
- EventSource API for Server-Sent Events (fault streaming)
- WebSocket for bidirectional real-time updates
- Axios for REST API calls with interceptors
- Automatic reconnection with exponential backoff

## Components and Interfaces

### Component Hierarchy

The application follows a feature-based component organization:

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx           # Main application container
│   │   ├── Header.tsx             # Top navigation bar
│   │   ├── Sidebar.tsx            # Collapsible navigation sidebar
│   │   └── StatusBar.tsx          # Connection status footer
│   ├── dashboard/
│   │   ├── SystemHealthOverview.tsx
│   │   ├── QuickAccessCards.tsx
│   │   ├── MetricsPanel.tsx
│   │   └── FaultSummary.tsx
│   ├── components/
│   │   ├── ComponentTree.tsx      # Hierarchical area/component view
│   │   ├── ComponentDetail.tsx    # Detailed component view
│   │   └── ComponentSearch.tsx    # Search and filter interface
│   ├── topics/
│   │   ├── TopicList.tsx          # List of available topics
│   │   ├── TopicViewer.tsx        # Real-time topic data display
│   │   ├── TopicChart.tsx         # Time-series visualization
│   │   └── TopicPublisher.tsx     # Message publishing interface
│   ├── operations/
│   │   ├── OperationList.tsx      # Services and actions list
│   │   ├── OperationExecutor.tsx  # Execution interface
│   │   └── ExecutionMonitor.tsx   # Action progress tracking
│   ├── parameters/
│   │   ├── ParameterTable.tsx     # Parameter list with inline editing
│   │   ├── ParameterEditor.tsx    # Detailed parameter editor
│   │   └── ConfigurationProfile.tsx
│   ├── faults/
│   │   ├── FaultMonitor.tsx       # Real-time fault display
│   │   ├── FaultTimeline.tsx      # Historical fault view
│   │   ├── FaultDetail.tsx        # Fault snapshot viewer
│   │   └── FaultFilter.tsx        # Filtering controls
│   ├── visualizations/
│   │   ├── Map2D.tsx              # 2D navigation map
│   │   ├── PointCloudViewer.tsx   # 3D point cloud
│   │   ├── GaussianSplatViewer.tsx
│   │   ├── RobotOrientation3D.tsx
│   │   ├── SemanticObjectMap.tsx
│   │   └── ComponentTopology.tsx
│   ├── safety/
│   │   ├── SafetyMonitor.tsx
│   │   ├── BehaviorTreeView.tsx
│   │   └── EmergencyStopButton.tsx
│   ├── performance/
│   │   ├── PerformanceMetrics.tsx
│   │   ├── ResourceUsageChart.tsx
│   │   └── NetworkBandwidth.tsx
│   └── common/
│       ├── JsonInspector.tsx      # Syntax-highlighted JSON viewer
│       ├── LoadingState.tsx       # Skeleton screens
│       ├── ErrorBoundary.tsx      # Error handling
│       ├── AnimatedStatus.tsx     # Status indicators
│       └── ThemeToggle.tsx        # Dark/light mode switch
├── features/
│   ├── api/
│   │   ├── client.ts              # Axios instance configuration
│   │   ├── endpoints.ts           # API endpoint definitions
│   │   ├── hooks.ts               # React Query hooks
│   │   └── types.ts               # API response types
│   ├── realtime/
│   │   ├── sseManager.ts          # Server-Sent Events handler
│   │   ├── websocketManager.ts    # WebSocket connection manager
│   │   └── reconnection.ts        # Reconnection logic
│   ├── stores/
│   │   ├── uiStore.ts             # UI state (theme, layout)
│   │   ├── robotStore.ts          # Multi-robot management
│   │   ├── filterStore.ts         # Search and filter state
│   │   └── layoutStore.ts         # Custom dashboard layouts
│   └── utils/
│       ├── dataTransform.ts       # Data transformation utilities
│       ├── validation.ts          # Input validation
│       ├── formatting.ts          # Data formatting
│       └── performance.ts         # Performance optimization helpers
├── pages/
│   ├── Dashboard.tsx              # System health overview
│   ├── Components.tsx             # Component browser
│   ├── Topics.tsx                 # Topic monitoring
│   ├── Operations.tsx             # Service/action execution
│   ├── Parameters.tsx             # Configuration management
│   ├── Faults.tsx                 # Fault monitoring
│   ├── Visualizations.tsx         # 3D visualizations
│   ├── Performance.tsx            # Performance metrics
│   └── Settings.tsx               # User preferences
└── types/
    ├── api.ts                     # API type definitions
    ├── robot.ts                   # Robot domain types
    └── ui.ts                      # UI-specific types
```


### Key Interface Definitions

```typescript
// Core domain types
interface Area {
  id: string;
  name: string;
  description?: string;
  componentCount: number;
}

interface Component {
  id: string;
  name: string;
  identifier: string;
  areaId: string;
  status: 'active' | 'inactive' | 'error';
  metadata?: Record<string, unknown>;
}

interface Topic {
  name: string;
  messageType: string;
  publishRate: number;
  lastUpdate: string;
  data: unknown;
}

interface Operation {
  id: string;
  name: string;
  type: 'service' | 'action';
  parameters: ParameterDefinition[];
  description?: string;
}

interface Execution {
  id: string;
  operationId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress?: number;
  feedback?: unknown;
  result?: unknown;
  error?: string;
  startTime: string;
  endTime?: string;
}

interface Parameter {
  name: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  constraints?: ParameterConstraints;
  namespace?: string;
}

interface Fault {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  componentId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface FaultSnapshot {
  faultCode: string;
  timestamp: string;
  systemState: Record<string, unknown>;
  topicData: Record<string, unknown>;
}

// Real-time streaming types
interface SSEMessage {
  type: 'fault' | 'component_status' | 'topic_update';
  data: unknown;
  timestamp: string;
}

interface WebSocketMessage {
  event: string;
  payload: unknown;
  timestamp: string;
}

// UI state types
interface DashboardLayout {
  id: string;
  name: string;
  panels: PanelConfig[];
  isDefault: boolean;
}

interface PanelConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
}

interface RobotInstance {
  id: string;
  name: string;
  apiUrl: string;
  isActive: boolean;
  lastConnected?: string;
}
```

## Data Models

### State Management Architecture

The application uses a hybrid state management approach:

**1. Server State (React Query)**
- Manages all data fetched from the API Gateway
- Automatic caching with configurable TTL
- Background refetching for stale data
- Optimistic updates for mutations
- Request deduplication

**2. UI State (Zustand)**
- Theme preferences (dark/light mode)
- Layout configuration
- Filter and search state
- Panel visibility and arrangement
- User preferences

**3. Real-time State (Custom Managers)**
- SSE connection state and message buffer
- WebSocket connection state and subscriptions
- Topic data streams with circular buffers
- Fault event stream

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Action                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Component                           │
│  - Dispatches action via hook                                │
│  - Optimistic UI update                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Query Hook                          │
│  - Checks cache for existing data                            │
│  - Returns cached data immediately if fresh                  │
│  - Triggers background refetch if stale                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Client                              │
│  - Adds authentication headers                               │
│  - Handles request serialization                             │
│  - Implements retry logic                                    │
│  - Manages request cancellation                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway                                │
│  - Processes request                                         │
│  - Returns response                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Response Processing                         │
│  - Validates response schema                                 │
│  - Transforms data to UI format                              │
│  - Updates React Query cache                                 │
│  - Triggers component re-render                              │
└─────────────────────────────────────────────────────────────┘
```

### Caching Strategy

**Static Data (5 minute TTL)**
- Areas list
- Component metadata
- Operation definitions
- Parameter schemas

**Dynamic Data (30 second TTL)**
- Component status
- System health metrics
- Performance statistics

**Real-time Data (No caching)**
- Topic data streams
- Fault events
- Action execution status
- Live visualizations

**User Data (Persistent)**
- Theme preferences
- Layout configurations
- Robot instances
- Configuration profiles


## API Client Architecture

### Axios Configuration

The API client uses a configured Axios instance with interceptors for cross-cutting concerns:

```typescript
// features/api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 503) {
        // Service unavailable - trigger reconnection
        connectionStore.setStatus('disconnected');
      }
      
      // Transform API errors to user-friendly messages
      throw new ApiError(status, data.message || 'Request failed', data);
    } else if (error.request) {
      // Request made but no response received
      connectionStore.setStatus('disconnected');
      throw new NetworkError('Unable to reach API Gateway');
    } else {
      // Request setup error
      throw new Error(error.message);
    }
  }
);
```

### React Query Integration

React Query hooks provide a clean interface for data fetching with automatic caching:

```typescript
// features/api/hooks.ts

// Fetch all areas
export const useAreas = () => {
  return useQuery({
    queryKey: ['areas'],
    queryFn: () => apiClient.get<Area[]>('/areas').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  });
};

// Fetch components for an area
export const useAreaComponents = (areaId: string) => {
  return useQuery({
    queryKey: ['areas', areaId, 'components'],
    queryFn: () => 
      apiClient.get<Component[]>(`/areas/${areaId}/components`)
        .then(res => res.data),
    enabled: !!areaId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Fetch topic data with auto-refresh
export const useTopicData = (
  componentId: string,
  topicName: string,
  refreshInterval: number = 1000
) => {
  return useQuery({
    queryKey: ['components', componentId, 'topics', topicName],
    queryFn: () =>
      apiClient.get(`/components/${componentId}/data/${topicName}`)
        .then(res => res.data),
    enabled: !!componentId && !!topicName,
    refetchInterval: refreshInterval,
    staleTime: 0, // Always consider stale for real-time data
  });
};

// Publish topic message (mutation)
export const usePublishTopic = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ componentId, topicName, message }: PublishParams) =>
      apiClient.put(`/components/${componentId}/data/${topicName}`, message),
    onSuccess: (_, variables) => {
      // Invalidate topic data to refetch
      queryClient.invalidateQueries({
        queryKey: ['components', variables.componentId, 'topics', variables.topicName]
      });
    },
  });
};

// Execute operation with optimistic updates
export const useExecuteOperation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ componentId, operationId, parameters }: ExecuteParams) =>
      apiClient.post(
        `/components/${componentId}/operations/${operationId}/executions`,
        { parameters }
      ).then(res => res.data),
    onMutate: async (variables) => {
      // Optimistically add execution to list
      const queryKey = ['executions', variables.componentId, variables.operationId];
      await queryClient.cancelQueries({ queryKey });
      
      const previousExecutions = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: Execution[] = []) => [
        ...old,
        {
          id: 'temp-' + Date.now(),
          operationId: variables.operationId,
          status: 'pending',
          startTime: new Date().toISOString(),
        },
      ]);
      
      return { previousExecutions };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousExecutions) {
        queryClient.setQueryData(
          ['executions', variables.componentId, variables.operationId],
          context.previousExecutions
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Refetch to get actual state
      queryClient.invalidateQueries({
        queryKey: ['executions', variables.componentId, variables.operationId]
      });
    },
  });
};

// Update parameter with optimistic update
export const useUpdateParameter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ componentId, paramName, value }: UpdateParamParams) =>
      apiClient.put(`/components/${componentId}/configurations/${paramName}`, { value }),
    onMutate: async (variables) => {
      const queryKey = ['components', variables.componentId, 'parameters'];
      await queryClient.cancelQueries({ queryKey });
      
      const previousParams = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: Parameter[] = []) =>
        old.map(p => 
          p.name === variables.paramName 
            ? { ...p, value: variables.value }
            : p
        )
      );
      
      return { previousParams };
    },
    onError: (err, variables, context) => {
      if (context?.previousParams) {
        queryClient.setQueryData(
          ['components', variables.componentId, 'parameters'],
          context.previousParams
        );
      }
    },
  });
};
```

### Request Deduplication and Batching

React Query automatically deduplicates identical requests made within a short time window. For additional optimization, we implement request batching for bulk operations:

```typescript
// features/api/batching.ts
class RequestBatcher {
  private queue: Map<string, Promise<any>> = new Map();
  private batchTimeout: number = 50; // ms
  
  async batch<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.queue.has(key)) {
      return this.queue.get(key);
    }
    
    const promise = new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.queue.delete(key);
        }
      }, this.batchTimeout);
    });
    
    this.queue.set(key, promise);
    return promise;
  }
}
```


## Real-time Data Flow Architecture

### Server-Sent Events (SSE) Manager

The SSE manager handles fault streaming with automatic reconnection:

```typescript
// features/realtime/sseManager.ts
class SSEManager {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000; // 1 second
  private maxDelay = 30000; // 30 seconds
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  
  connect(url: string) {
    if (this.eventSource) {
      this.disconnect();
    }
    
    this.eventSource = new EventSource(url);
    
    this.eventSource.onopen = () => {
      console.log('[SSE] Connected');
      this.reconnectAttempts = 0;
      connectionStore.setSSEStatus('connected');
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        this.notifyListeners(message.type, message.data);
      } catch (error) {
        console.error('[SSE] Failed to parse message:', error);
      }
    };
    
    this.eventSource.onerror = () => {
      console.error('[SSE] Connection error');
      connectionStore.setSSEStatus('disconnected');
      this.reconnect(url);
    };
  }
  
  private reconnect(url: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnection attempts reached');
      return;
    }
    
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    );
    
    this.reconnectAttempts++;
    connectionStore.setSSEStatus('reconnecting');
    
    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(url);
    }, delay);
  }
  
  subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }
  
  private notifyListeners(eventType: string, data: any) {
    this.listeners.get(eventType)?.forEach(callback => callback(data));
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      connectionStore.setSSEStatus('disconnected');
    }
  }
}

export const sseManager = new SSEManager();
```

### WebSocket Manager

The WebSocket manager provides bidirectional real-time communication with subscription management:

```typescript
// features/realtime/websocketManager.ts
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private messageQueue: any[] = [];
  private heartbeatInterval: number | null = null;
  
  connect(url: string) {
    if (this.ws) {
      this.disconnect();
    }
    
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
      connectionStore.setWSStatus('connected');
      this.startHeartbeat();
      this.flushMessageQueue();
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.event === 'pong') {
          // Heartbeat response
          return;
        }
        
        this.notifySubscribers(message.event, message.payload);
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      connectionStore.setWSStatus('disconnected');
      this.stopHeartbeat();
      this.reconnect(url);
    };
  }
  
  private reconnect(url: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnection attempts reached, falling back to polling');
      connectionStore.setWSStatus('failed');
      // Trigger fallback to HTTP polling
      connectionStore.enablePollingFallback();
      return;
    }
    
    const delay = 1000 * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    connectionStore.setWSStatus('reconnecting');
    
    setTimeout(() => {
      this.connect(url);
    }, delay);
  }
  
  subscribe(event: string, callback: (data: any) => void) {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
      // Send subscription message to server
      this.send({ type: 'subscribe', event });
    }
    
    this.subscriptions.get(event)!.add(callback);
    
    return () => {
      this.subscriptions.get(event)?.delete(callback);
      if (this.subscriptions.get(event)?.size === 0) {
        this.send({ type: 'unsubscribe', event });
        this.subscriptions.delete(event);
      }
    };
  }
  
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Queue message for sending when connected
      this.messageQueue.push(data);
    }
  }
  
  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }
  
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000); // 30 seconds
  }
  
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private notifySubscribers(event: string, data: any) {
    this.subscriptions.get(event)?.forEach(callback => callback(data));
  }
  
  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsManager = new WebSocketManager();
```

### Polling Fallback Strategy

When WebSocket connection fails, the system falls back to HTTP polling:

```typescript
// features/realtime/pollingFallback.ts
class PollingManager {
  private intervals: Map<string, number> = new Map();
  private defaultInterval = 2000; // 2 seconds
  
  startPolling(
    key: string,
    fetchFn: () => Promise<any>,
    callback: (data: any) => void,
    interval: number = this.defaultInterval
  ) {
    if (this.intervals.has(key)) {
      this.stopPolling(key);
    }
    
    const poll = async () => {
      try {
        const data = await fetchFn();
        callback(data);
      } catch (error) {
        console.error(`[Polling] Error for ${key}:`, error);
      }
    };
    
    // Initial fetch
    poll();
    
    // Set up interval
    const intervalId = window.setInterval(poll, interval);
    this.intervals.set(key, intervalId);
  }
  
  stopPolling(key: string) {
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }
  
  stopAll() {
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
    this.intervals.clear();
  }
}

export const pollingManager = new PollingManager();
```

### Topic Data Streaming with Circular Buffer

For high-frequency topic data, we use a circular buffer to maintain recent history:

```typescript
// features/realtime/topicBuffer.ts
class CircularBuffer<T> {
  private buffer: T[];
  private head = 0;
  private size = 0;
  
  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }
  
  push(item: T) {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    this.size = Math.min(this.size + 1, this.capacity);
  }
  
  toArray(): T[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size);
    }
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }
  
  clear() {
    this.head = 0;
    this.size = 0;
  }
  
  getSize(): number {
    return this.size;
  }
}

// Topic data manager with circular buffers
class TopicDataManager {
  private buffers: Map<string, CircularBuffer<TopicDataPoint>> = new Map();
  private bufferSize = 60; // Keep 60 data points (60 seconds at 1Hz)
  
  addDataPoint(topicKey: string, data: any) {
    if (!this.buffers.has(topicKey)) {
      this.buffers.set(topicKey, new CircularBuffer(this.bufferSize));
    }
    
    const buffer = this.buffers.get(topicKey)!;
    buffer.push({
      timestamp: Date.now(),
      value: data,
    });
  }
  
  getHistory(topicKey: string): TopicDataPoint[] {
    return this.buffers.get(topicKey)?.toArray() || [];
  }
  
  clearHistory(topicKey: string) {
    this.buffers.get(topicKey)?.clear();
  }
}

export const topicDataManager = new TopicDataManager();
```


## UI Component Design System

### Design Tokens

The dashboard uses a comprehensive design token system for consistency:

```typescript
// Design tokens for theming
const designTokens = {
  colors: {
    // Semantic colors
    primary: 'hsl(221, 83%, 53%)',      // Blue for primary actions
    success: 'hsl(142, 71%, 45%)',      // Green for success states
    warning: 'hsl(38, 92%, 50%)',       // Orange for warnings
    error: 'hsl(0, 84%, 60%)',          // Red for errors
    info: 'hsl(199, 89%, 48%)',         // Cyan for info
    
    // Status colors
    active: 'hsl(142, 71%, 45%)',       // Green
    inactive: 'hsl(215, 14%, 34%)',     // Gray
    degraded: 'hsl(38, 92%, 50%)',      // Orange
    critical: 'hsl(0, 84%, 60%)',       // Red
    
    // Severity colors (color-blind friendly)
    severityError: 'hsl(0, 84%, 60%)',
    severityWarning: 'hsl(38, 92%, 50%)',
    severityInfo: 'hsl(199, 89%, 48%)',
  },
  
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },
  
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
    },
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};
```

### Animated Status Indicators

Creative status indicators provide at-a-glance system state awareness:

```typescript
// components/common/AnimatedStatus.tsx
interface AnimatedStatusProps {
  status: 'active' | 'inactive' | 'degraded' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

const AnimatedStatus: React.FC<AnimatedStatusProps> = ({
  status,
  size = 'md',
  showLabel = true,
  animate = true,
}) => {
  const statusConfig = {
    active: {
      color: 'bg-green-500',
      label: 'Active',
      animation: 'animate-pulse-slow',
      icon: Activity,
    },
    inactive: {
      color: 'bg-gray-400',
      label: 'Inactive',
      animation: '',
      icon: Circle,
    },
    degraded: {
      color: 'bg-yellow-500',
      label: 'Degraded',
      animation: 'animate-pulse-warning',
      icon: AlertTriangle,
    },
    critical: {
      color: 'bg-red-500',
      label: 'Critical',
      animation: 'animate-pulse-critical',
      icon: AlertCircle,
    },
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {/* Outer pulse ring */}
        {animate && status !== 'inactive' && (
          <div
            className={`absolute inset-0 rounded-full ${config.color} opacity-75 ${config.animation}`}
          />
        )}
        {/* Inner solid circle */}
        <div className={`relative rounded-full ${config.color} ${sizeClasses[size]}`}>
          <Icon className="w-full h-full p-1 text-white" />
        </div>
      </div>
      {showLabel && (
        <span className="text-sm font-medium">{config.label}</span>
      )}
    </div>
  );
};
```

### JSON Inspector Component

A sophisticated JSON viewer with syntax highlighting and interactive features:

```typescript
// components/common/JsonInspector.tsx
interface JsonInspectorProps {
  data: any;
  expanded?: boolean;
  searchable?: boolean;
  copyable?: boolean;
  diffWith?: any;
}

const JsonInspector: React.FC<JsonInspectorProps> = ({
  data,
  expanded = false,
  searchable = true,
  copyable = true,
  diffWith,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  
  const togglePath = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('Copied to clipboard');
  };
  
  const renderValue = (value: any, path: string, depth: number): React.ReactNode => {
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-purple-500">{value.toString()}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-500">{value}</span>;
    }
    
    if (typeof value === 'string') {
      const highlighted = searchTerm && value.includes(searchTerm);
      return (
        <span className={`text-green-500 ${highlighted ? 'bg-yellow-200' : ''}`}>
          "{value}"
        </span>
      );
    }
    
    if (Array.isArray(value)) {
      const isExpanded = expandedPaths.has(path);
      return (
        <div>
          <button
            onClick={() => togglePath(path)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '▼' : '▶'} Array[{value.length}]
          </button>
          {isExpanded && (
            <div className="ml-4 border-l-2 border-gray-200 pl-2">
              {value.map((item, index) => (
                <div key={index}>
                  <span className="text-gray-500">{index}: </span>
                  {renderValue(item, `${path}.${index}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      const isExpanded = expandedPaths.has(path);
      const keys = Object.keys(value);
      
      return (
        <div>
          <button
            onClick={() => togglePath(path)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '▼' : '▶'} Object{'{'}
            {keys.length}
            {'}'}
          </button>
          {isExpanded && (
            <div className="ml-4 border-l-2 border-gray-200 pl-2">
              {keys.map(key => (
                <div key={key}>
                  <span className="text-orange-500">"{key}"</span>
                  <span className="text-gray-500">: </span>
                  {renderValue(value[key], `${path}.${key}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };
  
  if (viewMode === 'raw') {
    return (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto font-mono text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {searchable && (
          <input
            type="text"
            placeholder="Search in JSON..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
            className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
          >
            {viewMode === 'formatted' ? 'Raw' : 'Formatted'}
          </button>
          {copyable && (
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
            >
              Copy
            </button>
          )}
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto font-mono text-sm">
        {renderValue(data, 'root', 0)}
      </div>
      <div className="text-xs text-gray-500">
        Size: {new Blob([JSON.stringify(data)]).size} bytes
      </div>
    </div>
  );
};
```


## Routing and Navigation Structure

### Route Configuration

The dashboard uses React Router v6 with nested routes:

```typescript
// App.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'components',
        children: [
          {
            index: true,
            element: <ComponentBrowser />,
          },
          {
            path: ':componentId',
            element: <ComponentDetail />,
            children: [
              {
                path: 'topics',
                element: <TopicList />,
              },
              {
                path: 'topics/:topicName',
                element: <TopicViewer />,
              },
              {
                path: 'operations',
                element: <OperationList />,
              },
              {
                path: 'operations/:operationId',
                element: <OperationExecutor />,
              },
              {
                path: 'parameters',
                element: <ParameterTable />,
              },
            ],
          },
        ],
      },
      {
        path: 'faults',
        children: [
          {
            index: true,
            element: <FaultMonitor />,
          },
          {
            path: ':faultCode',
            element: <FaultDetail />,
          },
        ],
      },
      {
        path: 'visualizations',
        children: [
          {
            index: true,
            element: <VisualizationHub />,
          },
          {
            path: 'map',
            element: <Map2D />,
          },
          {
            path: 'pointcloud',
            element: <PointCloudViewer />,
          },
          {
            path: 'gaussian-splat',
            element: <GaussianSplatViewer />,
          },
          {
            path: 'topology',
            element: <ComponentTopology />,
          },
        ],
      },
      {
        path: 'performance',
        element: <PerformanceMetrics />,
      },
      {
        path: 'safety',
        element: <SafetyMonitor />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);
```

### Navigation State Management

Breadcrumb navigation and history tracking:

```typescript
// features/stores/navigationStore.ts
interface NavigationState {
  breadcrumbs: Breadcrumb[];
  history: string[];
  currentPath: string;
}

const useNavigationStore = create<NavigationState>((set) => ({
  breadcrumbs: [],
  history: [],
  currentPath: '/',
  
  pushBreadcrumb: (breadcrumb: Breadcrumb) =>
    set((state) => ({
      breadcrumbs: [...state.breadcrumbs, breadcrumb],
    })),
  
  popBreadcrumb: () =>
    set((state) => ({
      breadcrumbs: state.breadcrumbs.slice(0, -1),
    })),
  
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) =>
    set({ breadcrumbs }),
  
  addToHistory: (path: string) =>
    set((state) => ({
      history: [...state.history.slice(-9), path], // Keep last 10
      currentPath: path,
    })),
}));
```

## 3D Visualization Architecture

### Three.js Integration with React Three Fiber

The dashboard uses React Three Fiber for declarative 3D scene composition:

```typescript
// components/visualizations/PointCloudViewer.tsx
interface PointCloudViewerProps {
  points: PointCloudData;
  colorMode: 'rgb' | 'intensity' | 'semantic';
  pointSize?: number;
}

const PointCloudViewer: React.FC<PointCloudViewerProps> = ({
  points,
  colorMode,
  pointSize = 0.05,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Convert point cloud data to Three.js geometry
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    
    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      
      const color = getPointColor(point, colorMode);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    return geometry;
  }, [points, colorMode]);
  
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={pointSize}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.8}
        />
      </Points>
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
      
      <Grid args={[20, 20]} />
      <axesHelper args={[5]} />
    </Canvas>
  );
};
```

### Gaussian Splatting Visualization

Advanced 3D reconstruction visualization using Gaussian splatting:

```typescript
// components/visualizations/GaussianSplatViewer.tsx
interface GaussianSplat {
  position: [number, number, number];
  color: [number, number, number];
  covariance: number[][]; // 3x3 covariance matrix
  opacity: number;
}

const GaussianSplatViewer: React.FC<{ splats: GaussianSplat[] }> = ({ splats }) => {
  const [renderMode, setRenderMode] = useState<'points' | 'ellipsoids' | 'full'>('full');
  
  // Custom shader for Gaussian rendering
  const splatMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        pointSize: { value: 1.0 },
        renderMode: { value: renderMode },
      },
      vertexShader: `
        attribute vec3 color;
        attribute mat3 covariance;
        attribute float opacity;
        
        varying vec3 vColor;
        varying float vOpacity;
        varying mat3 vCovariance;
        
        void main() {
          vColor = color;
          vOpacity = opacity;
          vCovariance = covariance;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = pointSize * (300.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        varying mat3 vCovariance;
        
        void main() {
          // Compute Gaussian falloff
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          float alpha = exp(-dist * dist * 4.0) * vOpacity;
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [renderMode]);
  
  return (
    <Canvas>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      
      <GaussianSplats splats={splats} material={splatMaterial} />
      
      <OrbitControls />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
      </EffectComposer>
    </Canvas>
  );
};
```

### 2D Map Visualization

Interactive 2D navigation map with semantic objects:

```typescript
// components/visualizations/Map2D.tsx
interface Map2DProps {
  robotPose: { x: number; y: number; theta: number };
  occupancyGrid: OccupancyGrid;
  semanticObjects: SemanticObject[];
  frontiers?: Frontier[];
  path?: PathPoint[];
}

const Map2D: React.FC<Map2DProps> = ({
  robotPose,
  occupancyGrid,
  semanticObjects,
  frontiers,
  path,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply viewport transform
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);
    
    // Draw occupancy grid
    drawOccupancyGrid(ctx, occupancyGrid);
    
    // Draw exploration frontiers
    if (frontiers) {
      drawFrontiers(ctx, frontiers);
    }
    
    // Draw planned path
    if (path) {
      drawPath(ctx, path);
    }
    
    // Draw semantic objects
    semanticObjects.forEach(obj => {
      drawSemanticObject(ctx, obj);
    });
    
    // Draw robot
    drawRobot(ctx, robotPose);
    
    ctx.restore();
  }, [robotPose, occupancyGrid, semanticObjects, frontiers, path, viewport]);
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(10, prev.scale * delta)),
    }));
  };
  
  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onWheel={handleWheel}
        className="border border-gray-300 rounded-lg"
      />
      <MapControls viewport={viewport} setViewport={setViewport} />
      <MapLegend />
    </div>
  );
};
```


## Performance Optimization Strategies

### Virtualization for Large Lists

Using react-window for efficient rendering of large component/topic lists:

```typescript
// components/common/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  height: number;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  height,
}: VirtualizedListProps<T>) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{renderItem(items[index], index)}</div>
  );
  
  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### Debouncing and Throttling

Optimizing high-frequency updates:

```typescript
// features/utils/performance.ts
import { useCallback, useEffect, useRef } from 'react';

// Debounce hook for search inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Throttle hook for scroll/resize handlers
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  
  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  ) as T;
}

// Frame rate limiter for animations
export class FrameRateLimiter {
  private lastFrame = 0;
  private targetFPS = 30;
  private frameInterval = 1000 / this.targetFPS;
  
  shouldRender(timestamp: number): boolean {
    if (timestamp - this.lastFrame >= this.frameInterval) {
      this.lastFrame = timestamp;
      return true;
    }
    return false;
  }
  
  setTargetFPS(fps: number) {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }
}
```

### Web Workers for Heavy Computation

Offloading data processing to web workers:

```typescript
// workers/dataProcessor.worker.ts
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PARSE_POINT_CLOUD':
      const parsed = parsePointCloudData(data);
      self.postMessage({ type: 'POINT_CLOUD_PARSED', data: parsed });
      break;
      
    case 'COMPUTE_STATISTICS':
      const stats = computeStatistics(data);
      self.postMessage({ type: 'STATISTICS_COMPUTED', data: stats });
      break;
      
    case 'FILTER_LARGE_DATASET':
      const filtered = filterDataset(data);
      self.postMessage({ type: 'DATASET_FILTERED', data: filtered });
      break;
  }
});

function parsePointCloudData(rawData: ArrayBuffer): PointCloud {
  // Heavy parsing logic
  const view = new DataView(rawData);
  const points: Point[] = [];
  
  for (let i = 0; i < view.byteLength; i += 16) {
    points.push({
      x: view.getFloat32(i, true),
      y: view.getFloat32(i + 4, true),
      z: view.getFloat32(i + 8, true),
      intensity: view.getFloat32(i + 12, true),
    });
  }
  
  return { points };
}

// Hook for using web workers
// features/utils/useWebWorker.ts
export function useWebWorker<T, R>(
  workerFactory: () => Worker
): [(data: T) => Promise<R>, () => void] {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, (value: R) => void>>(new Map());
  
  useEffect(() => {
    workerRef.current = workerFactory();
    
    workerRef.current.onmessage = (event) => {
      const { type, data, requestId } = event.data;
      const resolver = pendingRequests.current.get(requestId);
      if (resolver) {
        resolver(data);
        pendingRequests.current.delete(requestId);
      }
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  
  const postMessage = useCallback((data: T): Promise<R> => {
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36);
      pendingRequests.current.set(requestId, resolve);
      workerRef.current?.postMessage({ data, requestId });
    });
  }, []);
  
  const terminate = useCallback(() => {
    workerRef.current?.terminate();
  }, []);
  
  return [postMessage, terminate];
}
```

### Memoization and React Optimization

Preventing unnecessary re-renders:

```typescript
// Memoized component example
const TopicListItem = memo<TopicListItemProps>(
  ({ topic, onSelect }) => {
    return (
      <div
        onClick={() => onSelect(topic)}
        className="p-4 hover:bg-gray-50 cursor-pointer"
      >
        <div className="font-medium">{topic.name}</div>
        <div className="text-sm text-gray-500">{topic.messageType}</div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimization
    return (
      prevProps.topic.name === nextProps.topic.name &&
      prevProps.topic.lastUpdate === nextProps.topic.lastUpdate
    );
  }
);

// Memoized selector
const selectActiveComponents = createSelector(
  [(state: RootState) => state.components.items],
  (components) => components.filter(c => c.status === 'active')
);

// Optimized data transformation
const useTransformedData = (rawData: RawData[]) => {
  return useMemo(() => {
    return rawData.map(item => ({
      ...item,
      displayName: formatDisplayName(item.name),
      timestamp: new Date(item.timestamp),
    }));
  }, [rawData]);
};
```

### Code Splitting and Lazy Loading

Dynamic imports for route-based code splitting:

```typescript
// Lazy load heavy components
const PointCloudViewer = lazy(() => import('./components/visualizations/PointCloudViewer'));
const GaussianSplatViewer = lazy(() => import('./components/visualizations/GaussianSplatViewer'));
const PerformanceMetrics = lazy(() => import('./pages/Performance'));

// Route with suspense
<Route
  path="/visualizations/pointcloud"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <PointCloudViewer />
    </Suspense>
  }
/>

// Preload on hover for better UX
const PreloadLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const handleMouseEnter = () => {
    // Preload the route component
    const route = routes.find(r => r.path === to);
    if (route?.component) {
      route.component.preload();
    }
  };
  
  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
};
```

### Bundle Size Optimization

Vite configuration for optimal production builds:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          
          // Feature chunks
          'visualizations': [
            './src/components/visualizations/PointCloudViewer',
            './src/components/visualizations/GaussianSplatViewer',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
  },
});
```

## Error Handling

### Error Boundary Implementation

Comprehensive error catching and recovery:

```typescript
// components/common/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error tracking service
    if (import.meta.env.PROD) {
      logErrorToService(error, errorInfo);
    }
    
    this.setState({ errorInfo });
  }
  
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold">Something went wrong</h2>
            </div>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Handling

Structured error types and handling:

```typescript
// features/api/errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error handler utility
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message;
    }
  }
  
  if (error instanceof NetworkError) {
    return 'Unable to connect to the robot. Please check your connection.';
  }
  
  if (error instanceof ValidationError) {
    return `Validation failed: ${Object.values(error.fields).join(', ')}`;
  }
  
  return 'An unexpected error occurred.';
}
```


## Testing Strategy

The dashboard employs a comprehensive dual testing approach combining unit tests for specific scenarios and property-based tests for universal behaviors. This strategy ensures both concrete correctness and general robustness across all possible inputs.

### Testing Framework Stack

**Unit and Component Testing**
- Vitest for unit tests (fast, Vite-native)
- React Testing Library for component tests
- MSW (Mock Service Worker) for API mocking
- @testing-library/user-event for user interaction simulation

**Property-Based Testing**
- fast-check for property-based testing in TypeScript
- Minimum 100 iterations per property test
- Custom generators for domain-specific data types

**End-to-End Testing**
- Playwright for E2E tests
- Visual regression testing with Percy or Chromatic
- Accessibility testing with axe-core

**Performance Testing**
- Lighthouse CI for performance benchmarks
- Web Vitals monitoring
- Bundle size tracking

### Test Organization

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── dataTransform.test.ts
│   │   │   ├── validation.test.ts
│   │   │   └── formatting.test.ts
│   │   ├── api/
│   │   │   ├── client.test.ts
│   │   │   └── endpoints.test.ts
│   │   └── stores/
│   │       ├── uiStore.test.ts
│   │       └── robotStore.test.ts
│   ├── component/
│   │   ├── TopicViewer.test.tsx
│   │   ├── FaultMonitor.test.tsx
│   │   ├── ParameterTable.test.tsx
│   │   └── JsonInspector.test.tsx
│   ├── integration/
│   │   ├── apiIntegration.test.ts
│   │   ├── realtimeStreaming.test.ts
│   │   └── stateManagement.test.ts
│   ├── property/
│   │   ├── configRoundTrip.property.test.ts
│   │   ├── searchFiltering.property.test.ts
│   │   ├── dataValidation.property.test.ts
│   │   └── apiCalls.property.test.ts
│   └── e2e/
│       ├── dashboard.spec.ts
│       ├── componentBrowser.spec.ts
│       ├── faultMonitoring.spec.ts
│       └── visualizations.spec.ts
└── __mocks__/
    ├── api/
    │   └── handlers.ts
    └── data/
        ├── mockComponents.ts
        ├── mockTopics.ts
        └── mockFaults.ts
```

### Mock Data Generation

Custom generators for property-based testing:

```typescript
// __tests__/generators/robotData.ts
import * as fc from 'fast-check';

export const componentArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  identifier: fc.string({ minLength: 1, maxLength: 100 }),
  areaId: fc.uuid(),
  status: fc.constantFrom('active', 'inactive', 'error'),
  metadata: fc.dictionary(fc.string(), fc.anything()),
});

export const topicArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  messageType: fc.string({ minLength: 1, maxLength: 50 }),
  publishRate: fc.nat({ max: 1000 }),
  lastUpdate: fc.date().map(d => d.toISOString()),
  data: fc.anything(),
});

export const faultArbitrary = fc.record({
  code: fc.string({ minLength: 1, maxLength: 20 }),
  message: fc.string({ minLength: 1, maxLength: 200 }),
  severity: fc.constantFrom('error', 'warning', 'info'),
  componentId: fc.uuid(),
  timestamp: fc.date().map(d => d.toISOString()),
  metadata: fc.dictionary(fc.string(), fc.anything()),
});

export const parameterArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  value: fc.oneof(
    fc.string(),
    fc.integer(),
    fc.double(),
    fc.boolean(),
    fc.array(fc.anything())
  ),
  type: fc.constantFrom('string', 'number', 'boolean', 'array', 'object'),
  description: fc.option(fc.string()),
  namespace: fc.option(fc.string()),
});

export const configurationArbitrary = fc.record({
  version: fc.constant('1.0'),
  theme: fc.constantFrom('light', 'dark'),
  layout: fc.record({
    id: fc.uuid(),
    name: fc.string(),
    panels: fc.array(fc.record({
      id: fc.uuid(),
      type: fc.string(),
      position: fc.record({ x: fc.nat(), y: fc.nat() }),
      size: fc.record({ width: fc.nat(), height: fc.nat() }),
      config: fc.dictionary(fc.string(), fc.anything()),
    })),
  }),
  robots: fc.array(fc.record({
    id: fc.uuid(),
    name: fc.string(),
    apiUrl: fc.webUrl(),
    isActive: fc.boolean(),
  })),
});
```

### Unit Test Examples

```typescript
// __tests__/unit/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateJSON, validateParameterValue } from '@/features/utils/validation';

describe('validateJSON', () => {
  it('should return true for valid JSON strings', () => {
    expect(validateJSON('{"key": "value"}')).toBe(true);
    expect(validateJSON('[]')).toBe(true);
    expect(validateJSON('null')).toBe(true);
  });
  
  it('should return false for invalid JSON strings', () => {
    expect(validateJSON('{key: value}')).toBe(false);
    expect(validateJSON('undefined')).toBe(false);
    expect(validateJSON('{incomplete')).toBe(false);
  });
});

describe('validateParameterValue', () => {
  it('should validate string parameters', () => {
    expect(validateParameterValue('test', 'string')).toBe(true);
    expect(validateParameterValue(123, 'string')).toBe(false);
  });
  
  it('should validate number parameters', () => {
    expect(validateParameterValue(123, 'number')).toBe(true);
    expect(validateParameterValue('123', 'number')).toBe(false);
  });
  
  it('should validate boolean parameters', () => {
    expect(validateParameterValue(true, 'boolean')).toBe(true);
    expect(validateParameterValue('true', 'boolean')).toBe(false);
  });
});
```

### Component Test Examples

```typescript
// __tests__/component/TopicViewer.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicViewer } from '@/components/topics/TopicViewer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('TopicViewer', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('should display topic data in JSON format', async () => {
    render(
      <TopicViewer componentId="comp-1" topicName="/test/topic" />,
      { wrapper }
    );
    
    await waitFor(() => {
      expect(screen.getByText(/test/i)).toBeInTheDocument();
    });
  });
  
  it('should provide pause/resume controls', async () => {
    const user = userEvent.setup();
    render(
      <TopicViewer componentId="comp-1" topicName="/test/topic" />,
      { wrapper }
    );
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await user.click(pauseButton);
    
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
  });
  
  it('should display error message on fetch failure', async () => {
    // Mock API failure
    queryClient.setQueryData(['topics', 'comp-1', '/test/topic'], () => {
      throw new Error('Network error');
    });
    
    render(
      <TopicViewer componentId="comp-1" topicName="/test/topic" />,
      { wrapper }
    );
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Test Examples

```typescript
// __tests__/integration/apiIntegration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/features/api/client';

const server = setupServer(
  http.get('http://localhost:8080/api/v1/areas', () => {
    return HttpResponse.json([
      { id: '1', name: 'Powertrain', componentCount: 5 },
      { id: '2', name: 'Chassis', componentCount: 3 },
    ]);
  }),
  
  http.get('http://localhost:8080/api/v1/components/:id/data', ({ params }) => {
    return HttpResponse.json({
      topics: [
        { name: '/odom', messageType: 'nav_msgs/Odometry', data: {} },
      ],
    });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('API Integration', () => {
  it('should fetch areas successfully', async () => {
    const response = await apiClient.get('/areas');
    expect(response.data).toHaveLength(2);
    expect(response.data[0].name).toBe('Powertrain');
  });
  
  it('should fetch component topic data', async () => {
    const response = await apiClient.get('/components/comp-1/data');
    expect(response.data.topics).toHaveLength(1);
    expect(response.data.topics[0].name).toBe('/odom');
  });
  
  it('should handle 404 errors gracefully', async () => {
    server.use(
      http.get('http://localhost:8080/api/v1/components/invalid', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );
    
    await expect(apiClient.get('/components/invalid')).rejects.toThrow();
  });
});
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

The following properties are derived from the acceptance criteria and represent universal behaviors that must hold for all valid inputs. Each property will be implemented as a property-based test using fast-check with a minimum of 100 iterations.

### Property 1: Area Selection API Call Correctness

For any valid area ID, when a user selects that area, the dashboard should make an API call to GET /api/v1/areas/{area_id}/components with the correct area ID.

**Validates: Requirements 2.4**

### Property 2: Component Search Filtering

For any search term and any list of components, the filtered results should only contain components whose name or identifier includes the search term (case-insensitive).

**Validates: Requirements 2.5**

### Property 3: Component Metadata Completeness

For any component displayed in the UI, the rendered output should include the component's name, identifier, and area association.

**Validates: Requirements 2.6**

### Property 4: Component Navigation

For any component in the component list, clicking on that component should trigger navigation to the detailed component view with the correct component ID in the URL.

**Validates: Requirements 2.7**

### Property 5: Topic Data Fetch on Component View

For any valid component ID, when viewing that component, the dashboard should fetch topic data from GET /api/v1/components/{component_id}/data.

**Validates: Requirements 3.1**

### Property 6: Topic Display Completeness

For any topic displayed in the topic list, the rendered output should include the topic's message type and current value.

**Validates: Requirements 3.2**

### Property 7: Topic Selection API Call

For any valid component ID and topic name, when a user selects that topic, the dashboard should fetch data from GET /api/v1/components/{component_id}/data/{topic_name}.

**Validates: Requirements 3.3**

### Property 8: Topic Auto-Refresh Timing

For any topic with auto-refresh enabled at interval I milliseconds, the dashboard should fetch new data at intervals of I ± 50ms (allowing for timing variance).

**Validates: Requirements 3.4**

### Property 9: Topic Message JSON Formatting

For any topic message data, the displayed output should be valid, parseable JSON with syntax highlighting applied.

**Validates: Requirements 3.5**

### Property 10: Topic Timestamp Display

For any topic message displayed, the rendered output should include a timestamp field.

**Validates: Requirements 3.7**

### Property 11: Numeric Topic Chart History

For any numeric topic data stream, the chart visualization should display data points from the last 60 seconds only, discarding older data.

**Validates: Requirements 3.8**

### Property 12: Topic Fetch Error Handling

For any topic data fetch that fails, the dashboard should display an error message and attempt to retry with exponential backoff (delays: 1s, 2s, 4s, 8s, max 30s).

**Validates: Requirements 3.9**

### Property 13: Topic Publish Interface Availability

For any topic being viewed, the dashboard should provide a "Publish Message" interface in the UI.

**Validates: Requirements 4.1**

### Property 14: JSON Validation Before Publication

For any string input to the message publisher, if the string is not valid JSON, the publish button should be disabled or publication should be prevented.

**Validates: Requirements 4.3**

### Property 15: Topic Publication API Call

For any valid component ID, topic name, and message payload, when a user submits the message, the dashboard should send a PUT request to /api/v1/components/{component_id}/data/{topic_name} with the message as the request body.

**Validates: Requirements 4.4**

### Property 16: Operations Fetch on Component View

For any valid component ID, when viewing that component's operations, the dashboard should fetch operations from GET /api/v1/components/{component_id}/operations.

**Validates: Requirements 5.1**

### Property 17: Operation Display Completeness

For any operation displayed, the rendered output should include the operation's type (service or action) and its parameters.

**Validates: Requirements 5.2**

### Property 18: Service vs Action Visual Distinction

For any two operations where one is a service and one is an action, the visual rendering should be distinguishable (different styling, icons, or labels).

**Validates: Requirements 5.3**

### Property 19: Operation Parameter Form Display

For any operation selected, the dashboard should display a form containing input fields for all of the operation's parameters.

**Validates: Requirements 5.4**

### Property 20: Operation Parameter Validation

For any operation with required parameters, if any required parameter is missing or has an invalid type, the execution button should be disabled or submission should be prevented.

**Validates: Requirements 5.5**

### Property 21: Operation Execution API Call

For any valid component ID, operation ID, and parameter values, when a user executes the operation, the dashboard should send a POST request to /api/v1/components/{component_id}/operations/{operation_id}/executions with the parameters in the request body.

**Validates: Requirements 5.6**

### Property 22: Action Status Polling

For any action execution with status "running" or "pending", the dashboard should poll the execution status from GET /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id} at regular intervals.

**Validates: Requirements 5.7**

### Property 23: Action Progress Display

For any action execution, the dashboard should display the current status, and if progress or feedback data is available, it should be displayed.

**Validates: Requirements 5.8**

### Property 24: Action Cancel Button Availability

For any action execution with status "running" or "pending", the dashboard should provide a cancel button that sends a DELETE request to /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id}.

**Validates: Requirements 5.9**

### Property 25: Parameters Fetch on Component View

For any valid component ID, when viewing that component's parameters, the dashboard should fetch parameters from GET /api/v1/components/{component_id}/configurations.

**Validates: Requirements 6.1**

### Property 26: Parameter Display Completeness

For any parameter displayed in the parameter table, the rendered output should include the parameter's name, current value, type, and description (if available).

**Validates: Requirements 6.2**

### Property 27: Parameter Grouping

For any list of parameters with namespace or category information, the displayed parameters should be grouped by namespace/category.

**Validates: Requirements 6.3**

### Property 28: Parameter Detail Fetch

For any valid component ID and parameter name, when a user clicks on that parameter, the dashboard should fetch detailed information from GET /api/v1/components/{component_id}/configurations/{param}.

**Validates: Requirements 6.4**

### Property 29: Parameter Input Type Matching

For any parameter with type T, the inline editor should provide an input control appropriate for type T (text input for string, number input for number, checkbox for boolean, etc.).

**Validates: Requirements 6.5**

### Property 30: Parameter Value Validation

For any parameter with type constraints, if a user enters a value that violates the constraints, submission should be prevented and a validation error should be displayed.

**Validates: Requirements 6.6**

### Property 31: Parameter Modification API Call

For any valid component ID, parameter name, and new value, when a user modifies the parameter, the dashboard should send a PUT request to /api/v1/components/{component_id}/configurations/{param} with the new value.

**Validates: Requirements 6.7**

### Property 32: Parameter Reset API Call

For any valid component ID and parameter name, when a user clicks the reset button, the dashboard should send a DELETE request to /api/v1/components/{component_id}/configurations/{param}.

**Validates: Requirements 6.8**

### Property 33: Fault Display Completeness

For any fault displayed in the fault monitor, the rendered output should include the fault code, message, component source, and timestamp.

**Validates: Requirements 7.5**

### Property 34: Fault Sorting

For any list of faults, the displayed faults should be sorted first by severity (error > warning > info) and then by timestamp (most recent first).

**Validates: Requirements 7.4**

### Property 35: Fault Filtering

For any fault filter criteria (severity, component, time range), the displayed faults should only include faults that match all active filter criteria.

**Validates: Requirements 7.6**

### Property 36: Fault Snapshot Fetch

For any valid fault code, when a user selects that fault, the dashboard should fetch snapshots from GET /api/v1/faults/{fault_code}/snapshots.

**Validates: Requirements 7.7**

### Property 37: Fault Snapshot Display

For any fault snapshot displayed, the rendered output should include the system state data captured at the time of the fault.

**Validates: Requirements 7.8**

### Property 38: Rosbag Download Availability

For any fault with available snapshots, the dashboard should provide a download button that fetches the rosbag file from GET /api/v1/faults/{fault_code}/snapshots/bag.

**Validates: Requirements 7.9**

### Property 39: SSE Reconnection with Exponential Backoff

For any SSE connection that drops, the dashboard should attempt to reconnect with exponential backoff delays (1s, 2s, 4s, 8s, 16s, max 30s) up to a maximum number of attempts.

**Validates: Requirements 7.11**

### Property 40: System Metrics Count Accuracy

For any system health overview display, the displayed counts of active components, areas, and topics should match the actual counts from the fetched data.

**Validates: Requirements 8.3**

### Property 41: Fault Count Accuracy

For any system health overview display, the displayed counts of faults by severity should match the actual counts from the fault data.

**Validates: Requirements 8.4**

### Property 42: Overview Metrics Auto-Update

For any system health overview page, all metrics should be refreshed every 2 seconds ± 200ms.

**Validates: Requirements 8.10**

### Property 43: Semantic Object Map Display

For any detected semantic object with position data, the object should appear on the 2D map visualization at the correct coordinates with its label.

**Validates: Requirements 9.3**

### Property 44: Visualization Tooltip Display

For any hoverable visualization element, when the user hovers over it, a tooltip with contextual information should be displayed.

**Validates: Requirements 9.8**

### Property 45: Visualization Layer Toggle

For any visualization layer, toggling the layer off should hide it from the display, and toggling it on should show it.

**Validates: Requirements 9.10**

### Property 46: Responsive Layout Adaptation

For any screen width W, the dashboard layout should adapt appropriately (grid columns, sidebar collapse, etc.) based on responsive breakpoints.

**Validates: Requirements 10.3**

### Property 47: Keyboard Shortcut Execution

For any defined keyboard shortcut, pressing that key combination should trigger the associated action.

**Validates: Requirements 10.6**

### Property 48: Loading State Display

For any asynchronous data fetch operation, while the operation is pending, a loading state (skeleton screen or spinner) should be displayed.

**Validates: Requirements 10.7**

### Property 49: ARIA Label Presence

For any interactive UI element (button, link, input), the element should have an appropriate ARIA label or accessible name.

**Validates: Requirements 10.9**

### Property 50: Empty State Display

For any data display component, when the data is empty or unavailable, an empty state message should be displayed.

**Validates: Requirements 10.10**

### Property 51: Theme Persistence Round-Trip

For any theme preference (light or dark), setting the theme should persist it to local storage, and reloading the page should apply the saved theme.

**Validates: Requirements 11.4**

### Property 52: Text Contrast Ratio

For any text element in both light and dark themes, the contrast ratio between text and background should meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 11.6, 11.9**

### Property 53: Reconnection Exponential Backoff

For any API Gateway connection failure, reconnection attempts should follow exponential backoff timing (1s, 2s, 4s, 8s, 16s, max 30s).

**Validates: Requirements 12.3**

### Property 54: Error Logging

For any error that occurs in the application, the error should be logged to the browser console with relevant context information.

**Validates: Requirements 12.7**

### Property 55: Graceful Degradation

For any unavailable API endpoint, the dashboard should continue to function with remaining available endpoints, displaying appropriate messages for unavailable features.

**Validates: Requirements 12.10**

### Property 56: Frame Rate Limiting

For any topic data visualization with real-time updates, the render rate should not exceed 30 frames per second.

**Validates: Requirements 13.1**

### Property 57: Search Input Debouncing

For any search or filter input, changes should be debounced by 300ms ± 50ms before triggering the search/filter operation.

**Validates: Requirements 13.3**

### Property 58: Lazy Loading

For any component detail view, the detailed data should not be fetched until the user explicitly requests to view that component.

**Validates: Requirements 13.4**

### Property 59: Static Data Caching

For any API response containing static data (areas, component metadata), the response should be cached for 5 minutes before refetching.

**Validates: Requirements 13.5**

### Property 60: Chart Data Time Window

For any historical chart, the displayed data should only include data points from the last 60 seconds, with older data being discarded.

**Validates: Requirements 13.7**

### Property 61: Topic Data Export JSON Validity

For any topic data export, the downloaded file should contain valid, parseable JSON.

**Validates: Requirements 14.1**

### Property 62: Fault History Export CSV Validity

For any fault history export, the downloaded file should contain valid CSV with proper headers and data rows.

**Validates: Requirements 14.2**

### Property 63: Parameter Export YAML Validity

For any parameter configuration export, the downloaded file should contain valid, parseable YAML.

**Validates: Requirements 14.3**

### Property 64: Export File Metadata

For any exported file (JSON, CSV, YAML), the file should include a timestamp and metadata section.

**Validates: Requirements 14.4**

### Property 65: Global Search Comprehensiveness

For any search term, the global search results should include matches from components, topics, and operations (all categories).

**Validates: Requirements 15.1**

### Property 66: Search Match Highlighting

For any search result item, the matching text should be visually highlighted in the display.

**Validates: Requirements 15.2**

### Property 67: Component Filter Accuracy

For any combination of component filters (area, status, name pattern), the filtered results should only include components that match all active filter criteria.

**Validates: Requirements 15.3**

### Property 68: Topic Filter Accuracy

For any combination of topic filters (message type, update frequency), the filtered results should only include topics that match all active filter criteria.

**Validates: Requirements 15.4**

### Property 69: Fault Filter Accuracy

For any combination of fault filters (severity, component, time range), the filtered results should only include faults that match all active filter criteria.

**Validates: Requirements 15.5**

### Property 70: Operation Filter Accuracy

For any combination of operation filters (type, availability), the filtered results should only include operations that match all active filter criteria.

**Validates: Requirements 15.6**

### Property 71: Filter Persistence Round-Trip

For any set of active filters, the filters should be persisted to session storage, and reloading the page should restore the same filter state.

**Validates: Requirements 15.7**

### Property 72: Filtered Results Count Accuracy

For any filtered data display, the displayed count of results should match the actual number of filtered items.

**Validates: Requirements 15.9**

### Property 73: Real-Time Search Updates

For any search input with debouncing, as the user types, search results should update in real-time after the debounce delay.

**Validates: Requirements 15.10**

### Property 74: Configuration Parsing

For any valid dashboard configuration JSON string, parsing the string should produce a valid configuration object without errors.

**Validates: Requirements 30.1**

### Property 75: Configuration Application

For any valid configuration object, applying the configuration should update all specified settings (theme, layout, robot instances) to match the configuration.

**Validates: Requirements 30.2**

### Property 76: Invalid Configuration Error Messages

For any invalid configuration JSON, parsing should fail and return descriptive validation errors indicating what is invalid.

**Validates: Requirements 30.3**

### Property 77: Configuration Serialization

For any valid dashboard configuration object, serializing it to JSON should produce a valid JSON string that can be parsed.

**Validates: Requirements 30.4**

### Property 78: Configuration Round-Trip

For any valid dashboard configuration object, serializing it to JSON and then parsing the JSON should produce an equivalent configuration object (all fields match).

**Validates: Requirements 30.5**

### Property 79: Configuration Schema Validation

For any configuration file, schema validation should occur before applying settings, and invalid schemas should be rejected.

**Validates: Requirements 30.6**

### Property 80: Partial Configuration Application

For any partial configuration object (containing only a subset of settings), applying it should only update the specified settings, leaving other settings unchanged.

**Validates: Requirements 30.7**

### Property 81: Configuration Version Inclusion

For any serialized configuration file, the JSON should include a "version" field indicating the configuration format version.

**Validates: Requirements 30.8**


### Property-Based Test Examples

```typescript
// __tests__/property/configRoundTrip.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { parseConfiguration, serializeConfiguration } from '@/features/utils/configuration';
import { configurationArbitrary } from '../generators/robotData';

describe('Configuration Round-Trip Property', () => {
  it('Feature: dojo-robot-web-dashboard, Property 78: For any valid dashboard configuration object, serializing it to JSON and then parsing the JSON should produce an equivalent configuration object', () => {
    fc.assert(
      fc.property(configurationArbitrary, (config) => {
        const serialized = serializeConfiguration(config);
        const parsed = parseConfiguration(serialized);
        
        // Deep equality check
        expect(parsed).toEqual(config);
      }),
      { numRuns: 100 }
    );
  });
});

// __tests__/property/searchFiltering.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterComponents } from '@/features/utils/filtering';
import { componentArbitrary } from '../generators/robotData';

describe('Component Search Filtering Property', () => {
  it('Feature: dojo-robot-web-dashboard, Property 2: For any search term and any list of components, the filtered results should only contain components whose name or identifier includes the search term', () => {
    fc.assert(
      fc.property(
        fc.array(componentArbitrary),
        fc.string(),
        (components, searchTerm) => {
          const filtered = filterComponents(components, searchTerm);
          
          // All filtered results should match the search term
          filtered.forEach(component => {
            const matchesName = component.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesId = component.identifier.toLowerCase().includes(searchTerm.toLowerCase());
            expect(matchesName || matchesId).toBe(true);
          });
          
          // No non-matching components should be in results
          const nonMatching = components.filter(c => {
            const matchesName = c.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesId = c.identifier.toLowerCase().includes(searchTerm.toLowerCase());
            return !matchesName && !matchesId;
          });
          
          nonMatching.forEach(component => {
            expect(filtered).not.toContain(component);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// __tests__/property/dataValidation.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { validateJSON } from '@/features/utils/validation';

describe('JSON Validation Property', () => {
  it('Feature: dojo-robot-web-dashboard, Property 14: For any string input, if the string is not valid JSON, validation should return false', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const isValid = validateJSON(input);
          
          if (isValid) {
            // If validation says it's valid, parsing should not throw
            expect(() => JSON.parse(input)).not.toThrow();
          } else {
            // If validation says it's invalid, parsing should throw
            expect(() => JSON.parse(input)).toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// __tests__/property/faultSorting.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { sortFaults } from '@/features/utils/faultSorting';
import { faultArbitrary } from '../generators/robotData';

describe('Fault Sorting Property', () => {
  it('Feature: dojo-robot-web-dashboard, Property 34: For any list of faults, the displayed faults should be sorted first by severity then by timestamp', () => {
    fc.assert(
      fc.property(
        fc.array(faultArbitrary, { minLength: 2 }),
        (faults) => {
          const sorted = sortFaults(faults);
          
          // Check severity ordering
          const severityOrder = { error: 0, warning: 1, info: 2 };
          
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            
            const currentSeverity = severityOrder[current.severity];
            const nextSeverity = severityOrder[next.severity];
            
            if (currentSeverity === nextSeverity) {
              // Same severity, check timestamp ordering (most recent first)
              const currentTime = new Date(current.timestamp).getTime();
              const nextTime = new Date(next.timestamp).getTime();
              expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            } else {
              // Different severity, current should be more severe
              expect(currentSeverity).toBeLessThan(nextSeverity);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// __tests__/property/chartDataWindow.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { filterChartData } from '@/features/utils/chartData';

describe('Chart Data Time Window Property', () => {
  it('Feature: dojo-robot-web-dashboard, Property 60: For any historical chart, the displayed data should only include data points from the last 60 seconds', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            timestamp: fc.date(),
            value: fc.double(),
          })
        ),
        (dataPoints) => {
          const now = Date.now();
          const filtered = filterChartData(dataPoints, now);
          
          // All filtered points should be within 60 seconds
          filtered.forEach(point => {
            const age = now - point.timestamp.getTime();
            expect(age).toBeLessThanOrEqual(60000); // 60 seconds in ms
          });
          
          // No points older than 60 seconds should be included
          const oldPoints = dataPoints.filter(p => {
            const age = now - p.timestamp.getTime();
            return age > 60000;
          });
          
          oldPoints.forEach(point => {
            expect(filtered).not.toContain(point);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// __tests__/property/parameterValidation.property.test.ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { validateParameterValue } from '@/features/utils/validation';

describe('Parameter Type Validation Property', () => {
  it('Feature: dojo-robot-web-dashboard, Property 30: For any parameter with type constraints, invalid values should fail validation', () => {
    fc.assert(
      fc.property(
        fc.anything(),
        fc.constantFrom('string', 'number', 'boolean', 'array', 'object'),
        (value, expectedType) => {
          const isValid = validateParameterValue(value, expectedType);
          
          if (isValid) {
            // If validation passes, the value should match the expected type
            switch (expectedType) {
              case 'string':
                expect(typeof value).toBe('string');
                break;
              case 'number':
                expect(typeof value).toBe('number');
                break;
              case 'boolean':
                expect(typeof value).toBe('boolean');
                break;
              case 'array':
                expect(Array.isArray(value)).toBe(true);
                break;
              case 'object':
                expect(typeof value).toBe('object');
                expect(value).not.toBeNull();
                expect(Array.isArray(value)).toBe(false);
                break;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Build and Deployment

### Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'visualizations': [
            './src/components/visualizations/PointCloudViewer',
            './src/components/visualizations/GaussianSplatViewer',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios'],
  },
});
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Package Configuration

```json
// package.json
{
  "name": "dojo-robot-web-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.12.0",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "recharts": "^2.10.3",
    "three": "^0.159.0",
    "@react-three/fiber": "^8.15.11",
    "@react-three/drei": "^9.92.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/three": "^0.159.0",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "@testing-library/jest-dom": "^6.1.5",
    "fast-check": "^3.15.0",
    "msw": "^2.0.11",
    "@playwright/test": "^1.40.1",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### Environment Configuration

```bash
# .env.development
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws
VITE_ENABLE_MOCK_API=false

# .env.production
VITE_API_URL=/api/v1
VITE_WS_URL=/ws
VITE_ENABLE_MOCK_API=false
```

### Deployment

The dashboard builds to static files that can be served by any web server:

```bash
# Build for production
npm run build

# Output directory: dist/
# - index.html
# - assets/
#   - index-[hash].js
#   - index-[hash].css
#   - vendor-[hash].js
#   - ...
```

**Deployment Options:**
1. **Nginx**: Serve static files with reverse proxy to API Gateway
2. **Docker**: Containerize with nginx base image
3. **Cloud Storage**: Deploy to S3, GCS, or Azure Blob Storage with CDN
4. **Vercel/Netlify**: Deploy with automatic CI/CD

**Nginx Configuration Example:**

```nginx
server {
    listen 80;
    server_name dashboard.example.com;
    root /var/www/dashboard/dist;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy WebSocket
    location /ws {
        proxy_pass http://localhost:8080/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Summary

This design document outlines a comprehensive, production-ready architecture for the Dojo Robot Web Dashboard. The design emphasizes:

1. **Modern Architecture**: React 18 with TypeScript, Vite build system, and component-based design
2. **Real-time Capabilities**: SSE and WebSocket integration with automatic fallback to polling
3. **Performance**: Virtualization, debouncing, web workers, and optimized bundle splitting
4. **Resilience**: Comprehensive error handling, automatic reconnection, and graceful degradation
5. **Testability**: Dual testing approach with unit tests and property-based tests
6. **User Experience**: Responsive design, dark mode, animated status indicators, and accessibility
7. **Developer Experience**: Type safety, clean abstractions, and comprehensive tooling

The dashboard provides a sophisticated interface for monitoring and controlling autonomous robot systems while maintaining excellent performance and user experience across all features.

