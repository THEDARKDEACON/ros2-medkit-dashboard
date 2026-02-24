# Map2D Visualization Component Usage

The `Map2D` component provides an interactive 2D map visualization for robot navigation, showing occupancy grids, robot pose, semantic objects, exploration frontiers, and navigation paths.

## Basic Usage

```tsx
import { Map2D } from '@/components/visualizations';
import type { RobotPose, OccupancyGrid, SemanticObject } from '@/types/visualization';

function NavigationView() {
  const robotPose: RobotPose = {
    x: 5.0,
    y: 3.0,
    theta: Math.PI / 4, // 45 degrees
  };

  const occupancyGrid: OccupancyGrid = {
    width: 100,
    height: 100,
    resolution: 0.1, // 10cm per cell
    origin: { x: -5, y: -5 },
    data: new Array(10000).fill(0), // All free space
  };

  return (
    <Map2D
      robotPose={robotPose}
      occupancyGrid={occupancyGrid}
      width={800}
      height={600}
    />
  );
}
```

## With Semantic Objects

```tsx
import { Map2D } from '@/components/visualizations';
import type { SemanticObject } from '@/types/visualization';

function SemanticMapView() {
  const semanticObjects: SemanticObject[] = [
    {
      id: 'obj_001',
      class: 'person',
      confidence: 0.95,
      position: { x: 3.0, y: 2.0 },
      timestamp: new Date().toISOString(),
      persistent: false,
    },
    {
      id: 'obj_002',
      class: 'chair',
      confidence: 0.88,
      position: { x: -1.0, y: 4.0 },
      timestamp: new Date().toISOString(),
      persistent: true,
    },
  ];

  return (
    <Map2D
      semanticObjects={semanticObjects}
      width={800}
      height={600}
      layers={{ semanticObjects: true }}
      config={{ showTooltip: true }}
    />
  );
}
```

## With Exploration Frontiers

```tsx
import { Map2D } from '@/components/visualizations';
import type { Frontier, PathPoint } from '@/types/visualization';

function ExplorationView() {
  const frontiers: Frontier[] = [
    {
      id: 'frontier_1',
      points: [
        { x: 10, y: 5 },
        { x: 10.1, y: 5.1 },
        { x: 10.2, y: 5 },
      ],
      centroid: { x: 10.1, y: 5.03 },
      size: 3,
      clusterId: 0,
    },
  ];

  const path: PathPoint[] = [
    { x: 0, y: 0, theta: 0 },
    { x: 2, y: 1, theta: 0.5 },
    { x: 5, y: 3, theta: 1.0 },
    { x: 8, y: 4, theta: 1.2 },
  ];

  return (
    <Map2D
      frontiers={frontiers}
      path={path}
      width={800}
      height={600}
      layers={{
        frontiers: true,
        path: true,
      }}
    />
  );
}
```

## Custom Layer Configuration

```tsx
import { Map2D } from '@/components/visualizations';
import type { MapLayers } from '@/types/visualization';

function CustomMapView() {
  const layers: Partial<MapLayers> = {
    occupancyGrid: true,
    robotPose: true,
    robotTrail: false, // Hide robot trail
    semanticObjects: true,
    frontiers: false, // Hide frontiers
    path: true,
  };

  return (
    <Map2D
      layers={layers}
      width={800}
      height={600}
    />
  );
}
```

## Custom Configuration

```tsx
import { Map2D } from '@/components/visualizations';
import type { MapConfig } from '@/types/visualization';

function ConfiguredMapView() {
  const config: Partial<MapConfig> = {
    showGrid: true,
    showCoordinates: true,
    showLegend: true,
    showTooltip: true,
    robotTrailLength: 100, // Show last 100 poses
  };

  return (
    <Map2D
      config={config}
      width={800}
      height={600}
    />
  );
}
```

## Complete Example with All Features

```tsx
import { Map2D } from '@/components/visualizations';
import type {
  RobotPose,
  OccupancyGrid,
  SemanticObject,
  Frontier,
  PathPoint,
} from '@/types/visualization';

function CompleteMapView() {
  // Robot state
  const robotPose: RobotPose = {
    x: 5.0,
    y: 3.0,
    theta: Math.PI / 4,
  };

  // Occupancy grid (simplified)
  const occupancyGrid: OccupancyGrid = {
    width: 100,
    height: 100,
    resolution: 0.1,
    origin: { x: -5, y: -5 },
    data: generateOccupancyData(), // Your data generation function
  };

  // Detected semantic objects
  const semanticObjects: SemanticObject[] = [
    {
      id: 'obj_001',
      class: 'person',
      confidence: 0.95,
      position: { x: 3.0, y: 2.0 },
      timestamp: new Date().toISOString(),
    },
    {
      id: 'obj_002',
      class: 'table',
      confidence: 0.92,
      position: { x: -1.0, y: 4.0 },
      timestamp: new Date().toISOString(),
      persistent: true,
    },
  ];

  // Exploration frontiers
  const frontiers: Frontier[] = [
    {
      id: 'frontier_1',
      points: [
        { x: 10, y: 5 },
        { x: 10.1, y: 5.1 },
      ],
      centroid: { x: 10.05, y: 5.05 },
      size: 2,
      clusterId: 0,
    },
  ];

  // Navigation path
  const path: PathPoint[] = [
    { x: 5, y: 3, theta: 0 },
    { x: 7, y: 4, theta: 0.5 },
    { x: 10, y: 5, theta: 1.0 },
  ];

  return (
    <div className="w-full h-full">
      <Map2D
        robotPose={robotPose}
        occupancyGrid={occupancyGrid}
        semanticObjects={semanticObjects}
        frontiers={frontiers}
        path={path}
        width={800}
        height={600}
        layers={{
          occupancyGrid: true,
          robotPose: true,
          robotTrail: true,
          semanticObjects: true,
          frontiers: true,
          path: true,
        }}
        config={{
          showGrid: true,
          showCoordinates: true,
          showLegend: true,
          showTooltip: true,
          robotTrailLength: 50,
        }}
        className="border rounded-lg shadow-lg"
      />
    </div>
  );
}

function generateOccupancyData(): number[] {
  // Generate sample occupancy grid data
  const data = new Array(10000);
  for (let i = 0; i < data.length; i++) {
    // Random occupancy values
    const rand = Math.random();
    if (rand < 0.7) data[i] = 0; // Free
    else if (rand < 0.9) data[i] = 100; // Occupied
    else data[i] = -1; // Unknown
  }
  return data;
}
```

## Interactive Features

### Pan and Zoom
- **Mouse Wheel**: Zoom in/out
- **Click and Drag**: Pan the map
- **Zoom follows mouse**: Zooming centers on the mouse cursor position

### Object Selection
- **Click on Semantic Object**: Select and view details
- **Hover over Object**: Show tooltip with class, confidence, and position
- **Click elsewhere**: Deselect object

### Layer Controls
- Use the layer controls panel to toggle visibility of different map elements
- Each layer can be independently shown or hidden

### Legend
- The legend shows the meaning of colors and symbols on the map
- Can be hidden via the `showLegend` config option

## Props Reference

### Map2DProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `robotPose` | `RobotPose` | `undefined` | Current robot position and orientation |
| `occupancyGrid` | `OccupancyGrid` | `undefined` | Occupancy grid map data |
| `semanticObjects` | `SemanticObject[]` | `[]` | Detected semantic objects |
| `frontiers` | `Frontier[]` | `[]` | Exploration frontiers |
| `path` | `PathPoint[]` | `[]` | Navigation path |
| `layers` | `Partial<MapLayers>` | All enabled | Layer visibility configuration |
| `config` | `Partial<MapConfig>` | Default config | Map display configuration |
| `width` | `number` | `800` | Canvas width in pixels |
| `height` | `number` | `600` | Canvas height in pixels |
| `className` | `string` | `''` | Additional CSS classes |

### MapLayers

```typescript
interface MapLayers {
  occupancyGrid: boolean;
  robotPose: boolean;
  robotTrail: boolean;
  semanticObjects: boolean;
  frontiers: boolean;
  path: boolean;
}
```

### MapConfig

```typescript
interface MapConfig {
  showGrid: boolean;          // Show reference grid
  showCoordinates: boolean;   // Show mouse coordinates
  showLegend: boolean;        // Show map legend
  showTooltip: boolean;       // Show tooltips on hover
  robotTrailLength: number;   // Number of historical poses
}
```

## Tips

1. **Performance**: For large occupancy grids, consider downsampling or only rendering visible cells
2. **Real-time Updates**: Use React state or hooks to update robot pose and semantic objects in real-time
3. **Responsive Design**: Adjust width/height based on container size for responsive layouts
4. **Color Customization**: Modify colors in `mapRendering.ts` for custom color schemes
5. **Coordinate Systems**: The map uses standard ROS coordinate conventions (X forward, Y left, Z up)
