# Semantic Object Components Usage

The semantic object components provide visualization and interaction with detected objects from YOLO or other detection systems.

## Components

### SemanticObjectList

Displays a list of detected semantic objects with filtering controls.

**Features:**
- Real-time object detection display
- Filter by object class
- Filter by confidence threshold
- Filter by persistence status
- Download data as JSON or CSV
- Click to view detailed information

**Props:**
- `className?: string` - Additional CSS classes
- `onObjectSelect?: (object: SemanticObject) => void` - Callback when object is selected
- `showFilters?: boolean` - Whether to show filter controls (default: true)

**Example:**

```tsx
import { SemanticObjectList } from '@/components/semantic';
import { useState } from 'react';

function SemanticView() {
  const [selectedObject, setSelectedObject] = useState(null);

  return (
    <div className="h-screen">
      <SemanticObjectList
        onObjectSelect={setSelectedObject}
        showFilters={true}
      />
    </div>
  );
}
```

### SemanticObjectDetail

Displays detailed information for a selected semantic object.

**Features:**
- Basic object information (class, confidence, position)
- Persistence information (first seen, last seen, observation count)
- Annotated camera images with bounding boxes
- Image navigation for multiple detections
- Detection timeline (last 24 hours)
- Download object data as JSON

**Props:**
- `object: SemanticObject` - The semantic object to display (required)
- `onClose?: () => void` - Callback when close button is clicked
- `className?: string` - Additional CSS classes

**Example:**

```tsx
import { SemanticObjectDetail } from '@/components/semantic';

function ObjectDetailView({ object, onClose }) {
  return (
    <div className="h-screen">
      <SemanticObjectDetail
        object={object}
        onClose={onClose}
      />
    </div>
  );
}
```

## Integration with Map2D

The semantic objects can be visualized on the 2D map by passing them to the Map2D component:

```tsx
import { Map2D } from '@/components/visualizations';
import { useSemanticObjects } from '@/features/api/hooks';

function SemanticMapView() {
  const { data: semanticObjects } = useSemanticObjects();

  return (
    <Map2D
      semanticObjects={semanticObjects || []}
      layers={{
        semanticObjects: true,
        occupancyGrid: true,
        robotPose: true,
      }}
      width={800}
      height={600}
    />
  );
}
```

## Complete Example: List + Detail + Map

```tsx
import { useState } from 'react';
import { SemanticObjectList, SemanticObjectDetail } from '@/components/semantic';
import { Map2D } from '@/components/visualizations';
import { useSemanticObjects } from '@/features/api/hooks';
import type { SemanticObject } from '@/types/visualization';

function SemanticDashboard() {
  const [selectedObject, setSelectedObject] = useState<SemanticObject | null>(null);
  const { data: semanticObjects } = useSemanticObjects();

  return (
    <div className="grid grid-cols-3 gap-4 h-screen p-4">
      {/* Object List */}
      <div className="col-span-1 border rounded-lg overflow-hidden">
        <SemanticObjectList
          onObjectSelect={setSelectedObject}
          showFilters={true}
        />
      </div>

      {/* Map Visualization */}
      <div className="col-span-1 border rounded-lg overflow-hidden">
        <Map2D
          semanticObjects={semanticObjects || []}
          layers={{
            semanticObjects: true,
            occupancyGrid: true,
            robotPose: true,
          }}
          width={600}
          height={800}
        />
      </div>

      {/* Object Detail */}
      <div className="col-span-1 border rounded-lg overflow-hidden">
        {selectedObject ? (
          <SemanticObjectDetail
            object={selectedObject}
            onClose={() => setSelectedObject(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select an object to view details
          </div>
        )}
      </div>
    </div>
  );
}
```

## API Hooks

### useSemanticObjects

Fetches semantic objects with optional filtering.

```tsx
const { data: objects, isLoading, error } = useSemanticObjects({
  classFilter: 'person',      // Optional: filter by class
  minConfidence: 0.8,         // Optional: minimum confidence (0-1)
  refetchInterval: 2000,      // Optional: polling interval in ms
  enabled: true,              // Optional: enable/disable polling
});
```

### useSemanticObjectDetail

Fetches detailed information for a specific object.

```tsx
const { data: detail, isLoading } = useSemanticObjectDetail(objectId);
```

### useSemanticObjectTimeline

Fetches detection timeline for a time range.

```tsx
const { data: timeline } = useSemanticObjectTimeline({
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-01T23:59:59Z',
  classFilter: 'person',  // Optional
});
```

### useDownloadSemanticObjects

Downloads semantic object data.

```tsx
const downloadObjects = useDownloadSemanticObjects();

await downloadObjects.mutateAsync({
  format: 'json',  // or 'csv'
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-01T23:59:59Z',
  classFilter: 'person',
});
```

## Data Types

### SemanticObject

```typescript
interface SemanticObject {
  id: string;
  class: string;
  confidence: number;
  position: Point2D;
  boundingBox?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  timestamp: string;
  persistent?: boolean;
}
```

### SemanticObjectDetail

```typescript
interface SemanticObjectDetail extends SemanticObject {
  firstSeen: string;
  lastSeen: string;
  observationCount: number;
  annotatedImages?: AnnotatedImage[];
}
```

### AnnotatedImage

```typescript
interface AnnotatedImage {
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
```

## Requirements Implemented

- **16.1**: Display detected objects in a list view
- **16.2**: Show object class, confidence, coordinates, and timestamp
- **16.3**: Provide filtering by class and confidence threshold
- **16.4**: Visualize object locations on 2D map (via Map2D integration)
- **16.5**: Use distinct colors and icons for different object classes
- **16.6**: Display object persistence information
- **16.7**: Display detailed object information on click
- **16.8**: Show annotated camera images with bounding boxes
- **16.9**: Provide timeline view and data download functionality
