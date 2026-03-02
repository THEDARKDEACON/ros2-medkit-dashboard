import { Navigation, Eye, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSystemHealth } from '@/features/api/hooks';
import { useRosbridgeTopic } from '@/hooks/useRosbridgeTopic';
import { useRosbridgeStore } from '@/features/stores/rosbridgeStore';

/** nav_msgs/Odometry simplified shape */
interface OdometryMsg {
  twist: {
    twist: {
      linear: { x: number; y: number; z: number };
    };
  };
}

/** sensor_msgs/LaserScan simplified shape */
interface LaserScanMsg {
  ranges: number[];
  angle_min: number;
  angle_max: number;
}

/**
 * QuickAccessCards Component
 *
 * Provides quick-access cards linking to major subsystems:
 * - Navigation — live velocity from /odom
 * - Perception — live scan stats from /scan
 * - Safety — fault counts from REST API
 *
 * Requirements: 8.9
 */
export function QuickAccessCards() {
  const { data, isLoading } = useSystemHealth();
  const rosbridgeStatus = useRosbridgeStore((s) => s.status);
  const isRosbridgeConnected = rosbridgeStatus === 'connected';

  // Subscribe to /odom for navigation velocity
  const odom = useRosbridgeTopic<OdometryMsg>('/odom', {
    type: 'nav_msgs/msg/Odometry',
    throttleRate: 1000,
    enabled: isRosbridgeConnected,
  });

  // Subscribe to /scan for perception stats
  const scan = useRosbridgeTopic<LaserScanMsg>('/scan', {
    type: 'sensor_msgs/msg/LaserScan',
    throttleRate: 2000,
    enabled: isRosbridgeConnected,
  });

  // Navigation metrics from live /odom
  const linearSpeed = odom.data?.twist?.twist?.linear
    ? Math.sqrt(
      odom.data.twist.twist.linear.x ** 2 +
      odom.data.twist.twist.linear.y ** 2
    )
    : null;

  const navigationMetrics = {
    status: (odom.data ? 'active' : 'healthy') as 'active' | 'healthy',
    speed: linearSpeed !== null ? `${linearSpeed.toFixed(2)} m/s` : '—',
    odomMsgs: odom.messageCount,
  };

  // Perception metrics from live /scan
  const validRanges = scan.data?.ranges?.filter(r => isFinite(r) && r > 0) ?? [];
  const minRange = validRanges.length > 0 ? Math.min(...validRanges) : null;

  const perceptionMetrics = {
    status: (scan.data ? 'active' : 'healthy') as 'active' | 'healthy',
    scanPoints: scan.data?.ranges?.length ?? 0,
    minRange: minRange !== null ? `${minRange.toFixed(2)} m` : '—',
  };

  const safetyMetrics = {
    status: data?.faultCounts.error ? ('critical' as const) :
      data?.faultCounts.warning ? ('warning' as const) :
        ('healthy' as const),
    activeFaults: (data?.faultCounts.error || 0) + (data?.faultCounts.warning || 0),
    lastCheck: 'Just now',
  };

  const cards = [
    {
      id: 'navigation',
      title: 'Navigation',
      description: 'Path planning and autonomous navigation',
      icon: Navigation,
      link: '/visualizations',
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      hoverBorderColor: 'hover:border-blue-500/50',
      metrics: [
        { label: 'Speed', value: navigationMetrics.speed },
        { label: 'Odom Messages', value: navigationMetrics.odomMsgs },
      ],
      status: navigationMetrics.status,
    },
    {
      id: 'perception',
      title: 'Perception',
      description: 'LiDAR scanning and obstacle detection',
      icon: Eye,
      link: '/visualizations',
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      hoverBorderColor: 'hover:border-purple-500/50',
      metrics: [
        { label: 'Scan Points', value: perceptionMetrics.scanPoints },
        { label: 'Min Range', value: perceptionMetrics.minRange },
      ],
      status: perceptionMetrics.status,
    },
    {
      id: 'safety',
      title: 'Safety',
      description: 'Fault monitoring and system diagnostics',
      icon: Shield,
      link: '/faults',
      iconColor: safetyMetrics.status === 'critical' ? 'text-red-500' :
        safetyMetrics.status === 'warning' ? 'text-yellow-500' :
          'text-green-500',
      bgColor: safetyMetrics.status === 'critical' ? 'bg-red-500/10' :
        safetyMetrics.status === 'warning' ? 'bg-yellow-500/10' :
          'bg-green-500/10',
      borderColor: safetyMetrics.status === 'critical' ? 'border-red-500/20' :
        safetyMetrics.status === 'warning' ? 'border-yellow-500/20' :
          'border-green-500/20',
      hoverBorderColor: safetyMetrics.status === 'critical' ? 'hover:border-red-500/50' :
        safetyMetrics.status === 'warning' ? 'hover:border-yellow-500/50' :
          'hover:border-green-500/50',
      metrics: [
        { label: 'Active Faults', value: safetyMetrics.activeFaults },
        { label: 'Last Check', value: safetyMetrics.lastCheck },
      ],
      status: safetyMetrics.status,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <QuickAccessCard
          key={card.id}
          {...card}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

/**
 * QuickAccessCard Component
 * Individual card for a subsystem with metrics and navigation
 */
interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  hoverBorderColor: string;
  metrics: Array<{ label: string; value: string | number }>;
  status: 'active' | 'healthy' | 'warning' | 'critical';
  isLoading?: boolean;
}

function QuickAccessCard({
  title,
  description,
  icon: Icon,
  link,
  iconColor,
  bgColor,
  borderColor,
  hoverBorderColor,
  metrics,
  status,
  isLoading,
}: QuickAccessCardProps) {
  const statusIndicatorColor = {
    active: 'bg-green-500',
    healthy: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
  }[status];

  return (
    <Link
      to={link}
      className={`group relative rounded-lg border-2 ${borderColor} ${hoverBorderColor} ${bgColor} p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      aria-label={`Navigate to ${title} subsystem`}
    >
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div
          className={`h-3 w-3 rounded-full ${statusIndicatorColor} animate-pulse`}
          role="status"
          aria-label={`${title} status: ${status}`}
        />
      </div>

      {/* Icon and Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`rounded-lg ${bgColor} p-3 ring-1 ring-black/5`}>
          <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3 mb-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <span className="text-sm font-semibold">
              {isLoading ? '...' : metric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Navigation Arrow */}
      <div className="flex items-center justify-end text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        <span>View Details</span>
        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </Link>
  );
}
