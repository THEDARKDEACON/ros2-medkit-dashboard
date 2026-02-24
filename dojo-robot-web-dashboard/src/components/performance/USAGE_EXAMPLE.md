# Performance Components Usage Examples

This document provides usage examples for the performance monitoring components.

## PerformanceMetrics

Displays comprehensive performance metrics including CPU, memory, network, latency, and disk I/O.

```tsx
import { PerformanceMetrics } from '@/components/performance';

function PerformancePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">System Performance</h1>
      <PerformanceMetrics refreshInterval={30000} />
    </div>
  );
}
```

### Props

- `refreshInterval` (optional): Refresh interval in milliseconds (default: 30000)

## ResourceUsageChart

Visualizes performance metrics with time-series charts including zoom and pan capabilities.

```tsx
import { ResourceUsageChart } from '@/components/performance';

function PerformanceChartsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Performance Charts</h1>
      
      {/* CPU Usage Chart */}
      <ResourceUsageChart
        metricType="cpu"
        height={400}
        refreshInterval={30000}
      />
      
      {/* Memory Usage Chart */}
      <ResourceUsageChart
        metricType="memory"
        height={400}
        refreshInterval={30000}
      />
      
      {/* TF Metrics Chart */}
      <ResourceUsageChart
        metricType="tf"
        height={400}
        refreshInterval={30000}
      />
      
      {/* Disk I/O Chart */}
      <ResourceUsageChart
        metricType="disk"
        height={400}
        refreshInterval={30000}
      />
    </div>
  );
}
```

### Props

- `metricType` (required): Type of metric to visualize ('cpu' | 'memory' | 'tf' | 'disk')
- `height` (optional): Height of the chart in pixels (default: 400)
- `refreshInterval` (optional): Refresh interval in milliseconds (default: 30000)

## PerformanceAlerts

Displays performance alerts with configurable thresholds and export functionality.

```tsx
import { PerformanceAlerts } from '@/components/performance';

function AlertsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Performance Alerts</h1>
      <PerformanceAlerts refreshInterval={10000} />
    </div>
  );
}
```

### Props

- `refreshInterval` (optional): Refresh interval in milliseconds (default: 10000)

### Features

- **Alert Display**: Shows active performance alerts with severity indicators
- **Threshold Configuration**: Configure warning and critical thresholds for CPU, memory, latency, and disk I/O
- **Data Export**: Export performance data for offline analysis with custom time ranges

## Complete Dashboard Example

Combining all performance components in a comprehensive dashboard:

```tsx
import {
  PerformanceMetrics,
  ResourceUsageChart,
  PerformanceAlerts,
} from '@/components/performance';

function PerformanceDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Performance Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor system performance metrics and alerts
        </p>
      </div>

      {/* Alerts Section */}
      <section>
        <PerformanceAlerts refreshInterval={10000} />
      </section>

      {/* Metrics Overview */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Current Metrics</h2>
        <PerformanceMetrics refreshInterval={30000} />
      </section>

      {/* Historical Charts */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Historical Trends</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">CPU Usage</h3>
            <ResourceUsageChart metricType="cpu" height={300} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Memory Usage</h3>
            <ResourceUsageChart metricType="memory" height={300} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">TF Metrics</h3>
              <ResourceUsageChart metricType="tf" height={250} />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Disk I/O</h3>
              <ResourceUsageChart metricType="disk" height={250} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PerformanceDashboard;
```

## API Hooks

The performance components use the following API hooks from `@/features/api/hooks`:

### usePerformanceMetrics

Fetches comprehensive performance metrics.

```tsx
import { usePerformanceMetrics } from '@/features/api/hooks';

const { data: metrics, isLoading, error } = usePerformanceMetrics({
  refetchInterval: 30000,
  enabled: true,
});
```

### usePerformanceAlerts

Fetches active performance alerts.

```tsx
import { usePerformanceAlerts } from '@/features/api/hooks';

const { data: alerts, isLoading, error } = usePerformanceAlerts({
  refetchInterval: 10000,
  enabled: true,
});
```

### usePerformanceThresholds

Fetches configured alert thresholds.

```tsx
import { usePerformanceThresholds } from '@/features/api/hooks';

const { data: thresholds, isLoading, error } = usePerformanceThresholds({
  enabled: true,
});
```

### useUpdatePerformanceThresholds

Updates alert thresholds.

```tsx
import { useUpdatePerformanceThresholds } from '@/features/api/hooks';

const updateThresholds = useUpdatePerformanceThresholds();

await updateThresholds.mutateAsync({
  cpuWarning: 75,
  cpuCritical: 95,
  memoryWarning: 1024,
  memoryCritical: 2048,
});
```

### useExportPerformanceData

Exports performance data for offline analysis.

```tsx
import { useExportPerformanceData } from '@/features/api/hooks';

const exportData = useExportPerformanceData();

await exportData.mutateAsync({
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-01-02T00:00:00Z',
});
```

## Styling

All components use Tailwind CSS and shadcn/ui design tokens for consistent styling:

- Dark mode support via CSS variables
- Responsive design with mobile-first approach
- Accessible color contrast ratios
- Smooth transitions and animations

## Accessibility

The components follow accessibility best practices:

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- Color-blind friendly color schemes
