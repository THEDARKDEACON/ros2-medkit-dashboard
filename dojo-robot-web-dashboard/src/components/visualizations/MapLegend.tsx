/**
 * MapLegend Component
 * Legend showing map element meanings and colors
 */

import React from 'react';

export interface MapLegendProps {
  className?: string;
}

export const MapLegend: React.FC<MapLegendProps> = ({ className = '' }) => {
  const legendItems = [
    { label: 'Free Space', color: '#f0f0f0', type: 'fill' },
    { label: 'Occupied', color: '#202020', type: 'fill' },
    { label: 'Unknown', color: '#404040', type: 'fill' },
    { label: 'Robot', color: '#3b82f6', type: 'circle' },
    { label: 'Robot Trail', color: '#3b82f6', type: 'line' },
    { label: 'Semantic Object', color: '#ef4444', type: 'circle' },
    { label: 'Frontier', color: '#fbbf24', type: 'circle' },
    { label: 'Navigation Path', color: '#10b981', type: 'dashed' },
  ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 shadow-lg ${className}`}
    >
      <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Legend
      </h3>
      <div className="space-y-1.5">
        {legendItems.map(({ label, color, type }) => (
          <div key={label} className="flex items-center gap-2">
            {type === 'fill' && (
              <div
                className="w-4 h-4 border border-gray-400"
                style={{ backgroundColor: color }}
              />
            )}
            {type === 'circle' && (
              <div
                className="w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
              />
            )}
            {type === 'line' && (
              <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
            )}
            {type === 'dashed' && (
              <svg width="16" height="4" className="flex-shrink-0">
                <line
                  x1="0"
                  y1="2"
                  x2="16"
                  y2="2"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="3,2"
                />
              </svg>
            )}
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLegend;
