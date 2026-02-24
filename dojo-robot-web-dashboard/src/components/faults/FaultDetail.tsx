/**
 * FaultDetail Component
 * Displays fault snapshot data with system state and rosbag download
 * Implements Requirements 7.7, 7.8, 7.9, 14.8
 */

import { useState } from 'react';
import { Download, AlertCircle, Clock, Code } from 'lucide-react';
import { useFaultSnapshots, useDownloadRosbag } from '../../features/api/hooks';
import { JsonInspector } from '../common/JsonInspector';
import { LoadingState } from '../common/LoadingState';

interface FaultDetailProps {
  faultCode: string;
  className?: string;
}

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const FaultDetail: React.FC<FaultDetailProps> = ({
  faultCode,
  className = '',
}) => {
  const { data: snapshot, isLoading, error } = useFaultSnapshots(faultCode);
  const downloadRosbag = useDownloadRosbag();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const handleDownload = async () => {
    try {
      setDownloadProgress(0);
      await downloadRosbag.mutateAsync({
        faultCode,
        onProgress: (progress: number) => {
          setDownloadProgress(progress);
        },
      });
      setDownloadProgress(null);
    } catch (err) {
      setDownloadProgress(null);
      console.error('Download failed:', err);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading fault snapshot..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>
            Failed to load fault snapshot:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          No snapshot data available for this fault.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Fault Snapshot
              </h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span className="font-medium">Code:</span>
                <span className="font-mono">{snapshot.faultCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTimestamp(snapshot.timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloadRosbag.isPending || downloadProgress !== null}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Download rosbag file"
          >
            <Download className="w-4 h-4" />
            {downloadProgress !== null
              ? `Downloading... ${Math.round(downloadProgress)}%`
              : 'Download Rosbag'}
          </button>
        </div>

        {/* Download Progress Bar */}
        {downloadProgress !== null && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
                role="progressbar"
                aria-valuenow={downloadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {/* Download Error */}
        {downloadRosbag.isError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">
              Download failed:{' '}
              {downloadRosbag.error instanceof Error
                ? downloadRosbag.error.message
                : 'Unknown error'}
            </p>
          </div>
        )}
      </div>

      {/* System State Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          System State at Fault Occurrence
        </h3>
        <JsonInspector
          data={snapshot.systemState}
          defaultExpanded={false}
          searchable={true}
          copyable={true}
          maxExpandDepth={1}
        />
      </div>

      {/* Topic Data Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Topic Data
        </h3>
        <JsonInspector
          data={snapshot.topicData}
          defaultExpanded={false}
          searchable={true}
          copyable={true}
          maxExpandDepth={1}
        />
      </div>
    </div>
  );
};
