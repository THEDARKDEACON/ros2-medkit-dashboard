import { Cpu, MemoryStick, Network, Clock, HardDrive, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { usePerformanceMetrics } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';
import { AnimatedStatus } from '@/components/common/AnimatedStatus';

/**
 * PerformanceMetrics Component
 * 
 * Displays comprehensive performance metrics including:
 * - CPU usage per component with trends
 * - Memory usage per component with trends
 * - Network bandwidth usage
 * - Message publication rates
 * - Node processing latency
 * - TF update rates and latency
 * - Disk I/O statistics
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */
interface PerformanceMetricsProps {
  refreshInterval?: number;
}

export function PerformanceMetrics({ refreshInterval = 30000 }: PerformanceMetricsProps) {
  const { data: metrics, isLoading, error } = usePerformanceMetrics({
    refetchInterval: refreshInterval,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading performance metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <AnimatedStatus status="error" message="Failed to load performance metrics" />
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* CPU Usage Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-500" aria-hidden="true" />
          CPU Usage by Component
        </h3>
        {metrics.cpuUsage.length > 0 ? (
          <div className="space-y-3">
            {metrics.cpuUsage.map((cpu) => (
              <CpuUsageBar
                key={cpu.componentId}
                componentName={cpu.componentName}
                usage={cpu.usage}
                trend={cpu.trend}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No CPU usage data available</p>
        )}
      </div>

      {/* Memory Usage Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MemoryStick className="h-5 w-5 text-purple-500" aria-hidden="true" />
          Memory Usage by Component
        </h3>
        {metrics.memoryUsage.length > 0 ? (
          <div className="space-y-3">
            {metrics.memoryUsage.map((memory) => (
              <MemoryUsageBar
                key={memory.componentId}
                componentName={memory.componentName}
                usage={memory.usage}
                trend={memory.trend}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No memory usage data available</p>
        )}
      </div>

      {/* Network Bandwidth Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Network className="h-5 w-5 text-green-500" aria-hidden="true" />
          Network Bandwidth Usage
        </h3>
        {metrics.networkBandwidth.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.networkBandwidth.map((network) => (
              <NetworkBandwidthCard
                key={network.topicName}
                topicName={network.topicName}
                bytesPerSecond={network.bytesPerSecond}
                messagesPerSecond={network.messagesPerSecond}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No network bandwidth data available</p>
        )}
      </div>

      {/* Message Rates Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" aria-hidden="true" />
          Message Publication Rates
        </h3>
        {metrics.messageRates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.messageRates.map((rate) => (
              <MessageRateCard
                key={rate.topicName}
                topicName={rate.topicName}
                publishRate={rate.publishRate}
                subscribeRate={rate.subscribeRate}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No message rate data available</p>
        )}
      </div>

      {/* Node Processing Latency Section */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-500" aria-hidden="true" />
          Node Processing Latency
        </h3>
        {metrics.latency.length > 0 ? (
          <div className="space-y-3">
            {metrics.latency.map((latency) => (
              <LatencyCard
                key={latency.nodeId}
                nodeName={latency.nodeName}
                processingLatency={latency.processingLatency}
                callbackExecutionTime={latency.callbackExecutionTime}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No latency data available</p>
        )}
      </div>

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TF Metrics */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-500" aria-hidden="true" />
            Transform Tree (TF) Metrics
          </h3>
          <div className="space-y-3">
            <MetricRow label="Update Rate" value={`${metrics.tfMetrics.updateRate.toFixed(1)} Hz`} />
            <MetricRow label="Latency" value={`${metrics.tfMetrics.latency.toFixed(1)} ms`} />
            <MetricRow label="Transform Count" value={metrics.tfMetrics.transformCount.toString()} />
          </div>
        </div>

        {/* Disk I/O Metrics */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-red-500" aria-hidden="true" />
            Disk I/O Statistics
          </h3>
          <div className="space-y-3">
            <MetricRow
              label="Read Rate"
              value={formatBytes(metrics.diskIO.readBytesPerSecond) + '/s'}
            />
            <MetricRow
              label="Write Rate"
              value={formatBytes(metrics.diskIO.writeBytesPerSecond) + '/s'}
            />
            <MetricRow
              label="Logging Rate"
              value={`${metrics.diskIO.loggingRate.toFixed(2)} MB/s`}
            />
          </div>
        </div>
      </div>

      {/* Last Update Timestamp */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(metrics.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

/**
 * CpuUsageBar Component
 * Displays CPU usage with a progress bar and trend indicator
 */
interface CpuUsageBarProps {
  componentName: string;
  usage: number;
  trend: 'up' | 'down' | 'stable';
}

function CpuUsageBar({ componentName, usage, trend }: CpuUsageBarProps) {
  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };

  const trendColors = {
    up: 'text-red-500',
    down: 'text-green-500',
    stable: 'text-gray-500',
  };

  const TrendIcon = trendIcons[trend];
  const usageColor = usage > 80 ? 'bg-red-500' : usage > 60 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{componentName}</span>
        <div className="flex items-center gap-2">
          <TrendIcon className={`h-4 w-4 ${trendColors[trend]}`} aria-hidden="true" />
          <span className="text-sm font-semibold">{usage.toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${usageColor} transition-all duration-300`}
          style={{ width: `${Math.min(usage, 100)}%` }}
          role="progressbar"
          aria-valuenow={usage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`CPU usage: ${usage.toFixed(1)}%`}
        />
      </div>
    </div>
  );
}

/**
 * MemoryUsageBar Component
 * Displays memory usage with a progress bar and trend indicator
 */
interface MemoryUsageBarProps {
  componentName: string;
  usage: number;
  trend: 'up' | 'down' | 'stable';
}

function MemoryUsageBar({ componentName, usage, trend }: MemoryUsageBarProps) {
  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };

  const trendColors = {
    up: 'text-red-500',
    down: 'text-green-500',
    stable: 'text-gray-500',
  };

  const TrendIcon = trendIcons[trend];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{componentName}</span>
        <div className="flex items-center gap-2">
          <TrendIcon className={`h-4 w-4 ${trendColors[trend]}`} aria-hidden="true" />
          <span className="text-sm font-semibold">{formatBytes(usage * 1024 * 1024)}</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-300"
          style={{ width: `${Math.min((usage / 2048) * 100, 100)}%` }}
          role="progressbar"
          aria-valuenow={usage}
          aria-valuemin={0}
          aria-valuemax={2048}
          aria-label={`Memory usage: ${formatBytes(usage * 1024 * 1024)}`}
        />
      </div>
    </div>
  );
}

/**
 * NetworkBandwidthCard Component
 * Displays network bandwidth for a topic
 */
interface NetworkBandwidthCardProps {
  topicName: string;
  bytesPerSecond: number;
  messagesPerSecond: number;
}

function NetworkBandwidthCard({
  topicName,
  bytesPerSecond,
  messagesPerSecond,
}: NetworkBandwidthCardProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-sm font-medium mb-3 truncate" title={topicName}>
        {topicName}
      </p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Bandwidth</span>
          <span className="text-sm font-semibold">{formatBytes(bytesPerSecond)}/s</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Messages</span>
          <span className="text-sm font-semibold">{messagesPerSecond.toFixed(1)}/s</span>
        </div>
      </div>
    </div>
  );
}

/**
 * MessageRateCard Component
 * Displays message publication and subscription rates
 */
interface MessageRateCardProps {
  topicName: string;
  publishRate: number;
  subscribeRate: number;
}

function MessageRateCard({ topicName, publishRate, subscribeRate }: MessageRateCardProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-sm font-medium mb-3 truncate" title={topicName}>
        {topicName}
      </p>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Publish Rate</span>
          <span className="text-sm font-semibold">{publishRate.toFixed(1)} Hz</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Subscribe Rate</span>
          <span className="text-sm font-semibold">{subscribeRate.toFixed(1)} Hz</span>
        </div>
      </div>
    </div>
  );
}

/**
 * LatencyCard Component
 * Displays node processing latency and callback execution time
 */
interface LatencyCardProps {
  nodeName: string;
  processingLatency: number;
  callbackExecutionTime: number;
}

function LatencyCard({ nodeName, processingLatency, callbackExecutionTime }: LatencyCardProps) {
  const latencyColor =
    processingLatency > 100 ? 'text-red-500' : processingLatency > 50 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="rounded-lg bg-muted/50 p-4 flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium mb-2">{nodeName}</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Processing: {processingLatency.toFixed(1)}ms</span>
          <span>Callback: {callbackExecutionTime.toFixed(1)}ms</span>
        </div>
      </div>
      <div className={`text-lg font-bold ${latencyColor}`}>
        {processingLatency.toFixed(0)}ms
      </div>
    </div>
  );
}

/**
 * MetricRow Component
 * Displays a single metric row
 */
interface MetricRowProps {
  label: string;
  value: string;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
