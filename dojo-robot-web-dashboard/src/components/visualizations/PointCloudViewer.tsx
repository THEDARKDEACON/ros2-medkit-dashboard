/**
 * Point Cloud Viewer Component
 * Renders 3D point cloud data with multiple color modes
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Scene3D } from './Scene3D';
import type {
  PointCloudData,
  PointCloudColorMode,
  PointCloudPoint,
} from '../../types/visualization';

interface PointCloudViewerProps {
  data: PointCloudData;
  colorMode?: PointCloudColorMode;
  pointSize?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  className?: string;
}

/**
 * Get color for a point based on the selected color mode
 */
function getPointColor(
  point: PointCloudPoint,
  colorMode: PointCloudColorMode
): THREE.Color {
  switch (colorMode) {
    case 'rgb':
      if (point.r !== undefined && point.g !== undefined && point.b !== undefined) {
        return new THREE.Color(point.r / 255, point.g / 255, point.b / 255);
      }
      return new THREE.Color(0.5, 0.5, 0.5); // Default gray

    case 'intensity':
      if (point.intensity !== undefined) {
        // Map intensity to grayscale
        return new THREE.Color(point.intensity, point.intensity, point.intensity);
      }
      return new THREE.Color(0.5, 0.5, 0.5);

    case 'semantic':
      if (point.semantic !== undefined) {
        // Map semantic class to color using HSL
        const hue = (point.semantic * 137.5) % 360; // Golden angle for good distribution
        return new THREE.Color().setHSL(hue / 360, 0.8, 0.5);
      }
      return new THREE.Color(0.5, 0.5, 0.5);

    default:
      return new THREE.Color(0.5, 0.5, 0.5);
  }
}

/**
 * Point cloud geometry component
 */
function PointCloudGeometry({
  points,
  colorMode,
  pointSize,
}: {
  points: PointCloudPoint[];
  colorMode: PointCloudColorMode;
  pointSize: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  // Create geometry and colors from point cloud data
  const geometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      // Set position
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      // Set color
      const color = getPointColor(point, colorMode);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Compute bounding sphere for proper camera framing
    geometry.computeBoundingSphere();

    return geometry;
  }, [points, colorMode]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={pointSize}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Point Cloud Viewer with controls
 */
export function PointCloudViewer({
  data,
  colorMode = 'rgb',
  pointSize = 0.05,
  showGrid = true,
  showAxes = true,
  className,
}: PointCloudViewerProps) {
  // Optimize for large point clouds by limiting rendering
  const optimizedPoints = useMemo(() => {
    const maxPoints = 100000; // Limit for performance
    if (data.points.length > maxPoints) {
      // Downsample by taking every nth point
      const step = Math.ceil(data.points.length / maxPoints);
      return data.points.filter((_, i) => i % step === 0);
    }
    return data.points;
  }, [data.points]);

  return (
    <Scene3D
      showGrid={showGrid}
      showAxes={showAxes}
      cameraPosition={[10, 10, 10]}
      className={className}
    >
      <PointCloudGeometry
        points={optimizedPoints}
        colorMode={colorMode}
        pointSize={pointSize}
      />
    </Scene3D>
  );
}
