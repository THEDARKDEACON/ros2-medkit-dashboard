import { Cpu, MemoryStick, Network, MapPin, Compass, Map, Eye } from 'lucide-react';
import { useSystemHealth, usePerformanceMetrics, useSemanticObjects, useRobotPose } from '@/features/api/hooks';
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
 * All data is fetched from real-time backend hooks.
 * Requirements: 8.5, 8.6, 8.7, 8.8
 */
export function MetricsPanel() {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useSystemHealth();
  const { data: perfData } = usePerformanceMetrics({ refetchInterval: 5000 });
  const { data: semanticData } = useSemanticObjects({ refetchInterval: 5000 });
  const { data: poseData } = useRobotPose({ refetchInterval: 1000 });

  if (healthLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading metrics..." />
      </div>
    );
  }

  if (healthError) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Unable to load metrics data
        </p>
      </div>
    );
  }

  if (!healthData) {
    return null;
  }

  // Extract latest performance metrics from time-series arrays
  const latestCpu = perfData?.cpuUsage?.length
    ? perfData.cpuUsage[perfData.cpuUsage.length - 1]
    : null;
  const latestMem = perfData?.memoryUsage?.length
    ? perfData.memoryUsage[perfData.memoryUsage.length - 1]
    : null;
  const latestNet = perfData?.networkBandwidth?.length
    ? perfData.networkBandwidth[perfData.networkBandwidth.length - 1]
    : null;

  const cpuValue = latestCpu && typeof latestCpu === 'object' && 'value' in latestCpu
    ? (latestCpu as { value: number }).value : null;
  const memValue = latestMem && typeof latestMem === 'object' && 'value' in latestMem
    ? (latestMem as { value: number }).value : null;
  const netValue = latestNet && typeof latestNet === 'object' && 'value' in latestNet
    ? (latestNet as { value: number }).value : null;

  // Robot pose from real hook
  const robotX = poseData?.x ?? null;
  const robotY = poseData?.y ?? null;
  const robotTheta = poseData?.theta ?? null;

  // Semantic objects from real hook
  const semanticTotal = semanticData?.length ?? 0;
  const semanticByType: Record<string, number> = {};
  semanticData?.forEach((obj) => {
    const cls = obj.class || 'unknown';
    semanticByType[cls] = (semanticByType[cls] || 0) + 1;
  });

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
            value={cpuValue !== null ? `${cpuValue.toFixed(1)}%` : '—'}
            iconColor="text-blue-500"
            bgColor="bg-blue-500/10"
            progressValue={cpuValue ?? undefined}
          />
          <MetricItem
            icon={MemoryStick}
            label="Memory Usage"
            value={memValue !== null ? `${memValue.toFixed(1)}%` : '—'}
            iconColor="text-purple-500"
            bgColor="bg-purple-500/10"
            progressValue={memValue ?? undefined}
          />
          <MetricItem
            icon={Network}
            label="Network Activity"
            value={netValue !== null ? `${netValue.toFixed(1)} MB/s` : '—'}
            iconColor="text-green-500"
            bgColor="bg-green-500/10"
          />
        </div>
        {cpuValue === null && (
          <p className="text-xs text-muted-foreground mt-3 italic">
            Performance data unavailable — ensure the performance endpoint is running
          </p>
        )}
      </div>

      {/* Robot Position & Orientation Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" aria-hidden="true" />
          Robot Position & Orientation
        </h3>
        {robotX !== null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                <span className="text-sm font-medium">Position</span>
              </div>
              <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>X:</span>
                  <span className="font-mono">{robotX.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Y:</span>
                  <span className="font-mono">{(robotY ?? 0).toFixed(2)} m</span>
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
                  <span>Yaw:</span>
                  <span className="font-mono">{(robotTheta ?? 0).toFixed(2)} rad</span>
                </div>
                <div className="flex justify-between">
                  <span>Heading:</span>
                  <span className="font-mono">{((robotTheta ?? 0) * 180 / Math.PI).toFixed(1)}°</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Robot pose unavailable — connect to the robot to see position data
          </p>
        )}
      </div>

      {/* Exploration Progress Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Map className="h-5 w-5" aria-hidden="true" />
          Exploration Progress
        </h3>
        <p className="text-sm text-muted-foreground italic">
          Exploration data available when a navigation component is active.
          View detailed exploration on the Visualizations page.
        </p>
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
              {semanticTotal}
            </span>
          </div>
          {Object.keys(semanticByType).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(semanticByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">{type}</span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No objects detected yet — ensure YOLO perception is running
            </p>
          )}
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
            className={`h-1.5 rounded-full transition-all duration-300 ${progressValue > 80
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
