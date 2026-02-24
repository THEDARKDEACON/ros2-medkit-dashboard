import { Navigation, Target, Map, AlertCircle, TrendingUp } from 'lucide-react';
import { useNavigationStatus, useExplorationStats } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';
import { AnimatedStatus } from '@/components/common/AnimatedStatus';

/**
 * NavigationMonitor Component
 * 
 * Displays navigation and exploration monitoring including:
 * - Exploration status (exploring, planning, idle)
 * - Exploration statistics and progress
 * - Current goal and planned path information
 * - Frontier clusters visualization
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */
interface NavigationMonitorProps {
  componentId: string;
  refreshInterval?: number;
}

export function NavigationMonitor({ componentId, refreshInterval = 1000 }: NavigationMonitorProps) {
  const { data: navStatus, isLoading: navLoading, error: navError } = useNavigationStatus(
    componentId,
    { refetchInterval: refreshInterval }
  );
  
  const { data: explorationStats, isLoading: statsLoading, error: statsError } = useExplorationStats(
    componentId,
    { refetchInterval: refreshInterval * 2 }
  );

  if (navLoading || statsLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading navigation data..." />
      </div>
    );
  }

  if (navError || statsError) {
    return (
      <div className="p-6">
        <AnimatedStatus status="error" message="Failed to load navigation data" />
      </div>
    );
  }

  if (!navStatus) {
    return null;
  }

  // Status configuration
  const statusConfig = {
    exploring: {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      label: 'Exploring',
      description: 'Actively exploring environment',
    },
    planning: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      label: 'Planning',
      description: 'Computing navigation path',
    },
    idle: {
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/20',
      label: 'Idle',
      description: 'No active navigation',
    },
    error: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Error',
      description: 'Navigation error occurred',
    },
  };

  const currentStatus = statusConfig[navStatus.status] || statusConfig.idle;

  return (
    <div className="space-y-6">
      {/* Exploration Status Header */}
      <div
        className={`rounded-lg border-2 ${currentStatus.borderColor} ${currentStatus.bgColor} p-6 transition-all duration-300`}
        role="status"
        aria-label={`Navigation status: ${currentStatus.label}`}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Navigation
              className={`h-10 w-10 ${currentStatus.color}`}
              aria-hidden="true"
            />
            {navStatus.status === 'exploring' && (
              <div className="absolute inset-0 h-10 w-10 animate-ping opacity-20">
                <Navigation className={currentStatus.color} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${currentStatus.color}`}>
              {currentStatus.label}
            </h2>
            <p className="text-muted-foreground mt-1">
              {currentStatus.description}
            </p>
          </div>
        </div>
      </div>

      {/* Exploration Statistics */}
      {explorationStats && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" aria-hidden="true" />
            Exploration Progress
          </h3>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{explorationStats.explorationProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-500 ease-out"
                style={{ width: `${explorationStats.explorationProgress}%` }}
                role="progressbar"
                aria-valuenow={explorationStats.explorationProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Explored Area"
              value={`${explorationStats.exploredArea.toFixed(1)} m²`}
            />
            <StatCard
              label="Total Area"
              value={`${explorationStats.totalArea.toFixed(1)} m²`}
            />
            {explorationStats.estimatedTimeRemaining !== undefined && (
              <StatCard
                label="Est. Time Remaining"
                value={formatTime(explorationStats.estimatedTimeRemaining)}
              />
            )}
          </div>
        </div>
      )}

      {/* Current Goal and Path */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Goal */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden="true" />
            Current Goal
          </h3>
          {navStatus.currentGoal ? (
            <div className="space-y-2">
              <CoordinateDisplay label="X" value={navStatus.currentGoal.x} />
              <CoordinateDisplay label="Y" value={navStatus.currentGoal.y} />
              <CoordinateDisplay label="Theta" value={navStatus.currentGoal.theta} unit="rad" />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No active goal</p>
          )}
        </div>

        {/* Planned Path */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Map className="h-5 w-5" aria-hidden="true" />
            Planned Path
          </h3>
          {navStatus.plannedPath && navStatus.plannedPath.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Waypoints</span>
                <span className="font-semibold">{navStatus.plannedPath.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Path Length</span>
                <span className="font-semibold">
                  {calculatePathLength(navStatus.plannedPath).toFixed(2)} m
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No planned path</p>
          )}
        </div>
      </div>

      {/* Frontier Clusters */}
      {explorationStats?.frontierClusters && explorationStats.frontierClusters.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            Frontier Clusters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {explorationStats.frontierClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-lg border bg-muted/50 p-3 hover:bg-muted transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">Cluster {cluster.id}</span>
                  <span className="text-xs text-muted-foreground">{cluster.size} points</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">X:</span>
                    <span className="font-mono">{cluster.centroid.x.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Y:</span>
                    <span className="font-mono">{cluster.centroid.y.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * StatCard Component
 * Displays a single statistic
 */
interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

/**
 * CoordinateDisplay Component
 * Displays a coordinate value with label
 */
interface CoordinateDisplayProps {
  label: string;
  value: number;
  unit?: string;
}

function CoordinateDisplay({ label, value, unit = 'm' }: CoordinateDisplayProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="font-mono font-semibold">
        {value.toFixed(3)} {unit}
      </span>
    </div>
  );
}

/**
 * Calculate total path length from waypoints
 */
function calculatePathLength(path: Array<{ x: number; y: number }>): number {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Format time in seconds to human-readable string
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
