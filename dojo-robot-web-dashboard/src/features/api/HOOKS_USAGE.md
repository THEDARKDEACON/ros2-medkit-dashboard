# API Hooks Usage Guide

This document provides examples of how to use the API hooks for fetching areas and components.

## Available Hooks

### `useAreas()`

Fetches all areas with their metadata and component counts.

**Cache Configuration:**
- Stale time: 5 minutes
- Garbage collection time: 10 minutes

**Example:**

```tsx
import { useAreas } from '@/features/api';

function AreasList() {
  const { data: areas, isLoading, error } = useAreas();

  if (isLoading) return <div>Loading areas...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {areas?.map((area) => (
        <li key={area.id}>
          {area.name} - {area.componentCount} components
        </li>
      ))}
    </ul>
  );
}
```

### `useComponents()`

Fetches all components across all areas.

**Cache Configuration:**
- Stale time: 5 minutes
- Garbage collection time: 10 minutes

**Example:**

```tsx
import { useComponents } from '@/features/api';

function ComponentsList() {
  const { data: components, isLoading, error } = useComponents();

  if (isLoading) return <div>Loading components...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {components?.map((component) => (
        <li key={component.id}>
          {component.name} ({component.status})
        </li>
      ))}
    </ul>
  );
}
```

### `useAreaComponents(areaId: string)`

Fetches components for a specific area. The query is only enabled when a valid `areaId` is provided.

**Cache Configuration:**
- Stale time: 5 minutes
- Garbage collection time: 10 minutes
- Enabled: Only when `areaId` is truthy

**Example:**

```tsx
import { useAreaComponents } from '@/features/api';

function AreaComponentsList({ areaId }: { areaId: string }) {
  const { data: components, isLoading, error } = useAreaComponents(areaId);

  if (!areaId) return <div>Please select an area</div>;
  if (isLoading) return <div>Loading components...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {components?.map((component) => (
        <li key={component.id}>
          {component.name} - {component.identifier}
        </li>
      ))}
    </ul>
  );
}
```

### `useTopicList(componentId: string)`

Fetches the list of available topics for a component with their metadata.

**Cache Configuration:**
- Stale time: 0 (always consider stale for real-time data)
- Garbage collection time: 1 minute
- Enabled: Only when `componentId` is truthy

**Example:**

```tsx
import { useTopicList } from '@/features/api';

function TopicList({ componentId }: { componentId: string }) {
  const { data: topics, isLoading, error } = useTopicList(componentId);

  if (!componentId) return <div>Please select a component</div>;
  if (isLoading) return <div>Loading topics...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {topics?.map((topic) => (
        <li key={topic.name}>
          {topic.name} - {topic.messageType}
        </li>
      ))}
    </ul>
  );
}
```

### `useTopicData(componentId: string, topicName: string, options?)`

Fetches data for a specific topic with auto-refresh capabilities.

**Parameters:**
- `componentId`: The component ID
- `topicName`: The topic name
- `options.refetchInterval`: Refresh interval in milliseconds (default: 1000)
- `options.enabled`: Whether auto-refresh is enabled (default: true)

**Cache Configuration:**
- Stale time: 0 (always consider stale for real-time data)
- Garbage collection time: 1 minute
- Refetch interval: Configurable (default 1 second)
- Enabled: Only when `componentId`, `topicName` are truthy and not paused

**Example:**

```tsx
import { useTopicData } from '@/features/api';

function TopicViewer({ componentId, topicName }: { componentId: string; topicName: string }) {
  const { data, isLoading, error } = useTopicData(componentId, topicName);

  if (isLoading) return <div>Loading topic data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>{topicName}</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

**Custom Refresh Interval:**

```tsx
import { useTopicData } from '@/features/api';

function FastTopicViewer({ componentId, topicName }: { componentId: string; topicName: string }) {
  // Refresh every 500ms instead of default 1000ms
  const { data } = useTopicData(componentId, topicName, { 
    refetchInterval: 500 
  });

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

**Pause/Resume Functionality:**

```tsx
import { useTopicData } from '@/features/api';
import { useState } from 'react';

function PausableTopicViewer({ componentId, topicName }: { componentId: string; topicName: string }) {
  const [isPaused, setIsPaused] = useState(false);
  
  const { data, isLoading } = useTopicData(componentId, topicName, { 
    enabled: !isPaused 
  });

  return (
    <div>
      <button onClick={() => setIsPaused(!isPaused)}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
```

## Advanced Usage

### Combining Multiple Hooks

```tsx
import { useAreas, useAreaComponents } from '@/features/api';
import { useState } from 'react';

function AreaBrowser() {
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  
  const { data: areas, isLoading: areasLoading } = useAreas();
  const { data: components, isLoading: componentsLoading } = useAreaComponents(selectedAreaId);

  if (areasLoading) return <div>Loading...</div>;

  return (
    <div>
      <select 
        value={selectedAreaId} 
        onChange={(e) => setSelectedAreaId(e.target.value)}
      >
        <option value="">Select an area</option>
        {areas?.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name} ({area.componentCount})
          </option>
        ))}
      </select>

      {selectedAreaId && (
        <div>
          {componentsLoading ? (
            <div>Loading components...</div>
          ) : (
            <ul>
              {components?.map((component) => (
                <li key={component.id}>
                  {component.name} - {component.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

### Manual Refetching

```tsx
import { useAreas } from '@/features/api';

function AreasWithRefresh() {
  const { data: areas, isLoading, refetch } = useAreas();

  return (
    <div>
      <button onClick={() => refetch()}>Refresh Areas</button>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {areas?.map((area) => (
            <li key={area.id}>{area.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Error Handling

```tsx
import { useComponents } from '@/features/api';
import { ApiError } from '@/features/api';

function ComponentsWithErrorHandling() {
  const { data: components, error, isError } = useComponents();

  if (isError) {
    if (error instanceof ApiError) {
      return (
        <div>
          <h3>API Error</h3>
          <p>Status: {error.status}</p>
          <p>Message: {error.message}</p>
        </div>
      );
    }
    return <div>An unexpected error occurred</div>;
  }

  return (
    <ul>
      {components?.map((component) => (
        <li key={component.id}>{component.name}</li>
      ))}
    </ul>
  );
}
```

## React Query Features

All hooks return a React Query result object with the following properties:

- `data`: The fetched data (undefined while loading)
- `isLoading`: True during the initial fetch
- `isFetching`: True during any fetch (including background refetches)
- `isError`: True if an error occurred
- `error`: The error object if one occurred
- `isSuccess`: True if the query succeeded
- `refetch()`: Function to manually trigger a refetch
- `fetchStatus`: Current fetch status ('idle', 'fetching', 'paused')

## Cache Behavior

### Static Data (5 minute stale time)
- Areas list
- Components list
- Area components

These hooks use a 5-minute stale time, meaning:
1. Data is considered fresh for 5 minutes after fetching
2. During this time, the hook returns cached data immediately
3. After 5 minutes, data is considered stale and will be refetched in the background
4. Cached data is kept for 10 minutes after the last component using it unmounts

### Real-time Data (0 stale time with auto-refresh)
- Topic list
- Topic data

These hooks use a 0 stale time with automatic refetching, meaning:
1. Data is always considered stale
2. Data is refetched at the configured interval (default 1 second)
3. Cached data is kept for 1 minute after the last component using it unmounts
4. Auto-refresh can be paused by setting `enabled: false`

### Background Refetching

React Query automatically refetches stale data when:
- A component using the hook mounts
- The window regains focus
- The network reconnects
- You call `refetch()` manually

You can disable automatic refetching:

```tsx
const { data } = useAreas({
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
});
```

## TypeScript Support

All hooks are fully typed. Import types from `@/types/api`:

```tsx
import type { Area, Component } from '@/types/api';
import { useAreas, useComponents } from '@/features/api';

function TypedComponent() {
  const { data: areas } = useAreas();
  const { data: components } = useComponents();

  // TypeScript knows the exact shape of areas and components
  const firstArea: Area | undefined = areas?.[0];
  const firstComponent: Component | undefined = components?.[0];

  return <div>...</div>;
}
```
