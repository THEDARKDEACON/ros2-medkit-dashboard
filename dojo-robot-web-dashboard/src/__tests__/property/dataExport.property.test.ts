/**
 * Property-based tests for data export utilities
 * Tests JSON, CSV, and YAML export functionality
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  exportToJSON,
  exportToCSV,
  exportToYAML,
  generateFilename,
} from '../../utils/dataExport';

describe('Data Export Property Tests', () => {
  /**
   * Property 61: Topic Data Export JSON Validity
   * **Validates: Requirements 14.1**
   */
  describe('Property 61: Topic data export JSON validity', () => {
    it('should produce valid parseable JSON for any topic data', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // topicName
          fc.string({ minLength: 1, maxLength: 50 }), // messageType
          fc.array(
            fc.oneof(
              fc.record({
                timestamp: fc.date().map(d => d.toISOString()),
                value: fc.float(),
              }),
              fc.record({
                x: fc.float(),
                y: fc.float(),
                z: fc.float(),
              }),
              fc.jsonValue() // Use jsonValue instead of object to avoid undefined
            ),
            { maxLength: 100 }
          ), // data
          (topicName, messageType, data) => {
            const jsonString = exportToJSON(topicName, messageType, data);

            // Should be valid JSON
            const parsed = JSON.parse(jsonString);

            // Should have required structure
            expect(parsed).toHaveProperty('metadata');
            expect(parsed).toHaveProperty('topicName', topicName);
            expect(parsed).toHaveProperty('messageType', messageType);
            expect(parsed).toHaveProperty('data');

            // Metadata should have required fields
            expect(parsed.metadata).toHaveProperty('timestamp');
            expect(parsed.metadata).toHaveProperty('exportedBy');
            expect(parsed.metadata).toHaveProperty('version');
            expect(parsed.metadata).toHaveProperty('source');

            // Data should be an array (JSON.parse/stringify may normalize undefined to null)
            expect(Array.isArray(parsed.data)).toBe(true);
            expect(parsed.data.length).toBe(data.length);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle empty data arrays', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (topicName, messageType) => {
            const jsonString = exportToJSON(topicName, messageType, []);
            const parsed = JSON.parse(jsonString);

            expect(parsed.data).toEqual([]);
            expect(Array.isArray(parsed.data)).toBe(true);
          }
        )
      );
    });
  });

  /**
   * Property 62: Fault History Export CSV Validity
   * **Validates: Requirements 14.2**
   */
  describe('Property 62: Fault history export CSV validity', () => {
    const faultArbitrary = fc.record({
      code: fc.string({ minLength: 1, maxLength: 20 }),
      message: fc.string({ minLength: 1, maxLength: 200 }),
      severity: fc.constantFrom('error', 'warning', 'info'),
      componentId: fc.uuid(),
      timestamp: fc.date().map(d => d.toISOString()),
    });

    it('should produce valid CSV with proper headers for any fault data', () => {
      fc.assert(
        fc.property(
          fc.array(faultArbitrary, { minLength: 1, maxLength: 50 }),
          (faults) => {
            const csvString = exportToCSV(faults);

            // Should have content
            expect(csvString.length).toBeGreaterThan(0);

            // Split into lines
            const lines = csvString.split('\n').filter(line => line.trim());

            // Should have metadata comments
            const metadataLines = lines.filter(line => line.startsWith('#'));
            expect(metadataLines.length).toBeGreaterThan(0);

            // Should have header row
            const dataLines = lines.filter(line => !line.startsWith('#'));
            expect(dataLines.length).toBeGreaterThan(0);

            const headerLine = dataLines[0];
            const headers = headerLine.split(',').map(h => h.trim());

            // Should have required headers
            expect(headers).toContain('code');
            expect(headers).toContain('message');
            expect(headers).toContain('severity');
            expect(headers).toContain('componentId');
            expect(headers).toContain('timestamp');

            // Should have data rows
            const dataRows = dataLines.slice(1);
            expect(dataRows.length).toBe(faults.length);

            // Each row should have same number of columns as headers (when parsed properly)
            dataRows.forEach(row => {
              // Handle quoted values
              const values = parseCSVRow(row);
              expect(values.length).toBe(headers.length);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle empty fault arrays', () => {
      const csvString = exportToCSV([]);

      // Should still have metadata and headers
      expect(csvString).toContain('#');
      expect(csvString).toContain('code,message,severity,componentId,timestamp');
    });

    it('should properly escape values with commas and quotes', () => {
      const faultsWithSpecialChars = [
        {
          code: 'TEST_001',
          message: 'Error with, comma',
          severity: 'error',
          componentId: 'comp-1',
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          code: 'TEST_002',
          message: 'Error with "quotes"',
          severity: 'warning',
          componentId: 'comp-2',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      const csvString = exportToCSV(faultsWithSpecialChars);

      // Should contain escaped values
      expect(csvString).toContain('"Error with, comma"');
      expect(csvString).toContain('"Error with ""quotes"""');
    });
  });

  /**
   * Property 63: Parameter Export YAML Validity
   * **Validates: Requirements 14.3**
   */
  describe('Property 63: Parameter export YAML validity', () => {
    const parameterArbitrary = fc.dictionary(
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.oneof(
        fc.string(),
        fc.integer(),
        fc.float(),
        fc.boolean(),
        fc.array(fc.oneof(fc.string(), fc.integer(), fc.float()), { maxLength: 10 }),
        fc.record({
          nested: fc.string(),
          value: fc.integer(),
        })
      )
    );

    it('should produce valid YAML for any parameter configuration', () => {
      fc.assert(
        fc.property(parameterArbitrary, (parameters) => {
          const yamlString = exportToYAML(parameters);

          // Should have content
          expect(yamlString.length).toBeGreaterThan(0);

          // Should have metadata section
          expect(yamlString).toContain('# Metadata');
          expect(yamlString).toContain('exported_by:');
          expect(yamlString).toContain('timestamp:');
          expect(yamlString).toContain('version:');
          expect(yamlString).toContain('source:');

          // Should have parameters section
          expect(yamlString).toContain('# Parameters');
          expect(yamlString).toContain('parameters:');

          // Each parameter key should appear in the YAML
          Object.keys(parameters).forEach(key => {
            expect(yamlString).toContain(`${key}:`);
          });
        }),
        { numRuns: 50 }
      );
    });

    it('should handle empty parameter objects', () => {
      const yamlString = exportToYAML({});

      // Should still have metadata and parameters section
      expect(yamlString).toContain('# Metadata');
      expect(yamlString).toContain('parameters:');
    });

    it('should handle parameters with namespace', () => {
      fc.assert(
        fc.property(
          parameterArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (parameters, namespace) => {
            const yamlString = exportToYAML(parameters, namespace);

            // Should include namespace in source
            expect(yamlString).toContain(`source: "parameters:${namespace}"`);
          }
        )
      );
    });

    it('should properly format different value types', () => {
      const parameters = {
        stringParam: 'test value',
        numberParam: 42,
        floatParam: 3.14,
        boolParam: true,
        arrayParam: [1, 2, 3],
        objectParam: { nested: 'value' },
      };

      const yamlString = exportToYAML(parameters);

      // Check each type is formatted correctly
      expect(yamlString).toContain('stringParam: "test value"');
      expect(yamlString).toContain('numberParam: 42');
      expect(yamlString).toContain('floatParam: 3.14');
      expect(yamlString).toContain('boolParam: true');
      expect(yamlString).toContain('arrayParam:');
      expect(yamlString).toContain('objectParam:');
    });
  });

  /**
   * Property 64: Export File Metadata
   * **Validates: Requirements 14.4**
   */
  describe('Property 64: Export file metadata', () => {
    it('should include timestamp in JSON exports', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.array(fc.object()),
          (topicName, messageType, data) => {
            const jsonString = exportToJSON(topicName, messageType, data);
            const parsed = JSON.parse(jsonString);

            // Should have timestamp
            expect(parsed.metadata.timestamp).toBeDefined();
            expect(typeof parsed.metadata.timestamp).toBe('string');

            // Timestamp should be valid ISO 8601
            const timestamp = new Date(parsed.metadata.timestamp);
            expect(timestamp.toString()).not.toBe('Invalid Date');
          }
        )
      );
    });

    it('should include timestamp in CSV exports', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              code: fc.string({ minLength: 1 }),
              message: fc.string({ minLength: 1 }),
              severity: fc.constantFrom('error', 'warning', 'info'),
              componentId: fc.string({ minLength: 1 }),
              timestamp: fc.date().map(d => d.toISOString()),
            }),
            { maxLength: 10 }
          ),
          (faults) => {
            const csvString = exportToCSV(faults);

            // Should have timestamp in metadata
            expect(csvString).toContain('# Export Timestamp:');

            // Extract timestamp
            const timestampLine = csvString
              .split('\n')
              .find(line => line.includes('# Export Timestamp:'));
            expect(timestampLine).toBeDefined();
          }
        )
      );
    });

    it('should include timestamp in YAML exports', () => {
      fc.assert(
        fc.property(
          fc.dictionary(fc.string({ minLength: 1 }), fc.oneof(fc.string(), fc.integer())),
          (parameters) => {
            const yamlString = exportToYAML(parameters);

            // Should have timestamp
            expect(yamlString).toContain('timestamp:');

            // Extract timestamp value
            const timestampLine = yamlString
              .split('\n')
              .find(line => line.includes('timestamp:'));
            expect(timestampLine).toBeDefined();
          }
        )
      );
    });

    it('should include all required metadata fields in all formats', () => {
      const requiredFields = ['exportedBy', 'version', 'source'];

      // JSON
      const jsonString = exportToJSON('test', 'test_msgs/Test', []);
      const jsonParsed = JSON.parse(jsonString);
      expect(jsonParsed.metadata).toHaveProperty('timestamp');
      requiredFields.forEach(field => {
        expect(jsonParsed.metadata).toHaveProperty(field);
      });

      // CSV
      const csvString = exportToCSV([]);
      expect(csvString).toContain('# Exported By:');
      expect(csvString).toContain('# Export Timestamp:');
      expect(csvString).toContain('# Version:');
      expect(csvString).toContain('# Source:');

      // YAML
      const yamlString = exportToYAML({});
      expect(yamlString).toContain('exported_by:');
      expect(yamlString).toContain('timestamp:');
      expect(yamlString).toContain('version:');
      expect(yamlString).toContain('source:');
    });
  });

  describe('Filename generation', () => {
    it('should generate unique filenames with timestamps', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('json', 'csv', 'yaml'),
          (prefix, extension) => {
            const filename = generateFilename(prefix, extension);

            // Should contain prefix
            expect(filename).toContain(prefix);

            // Should have correct extension
            expect(filename.endsWith(`.${extension}`)).toBe(true);

            // Should contain timestamp-like pattern
            expect(filename).toMatch(/_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
          }
        )
      );
    });
  });
});

/**
 * Helper function to parse CSV row handling quoted values
 */
function parseCSVRow(row: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current);

  return values;
}
