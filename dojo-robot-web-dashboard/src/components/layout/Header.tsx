import { useUIStore } from '@/features/stores/uiStore';
import { useConnectionStore } from '@/features/stores/connectionStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Menu } from 'lucide-react';

export function Header() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const apiStatus = useConnectionStore((state) => state.apiStatus);

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'reconnecting':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'failed':
        return 'Connection Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
      {/* Left section: Menu toggle and logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-lg font-bold">D</span>
          </div>
          <h1 className="text-xl font-semibold">Dojo Robot Dashboard</h1>
        </div>
      </div>

      {/* Right section: Status indicators and theme toggle */}
      <div className="flex items-center gap-4">
        {/* Connection status indicator */}
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
          <div
            className={`h-2 w-2 rounded-full ${getStatusColor()}`}
            aria-label={`Connection status: ${getStatusText()}`}
          />
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
