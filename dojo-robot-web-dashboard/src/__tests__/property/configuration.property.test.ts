/**
 * Property-based tests for configuration management
 * Tests parsing, serialization, validation, and round-trip properties
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseConfiguration,
  serializeConfiguration,
  mergeConfiguration,
} from '@/utils/configuration';
import type {
  DashboardConfiguration,
  DashboardSettings,
  DashboardLayout,
  RobotInstance,
  PanelConfig,
} from '@/types/configuration';

// Generators for configuration objects
const panelConfigArbitrary: fc.Arbitrary<PanelConfig> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('chart', 'metrics', 'map', 'faults', 'topics'),
  position: fc.record({
    x: fc.integer({ min: 0, max: 2000 }),
    y: fc.integer({ min: 0, max: 2000 }),
  }),
  size: fc.record({
    width: fc.integer({ min: 100, max: 1920 }),
    height: fc.integer({ min: 100, max: 1080 }),
  }),
  config: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.oneof(fc.string(), fc.integer(), fc.boolean())
  ),
});

const dashboardLayoutArbitrary: fc.Arbitrary<DashboardLayout> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  isDefault: fc.boolean(),
  panels: fc.array(panelConfigArbitrary, { maxLength: 10 }),
});

const robotInstanceArbitrary: fc.Arbitrary<RobotInstance> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  apiUrl: fc.webUrl(),
  isActive: fc.boolean(),
  lastConnected: fc.option(
    fc.integer({ min: 1577836800000, max: 1924992000000 }).map(ts => new Date(ts).toISOString()),
    { nil: undefined }
  ),
});

const dashboardSettingsArbitrary: fc.Arbitrary<DashboardSettings> = fc.record({
  theme: fc.constantFrom('light', 'dark'),
  layoutMode: fc.constantFrom('default', 'compact', 'expanded'),
  sidebarCollapsed: fc.boolean(),
  autoRefresh: fc.boolean(),
  refreshInterval: fc.integer({ min: 100, max: 60000 }),
  showTimestamps: fc.boolean(),
  compactMode: fc.boolean(),
  animationsEnabled: fc.boolean(),
});

const dashboardConfigurationArbitrary: fc.Arbitrary<DashboardConfiguration> = fc.record({
  version: fc.constantFrom('1.0.0', '1.1.0', '2.0.0'),
  settings: dashboardSettingsArbitrary,
  layouts: fc.array(dashboardLayoutArbitrary, { maxLength: 5 }),
  robotInstances: fc.array(robotInstanceArbitrary, { maxLength: 5 }),
  metadata: fc.option(
    fc.record({
      name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
      description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
      createdAt: fc.option(
        fc.integer({ min: 1577836800000, max: 1924992000000 }).map(ts => new Date(ts).toISOString()),
        { nil: undefined }
      ),
      updatedAt: fc.option(
        fc.integer({ min: 1577836800000, max: 1924992000000 }).map(ts => new Date(ts).toISOString()),
        { nil: undefined }
      ),
    }),
    { nil: undefined }
  ),
});

describe('Configuration Property Tests', () => {
  /**
   * Property 74: Configuration Parsing
   * **Validates: Requirements 30.1**
   */
  describe('Property 74: Configuration parsing', () => {
    it('Feature: dojo-robot-web-dashboard, Property 74: For any valid dashboard configuration JSON string, parsing the string should produce a valid configuration object without errors', () => {
      fc.assert(
        fc.property(dashboardConfigurationArbitrary, (config) => {
          const jsonString = JSON.stringify(config);
          const result = parseConfiguration(jsonString);

          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          expect(result.errors).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should parse minimal valid configuration', () => {
      const minimalConfig = {
        version: '1.0.0',
        settings: {},
        layouts: [],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(minimalConfig));
      expect(result.success).toBe(true);
    });
  });

  /**
   * Property 75: Configuration Application
   * **Validates: Requirements 30.2**
   */
  describe('Property 75: Configuration application', () => {
    it('Feature: dojo-robot-web-dashboard, Property 75: For any valid configuration object, applying the configuration should update all specified settings (theme, layout, robot instances) to match the configuration', () => {
      fc.assert(
        fc.property(
          dashboardConfigurationArbitrary,
          dashboardConfigurationArbitrary,
          (currentConfig, newConfig) => {
            // Merge new configuration into current
            const merged = mergeConfiguration(currentConfig, newConfig);

            // All specified settings should be applied
            if (newConfig.settings) {
              Object.keys(newConfig.settings).forEach(key => {
                expect(merged.settings[key as keyof DashboardSettings]).toEqual(
                  newConfig.settings![key as keyof DashboardSettings]
                );
              });
            }

            if (newConfig.layouts !== undefined) {
              expect(merged.layouts).toEqual(newConfig.layouts);
            }

            if (newConfig.robotInstances !== undefined) {
              expect(merged.robotInstances).toEqual(newConfig.robotInstances);
            }

            if (newConfig.version) {
              expect(merged.version).toBe(newConfig.version);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 76: Invalid Configuration Error Messages
   * **Validates: Requirements 30.3**
   */
  describe('Property 76: Invalid configuration error messages', () => {
    it('Feature: dojo-robot-web-dashboard, Property 76: For any invalid configuration JSON, parsing should fail and return descriptive validation errors indicating what is invalid', () => {
      const invalidConfigs = [
        { config: '{ invalid json }', expectedError: 'Invalid JSON' },
        { config: '{}', expectedError: 'version' },
        { config: '{"version": "1.0.0", "settings": {"theme": "invalid"}}', expectedError: 'theme' },
        { config: '{"version": "1.0.0", "settings": {"refreshInterval": 50}}', expectedError: 'refreshInterval' },
        { config: '{"version": "1.0.0", "robotInstances": [{"id": "1", "name": "Robot", "apiUrl": "not-a-url", "isActive": true}]}', expectedError: 'apiUrl' },
      ];

      invalidConfigs.forEach(({ config, expectedError }) => {
        const result = parseConfiguration(config);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);

        // Check that error message is descriptive
        const errorMessages = result.errors!.map(e => e.field + ' ' + e.message).join(' ');
        expect(errorMessages.toLowerCase()).toContain(expectedError.toLowerCase());
      });
    });

    it('should provide field-specific error information', () => {
      const invalidConfig = {
        version: '1.0.0',
        settings: {
          theme: 'invalid-theme',
          refreshInterval: 10, // Too low
        },
        layouts: [],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(invalidConfig));

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();

      // Should have errors for both invalid fields
      const fields = result.errors!.map(e => e.field);
      expect(fields.some(f => f.includes('theme'))).toBe(true);
      expect(fields.some(f => f.includes('refreshInterval'))).toBe(true);
    });
  });

  /**
   * Property 77: Configuration Serialization
   * **Validates: Requirements 30.4**
   */
  describe('Property 77: Configuration serialization', () => {
    it('Feature: dojo-robot-web-dashboard, Property 77: For any valid dashboard configuration object, serializing it to JSON should produce a valid JSON string that can be parsed', () => {
      fc.assert(
        fc.property(dashboardConfigurationArbitrary, (config) => {
          const serialized = serializeConfiguration(config);

          // Should be valid JSON
          expect(() => JSON.parse(serialized)).not.toThrow();

          // Parsed JSON should be an object
          const parsed = JSON.parse(serialized);
          expect(typeof parsed).toBe('object');
          expect(parsed).not.toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 78: Configuration Round-Trip
   * **Validates: Requirements 30.5**
   */
  describe('Property 78: Configuration round-trip', () => {
    it('Feature: dojo-robot-web-dashboard, Property 78: For any valid dashboard configuration object, serializing it to JSON and then parsing the JSON should produce an equivalent configuration object (all fields match)', () => {
      fc.assert(
        fc.property(dashboardConfigurationArbitrary, (config) => {
          const serialized = serializeConfiguration(config);
          const parseResult = parseConfiguration(serialized);

          expect(parseResult.success).toBe(true);
          expect(parseResult.data).toEqual(config);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity through multiple round-trips', () => {
      fc.assert(
        fc.property(dashboardConfigurationArbitrary, (config) => {
          let current = config;

          // Perform 3 round-trips
          for (let i = 0; i < 3; i++) {
            const serialized = serializeConfiguration(current);
            const parseResult = parseConfiguration(serialized);

            expect(parseResult.success).toBe(true);
            expect(parseResult.data).toEqual(config);

            current = parseResult.data!;
          }
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 79: Configuration Schema Validation
   * **Validates: Requirements 30.6**
   */
  describe('Property 79: Configuration schema validation', () => {
    it('Feature: dojo-robot-web-dashboard, Property 79: For any configuration file, schema validation should occur before applying settings, and invalid schemas should be rejected', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Valid configuration
            dashboardConfigurationArbitrary.map(c => ({ config: c, shouldPass: true })),
            // Invalid configurations
            fc.constant({ config: { version: 123 }, shouldPass: false }),
            fc.constant({ config: { version: '1.0.0', settings: 'not-an-object' }, shouldPass: false }),
            fc.constant({ config: { version: '1.0.0', layouts: 'not-an-array' }, shouldPass: false })
          ),
          ({ config, shouldPass }) => {
            const jsonString = JSON.stringify(config);
            const result = parseConfiguration(jsonString);

            if (shouldPass) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
              expect(result.errors).toBeDefined();
              expect(result.errors!.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate nested structure', () => {
      const invalidNestedConfig = {
        version: '1.0.0',
        settings: {},
        layouts: [
          {
            id: 'layout1',
            name: 'Layout',
            isDefault: true,
            panels: [
              {
                id: 'panel1',
                type: 'chart',
                position: { x: 'invalid', y: 0 }, // Invalid position
                size: { width: 100, height: 100 },
                config: {},
              },
            ],
          },
        ],
        robotInstances: [],
      };

      const result = parseConfiguration(JSON.stringify(invalidNestedConfig));

      expect(result.success).toBe(false);
      expect(result.errors!.some(e => e.field.includes('position'))).toBe(true);
    });
  });

  /**
   * Property 80: Partial Configuration Application
   * **Validates: Requirements 30.7**
   */
  describe('Property 80: Partial configuration application', () => {
    it('Feature: dojo-robot-web-dashboard, Property 80: For any partial configuration object (containing only a subset of settings), applying it should only update the specified settings, leaving other settings unchanged', () => {
      fc.assert(
        fc.property(
          dashboardConfigurationArbitrary,
          fc.record({
            settings: fc.option(
              fc.record({
                theme: fc.option(fc.constantFrom('light', 'dark'), { nil: undefined }),
                refreshInterval: fc.option(fc.integer({ min: 100, max: 60000 }), { nil: undefined }),
              }),
              { nil: undefined }
            ),
          }),
          (currentConfig, partialConfig) => {
            const merged = mergeConfiguration(currentConfig, partialConfig);

            // Specified settings should be updated (only if they have actual values, not undefined)
            if (partialConfig.settings?.theme !== undefined) {
              expect(merged.settings.theme).toBe(partialConfig.settings.theme);
            } else {
              expect(merged.settings.theme).toBe(currentConfig.settings.theme);
            }

            if (partialConfig.settings?.refreshInterval !== undefined) {
              expect(merged.settings.refreshInterval).toBe(partialConfig.settings.refreshInterval);
            } else {
              expect(merged.settings.refreshInterval).toBe(currentConfig.settings.refreshInterval);
            }

            // Unspecified settings should remain unchanged
            expect(merged.settings.layoutMode).toBe(currentConfig.settings.layoutMode);
            expect(merged.settings.sidebarCollapsed).toBe(currentConfig.settings.sidebarCollapsed);

            const partial = partialConfig as Partial<DashboardConfiguration>;
            // Arrays not specified should remain unchanged
            if (partial.layouts === undefined) {
              expect(merged.layouts).toEqual(currentConfig.layouts);
            }

            if (partial.robotInstances === undefined) {
              expect(merged.robotInstances).toEqual(currentConfig.robotInstances);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty partial configuration', () => {
      fc.assert(
        fc.property(dashboardConfigurationArbitrary, (config) => {
          const merged = mergeConfiguration(config, {});

          // Everything should remain unchanged
          expect(merged).toEqual(config);
        }),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 81: Configuration Version Inclusion
   * **Validates: Requirements 30.8**
   */
  describe('Property 81: Configuration version inclusion', () => {
    it('Feature: dojo-robot-web-dashboard, Property 81: For any serialized configuration file, the JSON should include a "version" field indicating the configuration format version', () => {
      fc.assert(
        fc.property(dashboardConfigurationArbitrary, (config) => {
          const serialized = serializeConfiguration(config);
          const parsed = JSON.parse(serialized);

          // Should have version field
          expect(parsed).toHaveProperty('version');
          expect(typeof parsed.version).toBe('string');
          expect(parsed.version.length).toBeGreaterThan(0);

          // Version should follow semantic versioning pattern
          expect(parsed.version).toMatch(/^\d+\.\d+\.\d+$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should add version if missing from input', () => {
      const configWithoutVersion = {
        settings: {
          theme: 'light' as const,
          layoutMode: 'default' as const,
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

      const serialized = serializeConfiguration(configWithoutVersion as any);
      const parsed = JSON.parse(serialized);

      expect(parsed.version).toBeDefined();
      expect(typeof parsed.version).toBe('string');
    });

    it('should preserve existing version', () => {
      fc.assert(
        fc.property(
          dashboardConfigurationArbitrary,
          fc.constantFrom('1.0.0', '2.0.0', '3.5.1'),
          (config, version) => {
            const configWithVersion = { ...config, version };
            const serialized = serializeConfiguration(configWithVersion);
            const parsed = JSON.parse(serialized);

            expect(parsed.version).toBe(version);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle configuration with all optional fields omitted', () => {
      const minimalConfig: DashboardConfiguration = {
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

      const serialized = serializeConfiguration(minimalConfig);
      const result = parseConfiguration(serialized);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(minimalConfig);
    });

    it('should handle large configurations', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.constant('1.0.0'),
            settings: dashboardSettingsArbitrary,
            layouts: fc.array(dashboardLayoutArbitrary, { minLength: 10, maxLength: 20 }),
            robotInstances: fc.array(robotInstanceArbitrary, { minLength: 10, maxLength: 20 }),
          }),
          (config) => {
            const serialized = serializeConfiguration(config);
            const result = parseConfiguration(serialized);

            expect(result.success).toBe(true);
            expect(result.data?.layouts.length).toBe(config.layouts.length);
            expect(result.data?.robotInstances.length).toBe(config.robotInstances.length);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle configurations with special characters in strings', () => {
      fc.assert(
        fc.property(
          fc.record({
            version: fc.constant('1.0.0'),
            settings: dashboardSettingsArbitrary,
            layouts: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }), // May contain special chars
                isDefault: fc.boolean(),
                panels: fc.array(panelConfigArbitrary, { maxLength: 3 }),
              }),
              { maxLength: 3 }
            ),
            robotInstances: fc.array(robotInstanceArbitrary, { maxLength: 3 }),
          }),
          (config) => {
            const serialized = serializeConfiguration(config);
            const result = parseConfiguration(serialized);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(config);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
