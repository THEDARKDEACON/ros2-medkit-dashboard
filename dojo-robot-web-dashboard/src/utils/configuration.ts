/**
 * Configuration parser and serializer
 * Handles parsing, validation, and serialization of dashboard configurations
 */

import type {
  DashboardConfiguration,
  PartialDashboardConfiguration,
  ConfigurationParseResult,
  ConfigurationValidationError,
} from '@/types/configuration';

const CURRENT_VERSION = '1.0.0';

/**
 * Validates a dashboard settings object
 */
function validateSettings(
  settings: unknown,
): ConfigurationValidationError[] {
  const errors: ConfigurationValidationError[] = [];

  if (!settings || typeof settings !== 'object') {
    errors.push({
      field: 'settings',
      message: 'Settings must be an object',
      value: settings,
    });
    return errors;
  }

  const s = settings as Record<string, unknown>;

  // Validate theme
  if (s.theme !== undefined && s.theme !== 'light' && s.theme !== 'dark') {
    errors.push({
      field: 'settings.theme',
      message: 'Theme must be "light" or "dark"',
      value: s.theme,
    });
  }

  // Validate layoutMode
  if (
    s.layoutMode !== undefined &&
    s.layoutMode !== 'default' &&
    s.layoutMode !== 'compact' &&
    s.layoutMode !== 'expanded'
  ) {
    errors.push({
      field: 'settings.layoutMode',
      message: 'Layout mode must be "default", "compact", or "expanded"',
      value: s.layoutMode,
    });
  }

  // Validate boolean fields
  const booleanFields = [
    'sidebarCollapsed',
    'autoRefresh',
    'showTimestamps',
    'compactMode',
    'animationsEnabled',
  ];
  for (const field of booleanFields) {
    if (s[field] !== undefined && typeof s[field] !== 'boolean') {
      errors.push({
        field: `settings.${field}`,
        message: `${field} must be a boolean`,
        value: s[field],
      });
    }
  }

  // Validate refreshInterval
  if (s.refreshInterval !== undefined) {
    if (typeof s.refreshInterval !== 'number') {
      errors.push({
        field: 'settings.refreshInterval',
        message: 'Refresh interval must be a number',
        value: s.refreshInterval,
      });
    } else if (s.refreshInterval < 100 || s.refreshInterval > 60000) {
      errors.push({
        field: 'settings.refreshInterval',
        message: 'Refresh interval must be between 100 and 60000 milliseconds',
        value: s.refreshInterval,
      });
    }
  }

  return errors;
}

/**
 * Validates a panel configuration
 */
function validatePanel(
  panel: unknown,
  index: number,
): ConfigurationValidationError[] {
  const errors: ConfigurationValidationError[] = [];

  if (!panel || typeof panel !== 'object') {
    errors.push({
      field: `layouts[].panels[${index}]`,
      message: 'Panel must be an object',
      value: panel,
    });
    return errors;
  }

  const p = panel as Record<string, unknown>;

  // Validate required fields
  if (!p.id || typeof p.id !== 'string') {
    errors.push({
      field: `layouts[].panels[${index}].id`,
      message: 'Panel id must be a non-empty string',
      value: p.id,
    });
  }

  if (!p.type || typeof p.type !== 'string') {
    errors.push({
      field: `layouts[].panels[${index}].type`,
      message: 'Panel type must be a non-empty string',
      value: p.type,
    });
  }

  // Validate position
  if (!p.position || typeof p.position !== 'object') {
    errors.push({
      field: `layouts[].panels[${index}].position`,
      message: 'Panel position must be an object with x and y coordinates',
      value: p.position,
    });
  } else {
    const pos = p.position as Record<string, unknown>;
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
      errors.push({
        field: `layouts[].panels[${index}].position`,
        message: 'Panel position x and y must be numbers',
        value: p.position,
      });
    }
  }

  // Validate size
  if (!p.size || typeof p.size !== 'object') {
    errors.push({
      field: `layouts[].panels[${index}].size`,
      message: 'Panel size must be an object with width and height',
      value: p.size,
    });
  } else {
    const size = p.size as Record<string, unknown>;
    if (typeof size.width !== 'number' || typeof size.height !== 'number') {
      errors.push({
        field: `layouts[].panels[${index}].size`,
        message: 'Panel size width and height must be numbers',
        value: p.size,
      });
    }
  }

  // Validate config
  if (p.config !== undefined && typeof p.config !== 'object') {
    errors.push({
      field: `layouts[].panels[${index}].config`,
      message: 'Panel config must be an object',
      value: p.config,
    });
  }

  return errors;
}

/**
 * Validates a dashboard layout
 */
function validateLayout(
  layout: unknown,
  index: number,
): ConfigurationValidationError[] {
  const errors: ConfigurationValidationError[] = [];

  if (!layout || typeof layout !== 'object') {
    errors.push({
      field: `layouts[${index}]`,
      message: 'Layout must be an object',
      value: layout,
    });
    return errors;
  }

  const l = layout as Record<string, unknown>;

  // Validate required fields
  if (!l.id || typeof l.id !== 'string') {
    errors.push({
      field: `layouts[${index}].id`,
      message: 'Layout id must be a non-empty string',
      value: l.id,
    });
  }

  if (!l.name || typeof l.name !== 'string') {
    errors.push({
      field: `layouts[${index}].name`,
      message: 'Layout name must be a non-empty string',
      value: l.name,
    });
  }

  if (typeof l.isDefault !== 'boolean') {
    errors.push({
      field: `layouts[${index}].isDefault`,
      message: 'Layout isDefault must be a boolean',
      value: l.isDefault,
    });
  }

  // Validate panels array
  if (!Array.isArray(l.panels)) {
    errors.push({
      field: `layouts[${index}].panels`,
      message: 'Layout panels must be an array',
      value: l.panels,
    });
  } else {
    l.panels.forEach((panel, panelIndex) => {
      errors.push(...validatePanel(panel, panelIndex));
    });
  }

  return errors;
}

/**
 * Validates a robot instance
 */
function validateRobotInstance(
  instance: unknown,
  index: number,
): ConfigurationValidationError[] {
  const errors: ConfigurationValidationError[] = [];

  if (!instance || typeof instance !== 'object') {
    errors.push({
      field: `robotInstances[${index}]`,
      message: 'Robot instance must be an object',
      value: instance,
    });
    return errors;
  }

  const r = instance as Record<string, unknown>;

  // Validate required fields
  if (!r.id || typeof r.id !== 'string') {
    errors.push({
      field: `robotInstances[${index}].id`,
      message: 'Robot instance id must be a non-empty string',
      value: r.id,
    });
  }

  if (!r.name || typeof r.name !== 'string') {
    errors.push({
      field: `robotInstances[${index}].name`,
      message: 'Robot instance name must be a non-empty string',
      value: r.name,
    });
  }

  if (!r.apiUrl || typeof r.apiUrl !== 'string') {
    errors.push({
      field: `robotInstances[${index}].apiUrl`,
      message: 'Robot instance apiUrl must be a non-empty string',
      value: r.apiUrl,
    });
  } else {
    // Validate URL format
    try {
      new URL(r.apiUrl as string);
    } catch {
      errors.push({
        field: `robotInstances[${index}].apiUrl`,
        message: 'Robot instance apiUrl must be a valid URL',
        value: r.apiUrl,
      });
    }
  }

  if (typeof r.isActive !== 'boolean') {
    errors.push({
      field: `robotInstances[${index}].isActive`,
      message: 'Robot instance isActive must be a boolean',
      value: r.isActive,
    });
  }

  // Optional lastConnected field
  if (r.lastConnected !== undefined && typeof r.lastConnected !== 'string') {
    errors.push({
      field: `robotInstances[${index}].lastConnected`,
      message: 'Robot instance lastConnected must be a string',
      value: r.lastConnected,
    });
  }

  return errors;
}

/**
 * Validates the complete configuration schema
 */
function validateConfiguration(
  config: unknown,
): ConfigurationValidationError[] {
  const errors: ConfigurationValidationError[] = [];

  if (!config || typeof config !== 'object') {
    errors.push({
      field: 'root',
      message: 'Configuration must be an object',
      value: config,
    });
    return errors;
  }

  const c = config as Record<string, unknown>;

  // Validate version
  if (!c.version || typeof c.version !== 'string') {
    errors.push({
      field: 'version',
      message: 'Configuration version must be a non-empty string',
      value: c.version,
    });
  }

  // Validate settings
  if (c.settings !== undefined) {
    errors.push(...validateSettings(c.settings));
  }

  // Validate layouts
  if (c.layouts !== undefined) {
    if (!Array.isArray(c.layouts)) {
      errors.push({
        field: 'layouts',
        message: 'Layouts must be an array',
        value: c.layouts,
      });
    } else {
      c.layouts.forEach((layout, index) => {
        errors.push(...validateLayout(layout, index));
      });
    }
  }

  // Validate robot instances
  if (c.robotInstances !== undefined) {
    if (!Array.isArray(c.robotInstances)) {
      errors.push({
        field: 'robotInstances',
        message: 'Robot instances must be an array',
        value: c.robotInstances,
      });
    } else {
      c.robotInstances.forEach((instance, index) => {
        errors.push(...validateRobotInstance(instance, index));
      });
    }
  }

  return errors;
}

/**
 * Parses a JSON configuration string
 * @param jsonString - JSON string to parse
 * @returns Parse result with data or errors
 */
export function parseConfiguration(
  jsonString: string,
): ConfigurationParseResult {
  try {
    const parsed = JSON.parse(jsonString);
    const errors = validateConfiguration(parsed);

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      data: parsed as DashboardConfiguration,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: 'root',
          message:
            error instanceof Error
              ? `Invalid JSON: ${error.message}`
              : 'Invalid JSON format',
        },
      ],
    };
  }
}

/**
 * Serializes a configuration object to JSON string
 * @param config - Configuration object to serialize
 * @returns JSON string representation
 */
export function serializeConfiguration(
  config: DashboardConfiguration,
): string {
  // Ensure version is included
  const configWithVersion = {
    ...config,
    version: config.version || CURRENT_VERSION,
  };

  return JSON.stringify(configWithVersion, null, 2);
}

/**
 * Creates a default configuration
 */
export function createDefaultConfiguration(): DashboardConfiguration {
  return {
    version: CURRENT_VERSION,
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
}

/**
 * Merges partial configuration with existing configuration
 * @param current - Current configuration
 * @param partial - Partial configuration to merge
 * @returns Merged configuration
 */
export function mergeConfiguration(
  current: DashboardConfiguration,
  partial: PartialDashboardConfiguration,
): DashboardConfiguration {
  // Filter out undefined values from partial settings
  const filteredSettings = partial.settings
    ? Object.fromEntries(
      Object.entries(partial.settings).filter(([_, value]) => value !== undefined)
    )
    : undefined;

  return {
    version: partial.version || current.version,
    settings: filteredSettings
      ? { ...current.settings, ...filteredSettings }
      : current.settings,
    layouts: partial.layouts !== undefined ? partial.layouts : current.layouts,
    robotInstances:
      partial.robotInstances !== undefined
        ? partial.robotInstances
        : current.robotInstances,
    metadata: partial.metadata
      ? { ...current.metadata, ...partial.metadata }
      : current.metadata,
  };
}
