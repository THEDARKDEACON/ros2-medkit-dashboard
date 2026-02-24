/**
 * FaultTimeline Component
 * Timeline visualization of fault events over time
 * Implements Requirement 7.10
 */

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Calendar, Clock } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import type { Fault } from '@/types/api';

/**
 * Time range options for filtering
 */
type TimeRange = '1h' | '24h' | '7d' | 'custom';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  hours: number;
}

const TIME_RANGES: TimeRangeOption[] = [
  { value: '1h', label: 'Last Hour', hours: 1 },
  { value: '24h', label: 'Last 24 Hours', hours: 24 },
  { value: '7d', label: 'Last 7 Days', hours: 168 },
];

/**
 * Severity colors matching FaultMonitor
 */
const SEVERITY_COLORS = {
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

interface FaultTimelineProps {
  /**
   * Array of faults to visualize
   */
  faults: Fault[];
  /**
   * Callback when a fault is selected
   */
  onFaultSelect?: (fault: Fault) => void;
  /**
   * Height of the chart in pixels
   */
  height?: number;
}

/**
 * Data point for timeline chart
 */
interface TimelineBucket {
  timestamp: number;
  label: string;
  error: number;
  warning: number;
  info: number;
  faults: Fault[];
}

/**
 * Group faults into time buckets based on time range
 */
function groupFaultsByTime(
  faults: Fault[],
  timeRange: TimeRange
): TimelineBucket[] {
  if (faults.length === 0) return [];

  const now = Date.now();
  const rangeMs = TIME_RANGES.find((r) => r.value === timeRange)?.hours || 1;
  const startTime = now - rangeMs * 60 * 60 * 1000;

  // Filter faults within time range
  const filteredFaults = faults.filter((fault) => {
    const faultTime = new Date(fault.timestamp).getTime();
    return faultTime >= startTime && faultTime <= now;
  });

  if (filteredFaults.length === 0) return [];

  // Determine bucket size based on time range
  let bucketSizeMs: number;
  let labelFormat: (date: Date) => string;

  if (rangeMs <= 1) {
    // 1 hour: 5-minute buckets
    bucketSizeMs = 5 * 60 * 1000;
    labelFormat = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (rangeMs <= 24) {
    // 24 hours: 1-hour buckets
    bucketSizeMs = 60 * 60 * 1000;
    labelFormat = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    // 7 days: 6-hour buckets
    bucketSizeMs = 6 * 60 * 60 * 1000;
    labelFormat = (date) =>
      date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit' });
  }

  // Create buckets
  const buckets = new Map<number, TimelineBucket>();
  const numBuckets = Math.ceil((now - startTime) / bucketSizeMs);

  // Initialize all buckets
  for (let i = 0; i < numBuckets; i++) {
    const bucketStart = startTime + i * bucketSizeMs;
    const bucketDate = new Date(bucketStart);
    buckets.set(bucketStart, {
      timestamp: bucketStart,
      label: labelFormat(bucketDate),
      error: 0,
      warning: 0,
      info: 0,
      faults: [],
    });
  }

  // Assign faults to buckets
  filteredFaults.forEach((fault) => {
    const faultTime = new Date(fault.timestamp).getTime();
    const bucketStart = Math.floor((faultTime - startTime) / bucketSizeMs) * bucketSizeMs + startTime;
    const bucket = buckets.get(bucketStart);

    if (bucket) {
      bucket[fault.severity]++;
      bucket.faults.push(fault);
    }
  });

  return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Custom tooltip for timeline chart
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: TimelineBucket;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const total = data.error + data.warning + data.info;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="font-medium text-sm mb-2">{data.label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            Errors
          </span>
          <span className="font-medium">{data.error}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            Warnings
          </span>
          <span className="font-medium">{data.warning}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            Info
          </span>
          <span className="font-medium">{data.info}</span>
        </div>
        <div className="pt-1 mt-1 border-t border-border">
          <div className="flex items-center justify-between gap-4 font-medium">
            <span>Total</span>
            <span>{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FaultTimeline - Timeline visualization of fault events
 * 
 * Features:
 * - Time range selection (1h, 24h, 7d)
 * - Stacked bar chart showing fault counts by severity
 * - Interactive tooltips with fault details
 * - Click on bars to view faults in that time bucket
 * - Responsive design
 */
export function FaultTimeline({
  faults,
  onFaultSelect,
  height = 300,
}: FaultTimelineProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Group faults by time buckets
  const timelineData = useMemo(() => {
    return groupFaultsByTime(faults, timeRange);
  }, [faults, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = faults.length;
    const errors = faults.filter((f) => f.severity === 'error').length;
    const warnings = faults.filter((f) => f.severity === 'warning').length;
    const info = faults.filter((f) => f.severity === 'info').length;
    return { total, errors, warnings, info };
  }, [faults]);

  // Handle bar click
  const handleBarClick = (data: TimelineBucket) => {
    if (data.faults.length > 0 && onFaultSelect) {
      // Select the most recent fault in the bucket
      const sortedFaults = [...data.faults].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      onFaultSelect(sortedFaults[0]);
    }
  };

  if (faults.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No fault history"
        description="Fault events will appear here as they occur"
      />
    );
  }

  if (timelineData.length === 0) {
    return (
      <div className="space-y-4">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Time Range</span>
          </div>
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  timeRange === range.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <EmptyState
          icon={Calendar}
          title="No faults in selected time range"
          description={`No fault events occurred in the ${TIME_RANGES.find((r) => r.value === timeRange)?.label.toLowerCase()}`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Range</span>
        </div>
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                timeRange === range.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              aria-pressed={timeRange === range.value}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Faults</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Errors</div>
          <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Warnings</div>
          <div className="text-2xl font-bold text-yellow-500">{stats.warnings}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Info</div>
          <div className="text-2xl font-bold text-blue-500">{stats.info}</div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="border border-border rounded-lg bg-card p-4">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={timelineData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{
                value: 'Fault Count',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />
            <Bar
              dataKey="error"
              stackId="faults"
              fill={SEVERITY_COLORS.error}
              name="Errors"
              cursor="pointer"
              onClick={(data) => handleBarClick(data as unknown as TimelineBucket)}
            >
              {timelineData.map((entry, index) => (
                <Cell
                  key={`cell-error-${index}`}
                  fill={SEVERITY_COLORS.error}
                  opacity={entry.error > 0 ? 1 : 0}
                />
              ))}
            </Bar>
            <Bar
              dataKey="warning"
              stackId="faults"
              fill={SEVERITY_COLORS.warning}
              name="Warnings"
              cursor="pointer"
              onClick={(data) => handleBarClick(data as unknown as TimelineBucket)}
            >
              {timelineData.map((entry, index) => (
                <Cell
                  key={`cell-warning-${index}`}
                  fill={SEVERITY_COLORS.warning}
                  opacity={entry.warning > 0 ? 1 : 0}
                />
              ))}
            </Bar>
            <Bar
              dataKey="info"
              stackId="faults"
              fill={SEVERITY_COLORS.info}
              name="Info"
              cursor="pointer"
              onClick={(data) => handleBarClick(data as unknown as TimelineBucket)}
            >
              {timelineData.map((entry, index) => (
                <Cell
                  key={`cell-info-${index}`}
                  fill={SEVERITY_COLORS.info}
                  opacity={entry.info > 0 ? 1 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        Click on a bar to view faults from that time period
      </div>
    </div>
  );
}
