/**
 * 3D Visualization Controls Component
 * Provides UI controls for 3D visualizations
 */

import { useState } from 'react';
import {
  Settings,
  Download,
  RotateCw,
  Grid3x3,
  Maximize2,
  Eye,
} from 'lucide-react';
import type {
  PointCloudColorMode,
  GaussianRenderMode,
} from '../../types/visualization';

interface Visualization3DControlsProps {
  // Point cloud specific
  colorMode?: PointCloudColorMode;
  onColorModeChange?: (mode: PointCloudColorMode) => void;
  pointSize?: number;
  onPointSizeChange?: (size: number) => void;

  // Gaussian splat specific
  renderMode?: GaussianRenderMode;
  onRenderModeChange?: (mode: GaussianRenderMode) => void;

  // Common controls
  showGrid?: boolean;
  onShowGridChange?: (show: boolean) => void;
  showAxes?: boolean;
  onShowAxesChange?: (show: boolean) => void;
  autoRotate?: boolean;
  onAutoRotateChange?: (rotate: boolean) => void;

  // Export
  onExport?: () => void;

  // Reset camera
  onResetCamera?: () => void;

  className?: string;
}

/**
 * 3D Visualization Controls Panel
 */
export function Visualization3DControls({
  colorMode,
  onColorModeChange,
  pointSize = 0.05,
  onPointSizeChange,
  renderMode,
  onRenderModeChange,
  showGrid = true,
  onShowGridChange,
  showAxes = true,
  onShowAxesChange,
  autoRotate = false,
  onAutoRotateChange,
  onExport,
  onResetCamera,
  className,
}: Visualization3DControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className || ''}`}
    >
      {/* Collapsed state - icon button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Show controls"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {/* Expanded state - full controls */}
      {isExpanded && (
        <div className="p-4 space-y-4 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Visualization Controls
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Hide controls"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Color Mode (Point Cloud) */}
          {colorMode !== undefined && onColorModeChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Color Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onColorModeChange('rgb')}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                    colorMode === 'rgb'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  RGB
                </button>
                <button
                  onClick={() => onColorModeChange('intensity')}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                    colorMode === 'intensity'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Intensity
                </button>
                <button
                  onClick={() => onColorModeChange('semantic')}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                    colorMode === 'semantic'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Semantic
                </button>
              </div>
            </div>
          )}

          {/* Render Mode (Gaussian Splat) */}
          {renderMode !== undefined && onRenderModeChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Render Mode
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onRenderModeChange('points')}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                    renderMode === 'points'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Points
                </button>
                <button
                  onClick={() => onRenderModeChange('ellipsoids')}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                    renderMode === 'ellipsoids'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Ellipsoids
                </button>
                <button
                  onClick={() => onRenderModeChange('full')}
                  className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                    renderMode === 'full'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Full
                </button>
              </div>
            </div>
          )}

          {/* Point Size */}
          {onPointSizeChange && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Point Size: {pointSize.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={pointSize}
                onChange={(e) => onPointSizeChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Display Options */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Display Options
            </label>
            <div className="space-y-2">
              {onShowGridChange && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => onShowGridChange(e.target.checked)}
                    className="rounded"
                  />
                  <Grid3x3 className="w-4 h-4" />
                  <span className="text-xs">Show Grid</span>
                </label>
              )}
              {onShowAxesChange && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAxes}
                    onChange={(e) => onShowAxesChange(e.target.checked)}
                    className="rounded"
                  />
                  <Maximize2 className="w-4 h-4" />
                  <span className="text-xs">Show Axes</span>
                </label>
              )}
              {onAutoRotateChange && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => onAutoRotateChange(e.target.checked)}
                    className="rounded"
                  />
                  <RotateCw className="w-4 h-4" />
                  <span className="text-xs">Auto Rotate</span>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {onResetCamera && (
              <button
                onClick={onResetCamera}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                title="Reset camera"
              >
                <RotateCw className="w-4 h-4" />
                Reset
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                title="Export data"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Export 3D data to JSON file
 */
export function exportVisualizationData(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
