/**
 * Map2D Component
 * Interactive 2D map visualization with occupancy grid, robot pose, semantic objects, and frontiers
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type {
  RobotPose,
  OccupancyGrid,
  SemanticObject,
  Frontier,
  PathPoint,
  Viewport,
  MapLayers,
  MapConfig,
  Point2D,
} from '../../types/visualization';
import { worldToCanvas, canvasToWorld } from '../../utils/mapTransforms';
import {
  drawOccupancyGrid,
  drawRobot,
  drawRobotTrail,
  drawSemanticObject,
  drawFrontier,
  drawPath,
} from '../../utils/mapRendering';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';

export interface Map2DProps {
  robotPose?: RobotPose;
  occupancyGrid?: OccupancyGrid;
  semanticObjects?: SemanticObject[];
  frontiers?: Frontier[];
  path?: PathPoint[];
  layers?: Partial<MapLayers>;
  config?: Partial<MapConfig>;
  width?: number;
  height?: number;
  className?: string;
}

const defaultLayers: MapLayers = {
  occupancyGrid: true,
  robotPose: true,
  robotTrail: true,
  semanticObjects: true,
  frontiers: true,
  path: true,
};

const defaultConfig: MapConfig = {
  showGrid: true,
  showCoordinates: true,
  showLegend: true,
  showTooltip: true,
  robotTrailLength: 50,
};

export const Map2D: React.FC<Map2DProps> = ({
  robotPose,
  occupancyGrid,
  semanticObjects = [],
  frontiers = [],
  path = [],
  layers: layersProp,
  config: configProp,
  width = 800,
  height = 600,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 400, y: 300, scale: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point2D>({ x: 0, y: 0 });
  const [hoveredObject, setHoveredObject] = useState<SemanticObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<SemanticObject | null>(null);
  const [mousePos, setMousePos] = useState<Point2D>({ x: 0, y: 0 });
  const [robotTrail, setRobotTrail] = useState<RobotPose[]>([]);
  const [activeLayers, setActiveLayers] = useState<MapLayers>({
    ...defaultLayers,
    ...layersProp,
  });

  const layers = activeLayers;
  const config = { ...defaultConfig, ...configProp };

  // Handle layer toggle
  const handleLayerToggle = useCallback((layer: keyof MapLayers) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  // Update robot trail when robot pose changes
  useEffect(() => {
    if (robotPose && layers.robotTrail) {
      setRobotTrail((prev) => {
        const newTrail = [...prev, robotPose];
        // Keep only the last N poses
        if (newTrail.length > config.robotTrailLength) {
          return newTrail.slice(-config.robotTrailLength);
        }
        return newTrail;
      });
    }
  }, [robotPose, layers.robotTrail, config.robotTrailLength]);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom towards mouse position
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(100, viewport.scale * zoomFactor));

      // Adjust pan to zoom towards mouse
      const worldBefore = canvasToWorld({ x: mouseX, y: mouseY }, viewport, height);
      const newViewport = { ...viewport, scale: newScale };
      const worldAfter = canvasToWorld({ x: mouseX, y: mouseY }, newViewport, height);

      setViewport({
        x: newViewport.x + (worldAfter.x - worldBefore.x) * newScale,
        y: newViewport.y + (worldAfter.y - worldBefore.y) * newScale,
        scale: newScale,
      });
    },
    [viewport, height]
  );

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      // Check if clicking on a semantic object
      const worldPos = canvasToWorld({ x: canvasX, y: canvasY }, viewport, height);
      const clicked = semanticObjects.find((obj) => {
        const dx = obj.position.x - worldPos.x;
        const dy = obj.position.y - worldPos.y;
        return Math.sqrt(dx * dx + dy * dy) < 0.5; // 0.5m click radius
      });

      if (clicked) {
        setSelectedObject(clicked);
      } else {
        setSelectedObject(null);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    },
    [viewport, height, semanticObjects]
  );

  // Handle mouse move for panning and hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      setMousePos({ x: canvasX, y: canvasY });

      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setViewport((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (config.showTooltip) {
        // Check for hovered semantic objects
        const worldPos = canvasToWorld({ x: canvasX, y: canvasY }, viewport, height);
        const hovered = semanticObjects.find((obj) => {
          const dx = obj.position.x - worldPos.x;
          const dy = obj.position.y - worldPos.y;
          return Math.sqrt(dx * dx + dy * dy) < 0.5; // 0.5m hover radius
        });
        setHoveredObject(hovered || null);
      }
    },
    [isDragging, dragStart, viewport, height, semanticObjects, config.showTooltip]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHoveredObject(null);
  }, []);

  // Render the map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Save context state
    ctx.save();

    // Draw occupancy grid
    if (layers.occupancyGrid && occupancyGrid) {
      drawOccupancyGrid(ctx, occupancyGrid, viewport, width, height);
    }

    // Draw reference grid
    if (config.showGrid) {
      drawGrid(ctx, viewport, width, height);
    }

    // Draw robot trail
    if (layers.robotTrail && robotTrail.length > 1) {
      drawRobotTrail(ctx, robotTrail, viewport, height);
    }

    // Draw navigation path
    if (layers.path && path.length > 0) {
      drawPath(ctx, path, viewport, height);
    }

    // Draw exploration frontiers
    if (layers.frontiers && frontiers.length > 0) {
      frontiers.forEach((frontier) => {
        drawFrontier(ctx, frontier, viewport, height);
      });
    }

    // Draw robot pose
    if (layers.robotPose && robotPose) {
      drawRobot(ctx, robotPose, viewport, height);
    }

    // Draw semantic objects
    if (layers.semanticObjects && semanticObjects.length > 0) {
      semanticObjects.forEach((obj) => {
        drawSemanticObject(ctx, obj, viewport, height);
      });
    }

    // Restore context state
    ctx.restore();

    // Draw UI overlays (not affected by viewport transform)
    if (config.showCoordinates) {
      drawCoordinates(ctx, mousePos, viewport, height);
    }
  }, [
    viewport,
    robotPose,
    robotTrail,
    occupancyGrid,
    semanticObjects,
    frontiers,
    path,
    layers,
    config,
    width,
    height,
    mousePos,
  ]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="border border-gray-300 dark:border-gray-700 rounded-lg cursor-move"
        style={{ touchAction: 'none' }}
      />

      {/* Tooltip */}
      {hoveredObject && config.showTooltip && !selectedObject && (
        <div
          className="absolute bg-black/80 text-white px-3 py-2 rounded-md text-sm pointer-events-none"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y + 10,
          }}
        >
          <div className="font-semibold">{hoveredObject.class}</div>
          <div className="text-xs text-gray-300">
            Confidence: {(hoveredObject.confidence * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-300">
            Position: ({hoveredObject.position.x.toFixed(2)}, {hoveredObject.position.y.toFixed(2)})
          </div>
        </div>
      )}

      {/* Selected object detail panel */}
      {selectedObject && (
        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 shadow-lg max-w-xs">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{selectedObject.class}</h3>
            <button
              onClick={() => setSelectedObject(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">ID:</span>{' '}
              <span className="font-mono">{selectedObject.id}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>{' '}
              {(selectedObject.confidence * 100).toFixed(1)}%
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Position:</span>{' '}
              ({selectedObject.position.x.toFixed(2)}, {selectedObject.position.y.toFixed(2)})
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>{' '}
              {new Date(selectedObject.timestamp).toLocaleTimeString()}
            </div>
            {selectedObject.persistent !== undefined && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Persistent:</span>{' '}
                {selectedObject.persistent ? 'Yes' : 'No'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Viewport info */}
      <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-mono">
        Zoom: {viewport.scale.toFixed(2)}x
      </div>

      {/* Layer controls */}
      <MapControls
        layers={layers}
        onLayerToggle={handleLayerToggle}
        className="absolute top-2 right-2"
      />

      {/* Legend */}
      {config.showLegend && (
        <MapLegend className="absolute bottom-2 right-2" />
      )}
    </div>
  );
};

/**
 * Draw reference grid
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number
): void {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  const gridSpacing = 1; // 1 meter
  const scaledSpacing = gridSpacing * viewport.scale;

  // Draw vertical lines
  const startX = (-viewport.x % scaledSpacing) - scaledSpacing;
  for (let x = startX; x < width; x += scaledSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw horizontal lines
  const startY = (-viewport.y % scaledSpacing) - scaledSpacing;
  for (let y = startY; y < height; y += scaledSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw origin axes
  const originCanvas = worldToCanvas({ x: 0, y: 0 }, viewport, height);
  if (originCanvas.x >= 0 && originCanvas.x <= width) {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originCanvas.x, 0);
    ctx.lineTo(originCanvas.x, height);
    ctx.stroke();
  }
  if (originCanvas.y >= 0 && originCanvas.y <= height) {
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originCanvas.y);
    ctx.lineTo(width, originCanvas.y);
    ctx.stroke();
  }
}

/**
 * Draw mouse coordinates
 */
function drawCoordinates(
  ctx: CanvasRenderingContext2D,
  mousePos: Point2D,
  viewport: Viewport,
  height: number
): void {
  const worldPos = canvasToWorld(mousePos, viewport, height);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(mousePos.x + 10, mousePos.y - 30, 120, 25);

  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.fillText(
    `(${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)})`,
    mousePos.x + 15,
    mousePos.y - 12
  );
}

export default Map2D;
