import { SystemHealthOverview } from '@/components/dashboard/SystemHealthOverview';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';
import { QuickAccessCards } from '@/components/dashboard/QuickAccessCards';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          System health overview and real-time monitoring
        </p>
      </div>

      {/* System Health Overview */}
      <section>
        <SystemHealthOverview />
      </section>

      {/* Quick Access Cards */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <QuickAccessCards />
      </section>

      {/* Metrics Panel */}
      <section>
        <MetricsPanel />
      </section>
    </div>
  );
}
