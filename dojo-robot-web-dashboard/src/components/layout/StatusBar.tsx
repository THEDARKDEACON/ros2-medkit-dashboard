import { useConnectionStore } from '@/features/stores/connectionStore';
import { Wifi, WifiOff, Radio, RadioTower } from 'lucide-react';

export function StatusBar() {
  const apiStatus = useConnectionStore((state) => state.apiStatus);
  const sseStatus = useConnectionStore((state) => state.sseStatus);
  const wsStatus = useConnectionStore((state) => state.wsStatus);
  const pollingEnabled = useConnectionStore((state) => state.pollingEnabled);
  const lastConnected = useConnectionStore((state) => state.lastConnected);
  const reconnectAttempts = useConnectionStore(
    (state) => state.reconnectAttempts,
  );

  const formatLastConnected = () => {
    if (!lastConnected) return 'Never';
    const date = new Date(lastConnected);
    return date.toLocaleTimeString();
  };

  const getConnectionIcon = (status: string) => {
    if (status === 'connected') {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    return <WifiOff className="h-4 w-4 text-red-500" />;
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
        {getStatusBadge('API', apiStatus, getConnectionIcon(apiStatus))}
        {getStatusBadge(
          'SSE',
          sseStatus,
          <Radio className="h-4 w-4" />,
        )}
        {getStatusBadge(
          'WebSocket',
          wsStatus,
          <RadioTower className="h-4 w-4" />,
        )}
        {pollingEnabled && (
          <span className="text-xs text-yellow-600 dark:text-yellow-400">
            Polling Mode
          </span>
        )}
      </div>

      {/* Right section: Last connected and reconnect attempts */}
      <div className="flex items-center gap-4 text-xs">
        {reconnectAttempts > 0 && (
          <span className="text-yellow-600 dark:text-yellow-400">
            Reconnect attempts: {reconnectAttempts}
          </span>
        )}
        <span>Last connected: {formatLastConnected()}</span>
      </div>
    </footer>
  );
}
