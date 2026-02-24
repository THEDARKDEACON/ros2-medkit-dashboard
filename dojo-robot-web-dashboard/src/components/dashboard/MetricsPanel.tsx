import { Cpu, MemoryStick, Network, MapPin, Compass, Map, Eye } from 'lucide-react';
import { useSystemHealth } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';

/**
 * MetricsPanel Component
 * 
 * Displays key system metrics including:
 * - CPU usage, memory usage, network activity (Requirement 8.5)
 * - Robot position and orientation if available (Requirement 8.6)
 * - Exploration progress and mapping statistics (Requirement 8.7)
 * - Semantic object detection counts (Requirement 8.8)
 * 
 * Requirements: 8.5, 8.6, 8.7, 8.8
 */
export function MetricsPanel() {
  const { data, isLoading, error } = useSystemHealth();

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Unable to load metrics data
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Mock data for metrics that would come from topic data in a real implementation
  // In production, these would be fetched from specific topics
  const performanceMetrics = {
    cpuUsage: 45.2, // percentage
    memoryUsage: 62.8, // percentage
    networkActivity: 1.2, // MB/s
  };

  const robotPose = {
    position: { x: 2.5, y: 1.8, z: 0.0 },
    orientation: { roll: 0.0, pitch: 0.0, yaw: 1.57 }, // radians
  };

  const explorationStats = {
    progress: 68, // percentage
    areaCovered: 45.3, // square meters
    frontiers: 12,
  };

  const semanticObjects = {
    total: 23,
    byType: {
      person: 3,
      chair: 8,
      table: 4,
      door: 5,
      other: 3,
    },
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5" aria-hidden="true" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricItem
            icon={Cpu}
            label="CPU Usage"
            value={`${performanceMetrics.cpuUsage}%`}
            iconColor="text-blue-500"
            bgColor="bg-blue-500/10"
            progressValue={performanceMetrics.cpuUsage}
          />
          <MetricItem
            icon={MemoryStick}
            label="Memory Usage"
            value={`${performanceMetrics.memoryUsage}%`}
            iconColor="text-purple-500"
            bgColor="bg-purple-500/10"
            progressValue={performanceMetrics.memoryUsage}
          />
          <MetricItem
            icon={Network}
            label="Network Activity"
            value={`${performanceMetrics.networkActivity} MB/s`}
            iconColor="text-green-500"
            bgColor="bg-green-500/10"
          />
        </div>
      </div>

      {/* Robot Position & Orientation Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" aria-hidden="true" />
          Robot Position & Orientation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-500" aria-hidden="true" />
              <span className="text-sm font-medium">Position</span>
            </div>
            <div className="pl-6 space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>X:</span>
                <span className="font-mono">{robotPose.position.x.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span>Y:</span>
                <span className="font-mono">{robotPose.position.y.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span>Z:</span>
                <span className="font-mono">{robotPose.position.z.toFixed(2)} m</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-orange-500" aria-hidden="true" />
              <span className="text-sm font-medium">Orientation</span>
            </div>
            <div className="pl-6 space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Roll:</span>
                <span className="font-mono">{robotPose.orientation.roll.toFixed(2)} rad</span>
              </div>
              <div className="flex justify-between">
                <span>Pitch:</span>
                <span className="font-mono">{robotPose.orientation.pitch.toFixed(2)} rad</span>
              </div>
              <div className="flex justify-between">
                <span>Yaw:</span>
                <span className="font-mono">{robotPose.orientation.yaw.toFixed(2)} rad</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exploration Progress Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Map className="h-5 w-5" aria-hidden="true" />
          Exploration Progress
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold text-blue-500">
                {explorationStats.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${explorationStats.progress}%` }}
                role="progressbar"
                aria-valuenow={explorationStats.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Exploration progress"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Area Covered</p>
              <p className="text-xl font-bold">{explorationStats.areaCovered} m²</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Frontiers</p>
              <p className="text-xl font-bold">{explorationStats.frontiers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Object Detection Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5" aria-hidden="true" />
          Semantic Object Detection
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-sm font-medium">Total Objects Detected</span>
            <span className="text-2xl font-bold text-purple-500">
              {semanticObjects.total}
            </span>
          </div>
          <div className="space-y-2">
            {Object.entries(semanticObjects.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground capitalize">{type}</span>
                <span className="text-sm font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MetricItem Component
 * Displays a single metric with optional progress bar
 */
interface MetricItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  iconColor: string;
  bgColor: string;
  progressValue?: number;
}

function MetricItem({
  icon: Icon,
  label,
  value,
  iconColor,
  bgColor,
  progressValue,
}: MetricItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`rounded-lg ${bgColor} p-2`}>
          <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden="true" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold pl-10">{value}</p>
      {progressValue !== undefined && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 pl-10">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              progressValue > 80
                ? 'bg-red-500'
                : progressValue > 60
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${progressValue}%` }}
            role="progressbar"
            aria-valuenow={progressValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label} progress`}
          />
        </div>
      )}
    </div>
  );
}
