/**
 * Unit tests for fault filtering utilities
 */

import { describe, it, expect } from 'vitest';
import { filterFaults, getUniqueComponentIds } from '../../../utils/filterFaults';
import type { Fault } from '../../../types/api';

describe('filterFaults', () => {
  const mockFaults: Fault[] = [
    {
      code: 'ERR001',
      message: 'Navigation error',
      severity: 'error',
      componentId: 'nav_component',
      timestamp: '2024-01-15T10:00:00Z',
    },
    {
      code: 'WARN001',
      message: 'Low battery warning',
      severity: 'warning',
      componentId: 'power_component',
      timestamp: '2024-01-15T11:00:00Z',
    },
    {
      code: 'INFO001',
      message: 'System initialized',
      severity: 'info',
      componentId: 'nav_component',
      timestamp: '2024-01-15T09:00:00Z',
    },
    {
      code: 'ERR002',
      message: 'Sensor failure',
      severity: 'error',
      componentId: 'sensor_component',
      timestamp: '2024-01-15T12:00:00Z',
    },
  ];

  it('should return all faults when no filters are active', () => {
    const result = filterFaults(mockFaults, {
      severity: 'all',
      componentId: null,
      startTime: null,
      endTime: null,
    });

    expect(result).toHaveLength(4);
    expect(result).toEqual(mockFaults);
  });

  it('should filter by severity', () => {
    const result = filterFaults(mockFaults, {
      severity: 'error',
      componentId: null,
      startTime: null,
      endTime: null,
    });

    expect(result).toHaveLength(2);
    expect(result.every((f) => f.severity === 'error')).toBe(true);
  });

  it('should filter by component ID', () => {
    const result = filterFaults(mockFaults, {
      severity: 'all',
      componentId: 'nav_component',
      startTime: null,
      endTime: null,
    });

    expect(result).toHaveLength(2);
    expect(result.every((f) => f.componentId === 'nav_component')).toBe(true);
  });

  it('should filter by start time', () => {
    const result = filterFaults(mockFaults, {
      severity: 'all',
      componentId: null,
      startTime: '2024-01-15T10:30:00Z',
      endTime: null,
    });

    expect(result).toHaveLength(2);
    expect(result.every((f) => new Date(f.timestamp) >= new Date('2024-01-15T10:30:00Z'))).toBe(true);
  });

  it('should filter by end time', () => {
    const result = filterFaults(mockFaults, {
      severity: 'all',
      componentId: null,
      startTime: null,
      endTime: '2024-01-15T10:30:00Z',
    });

    expect(result).toHaveLength(2);
    expect(result.every((f) => new Date(f.timestamp) <= new Date('2024-01-15T10:30:00Z'))).toBe(true);
  });

  it('should filter by time range', () => {
    const result = filterFaults(mockFaults, {
      severity: 'all',
      componentId: null,
      startTime: '2024-01-15T09:30:00Z',
      endTime: '2024-01-15T11:30:00Z',
    });

    expect(result).toHaveLength(2);
    expect(result.every((f) => {
      const time = new Date(f.timestamp);
      return time >= new Date('2024-01-15T09:30:00Z') && time <= new Date('2024-01-15T11:30:00Z');
    })).toBe(true);
  });

  it('should apply multiple filters with AND logic', () => {
    const result = filterFaults(mockFaults, {
      severity: 'error',
      componentId: 'nav_component',
      startTime: null,
      endTime: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('ERR001');
    expect(result[0].severity).toBe('error');
    expect(result[0].componentId).toBe('nav_component');
  });

  it('should return empty array when no faults match all filters', () => {
    const result = filterFaults(mockFaults, {
      severity: 'warning',
      componentId: 'nav_component',
      startTime: null,
      endTime: null,
    });

    expect(result).toHaveLength(0);
  });

  it('should handle empty fault array', () => {
    const result = filterFaults([], {
      severity: 'error',
      componentId: 'nav_component',
      startTime: null,
      endTime: null,
    });

    expect(result).toHaveLength(0);
  });
});

describe('getUniqueComponentIds', () => {
  it('should return unique component IDs sorted alphabetically', () => {
    const faults: Fault[] = [
      {
        code: 'ERR001',
        message: 'Error 1',
        severity: 'error',
        componentId: 'component_b',
        timestamp: '2024-01-15T10:00:00Z',
      },
      {
        code: 'ERR002',
        message: 'Error 2',
        severity: 'error',
        componentId: 'component_a',
        timestamp: '2024-01-15T11:00:00Z',
      },
      {
        code: 'ERR003',
        message: 'Error 3',
        severity: 'error',
        componentId: 'component_b',
        timestamp: '2024-01-15T12:00:00Z',
      },
    ];

    const result = getUniqueComponentIds(faults);

    expect(result).toEqual(['component_a', 'component_b']);
  });

  it('should handle empty fault array', () => {
    const result = getUniqueComponentIds([]);

    expect(result).toEqual([]);
  });

  it('should handle single component', () => {
    const faults: Fault[] = [
      {
        code: 'ERR001',
        message: 'Error 1',
        severity: 'error',
        componentId: 'component_a',
        timestamp: '2024-01-15T10:00:00Z',
      },
    ];

    const result = getUniqueComponentIds(faults);

    expect(result).toEqual(['component_a']);
  });
});
