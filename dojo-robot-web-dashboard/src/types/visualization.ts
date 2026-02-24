/**
 * Visualization type definitions
 * Types for 2D/3D visualizations, maps, and spatial data
 */

/**
 * 2D point in map coordinates
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Robot pose in 2D space
 */
export interface RobotPose {
  x: number;
  y: number;
  theta: number; // Orientation in radians
}

/**
 * Occupancy grid map data
 */
export interface OccupancyGrid {
  width: number;
  height: number;
  resolution: number; // meters per cell
  origin: Point2D; // Map origin in world coordinates
  data: number[]; // Flattened array: 0 = free, 100 = occupied, -1 = unknown
}

/**
 * Semantic object detected in the environment
 */
export interface SemanticObject {
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

/**
 * Exploration frontier
 */
export interface Frontier {
  id: string;
  points: Point2D[];
  centroid: Point2D;
  size: number;
  clusterId?: number;
}

/**
 * Path point for navigation
 */
export interface PathPoint {
  x: number;
  y: number;
  theta?: number;
}

/**
 * Viewport state for 2D map
 */
export interface Viewport {
  x: number; // Pan offset X
  y: number; // Pan offset Y
  scale: number; // Zoom level
}

/**
 * Map layer visibility configuration
 */
export interface MapLayers {
  occupancyGrid: boolean;
  robotPose: boolean;
  robotTrail: boolean;
  semanticObjects: boolean;
  frontiers: boolean;
  path: boolean;
}

/**
 * Map visualization configuration
 */
export interface MapConfig {
  showGrid: boolean;
  showCoordinates: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  robotTrailLength: number; // Number of historical poses to show
}

/**
 * 3D point in space
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Point cloud data point
 */
export interface PointCloudPoint {
  x: number;
  y: number;
  z: number;
  r?: number; // RGB color (0-255)
  g?: number;
  b?: number;
  intensity?: number; // Intensity value (0-1)
  semantic?: number; // Semantic class ID
}

/**
 * Point cloud data structure
 */
export interface PointCloudData {
  points: PointCloudPoint[];
  timestamp: string;
  frameId?: string;
}

/**
 * Color mode for point cloud visualization
 */
export type PointCloudColorMode = 'rgb' | 'intensity' | 'semantic';

/**
 * Robot orientation in 3D space (Euler angles)
 */
export interface RobotOrientation {
  roll: number; // Rotation around X axis (radians)
  pitch: number; // Rotation around Y axis (radians)
  yaw: number; // Rotation around Z axis (radians)
}

/**
 * Robot pose in 3D space
 */
export interface RobotPose3D {
  position: Point3D;
  orientation: RobotOrientation;
  timestamp: string;
}

/**
 * Gaussian splat for 3D reconstruction
 */
export interface GaussianSplat {
  position: [number, number, number];
  color: [number, number, number]; // RGB (0-1)
  covariance: number[][]; // 3x3 covariance matrix
  opacity: number; // 0-1
}

/**
 * Gaussian splat data structure
 */
export interface GaussianSplatData {
  splats: GaussianSplat[];
  timestamp: string;
  frameId?: string;
}

/**
 * Gaussian splat rendering mode
 */
export type GaussianRenderMode = 'points' | 'ellipsoids' | 'full';

/**
 * Gaussian splat statistics
 */
export interface GaussianSplatStats {
  totalSplats: number;
  averageOpacity: number;
  boundingBox: {
    min: Point3D;
    max: Point3D;
  };
  memoryUsage: number; // bytes
}

/**
 * 3D visualization controls configuration
 */
export interface Visualization3DControls {
  autoRotate: boolean;
  rotateSpeed: number;
  zoomSpeed: number;
  panSpeed: number;
  showGrid: boolean;
  showAxes: boolean;
  pointSize: number;
}
