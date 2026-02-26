/**
 * MapControls Component
 * Layer toggle controls and legend for Map2D visualization
 */

import React from 'react';
import type { MapLayers } from '../../types/visualization';

export interface MapControlsProps {
  layers: MapLayers;
  onLayerToggle: (layer: keyof MapLayers) => void;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  layers,
  onLayerToggle,
  className = '',
}) => {
  const layerConfig: Array<{
    key: keyof MapLayers;
    label: string;
    color: string;
  }> = [
      { key: 'occupancyGrid', label: 'Occupancy Grid', color: '#808080' },
      { key: 'robotPose', label: 'Robot Pose', color: '#3b82f6' },
      { key: 'robotTrail', label: 'Robot Trail', color: '#3b82f6' },
      { key: 'semanticObjects', label: 'Semantic Objects', color: '#ef4444' },
      { key: 'frontiers', label: 'Frontiers', color: '#fbbf24' },
      { key: 'path', label: 'Navigation Path', color: '#10b981' },
    ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 shadow-lg ${className}`}
    >
      <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Map Layers
      </h3>
      <div className="space-y-1.5">
        {layerConfig.map(({ key, label, color }) => (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded"
          >
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() => onLayerToggle(key)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default MapControls;
