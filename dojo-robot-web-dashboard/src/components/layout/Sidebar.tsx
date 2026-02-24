import { useUIStore } from '@/features/stores/uiStore';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Radio,
  Zap,
  Settings,
  AlertTriangle,
  Eye,
  Activity,
} from 'lucide-react';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Components', icon: Box, path: '/components' },
  { name: 'Topics', icon: Radio, path: '/topics' },
  { name: 'Operations', icon: Zap, path: '/operations' },
  { name: 'Parameters', icon: Settings, path: '/parameters' },
  { name: 'Faults', icon: AlertTriangle, path: '/faults' },
  { name: 'Visualizations', icon: Eye, path: '/visualizations' },
  { name: 'Performance', icon: Activity, path: '/performance' },
];

export function Sidebar() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem-2.5rem)] border-r bg-card transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className="flex h-full flex-col gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                isActive ? 'bg-accent text-accent-foreground' : ''
              }`}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
