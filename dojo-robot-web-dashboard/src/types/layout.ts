export interface PanelConfig {
  id: string;
  type: PanelType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  panels: PanelConfig[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PanelType =
  | 'system-health'
  | 'metrics'
  | 'quick-access'
  | 'fault-summary'
  | 'performance'
  | 'safety-monitor'
  | 'navigation-monitor'
  | 'map-2d'
  | 'point-cloud'
  | 'logs'
  | 'component-status'
  | 'topic-monitor';

export interface PanelDefinition {
  type: PanelType;
  name: string;
  description: string;
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
  icon: string;
  category: 'monitoring' | 'visualization' | 'control' | 'data';
}
