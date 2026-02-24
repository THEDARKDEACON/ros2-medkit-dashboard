import type { DashboardLayout } from '../types/layout';

export const PRESET_LAYOUTS: Record<string, DashboardLayout> = {
  operator: {
    id: 'preset-operator',
    name: 'Operator Layout',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    panels: [
      {
        id: 'op-system-health',
        type: 'system-health',
        position: { x: 0, y: 0 },
        size: { width: 8, height: 2 },
        config: {},
      },
      {
        id: 'op-safety',
        type: 'safety-monitor',
        position: { x: 8, y: 0 },
        size: { width: 4, height: 2 },
        config: {},
      },
      {
        id: 'op-map',
        type: 'map-2d',
        position: { x: 0, y: 2 },
        size: { width: 8, height: 4 },
        config: {},
      },
      {
        id: 'op-navigation',
        type: 'navigation-monitor',
        position: { x: 8, y: 2 },
        size: { width: 4, height: 2 },
        config: {},
      },
      {
        id: 'op-quick-access',
        type: 'quick-access',
        position: { x: 8, y: 4 },
        size: { width: 4, height: 2 },
        config: {},
      },
      {
        id: 'op-faults',
        type: 'fault-summary',
        position: { x: 0, y: 6 },
        size: { width: 12, height: 2 },
        config: {},
      },
    ],
  },
  
  developer: {
    id: 'preset-developer',
    name: 'Developer Layout',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    panels: [
      {
        id: 'dev-metrics',
        type: 'metrics',
        position: { x: 0, y: 0 },
        size: { width: 6, height: 2 },
        config: {},
      },
      {
        id: 'dev-performance',
        type: 'performance',
        position: { x: 6, y: 0 },
        size: { width: 6, height: 2 },
        config: {},
      },
      {
        id: 'dev-components',
        type: 'component-status',
        position: { x: 0, y: 2 },
        size: { width: 6, height: 3 },
        config: {},
      },
      {
        id: 'dev-topics',
        type: 'topic-monitor',
        position: { x: 6, y: 2 },
        size: { width: 6, height: 3 },
        config: {},
      },
      {
        id: 'dev-faults',
        type: 'fault-summary',
        position: { x: 0, y: 5 },
        size: { width: 6, height: 2 },
        config: {},
      },
      {
        id: 'dev-logs',
        type: 'logs',
        position: { x: 6, y: 5 },
        size: { width: 6, height: 2 },
        config: {},
      },
    ],
  },
  
  researcher: {
    id: 'preset-researcher',
    name: 'Researcher Layout',
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    panels: [
      {
        id: 'res-system-health',
        type: 'system-health',
        position: { x: 0, y: 0 },
        size: { width: 12, height: 2 },
        config: {},
      },
      {
        id: 'res-map',
        type: 'map-2d',
        position: { x: 0, y: 2 },
        size: { width: 6, height: 4 },
        config: {},
      },
      {
        id: 'res-pointcloud',
        type: 'point-cloud',
        position: { x: 6, y: 2 },
        size: { width: 6, height: 4 },
        config: {},
      },
      {
        id: 'res-topics',
        type: 'topic-monitor',
        position: { x: 0, y: 6 },
        size: { width: 6, height: 3 },
        config: {},
      },
      {
        id: 'res-logs',
        type: 'logs',
        position: { x: 6, y: 6 },
        size: { width: 6, height: 3 },
        config: {},
      },
    ],
  },
};

export const getPresetLayout = (presetName: string): DashboardLayout | null => {
  return PRESET_LAYOUTS[presetName] || null;
};

export const getAllPresets = (): DashboardLayout[] => {
  return Object.values(PRESET_LAYOUTS);
};
