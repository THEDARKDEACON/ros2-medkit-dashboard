/**
 * Coordinate transformation utilities for 2D map visualization
 */

import type { Point2D, Viewport, OccupancyGrid } from '../types/visualization';

/**
 * Transform world coordinates to canvas coordinates
 */
export function worldToCanvas(
  worldPoint: Point2D,
  viewport: Viewport,
  canvasHeight: number
): Point2D {
  // Apply viewport transform: scale, then translate
  // Flip Y axis (canvas Y increases downward, world Y increases upward)
  return {
    x: worldPoint.x * viewport.scale + viewport.x,
    y: canvasHeight - (worldPoint.y * viewport.scale + viewport.y),
  };
}

/**
 * Transform canvas coordinates to world coordinates
 */
export function canvasToWorld(
  canvasPoint: Point2D,
  viewport: Viewport,
  canvasHeight: number
): Point2D {
  // Reverse the viewport transform
  return {
    x: (canvasPoint.x - viewport.x) / viewport.scale,
    y: (canvasHeight - canvasPoint.y - viewport.y) / viewport.scale,
  };
}

/**
 * Transform grid cell coordinates to world coordinates
 */
export function gridToWorld(
  gridX: number,
  gridY: number,
  grid: OccupancyGrid
): Point2D {
  return {
    x: grid.origin.x + gridX * grid.resolution,
    y: grid.origin.y + gridY * grid.resolution,
  };
}

/**
 * Transform world coordinates to grid cell coordinates
 */
export function worldToGrid(
  worldPoint: Point2D,
  grid: OccupancyGrid
): { x: number; y: number } {
  return {
    x: Math.floor((worldPoint.x - grid.origin.x) / grid.resolution),
    y: Math.floor((worldPoint.y - grid.origin.y) / grid.resolution),
  };
}

/**
 * Get grid cell value at world coordinates
 */
export function getGridValue(
  worldPoint: Point2D,
  grid: OccupancyGrid
): number {
  const gridCoords = worldToGrid(worldPoint, grid);

  if (
    gridCoords.x < 0 ||
    gridCoords.x >= grid.width ||
    gridCoords.y < 0 ||
    gridCoords.y >= grid.height
  ) {
    return -1; // Unknown
  }

  const index = gridCoords.y * grid.width + gridCoords.x;
  return grid.data[index];
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize angle to [-PI, PI]
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Calculate bounding box for a set of points
 */
export function calculateBounds(points: Point2D[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Fit viewport to show all points
 */
export function fitViewportToPoints(
  points: Point2D[],
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 50
): Viewport {
  if (points.length === 0) {
    return { x: 0, y: 0, scale: 1 };
  }

  const bounds = calculateBounds(points);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  // Calculate scale to fit with padding
  const scaleX = (canvasWidth - 2 * padding) / width;
  const scaleY = (canvasHeight - 2 * padding) / height;
  const scale = Math.min(scaleX, scaleY, 10); // Max scale of 10

  // Center the content
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  return {
    x: canvasWidth / 2 - centerX * scale,
    y: canvasHeight / 2 - centerY * scale,
    scale,
  };
}
