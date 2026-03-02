import { Cpu, MemoryStick, Network, MapPin, Compass, Map, Eye, Wifi, WifiOff } from 'lucide-react';
import { useSystemHealth } from '@/features/api/hooks';
import { useRosbridgeTopic } from '@/hooks/useRosbridgeTopic';
import { useRosbridgeStore } from '@/features/stores/rosbridgeStore';
import { LoadingState } from '@/components/common/LoadingState';

// ─── ROS Message Types ─────────────────────────────────────────────────────

/** nav_msgs/Odometry simplified shape */
interface OdometryMsg {
  pose: {
    pose: {
      position: { x: number; y: number; z: number };
      orientation: { x: number; y: number; z: number; w: number };
    };
  };
  twist: {
    twist: {
      linear: { x: number; y: number; z: number };
      angular: { x: number; y: number; z: number };
    };
  };
}

/** diagnostic_msgs/DiagnosticArray simplified shape */
interface DiagnosticArrayMsg {
  status: Array<{
    name: string;
    message: string;
    level: number; // 0=OK, 1=WARN, 2=ERROR, 3=STALE
    values: Array<{ key: string; value: string }>;
  }>;
}

/** Convert quaternion to yaw angle */
function quaternionToYaw(q: { x: number; y: number; z: number; w: number }): number {
  const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
  const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  return Math.atan2(siny_cosp, cosy_cosp);
}

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * MetricsPanel Component
 *
 * Displays key system metrics sourced from rosbridge topics:
 * - Robot position from /odom (nav_msgs/Odometry)
 * - Diagnostics from /diagnostics (diagnostic_msgs/DiagnosticArray)
 * - System health from the REST API (areas, components, faults)
 *
 * All data is live from the robot — no hardcoded values.
 */
export function MetricsPanel() {
  const { data: healthData, isLoading: healthLoading, error: healthError } = useSystemHealth();
  const rosbridgeStatus = useRosbridgeStore((s) => s.status);
  const isRosbridgeConnected = rosbridgeStatus === 'connected';

  // Subscribe to /odom for robot position and velocity
  const odom = useRosbridgeTopic<OdometryMsg>('/odom', {
    type: 'nav_msgs/msg/Odometry',
    throttleRate: 500,
    enabled: isRosbridgeConnected,
  });

  // Subscribe to /diagnostics for system performance info
  const diag = useRosbridgeTopic<DiagnosticArrayMsg>('/diagnostics', {
    type: 'diagnostic_msgs/msg/DiagnosticArray',
    throttleRate: 2000,
    enabled: isRosbridgeConnected,
  });

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

  // Extract pose from /odom
  const pose = odom.data?.pose?.pose;
  const robotX = pose?.position?.x ?? null;
  const robotY = pose?.position?.y ?? null;
  const robotZ = pose?.position?.z ?? null;
  const orientation = pose?.orientation;
  const yaw = orientation ? quaternionToYaw(orientation) : null;

  // Extract velocity from /odom
  const twist = odom.data?.twist?.twist;
  const linearSpeed = twist
    ? Math.sqrt(twist.linear.x ** 2 + twist.linear.y ** 2)
    : null;
  const angularSpeed = twist ? Math.abs(twist.angular.z) : null;

  // Extract diagnostics values
  const diagValues: Record<string, string> = {};
  diag.data?.status?.forEach((s) => {
    s.values?.forEach((v) => {
      diagValues[`${s.name}/${v.key}`] = v.value;
    });
  });

  // Try to find CPU and memory from diagnostics (common key patterns)
  const cpuKey = Object.keys(diagValues).find(k =>
    k.toLowerCase().includes('cpu') && k.toLowerCase().includes('usage')
  );
  const memKey = Object.keys(diagValues).find(k =>
    k.toLowerCase().includes('memory') || k.toLowerCase().includes('mem')
  );
  const cpuValue = cpuKey ? parseFloat(diagValues[cpuKey]) : null;
  const memValue = memKey ? parseFloat(diagValues[memKey]) : null;

  // Data source badge
  const dataSourceLabel = isRosbridgeConnected ? 'via rosbridge' : 'waiting for rosbridge';

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isRosbridgeConnected ? (
          <Wifi className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className="font-mono">{dataSourceLabel}</span>
        {odom.messageCount > 0 && (
          <span className="ml-auto font-mono text-[10px] opacity-60">
            odom: {odom.messageCount} msgs
          </span>
        )}
      </div>

      {/* Robot Position & Velocity Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" aria-hidden="true" />
          Robot Position & Velocity
        </h3>
        {robotX !== null ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Position */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                <span className="text-sm font-medium">Position</span>
              </div>
              <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>X:</span>
                  <span className="font-mono">{robotX.toFixed(3)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Y:</span>
                  <span className="font-mono">{(robotY ?? 0).toFixed(3)} m</span>
                </div>
                <div className="flex justify-between">
                  <span>Z:</span>
                  <span className="font-mono">{(robotZ ?? 0).toFixed(3)} m</span>
                </div>
              </div>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-orange-500" aria-hidden="true" />
                <span className="text-sm font-medium">Orientation</span>
              </div>
              <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Yaw:</span>
                  <span className="font-mono">{(yaw ?? 0).toFixed(3)} rad</span>
                </div>
                <div className="flex justify-between">
                  <span>Heading:</span>
                  <span className="font-mono">{((yaw ?? 0) * 180 / Math.PI).toFixed(1)}°</span>
                </div>
              </div>
            </div>

            {/* Velocity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span className="text-sm font-medium">Velocity</span>
              </div>
              <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Linear:</span>
                  <span className="font-mono">{(linearSpeed ?? 0).toFixed(3)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Angular:</span>
                  <span className="font-mono">{(angularSpeed ?? 0).toFixed(3)} rad/s</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {isRosbridgeConnected
              ? 'Waiting for /odom messages...'
              : 'Connect to rosbridge to see robot position'
            }
          </p>
        )}
      </div>

      {/* System Diagnostics Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5" aria-hidden="true" />
          System Diagnostics
        </h3>
        {diag.data ? (
          <div className="space-y-4">
            {/* CPU/Memory if available */}
            {(cpuValue !== null || memValue !== null) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cpuValue !== null && (
                  <MetricItem
                    icon={Cpu}
                    label="CPU Usage"
                    value={`${cpuValue.toFixed(1)}%`}
                    iconColor="text-blue-500"
                    bgColor="bg-blue-500/10"
                    progressValue={cpuValue}
                  />
                )}
                {memValue !== null && (
                  <MetricItem
                    icon={MemoryStick}
                    label="Memory Usage"
                    value={`${memValue.toFixed(1)}%`}
                    iconColor="text-purple-500"
                    bgColor="bg-purple-500/10"
                    progressValue={memValue}
                  />
                )}
              </div>
            )}

            {/* Diagnostic status summary */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Diagnostics</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {diag.data.status.slice(0, 8).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`inline-block h-2 w-2 rounded-full ${s.level === 0 ? 'bg-green-500' :
                        s.level === 1 ? 'bg-yellow-500' :
                          s.level === 2 ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                    <span className="text-muted-foreground truncate" title={s.name}>
                      {s.name}
                    </span>
                    <span className="ml-auto text-xs font-mono opacity-60">
                      {s.message || (s.level === 0 ? 'OK' : 'WARN')}
                    </span>
                  </div>
                ))}
              </div>
              {diag.data.status.length > 8 && (
                <p className="text-xs text-muted-foreground italic">
                  +{diag.data.status.length - 8} more diagnostic entries
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {isRosbridgeConnected
              ? 'Waiting for /diagnostics messages...'
              : 'Connect to rosbridge to see diagnostics'
            }
          </p>
        )}
      </div>

      {/* Exploration / Map Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Map className="h-5 w-5" aria-hidden="true" />
          Navigation
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Areas</p>
            <p className="text-2xl font-bold">{healthData.totalAreas}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Components</p>
            <p className="text-2xl font-bold">{healthData.activeComponents}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Topics</p>
            <p className="text-2xl font-bold">{healthData.totalTopics}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Faults</p>
            <p className="text-2xl font-bold text-red-500">
              {healthData.faultCounts.error + healthData.faultCounts.warning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

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
