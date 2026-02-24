# 3D Visualization Components Usage Guide

This guide demonstrates how to use the 3D visualization components built with React Three Fiber.

## Components Overview

- **Scene3D**: Base 3D canvas with camera, controls, and lighting
- **PointCloudViewer**: Renders 3D point cloud data with multiple color modes
- **RobotOrientation3D**: Displays robot orientation using coordinate frame axes
- **GaussianSplatViewer**: Renders Gaussian splats for 3D reconstruction
- **Visualization3DControls**: UI controls for 3D visualizations

## Installation

The required dependencies are already installed:
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber
- `three` - Three.js library

## Basic Usage

### Scene3D

The base 3D scene component provides a configured canvas with camera, controls, and lighting.

```tsx
import { Scene3D } from '@/components/visualizations';

function MyVisualization() {
  return (
    <Scene3D
      showGrid={true}
      showAxes={true}
      cameraPosition={[5, 5, 5]}
      className="w-full h-[600px]"
    >
      {/* Your 3D content here */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </Scene3D>
  );
}
```

### PointCloudViewer

Renders point cloud data with RGB, intensity, or semantic color modes.

```tsx
import { PointCloudViewer } from '@/components/visualizations';
import { PointCloudData } from '@/types/visualization';

function PointCloudExample() {
  const pointCloudData: PointCloudData = {
    points: [
      { x: 0, y: 0, z: 0, r: 255, g: 0, b: 0, intensity: 0.8, semantic: 1 },
      { x: 1, y: 1, z: 1, r: 0, g: 255, b: 0, intensity: 0.6, semantic: 2 },
      { x: 2, y: 2, z: 2, r: 0, g: 0, b: 255, intensity: 0.4, semantic: 3 },
    ],
    timestamp: new Date().toISOString(),
    frameId: 'base_link',
  };

  return (
    <PointCloudViewer
      data={pointCloudData}
      colorMode="rgb"
      pointSize={0.05}
      showGrid={true}
      showAxes={true}
      className="w-full h-[600px]"
    />
  );
}
```

**Color Modes:**
- `rgb`: Uses RGB color values from point data
- `intensity`: Grayscale based on intensity values
- `semantic`: Color-coded by semantic class ID

### RobotOrientation3D

Displays robot orientation with coordinate frame axes and real-time updates.

```tsx
import { RobotOrientation3D } from '@/components/visualizations';
import { RobotPose3D } from '@/types/visualization';

function OrientationExample() {
  const robotPose: RobotPose3D = {
    position: { x: 0, y: 0, z: 0 },
    orientation: {
      roll: 0.1,  // radians
      pitch: 0.2,
      yaw: 0.3,
    },
    timestamp: new Date().toISOString(),
  };

  return (
    <RobotOrientation3D
      pose={robotPose}
      showGrid={true}
      showAxes={true}
      axisLength={2}
      animate={true}
      className="w-full h-[600px]"
    />
  );
}
```

The component displays:
- Red arrow: X axis (roll)
- Green arrow: Y axis (pitch)
- Blue arrow: Z axis (yaw)
- Orientation values in degrees (overlay)

### GaussianSplatViewer

Renders Gaussian splats for 3D scene reconstruction.

```tsx
import { GaussianSplatViewer } from '@/components/visualizations';
import { GaussianSplatData } from '@/types/visualization';

function GaussianSplatExample() {
  const splatData: GaussianSplatData = {
    splats: [
      {
        position: [0, 0, 0],
        color: [1, 0, 0],
        covariance: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        opacity: 0.8,
      },
      // More splats...
    ],
    timestamp: new Date().toISOString(),
    frameId: 'camera',
  };

  return (
    <GaussianSplatViewer
      data={splatData}
      renderMode="full"
      showGrid={true}
      showAxes={true}
      showStats={true}
      className="w-full h-[600px]"
    />
  );
}
```

**Render Modes:**
- `points`: Simple circular points
- `ellipsoids`: Smooth Gaussian falloff
- `full`: Full Gaussian rendering with glow

### Visualization3DControls

Interactive controls for 3D visualizations.

```tsx
import { useState } from 'react';
import {
  PointCloudViewer,
  Visualization3DControls,
  exportVisualizationData,
} from '@/components/visualizations';
import { PointCloudColorMode } from '@/types/visualization';

function ControlledVisualization() {
  const [colorMode, setColorMode] = useState<PointCloudColorMode>('rgb');
  const [pointSize, setPointSize] = useState(0.05);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  const handleExport = () => {
    exportVisualizationData(pointCloudData, 'pointcloud.json');
  };

  return (
    <div className="relative w-full h-[600px]">
      <PointCloudViewer
        data={pointCloudData}
        colorMode={colorMode}
        pointSize={pointSize}
        showGrid={showGrid}
        showAxes={showAxes}
      />
      <Visualization3DControls
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        pointSize={pointSize}
        onPointSizeChange={setPointSize}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
        showAxes={showAxes}
        onShowAxesChange={setShowAxes}
        onExport={handleExport}
      />
    </div>
  );
}
```

## Complete Example with Real-time Updates

```tsx
import { useState, useEffect } from 'react';
import {
  PointCloudViewer,
  Visualization3DControls,
} from '@/components/visualizations';
import { PointCloudData, PointCloudColorMode } from '@/types/visualization';

function RealTimePointCloud() {
  const [data, setData] = useState<PointCloudData>({ points: [], timestamp: '' });
  const [colorMode, setColorMode] = useState<PointCloudColorMode>('rgb');
  const [pointSize, setPointSize] = useState(0.05);

  // Fetch point cloud data from API
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/pointcloud');
      const newData = await response.json();
      setData(newData);
    };

    const interval = setInterval(fetchData, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[600px]">
      <PointCloudViewer
        data={data}
        colorMode={colorMode}
        pointSize={pointSize}
      />
      <Visualization3DControls
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        pointSize={pointSize}
        onPointSizeChange={setPointSize}
      />
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Points: {data.points.length.toLocaleString()}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Updated: {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
```

## Performance Optimization

### Large Point Clouds

The PointCloudViewer automatically downsamples point clouds larger than 100,000 points for performance:

```tsx
// Automatic optimization - no configuration needed
<PointCloudViewer data={largePointCloud} />
```

### Custom Optimization

For custom optimization strategies:

```tsx
const optimizedData = useMemo(() => {
  if (rawData.points.length > 50000) {
    // Custom downsampling logic
    const step = Math.ceil(rawData.points.length / 50000);
    return {
      ...rawData,
      points: rawData.points.filter((_, i) => i % step === 0),
    };
  }
  return rawData;
}, [rawData]);
```

## Camera Controls

All 3D visualizations include orbit controls:
- **Left click + drag**: Rotate camera
- **Right click + drag**: Pan camera
- **Scroll wheel**: Zoom in/out
- **Middle click + drag**: Pan camera (alternative)

## Styling

All components accept a `className` prop for custom styling:

```tsx
<PointCloudViewer
  data={data}
  className="w-full h-screen rounded-lg shadow-xl"
/>
```

## TypeScript Types

All visualization types are exported from `@/types/visualization`:

```tsx
import type {
  PointCloudData,
  PointCloudPoint,
  PointCloudColorMode,
  RobotPose3D,
  RobotOrientation,
  GaussianSplatData,
  GaussianSplat,
  GaussianRenderMode,
  Point3D,
} from '@/types/visualization';
```

## Best Practices

1. **Always provide dimensions**: Use `className` or inline styles to set width and height
2. **Optimize large datasets**: Downsample or use level-of-detail techniques
3. **Use memoization**: Wrap data transformations in `useMemo` to prevent unnecessary recalculations
4. **Handle loading states**: Show loading indicators while fetching 3D data
5. **Provide fallbacks**: Handle empty or invalid data gracefully

## Troubleshooting

### Canvas not rendering
- Ensure the parent container has explicit dimensions
- Check that WebGL is supported in the browser

### Performance issues
- Reduce point count through downsampling
- Decrease point size
- Disable grid/axes if not needed
- Use simpler render modes for Gaussian splats

### Memory issues with large datasets
- Implement pagination or streaming
- Use web workers for data processing
- Clear old data when updating
