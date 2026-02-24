import { useUIStore } from '@/features/stores/uiStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const animationsEnabled = useUIStore((state) => state.preferences.animationsEnabled);

  return (
    <div 
      className={`flex h-screen flex-col overflow-hidden ${!animationsEnabled ? 'animations-disabled' : ''}`}
      role="application"
      aria-label="Dojo Robot Dashboard"
    >
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Header */}
      <Header />

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main
          id="main-content"
          className={`flex-1 overflow-auto bg-background transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
          role="main"
          aria-label="Main content"
        >
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>

      {/* Footer status bar */}
      <StatusBar />
    </div>
  );
}
