import { describe, it, expect } from 'vitest';
import { filterComponents, highlightMatches } from '../../../utils/filterComponents';
import type { Component } from '../../../types/api';

describe('filterComponents', () => {
  const mockComponents: Component[] = [
    {
      id: '1',
      name: 'Camera Sensor',
      identifier: 'camera_sensor_01',
      areaId: 'area1',
      status: 'active',
    },
    {
      id: '2',
      name: 'Lidar Scanner',
      identifier: 'lidar_scanner_02',
      areaId: 'area1',
      status: 'active',
    },
    {
      id: '3',
      name: 'Motor Controller',
      identifier: 'motor_ctrl_03',
      areaId: 'area2',
      status: 'inactive',
    },
    {
      id: '4',
      name: 'GPS Module',
      identifier: 'gps_module_04',
      areaId: 'area2',
      status: 'error',
    },
  ];

  it('returns all components when search term is empty', () => {
    const result = filterComponents(mockComponents, '');
    expect(result).toEqual(mockComponents);
  });

  it('returns all components when search term is whitespace', () => {
    const result = filterComponents(mockComponents, '   ');
    expect(result).toEqual(mockComponents);
  });

  it('filters by component name (case-insensitive)', () => {
    const result = filterComponents(mockComponents, 'camera');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Camera Sensor');
  });

  it('filters by component name with different case', () => {
    const result = filterComponents(mockComponents, 'CAMERA');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Camera Sensor');
  });

  it('filters by component identifier (case-insensitive)', () => {
    const result = filterComponents(mockComponents, 'lidar_scanner');
    expect(result).toHaveLength(1);
    expect(result[0].identifier).toBe('lidar_scanner_02');
  });

  it('filters by partial name match', () => {
    const result = filterComponents(mockComponents, 'sensor');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Camera Sensor');
  });

  it('filters by partial identifier match', () => {
    const result = filterComponents(mockComponents, 'ctrl');
    expect(result).toHaveLength(1);
    expect(result[0].identifier).toBe('motor_ctrl_03');
  });

  it('returns multiple matches', () => {
    const result = filterComponents(mockComponents, 'module');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('GPS Module');
  });

  it('matches in either name or identifier', () => {
    const result = filterComponents(mockComponents, '0');
    // All identifiers contain '0'
    expect(result).toHaveLength(4);
  });

  it('returns empty array when no matches found', () => {
    const result = filterComponents(mockComponents, 'nonexistent');
    expect(result).toHaveLength(0);
  });

  it('trims whitespace from search term', () => {
    const result = filterComponents(mockComponents, '  camera  ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Camera Sensor');
  });

  it('handles special characters in search term', () => {
    const result = filterComponents(mockComponents, '_');
    // All identifiers contain underscores
    expect(result).toHaveLength(4);
  });

  it('preserves original array when no filtering needed', () => {
    const result = filterComponents(mockComponents, '');
    expect(result).toBe(mockComponents);
  });
});

describe('highlightMatches', () => {
  it('returns single segment with no highlighting when search is empty', () => {
    const result = highlightMatches('Camera Sensor', '');
    expect(result).toEqual([{ text: 'Camera Sensor', highlighted: false }]);
  });

  it('returns single segment with no highlighting when search is whitespace', () => {
    const result = highlightMatches('Camera Sensor', '   ');
    expect(result).toEqual([{ text: 'Camera Sensor', highlighted: false }]);
  });

  it('highlights single match at start of text', () => {
    const result = highlightMatches('Camera Sensor', 'camera');
    expect(result).toEqual([
      { text: 'Camera', highlighted: true },
      { text: ' Sensor', highlighted: false },
    ]);
  });

  it('highlights single match at end of text', () => {
    const result = highlightMatches('Camera Sensor', 'sensor');
    expect(result).toEqual([
      { text: 'Camera ', highlighted: false },
      { text: 'Sensor', highlighted: true },
    ]);
  });

  it('highlights single match in middle of text', () => {
    const result = highlightMatches('Camera Sensor', 'era');
    expect(result).toEqual([
      { text: 'Cam', highlighted: false },
      { text: 'era', highlighted: true },
      { text: ' Sensor', highlighted: false },
    ]);
  });

  it('highlights multiple matches', () => {
    const result = highlightMatches('test test test', 'test');
    expect(result).toEqual([
      { text: 'test', highlighted: true },
      { text: ' ', highlighted: false },
      { text: 'test', highlighted: true },
      { text: ' ', highlighted: false },
      { text: 'test', highlighted: true },
    ]);
  });

  it('is case-insensitive', () => {
    const result = highlightMatches('Camera Sensor', 'CAMERA');
    expect(result).toEqual([
      { text: 'Camera', highlighted: true },
      { text: ' Sensor', highlighted: false },
    ]);
  });

  it('preserves original case in highlighted text', () => {
    const result = highlightMatches('CaMeRa SeNsOr', 'camera');
    expect(result).toEqual([
      { text: 'CaMeRa', highlighted: true },
      { text: ' SeNsOr', highlighted: false },
    ]);
  });

  it('handles overlapping potential matches correctly', () => {
    const result = highlightMatches('aaaa', 'aa');
    expect(result).toEqual([
      { text: 'aa', highlighted: true },
      { text: 'aa', highlighted: true },
    ]);
  });

  it('handles entire text match', () => {
    const result = highlightMatches('camera', 'camera');
    expect(result).toEqual([{ text: 'camera', highlighted: true }]);
  });

  it('handles no match', () => {
    const result = highlightMatches('Camera Sensor', 'xyz');
    expect(result).toEqual([{ text: 'Camera Sensor', highlighted: false }]);
  });

  it('handles special characters', () => {
    const result = highlightMatches('camera_sensor_01', '_sensor');
    expect(result).toEqual([
      { text: 'camera', highlighted: false },
      { text: '_sensor', highlighted: true },
      { text: '_01', highlighted: false },
    ]);
  });

  it('trims whitespace from search term', () => {
    const result = highlightMatches('Camera Sensor', '  camera  ');
    expect(result).toEqual([
      { text: 'Camera', highlighted: true },
      { text: ' Sensor', highlighted: false },
    ]);
  });
});
