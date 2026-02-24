# TopicChart Usage Example

The `TopicChart` component provides real-time visualization of numeric topic data with a 60-second circular buffer.

## Basic Usage

```tsx
import { TopicChart } from '@/components/topics/TopicChart';

function MyComponent() {
  const topicData = { velocity: 1.5, acceleration: 0.3 };
  
  return (
    <TopicChart 
      data={topicData} 
      topicName="/robot/velocity" 
      height={400}
    />
  );
}
```

## Integration with TopicViewer

To add chart visualization to the TopicViewer component, you can add a tab or toggle:

```tsx
import { TopicChart } from '@/components/topics/TopicChart';
import { JsonInspector } from '@/components/common/JsonInspector';

function TopicViewer({ componentId }: TopicViewerProps) {
  const [viewMode, setViewMode] = useState<'json' | 'chart'>('json');
  
  // ... existing code ...
  
  return (
    <div>
      {/* View mode toggle */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setViewMode('json')}
          className={viewMode === 'json' ? 'active' : ''}
        >
          JSON View
        </button>
        <button 
          onClick={() => setViewMode('chart')}
          className={viewMode === 'chart' ? 'active' : ''}
        >
          Chart View
        </button>
      </div>
      
      {/* Conditional rendering */}
      {viewMode === 'json' ? (
        <JsonInspector data={topicData} />
      ) : (
        <TopicChart 
          data={topicData} 
          topicName={selectedTopic} 
        />
      )}
    </div>
  );
}
```

## Supported Data Formats

The TopicChart automatically extracts and visualizes numeric values from various data structures:

### Primitive Numbers
```tsx
<TopicChart data={42} topicName="/temperature" />
```

### Objects with Numeric Fields
```tsx
const data = {
  velocity: 1.5,
  acceleration: 0.3,
  position: 10.2
};
<TopicChart data={data} topicName="/robot/state" />
```

### Arrays of Numbers
```tsx
const data = [1.0, 2.0, 3.0, 4.0];
<TopicChart data={data} topicName="/sensor/readings" />
```

### Nested Objects (One Level Deep)
```tsx
const data = {
  pose: {
    x: 1.0,
    y: 2.0,
    z: 3.0
  },
  velocity: 0.5
};
<TopicChart data={data} topicName="/robot/pose" />
// Displays: pose.x, pose.y, pose.z, velocity
```

## Features

- **60-Second Circular Buffer**: Automatically maintains last 60 seconds of data
- **Automatic Filtering**: Only displays numeric values, filters out NaN and Infinity
- **Zoom Controls**: Zoom in, zoom out, and reset zoom functionality
- **Pan Controls**: Brush component for panning through data
- **Multiple Lines**: Displays multiple numeric fields as separate colored lines
- **Responsive**: Adapts to container size
- **Empty States**: Graceful handling of non-numeric or missing data

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `unknown` | required | Topic data to visualize |
| `topicName` | `string` | required | Name of the topic being visualized |
| `height` | `number` | `400` | Height of the chart in pixels |

## Circular Buffer Implementation

The component uses a custom `CircularBuffer` class that:
- Maintains data points with timestamps
- Automatically removes data older than 60 seconds
- Provides efficient array conversion for rendering
- Supports multiple buffers for different numeric fields

## Performance Considerations

- Chart updates are optimized with `isAnimationActive={false}` for smooth real-time updates
- Circular buffer prevents memory growth by limiting history to 60 seconds
- Automatic cleanup of old data points on each update
- Efficient data extraction with early returns for non-numeric data
