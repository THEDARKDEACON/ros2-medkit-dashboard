import { useState } from 'react';
import { AlertTriangle, AlertCircle, Settings, Download, X } from 'lucide-react';
import {
  usePerformanceAlerts,
  usePerformanceThresholds,
  useUpdatePerformanceThresholds,
  useExportPerformanceData,
} from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';
import { AnimatedStatus } from '@/components/common/AnimatedStatus';

/**
 * PerformanceAlerts Component
 * 
 * Displays performance alerts and provides:
 * - Configurable threshold alerts
 * - Alert notifications
 * - Export functionality for performance data
 * 
 * Requirements: 19.8, 19.9
 */
interface PerformanceAlertsProps {
  refreshInterval?: number;
}

export function PerformanceAlerts({ refreshInterval }: PerformanceAlertsProps) {
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data: alerts, isLoading: alertsLoading, error: alertsError } = usePerformanceAlerts({
    refetchInterval: refreshInterval || 10000,
  });

  const { data: thresholds, isLoading: thresholdsLoading } = usePerformanceThresholds();

  if (alertsLoading || thresholdsLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading performance alerts..." />
      </div>
    );
  }

  if (alertsError) {
    return (
      <div className="p-6">
        <AnimatedStatus status="error" message="Failed to load performance alerts" />
      </div>
    );
  }

  const activeAlerts = alerts || [];
  const warningAlerts = activeAlerts.filter((alert) => alert.severity === 'warning');
  const criticalAlerts = activeAlerts.filter((alert) => alert.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Alert Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Performance Alerts</h3>
          <div className="flex items-center gap-2">
            {criticalAlerts.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-medium">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {criticalAlerts.length} Critical
              </div>
            )}
            {warningAlerts.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {warningAlerts.length} Warning
              </div>
            )}
            {activeAlerts.length === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                All systems normal
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThresholdConfig(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Configure thresholds"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Configure Thresholds
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Export performance data"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export Data
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-green-500/10 p-3">
              <AlertCircle className="h-8 w-8 text-green-500" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">No Active Alerts</h4>
              <p className="text-sm text-muted-foreground">
                All performance metrics are within configured thresholds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Configuration Dialog */}
      {showThresholdConfig && thresholds && (
        <ThresholdConfigDialog
          thresholds={thresholds}
          onClose={() => setShowThresholdConfig(false)}
        />
      )}

      {/* Export Data Dialog */}
      {showExportDialog && (
        <ExportDataDialog onClose={() => setShowExportDialog(false)} />
      )}
    </div>
  );
}

/**
 * AlertCard Component
 * Displays a single performance alert
 */
interface AlertCardProps {
  alert: {
    id: string;
    type: 'cpu' | 'memory' | 'network' | 'latency' | 'disk';
    severity: 'warning' | 'critical';
    message: string;
    threshold: number;
    currentValue: number;
    componentId?: string;
    timestamp: string;
  };
}

function AlertCard({ alert }: AlertCardProps) {
  const severityConfig = {
    warning: {
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      icon: AlertTriangle,
    },
    critical: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      icon: AlertCircle,
    },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;
  const timestamp = new Date(alert.timestamp);

  return (
    <div
      className={`rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-4 transition-all duration-300`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 ${config.color} flex-shrink-0 mt-0.5`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="font-semibold mb-1">{alert.message}</div>
              <div className="text-sm text-muted-foreground">
                {alert.componentId && <span className="mr-2">Component: {alert.componentId}</span>}
                <span className="capitalize">{alert.type} Alert</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {timestamp.toLocaleTimeString()}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Current: </span>
              <span className={`font-semibold ${config.color}`}>
                {formatValue(alert.currentValue, alert.type)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Threshold: </span>
              <span className="font-semibold">
                {formatValue(alert.threshold, alert.type)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ThresholdConfigDialog Component
 * Dialog for configuring alert thresholds
 */
interface ThresholdConfigDialogProps {
  thresholds: {
    cpuWarning: number;
    cpuCritical: number;
    memoryWarning: number;
    memoryCritical: number;
    latencyWarning: number;
    latencyCritical: number;
    diskIOWarning: number;
    diskIOCritical: number;
  };
  onClose: () => void;
}

function ThresholdConfigDialog({ thresholds, onClose }: ThresholdConfigDialogProps) {
  const [formData, setFormData] = useState(thresholds);
  const updateThresholds = useUpdatePerformanceThresholds();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateThresholds.mutateAsync(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update thresholds:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Configure Alert Thresholds</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* CPU Thresholds */}
          <div className="space-y-3">
            <h4 className="font-semibold">CPU Usage (%)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Warning Threshold
                </label>
                <input
                  type="number"
                  value={formData.cpuWarning}
                  onChange={(e) =>
                    setFormData({ ...formData, cpuWarning: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Critical Threshold
                </label>
                <input
                  type="number"
                  value={formData.cpuCritical}
                  onChange={(e) =>
                    setFormData({ ...formData, cpuCritical: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Memory Thresholds */}
          <div className="space-y-3">
            <h4 className="font-semibold">Memory Usage (MB)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Warning Threshold
                </label>
                <input
                  type="number"
                  value={formData.memoryWarning}
                  onChange={(e) =>
                    setFormData({ ...formData, memoryWarning: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Critical Threshold
                </label>
                <input
                  type="number"
                  value={formData.memoryCritical}
                  onChange={(e) =>
                    setFormData({ ...formData, memoryCritical: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Latency Thresholds */}
          <div className="space-y-3">
            <h4 className="font-semibold">Processing Latency (ms)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Warning Threshold
                </label>
                <input
                  type="number"
                  value={formData.latencyWarning}
                  onChange={(e) =>
                    setFormData({ ...formData, latencyWarning: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Critical Threshold
                </label>
                <input
                  type="number"
                  value={formData.latencyCritical}
                  onChange={(e) =>
                    setFormData({ ...formData, latencyCritical: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Disk I/O Thresholds */}
          <div className="space-y-3">
            <h4 className="font-semibold">Disk I/O (MB/s)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Warning Threshold
                </label>
                <input
                  type="number"
                  value={formData.diskIOWarning}
                  onChange={(e) =>
                    setFormData({ ...formData, diskIOWarning: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Critical Threshold
                </label>
                <input
                  type="number"
                  value={formData.diskIOCritical}
                  onChange={(e) =>
                    setFormData({ ...formData, diskIOCritical: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateThresholds.isPending}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {updateThresholds.isPending ? 'Saving...' : 'Save Thresholds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * ExportDataDialog Component
 * Dialog for exporting performance data
 */
interface ExportDataDialogProps {
  onClose: () => void;
}

function ExportDataDialog({ onClose }: ExportDataDialogProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const exportData = useExportPerformanceData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await exportData.mutateAsync({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  // Set default time range (last 24 hours)
  const setDefaultTimeRange = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    setEndTime(end.toISOString().slice(0, 16));
    setStartTime(start.toISOString().slice(0, 16));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full m-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Export Performance Data</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            />
          </div>

          <button
            type="button"
            onClick={setDefaultTimeRange}
            className="text-sm text-primary hover:underline"
          >
            Set to last 24 hours
          </button>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={exportData.isPending}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {exportData.isPending ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Format value based on metric type
 */
function formatValue(value: number, type: string): string {
  switch (type) {
    case 'cpu':
      return `${value.toFixed(1)}%`;
    case 'memory':
      return `${value.toFixed(0)} MB`;
    case 'latency':
      return `${value.toFixed(1)} ms`;
    case 'disk':
      return `${value.toFixed(2)} MB/s`;
    default:
      return value.toFixed(2);
  }
}
