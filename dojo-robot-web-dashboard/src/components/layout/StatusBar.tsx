import { useConnectionStore } from '@/features/stores/connectionStore';
import { useRobotStore } from '@/features/stores/robotStore';
import { Wifi, WifiOff, Radio } from 'lucide-react';

export function StatusBar() {
  const apiStatus = useConnectionStore((state) => state.apiStatus);
  const sseStatus = useConnectionStore((state) => state.sseStatus);
  const lastConnected = useConnectionStore((state) => state.lastConnected);
  const activeRobot = useRobotStore((state) => state.getActiveRobot());

  const formatLastConnected = () => {
    if (!lastConnected) return 'Never';
    const date = new Date(lastConnected);
    return date.toLocaleTimeString();
  };

  const getStatusBadge = (
    label: string,
    status: string,
    icon: React.ReactNode,
  ) => {
    const statusColor =
      status === 'connected'
        ? 'text-green-600 dark:text-green-400'
        : status === 'reconnecting'
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400';

    return (
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs">
          {label}:{' '}
          <span className={`font-medium ${statusColor}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </span>
      </div>
    );
  };

  return (
    <footer className="flex h-10 items-center justify-between border-t bg-card px-6 text-sm text-muted-foreground">
      {/* Left section: Connection statuses */}
      <div className="flex items-center gap-6">
        {getStatusBadge(
          'API',
          apiStatus,
          apiStatus === 'connected'
            ? <Wifi className="h-4 w-4 text-green-500" />
            : <WifiOff className="h-4 w-4 text-red-500" />,
        )}
        {/* Only show SSE if it's been activated (not default disconnected) */}
        {sseStatus !== 'disconnected' &&
          getStatusBadge(
            'Real-time',
            sseStatus,
            <Radio className="h-4 w-4" />,
          )}
      </div>

      {/* Right section: Active robot and last connected */}
      <div className="flex items-center gap-4 text-xs">
        {activeRobot && (
          <span className="text-muted-foreground truncate max-w-xs" title={activeRobot.apiUrl}>
            🤖 {activeRobot.name}
          </span>
        )}
        <span>Last connected: {formatLastConnected()}</span>
      </div>
    </footer>
  );
}

