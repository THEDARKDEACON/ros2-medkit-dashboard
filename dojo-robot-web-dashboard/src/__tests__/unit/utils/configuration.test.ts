import { describe, it, expect } from 'vitest';
import {
  parseConfiguration,
  serializeConfiguration,
  createDefaultConfiguration,
  mergeConfiguration,
} from '@/utils/configuration';
import type { DashboardConfiguration } from '@/types/configuration';

describe('Configuration Parser and Serializer', () => {
  describe('parseConfiguration', () => {
    it('should parse valid configuration JSON', () => {
      const config: DashboardConfiguration = {
        version: '1.0.0',
        settings: {
          theme: 'dark',
          layoutMode: 'compact',
          sidebarCollapsed: true,
          autoRefresh: true,
          refreshInterval: 2000,
          showTimestamps: true,
          compactMode: false,
          animationsEnabled: true,
        },
        layouts: [],
        robotInstances: [],
      };

      const json = JSON.stringify(config);
      const result = parseConfiguration(json);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
      expect(result.errors).toBeUndefined();
    });

    it('should return error for invalid JSON', () => {
      const result = parseConfiguration('{ invalid json }');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('root');
      expect(result.errors![0].message).toContain('Invalid JSON');
    });

    it('should validate version field', () => {
      const config = {
        settings: {},
        layouts: [],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(config));

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.field === 'version')).toBe(true);
    });

    it('should validate theme values', () => {
      const config = {
        version: '1.0.0',
        settings: {
          theme: 'invalid',
        },
        layouts: [],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(config));

      expect(result.success).toBe(false);
      expect(
        result.errors!.some((e) => e.field === 'settings.theme'),
      ).toBe(true);
    });

    it('should validate layoutMode values', () => {
      const config = {
        version: '1.0.0',
        settings: {
          layoutMode: 'invalid',
        },
        layouts: [],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(config));

      expect(result.success).toBe(false);
      expect(
        result.errors!.some((e) => e.field === 'settings.layoutMode'),
      ).toBe(true);
    });

    it('should validate refreshInterval range', () => {
      const config = {
        version: '1.0.0',
        settings: {
          refreshInterval: 50, // Too low
        },
        layouts: [],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(config));

      expect(result.success).toBe(false);
      expect(
        result.errors!.some((e) => e.field === 'settings.refreshInterval'),
      ).toBe(true);
    });

    it('should validate robot instance URL format', () => {
      const config = {
        version: '1.0.0',
        settings: {},
        layouts: [],
        robotInstances: [
          {
            id: 'robot1',
            name: 'Robot 1',
            apiUrl: 'not-a-valid-url',
            isActive: true,
          },
        ],
      };

      const result = parseConfiguration(JSON.stringify(config));

      expect(result.success).toBe(false);
      expect(
        result.errors!.some((e) => e.field === 'robotInstances[0].apiUrl'),
      ).toBe(true);
    });

    it('should validate panel structure', () => {
      const config = {
        version: '1.0.0',
        settings: {},
        layouts: [
          {
            id: 'layout1',
            name: 'Layout 1',
            isDefault: true,
            panels: [
              {
                id: 'panel1',
                type: 'chart',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                config: {},
              },
            ],
          },
        ],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(config));

      expect(result.success).toBe(true);
    });

    it('should reject invalid panel position', () => {
      const config = {
        version: '1.0.0',
        settings: {},
        layouts: [
          {
            id: 'layout1',
            name: 'Layout 1',
            isDefault: true,
            panels: [
              {
                id: 'panel1',
                type: 'chart',
                position: { x: 'invalid', y: 0 },
                size: { width: 100, height: 100 },
                config: {},
              },
            ],
          },
        ],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(config));

      expect(result.success).toBe(false);
      expect(
        result.errors!.some((e) => e.field.includes('position')),
      ).toBe(true);
    });
  });

  describe('serializeConfiguration', () => {
    it('should serialize configuration to JSON', () => {
      const config: DashboardConfiguration = {
        version: '1.0.0',
        settings: {
          theme: 'dark',
          layoutMode: 'compact',
          sidebarCollapsed: true,
          autoRefresh: true,
          refreshInterval: 2000,
          showTimestamps: true,
          compactMode: false,
          animationsEnabled: true,
        },
        layouts: [],
        robotInstances: [],
      };

      const json = serializeConfiguration(config);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(config);
    });

    it('should include version in serialized output', () => {
      const config: DashboardConfiguration = {
        version: '1.0.0',
        settings: {
          theme: 'light',
          layoutMode: 'default',
          sidebarCollapsed: false,
          autoRefresh: true,
          refreshInterval: 1000,
          showTimestamps: true,
          compactMode: false,
          animationsEnabled: true,
        },
        layouts: [],
        robotInstances: [],
      };

      const json = serializeConfiguration(config);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBeDefined();
      expect(typeof parsed.version).toBe('string');
    });

    it('should format JSON with indentation', () => {
      const config = createDefaultConfiguration();
      const json = serializeConfiguration(config);

      // Check that JSON is formatted (contains newlines and spaces)
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('round-trip', () => {
    it('should maintain data integrity through parse-serialize-parse cycle', () => {
      const original: DashboardConfiguration = {
        version: '1.0.0',
        settings: {
          theme: 'dark',
          layoutMode: 'expanded',
          sidebarCollapsed: false,
          autoRefresh: true,
          refreshInterval: 5000,
          showTimestamps: false,
          compactMode: true,
          animationsEnabled: false,
        },
        layouts: [
          {
            id: 'layout1',
            name: 'Custom Layout',
            isDefault: true,
            panels: [
              {
                id: 'panel1',
                type: 'metrics',
                position: { x: 0, y: 0 },
                size: { width: 400, height: 300 },
                config: { refreshRate: 1000 },
              },
            ],
          },
        ],
        robotInstances: [
          {
            id: 'robot1',
            name: 'Test Robot',
            apiUrl: 'http://localhost:8080',
            isActive: true,
            lastConnected: '2024-01-01T00:00:00Z',
          },
        ],
      };

      const serialized = serializeConfiguration(original);
      const parseResult = parseConfiguration(serialized);

      expect(parseResult.success).toBe(true);
      expect(parseResult.data).toEqual(original);
    });
  });

  describe('createDefaultConfiguration', () => {
    it('should create valid default configuration', () => {
      const config = createDefaultConfiguration();

      expect(config.version).toBeDefined();
      expect(config.settings).toBeDefined();
      expect(config.layouts).toEqual([]);
      expect(config.robotInstances).toEqual([]);
    });

    it('should create parseable configuration', () => {
      const config = createDefaultConfiguration();
      const json = serializeConfiguration(config);
      const result = parseConfiguration(json);

      expect(result.success).toBe(true);
    });
  });

  describe('mergeConfiguration', () => {
    it('should merge partial settings', () => {
      const current = createDefaultConfiguration();
      const partial = {
        settings: {
          theme: 'dark' as const,
          refreshInterval: 2000,
        },
      };

      const merged = mergeConfiguration(current, partial);

      expect(merged.settings.theme).toBe('dark');
      expect(merged.settings.refreshInterval).toBe(2000);
      expect(merged.settings.layoutMode).toBe(current.settings.layoutMode);
    });

    it('should replace layouts when provided', () => {
      const current = createDefaultConfiguration();
      const newLayout = {
        id: 'layout1',
        name: 'New Layout',
        isDefault: true,
        panels: [],
      };
      const partial = {
        layouts: [newLayout],
      };

      const merged = mergeConfiguration(current, partial);

      expect(merged.layouts).toEqual([newLayout]);
    });

    it('should preserve current values when partial is empty', () => {
      const current = createDefaultConfiguration();
      const partial = {};

      const merged = mergeConfiguration(current, partial);

      expect(merged).toEqual(current);
    });

    it('should update version when provided', () => {
      const current = createDefaultConfiguration();
      const partial = {
        version: '2.0.0',
      };

      const merged = mergeConfiguration(current, partial);

      expect(merged.version).toBe('2.0.0');
    });
  });
});
