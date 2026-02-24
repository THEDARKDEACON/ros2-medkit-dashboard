/**
 * Configuration type definitions
 * Types for dashboard configuration management
 */

/**
 * Robot instance configuration
 */
export interface RobotInstance {
  id: string;
  name: string;
  apiUrl: string;
  isActive: boolean;
  lastConnected?: string;
}

/**
 * Panel configuration for custom layouts
 */
export interface PanelConfig {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, unknown>;
}

/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
  id: string;
  name: string;
  panels: PanelConfig[];
  isDefault: boolean;
}

/**
 * Dashboard settings
 */
export interface DashboardSettings {
  theme: 'light' | 'dark';
  layoutMode: 'default' | 'compact' | 'expanded';
  sidebarCollapsed: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  showTimestamps: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
}

/**
 * Complete dashboard configuration
 */
export interface DashboardConfiguration {
  version: string;
  settings: DashboardSettings;
  layouts: DashboardLayout[];
  robotInstances: RobotInstance[];
  metadata?: {
    name?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * Partial configuration for updates
 */
export type PartialDashboardConfiguration = {
  version?: string;
  settings?: Partial<DashboardSettings>;
  layouts?: DashboardLayout[];
  robotInstances?: RobotInstance[];
  metadata?: Partial<DashboardConfiguration['metadata']>;
};

/**
 * Configuration validation error
 */
export interface ConfigurationValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Configuration parse result
 */
export interface ConfigurationParseResult {
  success: boolean;
  data?: DashboardConfiguration;
  errors?: ConfigurationValidationError[];
}
