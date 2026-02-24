import type { PanelDefinition } from '../types/layout';

export const PANEL_LIBRARY: PanelDefinition[] = [
  {
    type: 'system-health',
    name: 'System Health Overview',
    description: 'Overall system status and health metrics',
    defaultSize: { width: 6, height: 2 },
    minSize: { width: 4, height: 2 },
    icon: 'Activity',
    category: 'monitoring',
  },
  {
    type: 'metrics',
    name: 'Metrics Panel',
    description: 'Key performance metrics and statistics',
    defaultSize: { width: 6, height: 2 },
    minSize: { width: 4, height: 2 },
    icon: 'BarChart3',
    category: 'monitoring',
  },
  {
    type: 'quick-access',
    name: 'Quick Access Cards',
    description: 'Quick access to common actions and views',
    defaultSize: { width: 4, height: 2 },
    minSize: { width: 3, height: 2 },
    icon: 'Zap',
    category: 'control',
  },
  {
    type: 'fault-summary',
    name: 'Fault Summary',
    description: 'Recent faults and alerts',
    defaultSize: { width: 8, height: 2 },
    minSize: { width: 4, height: 2 },
    icon: 'AlertTriangle',
    category: 'monitoring',
  },
  {
    type: 'performance',
    name: 'Performance Metrics',
    description: 'CPU, memory, and network performance',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 2 },
    icon: 'Gauge',
    category: 'monitoring',
  },
  {
    type: 'safety-monitor',
    name: 'Safety Monitor',
    description: 'Safety status and emergency controls',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 2 },
    icon: 'Shield',
    category: 'monitoring',
  },
  {
    type: 'navigation-monitor',
    name: 'Navigation Monitor',
    description: 'Robot position, velocity, and battery',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 2 },
    icon: 'Navigation',
    category: 'monitoring',
  },
  {
    type: 'map-2d',
    name: '2D Map',
    description: 'Interactive 2D navigation map',
    defaultSize: { width: 8, height: 4 },
    minSize: { width: 6, height: 3 },
    icon: 'Map',
    category: 'visualization',
  },
  {
    type: 'point-cloud',
    name: 'Point Cloud Viewer',
    description: '3D point cloud visualization',
    defaultSize: { width: 8, height: 4 },
    minSize: { width: 6, height: 3 },
    icon: 'Box',
    category: 'visualization',
  },
  {
    type: 'logs',
    name: 'Session Logs',
    description: 'System logs and messages',
    defaultSize: { width: 12, height: 3 },
    minSize: { width: 6, height: 2 },
    icon: 'FileText',
    category: 'data',
  },
  {
    type: 'component-status',
    name: 'Component Status',
    description: 'Status of all system components',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 2 },
    icon: 'Cpu',
    category: 'monitoring',
  },
  {
    type: 'topic-monitor',
    name: 'Topic Monitor',
    description: 'Real-time topic data monitoring',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 2 },
    icon: 'Radio',
    category: 'data',
  },
];

export const getPanelDefinition = (type: string): PanelDefinition | undefined => {
  return PANEL_LIBRARY.find((panel) => panel.type === type);
};

export const getPanelsByCategory = (category: PanelDefinition['category']): PanelDefinition[] => {
  return PANEL_LIBRARY.filter((panel) => panel.category === category);
};
