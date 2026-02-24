/**
 * SemanticObjectDetail Component
 * Displays detailed information for a selected semantic object
 * Implements Requirements 16.7, 16.8, 16.9
 */

import { useState } from 'react';
import {
  Package,
  MapPin,
  Clock,
  Eye,
  Calendar,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useSemanticObjectDetail, useSemanticObjectTimeline } from '../../features/api/hooks';
import type { SemanticObject } from '../../types/visualization';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

interface SemanticObjectDetailProps {
  object: SemanticObject;
  onClose?: () => void;
  className?: string;
}

/**
 * Get color for object class (consistent with list view)
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
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

/**
 * Format duration between two dates
 */
const formatDuration = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay}d ${diffHour % 24}h`;
  } else if (diffHour > 0) {
    return `${diffHour}h ${diffMin % 60}m`;
  } else if (diffMin > 0) {
    return `${diffMin}m ${diffSec % 60}s`;
  } else {
    return `${diffSec}s`;
  }
};

export const SemanticObjectDetail: React.FC<SemanticObjectDetailProps> = ({
  object,
  onClose,
  className = '',
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showTimeline, setShowTimeline] = useState(false);

  // Fetch detailed object information
  const { data: objectDetail, isLoading: isLoadingDetail } = useSemanticObjectDetail(object.id);

  // Fetch timeline data (last 24 hours)
  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: timeline, isLoading: isLoadingTimeline } = useSemanticObjectTimeline({
    startTime,
    endTime,
    classFilter: object.class,
  });

  // Filter timeline to only this object
  const objectTimeline = timeline?.filter((event) => event.objectId === object.id) || [];

  if (isLoadingDetail) {
    return <LoadingState message="Loading object details..." />;
  }

  const annotatedImages = objectDetail?.annotatedImages || [];
  const currentImage = annotatedImages[selectedImageIndex];

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`${getClassColor(object.class)} p-2 rounded-lg text-white`}>
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {object.class}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">ID: {object.id}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Close
            </button>
          )}
        </div>

        {/* Confidence badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
          <div
            className={`px-3 py-1 rounded text-sm font-medium ${
              object.confidence >= 0.8
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : object.confidence >= 0.6
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {(object.confidence * 100).toFixed(1)}%
          </div>
          {object.persistent && (
            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
              Persistent
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  X: {object.position.x.toFixed(3)}, Y: {object.position.y.toFixed(3)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Detected
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(object.timestamp)}
                </p>
              </div>
            </div>

            {object.boundingBox && (
              <div className="flex items-start gap-2 md:col-span-2">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bounding Box
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Min: ({object.boundingBox.minX.toFixed(2)}, {object.boundingBox.minY.toFixed(2)})
                    {' → '}
                    Max: ({object.boundingBox.maxX.toFixed(2)}, {object.boundingBox.maxY.toFixed(2)})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Persistence Information */}
        {objectDetail && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Persistence Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Seen
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(objectDetail.firstSeen)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Seen
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(objectDetail.lastSeen)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Eye className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observations
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {objectDetail.observationCount} times
                  </p>
                </div>
              </div>

              <div className="md:col-span-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration: {formatDuration(objectDetail.firstSeen, objectDetail.lastSeen)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Annotated Images */}
        {annotatedImages.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Annotated Camera Images
            </h3>
            <div className="space-y-3">
              {/* Image viewer */}
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={currentImage.imageUrl}
                  alt={`${object.class} detection`}
                  className="w-full h-auto"
                />
                {/* Bounding boxes overlay would be rendered here in a real implementation */}
              </div>

              {/* Image navigation */}
              {annotatedImages.length > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev > 0 ? prev - 1 : annotatedImages.length - 1
                      )
                    }
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedImageIndex + 1} / {annotatedImages.length}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((prev) =>
                        prev < annotatedImages.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Image metadata */}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Camera: {currentImage.cameraId}</p>
                <p>Timestamp: {formatDate(currentImage.timestamp)}</p>
                <p>Bounding boxes: {currentImage.boundingBoxes.length}</p>
              </div>
            </div>
          </div>
        )}

        {annotatedImages.length === 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Annotated Camera Images
            </h3>
            <EmptyState
              icon={ImageIcon}
              title="No images available"
              description="Camera images with bounding boxes will appear here"
            />
          </div>
        )}

        {/* Timeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Detection Timeline (Last 24h)
            </h3>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showTimeline ? 'Hide' : 'Show'}
            </button>
          </div>

          {showTimeline && (
            <div>
              {isLoadingTimeline ? (
                <LoadingState message="Loading timeline..." />
              ) : objectTimeline.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {objectTimeline.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          event.eventType === 'detected'
                            ? 'bg-green-500'
                            : event.eventType === 'lost'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {event.eventType}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Position: ({event.position.x.toFixed(2)}, {event.position.y.toFixed(2)})
                          {' • '}
                          Confidence: {(event.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No timeline data"
                  description="Detection events will appear here"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            // Download object data as JSON
            const dataStr = JSON.stringify(objectDetail || object, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${object.class}_${object.id}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Object Data
        </button>
      </div>
    </div>
  );
};
