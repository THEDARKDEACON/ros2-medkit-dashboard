import { useState, useEffect } from 'react';
import { useUIStore } from '@/features/stores/uiStore';
import { useConnectionStore } from '@/features/stores/connectionStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { RobotSelector } from '@/components/common/RobotSelector';
import { HelpSystem } from '@/components/help/HelpSystem';
import { FeedbackButton } from '@/components/help/FeedbackButton';
import { Tooltip } from '@/components/help/Tooltip';
import { KeyboardShortcutsDialog } from '@/components/help/KeyboardShortcutsDialog';
import { Menu, HelpCircle, Keyboard } from 'lucide-react';

export function Header() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const apiStatus = useConnectionStore((state) => state.apiStatus);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Keyboard shortcut: ? to open help
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        event.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
        {/* Left section: Menu toggle and logo */}
        <div className="flex items-center gap-4">
          <Tooltip content="Toggle sidebar (Ctrl+B)">
            <button
              onClick={toggleSidebar}
              className="rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </Tooltip>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-lg font-bold">D</span>
            </div>
            <h1 className="text-xl font-semibold">Dojo Robot Dashboard</h1>
          </div>
        </div>

        {/* Right section: Robot selector, status indicators, help, feedback, and theme toggle */}
        <div className="flex items-center gap-4">
          {/* Robot selector */}
          <RobotSelector />

          {/* Connection status indicator */}
          <Tooltip content={`API Gateway: ${getStatusText()}`}>
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
              <div
                className={`h-2 w-2 rounded-full ${getStatusColor()}`}
                aria-label={`Connection status: ${getStatusText()}`}
              />
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </Tooltip>

          {/* Help button */}
          <Tooltip content="Help & Documentation">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Open help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </Tooltip>

          {/* Keyboard shortcuts button */}
          <Tooltip content="Keyboard Shortcuts (?)">
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="rounded-md p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Show keyboard shortcuts"
              data-keyboard-shortcut="help"
            >
              <Keyboard className="h-5 w-5" />
            </button>
          </Tooltip>

          {/* Feedback button */}
          <FeedbackButton />

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Help System Modal */}
      <HelpSystem isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </>
  );
}
