/**
 * SemanticObjectList Component
 * Displays detected semantic objects with filtering controls
 * Implements Requirements 16.1, 16.2, 16.3, 16.6
 */

import { useState, useMemo } from 'react';
import { Package, Filter, Download, Clock, MapPin } from 'lucide-react';
import { useSemanticObjects, useDownloadSemanticObjects } from '../../features/api/hooks';
import type { SemanticObject } from '../../types/visualization';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

interface SemanticObjectListProps {
  className?: string;
  onObjectSelect?: (object: SemanticObject) => void;
  showFilters?: boolean;
}

/**
 * Get color for object class (consistent with map visualization)
 */
const getClassColor = (className: string): string => {
  const colors: Record<string, string> = {
    person: 'bg-blue-500',
    chair: 'bg-green-500',
    table: 'bg-yellow-500',
    bottle: 'bg-purple-500',
    cup: 'bg-pink-500',
    laptop: 'bg-indigo-500',
    book: 'bg-orange-500',
    default: 'bg-gray-500',
  };
  return colors[className.toLowerCase()] || colors.default;
};

/**
 * Get icon for object class
 */
const getClassIcon = (_className: string) => {
  // For now, use Package icon for all objects
  // Can be extended with specific icons per class
  return <Package className="w-4 h-4" />;
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) {
    return `${diffSec}s ago`;
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else {
    return date.toLocaleString();
  }
};

/**
 * Sort objects by confidence (highest first) then by timestamp (most recent first)
 */
const sortObjects = (objects: SemanticObject[]): SemanticObject[] => {
  return [...objects].sort((a, b) => {
    // First sort by confidence (highest first)
    const confidenceDiff = b.confidence - a.confidence;
    if (Math.abs(confidenceDiff) > 0.01) return confidenceDiff;

    // Then sort by timestamp (most recent first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

export const SemanticObjectList: React.FC<SemanticObjectListProps> = ({
  className = '',
  onObjectSelect,
  showFilters = true,
}) => {
  const [classFilter, setClassFilter] = useState<string>('');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [showPersistentOnly, setShowPersistentOnly] = useState<boolean>(false);

  const { data: objects, isLoading, error } = useSemanticObjects({
    classFilter: classFilter || undefined,
    minConfidence: minConfidence > 0 ? minConfidence : undefined,
  });

  const downloadObjects = useDownloadSemanticObjects();

  // Apply additional client-side filtering
  const filteredObjects = useMemo(() => {
    if (!objects) return [];

    let filtered = objects;

    // Filter by persistent flag
    if (showPersistentOnly) {
      filtered = filtered.filter((obj) => obj.persistent === true);
    }

    return sortObjects(filtered);
  }, [objects, showPersistentOnly]);

  // Get unique object classes for filter dropdown
  const uniqueClasses = useMemo(() => {
    if (!objects) return [];
    const classes = new Set(objects.map((obj) => obj.class));
    return Array.from(classes).sort();
  }, [objects]);

  // Handle download
  const handleDownload = async (format: 'json' | 'csv') => {
    try {
      await downloadObjects.mutateAsync({
        format,
        classFilter: classFilter || undefined,
      });
    } catch (error) {
      console.error('Failed to download semantic objects:', error);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading semantic objects..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">
          Failed to load semantic objects: {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with filters */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Detected Objects
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload('json')}
                disabled={downloadObjects.isPending}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Download as JSON"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => handleDownload('csv')}
                disabled={downloadObjects.isPending}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Download as CSV"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Class filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Object Class
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Confidence filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Confidence: {(minConfidence * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minConfidence * 100}
                onChange={(e) => setMinConfidence(parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>

            {/* Persistent filter */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPersistentOnly}
                  onChange={(e) => setShowPersistentOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Persistent only
                </span>
              </label>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              {filteredObjects.length} object{filteredObjects.length !== 1 ? 's' : ''}
            </span>
            {classFilter && (
              <span className="flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filtered by: {classFilter}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Object list */}
      <div className="flex-1 overflow-y-auto">
        {filteredObjects.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No objects detected"
            description={
              classFilter || minConfidence > 0
                ? 'Try adjusting your filters'
                : 'Waiting for object detection data'
            }
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredObjects.map((object) => (
              <div
                key={object.id}
                onClick={() => onObjectSelect?.(object)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  {/* Object info */}
                  <div className="flex items-start gap-3 flex-1">
                    {/* Class icon and color */}
                    <div
                      className={`${getClassColor(object.class)} p-2 rounded-lg text-white`}
                    >
                      {getClassIcon(object.class)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {object.class}
                        </h3>
                        {object.persistent && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                            Persistent
                          </span>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Position: ({object.position.x.toFixed(2)}, {object.position.y.toFixed(2)})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(object.timestamp)}
                          </span>
                        </div>
                        {object.boundingBox && (
                          <div className="text-xs">
                            Bounding Box: [{object.boundingBox.minX.toFixed(2)}, {object.boundingBox.minY.toFixed(2)}] to [{object.boundingBox.maxX.toFixed(2)}, {object.boundingBox.maxY.toFixed(2)}]
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Confidence badge */}
                  <div className="ml-3">
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${object.confidence >= 0.8
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : object.confidence >= 0.6
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                    >
                      {(object.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
