import { Activity, AlertTriangle, CheckCircle, XCircle, Layers, Box, Radio } from 'lucide-react';
import { useSystemHealth } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';
import { AnimatedStatus } from '@/components/common/AnimatedStatus';

/**
 * SystemHealthOverview Component
 * 
 * Displays a high-level overview of system health including:
 * - Overall system status indicator (healthy, degraded, critical)
 * - Counts of active components, areas, and topics
 * - Fault counts by severity level
 * - Visual health indicators
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
export function SystemHealthOverview() {
  const { data, isLoading, error } = useSystemHealth();

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading system health..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <AnimatedStatus status="error" message="Failed to load system health data" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { systemStatus, totalAreas, totalComponents, activeComponents, totalTopics, faultCounts } = data;

  // System status configuration
  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Healthy',
      description: 'All systems operational',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      label: 'Degraded',
      description: 'Some issues detected',
    },
    critical: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Critical',
      description: 'Critical errors present',
    },
  };

  const currentStatus = statusConfig[systemStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <div
        className={`rounded-lg border-2 ${currentStatus.borderColor} ${currentStatus.bgColor} p-6 transition-all duration-300`}
        role="status"
        aria-label={`System status: ${currentStatus.label}`}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <StatusIcon
              className={`h-12 w-12 ${currentStatus.color}`}
              aria-hidden="true"
            />
            {systemStatus === 'healthy' && (
              <div className="absolute inset-0 h-12 w-12 animate-ping opacity-20">
                <StatusIcon className={currentStatus.color} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${currentStatus.color}`}>
              System Status: {currentStatus.label}
            </h2>
            <p className="text-muted-foreground mt-1">
              {currentStatus.description}
            </p>
          </div>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Areas Count */}
        <MetricCard
          icon={Layers}
          label="Areas"
          value={totalAreas}
          iconColor="text-blue-500"
          bgColor="bg-blue-500/10"
        />

        {/* Components Count */}
        <MetricCard
          icon={Box}
          label="Components"
          value={`${activeComponents} / ${totalComponents}`}
          subtitle={`${activeComponents} active`}
          iconColor="text-purple-500"
          bgColor="bg-purple-500/10"
        />

        {/* Topics Count */}
        <MetricCard
          icon={Radio}
          label="Topics"
          value={totalTopics}
          iconColor="text-cyan-500"
          bgColor="bg-cyan-500/10"
        />

        {/* System Activity */}
        <MetricCard
          icon={Activity}
          label="System Activity"
          value={activeComponents > 0 ? 'Active' : 'Idle'}
          subtitle={`${activeComponents} components running`}
          iconColor="text-green-500"
          bgColor="bg-green-500/10"
        />
      </div>

      {/* Fault Counts by Severity */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Fault Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Error Faults */}
          <FaultCountCard
            severity="error"
            count={faultCounts.error}
            label="Errors"
            color="text-red-500"
            bgColor="bg-red-500/10"
          />

          {/* Warning Faults */}
          <FaultCountCard
            severity="warning"
            count={faultCounts.warning}
            label="Warnings"
            color="text-yellow-500"
            bgColor="bg-yellow-500/10"
          />

          {/* Info Faults */}
          <FaultCountCard
            severity="info"
            count={faultCounts.info}
            label="Info"
            color="text-blue-500"
            bgColor="bg-blue-500/10"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * MetricCard Component
 * Displays a single metric with icon and value
 */
interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  iconColor: string;
  bgColor: string;
}

function MetricCard({ icon: Icon, label, value, subtitle, iconColor, bgColor }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className={`rounded-lg ${bgColor} p-2`}>
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1 truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * FaultCountCard Component
 * Displays fault count for a specific severity level
 */
interface FaultCountCardProps {
  severity: 'error' | 'warning' | 'info';
  count: number;
  label: string;
  color: string;
  bgColor: string;
}

function FaultCountCard({ severity, count, label, color, bgColor }: FaultCountCardProps) {
  const severityIcons = {
    error: XCircle,
    warning: AlertTriangle,
    info: AlertTriangle,
  };

  const Icon = severityIcons[severity];

  return (
    <div
      className={`rounded-lg border ${bgColor} p-4 transition-all`}
      role="status"
      aria-label={`${count} ${label.toLowerCase()}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 ${color} flex-shrink-0`} aria-hidden="true" />
        <div className="flex-1">
          <p className={`text-3xl font-bold ${color}`}>{count}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
}
