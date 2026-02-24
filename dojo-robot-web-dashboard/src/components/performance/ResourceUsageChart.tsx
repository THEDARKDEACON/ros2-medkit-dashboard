import { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { ZoomIn, ZoomOut, Maximize2, Activity } from 'lucide-react';
import { usePerformanceMetrics } from '@/features/api/hooks';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';

/**
 * Data point in the circular buffer
 */
interface DataPoint {
  timestamp: number;
  value: number;
}

/**
 * Circular buffer for maintaining 60-second history
 */
class CircularBuffer {
  private buffer: DataPoint[] = [];
  private maxAge: number;

  constructor(maxAgeSeconds: number = 60) {
    this.maxAge = maxAgeSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Add a data point to the buffer
   */
  push(point: DataPoint): void {
    this.buffer.push(point);
    this.cleanup();
  }

  /**
   * Remove data points older than maxAge
   */
  private cleanup(): void {
    const now = Date.now();
    this.buffer = this.buffer.filter(
      (point) => now - point.timestamp <= this.maxAge
    );
  }

  /**
   * Get all data points in chronological order
   */
  toArray(): DataPoint[] {
    this.cleanup();
    return [...this.buffer];
  }

  /**
   * Clear all data points
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Get the number of data points
   */
  getSize(): number {
    this.cleanup();
    return this.buffer.length;
  }
}

/**
 * ResourceUsageChart Component
 * 
 * Visualizes performance metrics with time-series charts including:
 * - CPU usage trends
 * - Memory usage trends
 * - TF update rates and latency
 * - Disk I/O statistics
 * - Zoom and pan capabilities
 * 
 * Requirements: 19.6, 19.7, 19.10
 */
interface ResourceUsageChartProps {
  /**
   * Type of metric to visualize
   */
  metricType: 'cpu' | 'memory' | 'tf' | 'disk';
  /**
   * Height of the chart in pixels
   */
  height?: number;
  /**
   * Refresh interval in milliseconds
   */
  refreshInterval?: number;
}

export function ResourceUsageChart({
  metricType,
  height = 400,
  refreshInterval = 30000,
}: ResourceUsageChartProps) {
  const { data: metrics, isLoading, error } = usePerformanceMetrics({
    refetchInterval: refreshInterval,
  });

  // Circular buffers for each metric series
  const buffersRef = useRef<Map<string, CircularBuffer>>(new Map());
  const [chartData, setChartData] = useState<Array<Record<string, number | string>>>([]);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [seriesNames, setSeriesNames] = useState<string[]>([]);

  // Colors for different lines
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  // Process incoming metrics and update buffers
  useEffect(() => {
    if (!metrics) return;

    const timestamp = Date.now();
    const newSeries = new Set<string>();

    // Extract data based on metric type
    switch (metricType) {
      case 'cpu':
        metrics.cpuUsage.forEach((cpu) => {
          const seriesName = cpu.componentName;
          newSeries.add(seriesName);

          if (!buffersRef.current.has(seriesName)) {
            buffersRef.current.set(seriesName, new CircularBuffer(60));
          }

          buffersRef.current.get(seriesName)!.push({
            timestamp,
            value: cpu.usage,
          });
        });
        break;

      case 'memory':
        metrics.memoryUsage.forEach((memory) => {
          const seriesName = memory.componentName;
          newSeries.add(seriesName);

          if (!buffersRef.current.has(seriesName)) {
            buffersRef.current.set(seriesName, new CircularBuffer(60));
          }

          buffersRef.current.get(seriesName)!.push({
            timestamp,
            value: memory.usage,
          });
        });
        break;

      case 'tf':
        // TF update rate
        newSeries.add('Update Rate (Hz)');
        if (!buffersRef.current.has('Update Rate (Hz)')) {
          buffersRef.current.set('Update Rate (Hz)', new CircularBuffer(60));
        }
        buffersRef.current.get('Update Rate (Hz)')!.push({
          timestamp,
          value: metrics.tfMetrics.updateRate,
        });

        // TF latency
        newSeries.add('Latency (ms)');
        if (!buffersRef.current.has('Latency (ms)')) {
          buffersRef.current.set('Latency (ms)', new CircularBuffer(60));
        }
        buffersRef.current.get('Latency (ms)')!.push({
          timestamp,
          value: metrics.tfMetrics.latency,
        });
        break;

      case 'disk':
        // Read rate (convert to MB/s)
        newSeries.add('Read (MB/s)');
        if (!buffersRef.current.has('Read (MB/s)')) {
          buffersRef.current.set('Read (MB/s)', new CircularBuffer(60));
        }
        buffersRef.current.get('Read (MB/s)')!.push({
          timestamp,
          value: metrics.diskIO.readBytesPerSecond / (1024 * 1024),
        });

        // Write rate (convert to MB/s)
        newSeries.add('Write (MB/s)');
        if (!buffersRef.current.has('Write (MB/s)')) {
          buffersRef.current.set('Write (MB/s)', new CircularBuffer(60));
        }
        buffersRef.current.get('Write (MB/s)')!.push({
          timestamp,
          value: metrics.diskIO.writeBytesPerSecond / (1024 * 1024),
        });

        // Logging rate
        newSeries.add('Logging (MB/s)');
        if (!buffersRef.current.has('Logging (MB/s)')) {
          buffersRef.current.set('Logging (MB/s)', new CircularBuffer(60));
        }
        buffersRef.current.get('Logging (MB/s)')!.push({
          timestamp,
          value: metrics.diskIO.loggingRate,
        });
        break;
    }

    // Update the list of series
    setSeriesNames(Array.from(newSeries));

    // Convert buffers to chart data format
    const allTimestamps = new Set<number>();
    buffersRef.current.forEach((buffer) => {
      buffer.toArray().forEach((point) => allTimestamps.add(point.timestamp));
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    const formattedData = sortedTimestamps.map((timestamp) => {
      const dataPoint: Record<string, number | string> = {
        timestamp,
        time: new Date(timestamp).toLocaleTimeString(),
      };

      buffersRef.current.forEach((buffer, seriesName) => {
        const point = buffer.toArray().find((p) => p.timestamp === timestamp);
        if (point) {
          dataPoint[seriesName] = point.value;
        }
      });

      return dataPoint;
    });

    setChartData(formattedData);
  }, [metrics, metricType]);

  // Handle zoom reset
  const handleResetZoom = () => {
    setZoomDomain(null);
  };

  // Handle zoom in
  const handleZoomIn = () => {
    if (chartData.length === 0) return;

    const currentDomain = zoomDomain || [0, chartData.length - 1];
    const center = (currentDomain[0] + currentDomain[1]) / 2;
    const range = currentDomain[1] - currentDomain[0];
    const newRange = Math.max(range * 0.7, 5); // Zoom in by 30%, minimum 5 points

    setZoomDomain([
      Math.max(0, Math.floor(center - newRange / 2)),
      Math.min(chartData.length - 1, Math.ceil(center + newRange / 2)),
    ]);
  };

  // Handle zoom out
  const handleZoomOut = () => {
    if (chartData.length === 0) return;

    const currentDomain = zoomDomain || [0, chartData.length - 1];
    const center = (currentDomain[0] + currentDomain[1]) / 2;
    const range = currentDomain[1] - currentDomain[0];
    const newRange = Math.min(range * 1.3, chartData.length); // Zoom out by 30%

    const newStart = Math.max(0, Math.floor(center - newRange / 2));
    const newEnd = Math.min(chartData.length - 1, Math.ceil(center + newRange / 2));

    if (newStart === 0 && newEnd === chartData.length - 1) {
      setZoomDomain(null);
    } else {
      setZoomDomain([newStart, newEnd]);
    }
  };

  // Get chart title and Y-axis label based on metric type
  const getChartConfig = () => {
    switch (metricType) {
      case 'cpu':
        return {
          title: 'CPU Usage Over Time',
          yAxisLabel: 'Usage (%)',
        };
      case 'memory':
        return {
          title: 'Memory Usage Over Time',
          yAxisLabel: 'Usage (MB)',
        };
      case 'tf':
        return {
          title: 'Transform Tree (TF) Metrics',
          yAxisLabel: 'Value',
        };
      case 'disk':
        return {
          title: 'Disk I/O Statistics',
          yAxisLabel: 'Rate (MB/s)',
        };
    }
  };

  const chartConfig = getChartConfig();

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading performance data..." />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load data"
        description="Unable to fetch performance metrics. Please try again."
      />
    );
  }

  if (chartData.length === 0) {
    return (
      <EmptyState
        title="Waiting for data"
        description="Chart will display once performance data is received."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden="true" />
          {chartConfig.title}
        </h3>
        <div className="text-sm text-muted-foreground">
          Last 60 seconds ({chartData.length} data points)
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleZoomIn}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Zoom in"
          disabled={chartData.length < 5}
        >
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
          Zoom In
        </button>
        <button
          onClick={handleZoomOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Zoom out"
          disabled={!zoomDomain}
        >
          <ZoomOut className="h-4 w-4" aria-hidden="true" />
          Zoom Out
        </button>
        <button
          onClick={handleResetZoom}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Reset zoom"
          disabled={!zoomDomain}
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      {/* Chart */}
      <div className="border border-border rounded-lg bg-card p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="time"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={zoomDomain || undefined}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{
                value: chartConfig.yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            {seriesNames.map((seriesName, index) => (
              <Line
                key={seriesName}
                type="monotone"
                dataKey={seriesName}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ))}
            <Brush
              dataKey="time"
              height={30}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted))"
              startIndex={zoomDomain?.[0]}
              endIndex={zoomDomain?.[1]}
              onChange={(domain) => {
                if (domain.startIndex !== undefined && domain.endIndex !== undefined) {
                  setZoomDomain([domain.startIndex, domain.endIndex]);
                }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Series Legend */}
      {seriesNames.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-2">Visualized series:</div>
          <div className="flex flex-wrap gap-2">
            {seriesNames.map((seriesName, index) => (
              <div key={seriesName} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: colors[index % colors.length] }}
                  aria-hidden="true"
                />
                <span>{seriesName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
