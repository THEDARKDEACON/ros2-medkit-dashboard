import { Gauge, ArrowRight, RotateCw } from 'lucide-react';
import { useRobotVelocity } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';

/**
 * VelocityDisplay Component
 * 
 * Displays current robot velocity including:
 * - Linear velocity (x, y, z components)
 * - Angular velocity (x, y, z components)
 * - Visual velocity magnitude indicator
 * 
 * Requirements: 17.8
 */
interface VelocityDisplayProps {
  componentId: string;
  refreshInterval?: number;
}

export function VelocityDisplay({ componentId, refreshInterval = 500 }: VelocityDisplayProps) {
  const { data: velocity, isLoading, error } = useRobotVelocity(componentId, {
    refetchInterval: refreshInterval,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingState message="Loading velocity data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-red-500">Failed to load velocity data</p>
      </div>
    );
  }

  if (!velocity) {
    return null;
  }

  // Calculate velocity magnitudes
  const linearMagnitude = Math.sqrt(
    velocity.linear.x ** 2 + velocity.linear.y ** 2 + velocity.linear.z ** 2
  );
  const angularMagnitude = Math.sqrt(
    velocity.angular.x ** 2 + velocity.angular.y ** 2 + velocity.angular.z ** 2
  );

  return (
    <div className="space-y-4">
      {/* Linear Velocity */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <ArrowRight className="h-5 w-5 text-blue-500" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Linear Velocity</h4>
            <p className="text-xs text-muted-foreground">
              {linearMagnitude.toFixed(3)} m/s
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <VelocityBar
            label="X"
            value={velocity.linear.x}
            unit="m/s"
            color="blue"
          />
          <VelocityBar
            label="Y"
            value={velocity.linear.y}
            unit="m/s"
            color="blue"
          />
          <VelocityBar
            label="Z"
            value={velocity.linear.z}
            unit="m/s"
            color="blue"
          />
        </div>
      </div>

      {/* Angular Velocity */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <RotateCw className="h-5 w-5 text-purple-500" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Angular Velocity</h4>
            <p className="text-xs text-muted-foreground">
              {angularMagnitude.toFixed(3)} rad/s
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <VelocityBar
            label="X"
            value={velocity.angular.x}
            unit="rad/s"
            color="purple"
          />
          <VelocityBar
            label="Y"
            value={velocity.angular.y}
            unit="rad/s"
            color="purple"
          />
          <VelocityBar
            label="Z"
            value={velocity.angular.z}
            unit="rad/s"
            color="purple"
          />
        </div>
      </div>

      {/* Velocity Gauge */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-green-500/10 p-2">
            <Gauge className="h-5 w-5 text-green-500" aria-hidden="true" />
          </div>
          <h4 className="font-semibold">Speed</h4>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Linear</span>
            <span className="font-mono font-semibold">
              {linearMagnitude.toFixed(3)} m/s
            </span>
          </div>
          <SpeedGauge value={linearMagnitude} maxValue={2.0} />
          
          <div className="flex justify-between text-sm mt-4">
            <span className="text-muted-foreground">Angular</span>
            <span className="font-mono font-semibold">
              {angularMagnitude.toFixed(3)} rad/s
            </span>
          </div>
          <SpeedGauge value={angularMagnitude} maxValue={3.14} />
        </div>
      </div>
    </div>
  );
}

/**
 * VelocityBar Component
 * Displays a single velocity component with a bar visualization
 */
interface VelocityBarProps {
  label: string;
  value: number;
  unit: string;
  color: 'blue' | 'purple';
}

function VelocityBar({ label, value, unit, color }: VelocityBarProps) {
  const maxValue = unit === 'm/s' ? 2.0 : 3.14; // Max linear: 2 m/s, Max angular: π rad/s
  const percentage = Math.min(Math.abs(value) / maxValue, 1) * 100;
  const isNegative = value < 0;

  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground font-medium">{label}:</span>
        <span className="font-mono font-semibold">
          {value.toFixed(3)} {unit}
        </span>
      </div>
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        {isNegative ? (
          <div
            className={`${colorClasses[color]} h-full transition-all duration-200 ease-out ml-auto`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={Math.abs(value)}
            aria-valuemin={0}
            aria-valuemax={maxValue}
          />
        ) : (
          <div
            className={`${colorClasses[color]} h-full transition-all duration-200 ease-out`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={maxValue}
          />
        )}
      </div>
    </div>
  );
}

/**
 * SpeedGauge Component
 * Visual gauge for speed magnitude
 */
interface SpeedGaugeProps {
  value: number;
  maxValue: number;
}

function SpeedGauge({ value, maxValue }: SpeedGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  // Determine color based on speed
  let barColor = 'bg-green-500';
  if (percentage > 80) {
    barColor = 'bg-red-500';
  } else if (percentage > 60) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
      <div
        className={`${barColor} h-full transition-all duration-200 ease-out`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={maxValue}
      />
    </div>
  );
}
