export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          System health overview and real-time monitoring
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">System Status</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor overall system health and component status
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Real-time Data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            View live topic data and sensor information
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Control Panel</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Execute operations and manage parameters
          </p>
        </div>
      </div>
    </div>
  );
}
