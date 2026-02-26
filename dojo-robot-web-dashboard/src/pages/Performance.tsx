import {
  PerformanceMetrics,
  ResourceUsageChart,
  PerformanceAlerts,
} from '../components/performance';

export function Performance() {
  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-6 overflow-hidden">
      {/* Page Header */}
      <div className="flex-none">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor system performance metrics and alerts
        </p>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-8">
        {/* Alerts Section */}
        <section>
          <PerformanceAlerts refreshInterval={10000} />
        </section>

        {/* Metrics Overview */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Current Metrics</h2>
          <PerformanceMetrics refreshInterval={30000} />
        </section>

        {/* Historical Charts */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Historical Trends</h2>
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-3">CPU Usage</h3>
              <ResourceUsageChart metricType="cpu" height={300} />
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-3">Memory Usage</h3>
              <ResourceUsageChart metricType="memory" height={300} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="text-lg font-medium mb-3">TF Metrics</h3>
                <ResourceUsageChart metricType="tf" height={250} />
              </div>

              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="text-lg font-medium mb-3">Disk I/O</h3>
                <ResourceUsageChart metricType="disk" height={250} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
