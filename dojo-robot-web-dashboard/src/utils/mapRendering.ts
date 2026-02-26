/**
 * Map rendering utilities
 * Efficient rendering functions for occupancy grids, robots, objects, etc.
 */

import type {
  OccupancyGrid,
  RobotPose,
  SemanticObject,
  Frontier,
  PathPoint,
  Viewport,
} from '../types/visualization';
import { worldToCanvas, gridToWorld } from './mapTransforms';

/**
 * Color mapping for occupancy grid values
 */
export function getOccupancyColor(value: number): string {
  if (value < 0) {
    // Unknown
    return '#404040';
  } else if (value === 0) {
    // Free space
    return '#f0f0f0';
  } else if (value < 50) {
    // Low occupancy
    return '#c0c0c0';
  } else if (value < 100) {
    // Medium occupancy
    return '#808080';
  } else {
    // Occupied
    return '#202020';
  }
}

/**
 * Render occupancy grid on canvas
 * Uses efficient ImageData for pixel manipulation
 */
export function drawOccupancyGrid(
  ctx: CanvasRenderingContext2D,
  grid: OccupancyGrid,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!grid || grid.data.length === 0) return;

  // Calculate visible grid bounds
  const topLeft = {
    x: Math.max(0, Math.floor(-viewport.x / viewport.scale / grid.resolution)),
    y: Math.max(0, Math.floor(-viewport.y / viewport.scale / grid.resolution)),
  };

  const bottomRight = {
    x: Math.min(
      grid.width,
      Math.ceil((canvasWidth - viewport.x) / viewport.scale / grid.resolution)
    ),
    y: Math.min(
      grid.height,
      Math.ceil((canvasHeight - viewport.y) / viewport.scale / grid.resolution)
    ),
  };

  // Render grid cells
  for (let gy = topLeft.y; gy < bottomRight.y; gy++) {
    for (let gx = topLeft.x; gx < bottomRight.x; gx++) {
      const index = gy * grid.width + gx;
      const value = grid.data[index];

      // Get world coordinates for this cell
      const worldPos = gridToWorld(gx, gy, grid);

      // Convert to canvas coordinates
      const canvasPos = worldToCanvas(worldPos, viewport, canvasHeight);

      // Calculate cell size in canvas pixels
      const cellSize = grid.resolution * viewport.scale;

      // Skip if cell is too small to see
      if (cellSize < 0.5) continue;

      // Draw cell
      ctx.fillStyle = getOccupancyColor(value);
      ctx.fillRect(canvasPos.x, canvasPos.y - cellSize, cellSize, cellSize);
    }
  }
}

/**
 * Draw robot pose with orientation indicator
 */
export function drawRobot(
  ctx: CanvasRenderingContext2D,
  pose: RobotPose,
  viewport: Viewport,
  canvasHeight: number,
  color: string = '#3b82f6'
): void {
  const canvasPos = worldToCanvas(pose, viewport, canvasHeight);

  const robotRadius = 0.3; // 0.3 meters
  const radiusPixels = robotRadius * viewport.scale;

  // Draw robot body (circle)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(canvasPos.x, canvasPos.y, radiusPixels, 0, 2 * Math.PI);
  ctx.fill();

  // Draw orientation indicator (line)
  const orientationLength = robotRadius * 1.5;
  const endX = canvasPos.x + Math.cos(pose.theta) * orientationLength * viewport.scale;
  const endY = canvasPos.y - Math.sin(pose.theta) * orientationLength * viewport.scale;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvasPos.x, canvasPos.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw outline
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(canvasPos.x, canvasPos.y, radiusPixels, 0, 2 * Math.PI);
  ctx.stroke();
}

/**
 * Draw robot trail (historical poses)
 */
export function drawRobotTrail(
  ctx: CanvasRenderingContext2D,
  trail: RobotPose[],
  viewport: Viewport,
  canvasHeight: number
): void {
  if (trail.length < 2) return;

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;

  ctx.beginPath();
  const firstPos = worldToCanvas(trail[0], viewport, canvasHeight);
  ctx.moveTo(firstPos.x, firstPos.y);

  for (let i = 1; i < trail.length; i++) {
    const pos = worldToCanvas(trail[i], viewport, canvasHeight);
    ctx.lineTo(pos.x, pos.y);
  }

  ctx.stroke();
  ctx.globalAlpha = 1.0;
}

/**
 * Draw semantic object with label
 */
export function drawSemanticObject(
  ctx: CanvasRenderingContext2D,
  obj: SemanticObject,
  viewport: Viewport,
  canvasHeight: number
): void {
  const canvasPos = worldToCanvas(obj.position, viewport, canvasHeight);

  // Get color based on object class
  const color = getObjectColor(obj.class);

  // Draw object marker (circle with icon)
  const markerRadius = 8;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(canvasPos.x, canvasPos.y, markerRadius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(canvasPos.x, canvasPos.y, markerRadius, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw label
  ctx.fillStyle = '#000000';
  ctx.font = '12px sans-serif';
  const label = `${obj.class} (${(obj.confidence * 100).toFixed(0)}%)`;
  const metrics = ctx.measureText(label);

  // Label background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(
    canvasPos.x - metrics.width / 2 - 4,
    canvasPos.y + markerRadius + 4,
    metrics.width + 8,
    18
  );

  // Label text
  ctx.fillStyle = '#000000';
  ctx.fillText(label, canvasPos.x - metrics.width / 2, canvasPos.y + markerRadius + 17);
}

/**
 * Get color for object class
 */
function getObjectColor(objectClass: string): string {
  // Color palette for different object classes
  const colors: Record<string, string> = {
    person: '#ef4444',
    car: '#3b82f6',
    chair: '#10b981',
    table: '#f59e0b',
    door: '#8b5cf6',
    window: '#06b6d4',
    default: '#6b7280',
  };

  return colors[objectClass.toLowerCase()] || colors.default;
}

/**
 * Draw exploration frontier
 */
export function drawFrontier(
  ctx: CanvasRenderingContext2D,
  frontier: Frontier,
  viewport: Viewport,
  canvasHeight: number
): void {
  if (frontier.points.length === 0) return;

  // Draw frontier points
  ctx.fillStyle = '#fbbf24';
  ctx.globalAlpha = 0.6;

  for (const point of frontier.points) {
    const canvasPos = worldToCanvas(point, viewport, canvasHeight);
    ctx.fillRect(canvasPos.x - 2, canvasPos.y - 2, 4, 4);
  }

  ctx.globalAlpha = 1.0;

  // Draw centroid
  const centroidPos = worldToCanvas(frontier.centroid, viewport, canvasHeight);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(centroidPos.x, centroidPos.y, 6, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centroidPos.x, centroidPos.y, 6, 0, 2 * Math.PI);
  ctx.stroke();
}

/**
 * Draw navigation path
 */
export function drawPath(
  ctx: CanvasRenderingContext2D,
  path: PathPoint[],
  viewport: Viewport,
  canvasHeight: number
): void {
  if (path.length < 2) return;

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  const firstPos = worldToCanvas(path[0], viewport, canvasHeight);
  ctx.moveTo(firstPos.x, firstPos.y);

  for (let i = 1; i < path.length; i++) {
    const pos = worldToCanvas(path[i], viewport, canvasHeight);
    ctx.lineTo(pos.x, pos.y);
  }

  ctx.stroke();
  ctx.setLineDash([]);

  // Draw waypoints
  ctx.fillStyle = '#10b981';
  for (const point of path) {
    const pos = worldToCanvas(point, viewport, canvasHeight);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
}
