import { Battery, BatteryCharging, Zap, Clock } from 'lucide-react';
import { useBatteryStatus, useExplorationStats } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';

/**
 * BatteryDisplay Component
 * 
 * Displays battery status and exploration time estimates including:
 * - Battery level with visual indicator
 * - Voltage and current readings
 * - Charging status
 * - Estimated remaining exploration time
 * 
 * Requirements: 17.9
 */
interface BatteryDisplayProps {
  componentId: string;
  refreshInterval?: number;
}

export function BatteryDisplay({ componentId, refreshInterval = 5000 }: BatteryDisplayProps) {
  const { data: battery, isLoading: batteryLoading, error: batteryError } = useBatteryStatus(
    componentId,
    { refetchInterval: refreshInterval }
  );
  
  const { data: explorationStats } = useExplorationStats(componentId, {
    refetchInterval: refreshInterval * 2,
  });

  if (batteryLoading) {
    return (
      <div className="p-4">
        <LoadingState message="Loading battery data..." />
      </div>
    );
  }

  if (batteryError) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Battery data not available</p>
      </div>
    );
  }

  if (!battery) {
    return null;
  }

  // Determine battery status color
  let batteryColor = 'text-green-500';
  let batteryBgColor = 'bg-green-500';
  let batteryBorderColor = 'border-green-500/20';
  
  if (battery.level < 20) {
    batteryColor = 'text-red-500';
    batteryBgColor = 'bg-red-500';
    batteryBorderColor = 'border-red-500/20';
  } else if (battery.level < 50) {
    batteryColor = 'text-yellow-500';
    batteryBgColor = 'bg-yellow-500';
    batteryBorderColor = 'border-yellow-500/20';
  }

  const BatteryIcon = battery.charging ? BatteryCharging : Battery;

  return (
    <div className="space-y-4">
      {/* Battery Level Card */}
      <div className={`rounded-lg border-2 ${batteryBorderColor} bg-card p-6`}>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <BatteryIcon
              className={`h-10 w-10 ${batteryColor}`}
              aria-hidden="true"
            />
            {battery.charging && (
              <div className="absolute inset-0 h-10 w-10 animate-pulse opacity-50">
                <BatteryCharging className={batteryColor} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">{battery.level.toFixed(1)}%</h3>
            <p className="text-sm text-muted-foreground">
              {battery.charging ? 'Charging' : 'Battery Level'}
            </p>
          </div>
        </div>

        {/* Battery Level Bar */}
        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden mb-4">
          <div
            className={`${batteryBgColor} h-full transition-all duration-500 ease-out`}
            style={{ width: `${battery.level}%` }}
            role="progressbar"
            aria-valuenow={battery.level}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Battery level: ${battery.level.toFixed(1)}%`}
          />
        </div>

        {/* Battery Status */}
        {battery.level < 20 && !battery.charging && (
          <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Low Battery Warning
          </div>
        )}
      </div>

      {/* Battery Details */}
      <div className="rounded-lg border bg-card p-4">
        <h4 className="font-semibold mb-3">Battery Details</h4>
        <div className="space-y-2">
          <DetailRow
            label="Voltage"
            value={`${battery.voltage.toFixed(2)} V`}
          />
          <DetailRow
            label="Current"
            value={`${battery.current.toFixed(2)} A`}
          />
          <DetailRow
            label="Power"
            value={`${(battery.voltage * battery.current).toFixed(2)} W`}
          />
          <DetailRow
            label="Status"
            value={battery.charging ? 'Charging' : 'Discharging'}
          />
        </div>
      </div>

      {/* Estimated Time Remaining */}
      {explorationStats?.estimatedTimeRemaining !== undefined && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Clock className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </div>
            <h4 className="font-semibold">Time Estimates</h4>
          </div>
          <div className="space-y-2">
            <DetailRow
              label="Exploration Time Remaining"
              value={formatTime(explorationStats.estimatedTimeRemaining)}
            />
            {battery.level > 0 && !battery.charging && (
              <DetailRow
                label="Est. Battery Runtime"
                value={estimateBatteryRuntime(battery.level, battery.current)}
              />
            )}
          </div>
        </div>
      )}

      {/* Battery Health Indicator */}
      <div className="rounded-lg border bg-card p-4">
        <h4 className="font-semibold mb-3">Battery Health</h4>
        <BatteryHealthIndicator level={battery.level} voltage={battery.voltage} />
      </div>
    </div>
  );
}

/**
 * DetailRow Component
 * Displays a label-value pair
 */
interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

/**
 * BatteryHealthIndicator Component
 * Visual indicator of battery health
 */
interface BatteryHealthIndicatorProps {
  level: number;
  voltage: number;
}

function BatteryHealthIndicator({ level, voltage }: BatteryHealthIndicatorProps) {
  // Simple health assessment based on level and voltage
  let health = 'Good';
  let healthColor = 'text-green-500';
  let healthBgColor = 'bg-green-500/10';

  if (level < 20 || voltage < 11.0) {
    health = 'Critical';
    healthColor = 'text-red-500';
    healthBgColor = 'bg-red-500/10';
  } else if (level < 50 || voltage < 11.5) {
    health = 'Fair';
    healthColor = 'text-yellow-500';
    healthBgColor = 'bg-yellow-500/10';
  }

  return (
    <div className={`rounded-lg ${healthBgColor} p-3`}>
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${healthColor.replace('text-', 'bg-')}`} />
        <span className={`font-semibold ${healthColor}`}>{health}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {health === 'Critical' && 'Battery needs immediate attention'}
        {health === 'Fair' && 'Consider charging soon'}
        {health === 'Good' && 'Battery is in good condition'}
      </p>
    </div>
  );
}

/**
 * Format time in seconds to human-readable string
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Estimate battery runtime based on current level and discharge rate
 */
function estimateBatteryRuntime(level: number, current: number): string {
  if (current <= 0) {
    return 'N/A';
  }

  // Assume a typical robot battery capacity (e.g., 50Ah)
  const batteryCapacityAh = 50;
  const remainingCapacityAh = (level / 100) * batteryCapacityAh;
  const runtimeHours = remainingCapacityAh / current;
  const runtimeSeconds = runtimeHours * 3600;

  return formatTime(runtimeSeconds);
}
