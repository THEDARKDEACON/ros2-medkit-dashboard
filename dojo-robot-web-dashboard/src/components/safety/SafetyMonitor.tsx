import { Shield, AlertTriangle, Activity, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useSafetyStatus, useBehaviorTree, useSafetyEvents, useSafetyMetrics } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';
import { AnimatedStatus } from '@/components/common/AnimatedStatus';
import { EmergencyStopButton } from './EmergencyStopButton';
import { BehaviorTreeView } from './BehaviorTreeView';

/**
 * SafetyMonitor Component
 * 
 * Displays safety system monitoring including:
 * - Emergency stop status
 * - Collision detection status
 * - Safety zone violations
 * - Behavior tree state
 * - Active safety behaviors
 * - Safety event log
 * - Safety system health metrics
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.7, 18.8, 18.9
 */
interface SafetyMonitorProps {
  componentId: string;
  refreshInterval?: number;
}

export function SafetyMonitor({ componentId, refreshInterval = 1000 }: SafetyMonitorProps) {
  const { data: safetyStatus, isLoading: statusLoading, error: statusError } = useSafetyStatus(
    componentId,
    { refetchInterval: refreshInterval }
  );
  
  const { data: behaviorTree, isLoading: treeLoading, error: treeError } = useBehaviorTree(
    componentId,
    { refetchInterval: refreshInterval }
  );

  const { data: safetyEvents, isLoading: eventsLoading } = useSafetyEvents(
    componentId,
    { refetchInterval: refreshInterval * 2, limit: 20 }
  );

  const { data: safetyMetrics, isLoading: metricsLoading } = useSafetyMetrics(
    componentId,
    { refetchInterval: refreshInterval * 5 }
  );

  if (statusLoading || treeLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading safety system data..." />
      </div>
    );
  }

  if (statusError || treeError) {
    return (
      <div className="p-6">
        <AnimatedStatus status="error" message="Failed to load safety system data" />
      </div>
    );
  }

  if (!safetyStatus) {
    return null;
  }

  // System health configuration
  const healthConfig = {
    healthy: {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Healthy',
      description: 'All safety systems operational',
      icon: CheckCircle,
    },
    degraded: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      label: 'Degraded',
      description: 'Some safety systems experiencing issues',
      icon: AlertTriangle,
    },
    critical: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Critical',
      description: 'Critical safety system failure',
      icon: AlertCircle,
    },
  };

  const currentHealth = healthConfig[safetyStatus.systemHealth] || healthConfig.healthy;
  const HealthIcon = currentHealth.icon;

  return (
    <div className="space-y-6">
      {/* Safety System Status Header */}
      <div
        className={`rounded-lg border-2 ${currentHealth.borderColor} ${currentHealth.bgColor} p-6 transition-all duration-300`}
        role="status"
        aria-label={`Safety system health: ${currentHealth.label}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Shield
                className={`h-10 w-10 ${currentHealth.color}`}
                aria-hidden="true"
              />
              {safetyStatus.systemHealth === 'critical' && (
                <div className="absolute inset-0 h-10 w-10 animate-ping opacity-20">
                  <Shield className={currentHealth.color} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${currentHealth.color}`}>
                {currentHealth.label}
              </h2>
              <p className="text-muted-foreground mt-1">
                {currentHealth.description}
              </p>
            </div>
          </div>
          
          {/* Emergency Stop Button */}
          <EmergencyStopButton
            componentId={componentId}
            isActive={safetyStatus.emergencyStopActive}
          />
        </div>
      </div>

      {/* Safety Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Emergency Stop Status */}
        <SafetyStatusCard
          label="Emergency Stop"
          active={safetyStatus.emergencyStopActive}
          severity={safetyStatus.emergencyStopActive ? 'error' : 'success'}
          icon={AlertCircle}
        />

        {/* Collision Detection */}
        <SafetyStatusCard
          label="Collision Detected"
          active={safetyStatus.collisionDetected}
          severity={safetyStatus.collisionDetected ? 'error' : 'success'}
          icon={AlertTriangle}
        />

        {/* Safety Zone Violation */}
        <SafetyStatusCard
          label="Zone Violation"
          active={safetyStatus.safetyZoneViolation}
          severity={safetyStatus.safetyZoneViolation ? 'warning' : 'success'}
          icon={AlertCircle}
        />
      </div>

      {/* Proximity Warnings */}
      {safetyStatus.proximityWarnings && safetyStatus.proximityWarnings.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
            Proximity Warnings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {safetyStatus.proximityWarnings.map((warning, index) => (
              <ProximityWarningCard key={index} warning={warning} />
            ))}
          </div>
        </div>
      )}

      {/* Behavior Tree State */}
      {behaviorTree && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden="true" />
            Behavior Tree State
          </h3>
          <BehaviorTreeView behaviorTree={behaviorTree} />
        </div>
      )}

      {/* Active Safety Behaviors */}
      {behaviorTree && behaviorTree.activeBehaviors.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden="true" />
            Active Safety Behaviors
          </h3>
          <div className="space-y-2">
            {behaviorTree.activeBehaviors.map((behavior) => (
              <ActiveBehaviorCard key={behavior.id} behavior={behavior} />
            ))}
          </div>
        </div>
      )}

      {/* Safety Metrics */}
      {safetyMetrics && !metricsLoading && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" aria-hidden="true" />
            Safety System Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard label="Total Events" value={safetyMetrics.totalEvents.toString()} />
            <MetricCard label="Emergency Stops" value={safetyMetrics.emergencyStops.toString()} />
            <MetricCard label="Collisions" value={safetyMetrics.collisions.toString()} />
            <MetricCard label="Zone Violations" value={safetyMetrics.zoneViolations.toString()} />
            <MetricCard
              label="Avg Response Time"
              value={`${safetyMetrics.averageResponseTime.toFixed(0)}ms`}
            />
            <MetricCard
              label="System Uptime"
              value={formatUptime(safetyMetrics.systemUptime)}
            />
          </div>
        </div>
      )}

      {/* Safety Event Log */}
      {safetyEvents && !eventsLoading && safetyEvents.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" aria-hidden="true" />
            Safety Event Log
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {safetyEvents.map((event) => (
              <SafetyEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SafetyStatusCard Component
 * Displays a safety status indicator
 */
interface SafetyStatusCardProps {
  label: string;
  active: boolean;
  severity: 'success' | 'warning' | 'error';
  icon: React.ComponentType<{ className?: string }>;
}

function SafetyStatusCard({ label, active, severity, icon: Icon }: SafetyStatusCardProps) {
  const severityConfig = {
    success: {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Normal',
    },
    warning: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      label: 'Warning',
    },
    error: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Active',
    },
  };

  const config = severityConfig[severity];

  return (
    <div
      className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-4 transition-all duration-300`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`h-6 w-6 ${config.color}`} aria-hidden="true" />
        <span className="font-semibold">{label}</span>
      </div>
      <div className={`text-sm font-medium ${config.color}`}>
        {active ? config.label : 'Normal'}
      </div>
    </div>
  );
}

/**
 * ProximityWarningCard Component
 * Displays a proximity warning
 */
interface ProximityWarningCardProps {
  warning: {
    direction: string;
    distance: number;
    severity: 'low' | 'medium' | 'high';
  };
}

function ProximityWarningCard({ warning }: ProximityWarningCardProps) {
  const severityConfig = {
    low: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    medium: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
    },
    high: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    },
  };

  const config = severityConfig[warning.severity];

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-3`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium capitalize">{warning.direction}</span>
        <span className={`text-xs font-semibold ${config.color} uppercase`}>
          {warning.severity}
        </span>
      </div>
      <div className="text-lg font-bold">
        {warning.distance.toFixed(2)} m
      </div>
    </div>
  );
}

/**
 * ActiveBehaviorCard Component
 * Displays an active behavior
 */
interface ActiveBehaviorCardProps {
  behavior: {
    id: string;
    name: string;
    status: 'running' | 'success' | 'failure';
    startTime: string;
  };
}

function ActiveBehaviorCard({ behavior }: ActiveBehaviorCardProps) {
  const statusConfig = {
    running: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'Running',
    },
    success: {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Success',
    },
    failure: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Failure',
    },
  };

  const config = statusConfig[behavior.status];
  const duration = Date.now() - new Date(behavior.startTime).getTime();

  return (
    <div className={`rounded-lg border ${config.bgColor} p-3 flex items-center justify-between`}>
      <div className="flex-1">
        <div className="font-medium">{behavior.name}</div>
        <div className="text-xs text-muted-foreground mt-1">
          Running for {formatDuration(duration)}
        </div>
      </div>
      <div className={`text-sm font-semibold ${config.color}`}>
        {config.label}
      </div>
    </div>
  );
}

/**
 * MetricCard Component
 * Displays a single metric
 */
interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

/**
 * SafetyEventCard Component
 * Displays a safety event
 */
interface SafetyEventCardProps {
  event: {
    id: string;
    type: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  };
}

function SafetyEventCard({ event }: SafetyEventCardProps) {
  const severityConfig = {
    info: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      icon: AlertCircle,
    },
    warning: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      icon: AlertTriangle,
    },
    error: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      icon: AlertCircle,
    },
  };

  const config = severityConfig[event.severity];
  const Icon = config.icon;
  const timestamp = new Date(event.timestamp);

  return (
    <div className={`rounded-lg border ${config.bgColor} p-3 flex items-start gap-3`}>
      <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-medium text-sm">{event.message}</div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {timestamp.toLocaleTimeString()}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 capitalize">
          {event.type.replace(/_/g, ' ')}
        </div>
      </div>
    </div>
  );
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Format uptime in seconds to human-readable string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
