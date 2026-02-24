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
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

/**
 * Data point in the circular buffer
 */
interface DataPoint {
  timestamp: number;
  value: number;
  label: string;
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

interface TopicChartProps {
  /**
   * Topic data to visualize (must be numeric or contain numeric fields)
   */
  data: unknown;
  /**
   * Name of the topic being visualized
   */
  topicName: string;
  /**
   * Height of the chart in pixels
   */
  height?: number;
}

/**
 * Extract numeric values from topic data
 * Handles various data structures and returns an array of numeric values with labels
 */
function extractNumericValues(data: unknown): Array<{ label: string; value: number }> {
  const results: Array<{ label: string; value: number }> = [];

  if (data === null || data === undefined) {
    return results;
  }

  // Handle primitive numeric values
  if (typeof data === 'number' && !isNaN(data) && isFinite(data)) {
    results.push({ label: 'value', value: data });
    return results;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      if (typeof item === 'number' && !isNaN(item) && isFinite(item)) {
        results.push({ label: `[${index}]`, value: item });
      }
    });
    return results;
  }

  // Handle objects
  if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        results.push({ label: key, value });
      }
      // Recursively check nested objects (one level deep)
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (typeof nestedValue === 'number' && !isNaN(nestedValue) && isFinite(nestedValue)) {
            results.push({ label: `${key}.${nestedKey}`, value: nestedValue });
          }
        });
      }
    });
  }

  return results;
}

/**
 * TopicChart - Real-time chart visualization for numeric topic data
 * 
 * Features:
 * - Circular buffer maintaining 60-second history
 * - Automatic filtering of non-numeric data
 * - Zoom and pan controls via Brush component
 * - Multiple numeric fields displayed as separate lines
 * - Responsive design
 * - Time-based X-axis
 */
export function TopicChart({ data, topicName: _topicName, height = 400 }: TopicChartProps) {
  // Circular buffer for each numeric field
  const buffersRef = useRef<Map<string, CircularBuffer>>(new Map());
  const [chartData, setChartData] = useState<Array<Record<string, number | string>>>([]);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [numericFields, setNumericFields] = useState<string[]>([]);

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

  // Process incoming data and update buffers
  useEffect(() => {
    const numericValues = extractNumericValues(data);

    if (numericValues.length === 0) {
      return;
    }

    const timestamp = Date.now();
    const newFields = new Set<string>();

    // Update buffers for each numeric field
    numericValues.forEach(({ label, value }) => {
      newFields.add(label);
      
      if (!buffersRef.current.has(label)) {
        buffersRef.current.set(label, new CircularBuffer(60));
      }

      const buffer = buffersRef.current.get(label)!;
      buffer.push({
        timestamp,
        value,
        label,
      });
    });

    // Update the list of numeric fields
    setNumericFields(Array.from(newFields));

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

      buffersRef.current.forEach((buffer, label) => {
        const point = buffer.toArray().find((p) => p.timestamp === timestamp);
        if (point) {
          dataPoint[label] = point.value;
        }
      });

      return dataPoint;
    });

    setChartData(formattedData);
  }, [data]);

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

  // Check if data contains numeric values
  const hasNumericData = numericFields.length > 0;

  if (!hasNumericData) {
    return (
      <EmptyState
        title="No numeric data"
        description="This topic does not contain numeric data that can be visualized in a chart."
      />
    );
  }

  if (chartData.length === 0) {
    return (
      <EmptyState
        title="Waiting for data"
        description="Chart will display once numeric data is received."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing last 60 seconds ({chartData.length} data points)
        </div>
        <div className="flex items-center gap-2">
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
            {numericFields.map((field, index) => (
              <Line
                key={field}
                type="monotone"
                dataKey={field}
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

      {/* Field Legend */}
      <div className="text-xs text-muted-foreground">
        <div className="font-medium mb-2">Visualized fields:</div>
        <div className="flex flex-wrap gap-2">
          {numericFields.map((field, index) => (
            <div key={field} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: colors[index % colors.length] }}
                aria-hidden="true"
              />
              <span>{field}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
