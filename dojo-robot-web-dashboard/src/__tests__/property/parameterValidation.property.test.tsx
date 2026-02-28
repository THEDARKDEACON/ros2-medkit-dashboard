/**
 * Property-based tests for Parameter Validation
 * **Validates: Requirements 6.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Parameter } from '@/types/api';

/**
 * Validation function (extracted from ParameterEditor for testing)
 */
function validateValue(param: Parameter, value: string): { valid: boolean; error?: string; parsedValue?: unknown } {
  // Type validation
  switch (param.type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        return { valid: false, error: 'Must be a valid number' };
      }
      // Check constraints
      if (param.constraints?.min !== undefined && num < param.constraints.min) {
        return { valid: false, error: `Must be at least ${param.constraints.min}` };
      }
      if (param.constraints?.max !== undefined && num > param.constraints.max) {
        return { valid: false, error: `Must be at most ${param.constraints.max}` };
      }
      return { valid: true, parsedValue: num };
    }
    case 'boolean': {
      const lower = value.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        return { valid: false, error: 'Must be true or false' };
      }
      return { valid: true, parsedValue: lower === 'true' };
    }
    case 'array': {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          return { valid: false, error: 'Must be a valid JSON array' };
        }
        return { valid: true, parsedValue: parsed };
      } catch {
        return { valid: false, error: 'Must be a valid JSON array' };
      }
    }
    case 'object': {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          return { valid: false, error: 'Must be a valid JSON object' };
        }
        return { valid: true, parsedValue: parsed };
      } catch {
        return { valid: false, error: 'Must be a valid JSON object' };
      }
    }
    case 'string':
    default: {
      // Check enum constraint
      if (param.constraints?.enum && !param.constraints.enum.includes(value)) {
        return { valid: false, error: `Must be one of: ${param.constraints.enum.join(', ')}` };
      }
      // Check pattern constraint
      if (param.constraints?.pattern) {
        const regex = new RegExp(param.constraints.pattern);
        if (!regex.test(value)) {
          return { valid: false, error: 'Does not match required pattern' };
        }
      }
      return { valid: true, parsedValue: value };
    }
  }
}

describe('Property 30: Parameter Value Validation', () => {
  /**
   * Property: For any parameter with type constraints, if a user enters a value
   * that violates the constraints, submission should be prevented and a validation
   * error should be displayed.
   * 
   * **Validates: Requirements 6.6**
   */

  it('should reject number values below minimum constraint', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // min constraint
        fc.integer({ min: -100, max: 0 }), // value below min
        (minValue, testValue) => {
          const param: Parameter = {
            name: 'test_param',
            value: 50,
            type: 'number',
            constraints: { min: minValue },
          };

          const result = validateValue(param, String(testValue));

          // Should be invalid
          expect(result.valid).toBe(false);
          expect(result.error).toContain('at least');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject number values above maximum constraint', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // max constraint
        fc.integer({ min: 101, max: 200 }), // value above max
        (maxValue, testValue) => {
          const param: Parameter = {
            name: 'test_param',
            value: 50,
            type: 'number',
            constraints: { max: maxValue },
          };

          const result = validateValue(param, String(testValue));

          // Should be invalid
          expect(result.valid).toBe(false);
          expect(result.error).toContain('at most');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept number values within min/max constraints', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }), // min
        fc.integer({ min: 51, max: 100 }), // max
        (minValue, maxValue) => {
          const param: Parameter = {
            name: 'test_param',
            value: 50,
            type: 'number',
            constraints: { min: minValue, max: maxValue },
          };

          // Test value within range
          const testValue = Math.floor((minValue + maxValue) / 2);
          const result = validateValue(param, String(testValue));

          // Should be valid
          expect(result.valid).toBe(true);
          expect(result.parsedValue).toBe(testValue);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject invalid number strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => isNaN(Number(s)) && s !== ''),
        (invalidNumber) => {
          const param: Parameter = {
            name: 'test_param',
            value: 42,
            type: 'number',
          };

          const result = validateValue(param, invalidNumber);

          // Should be invalid
          expect(result.valid).toBe(false);
          expect(result.error).toContain('valid number');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject invalid boolean values', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.toLowerCase() !== 'true' && s.toLowerCase() !== 'false'),
        (invalidBoolean) => {
          const param: Parameter = {
            name: 'test_param',
            value: true,
            type: 'boolean',
          };

          const result = validateValue(param, invalidBoolean);

          // Should be invalid
          expect(result.valid).toBe(false);
          expect(result.error).toContain('true or false');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept valid boolean values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('true', 'false', 'True', 'False', 'TRUE', 'FALSE'),
        (validBoolean) => {
          const param: Parameter = {
            name: 'test_param',
            value: true,
            type: 'boolean',
          };

          const result = validateValue(param, validBoolean);

          // Should be valid
          expect(result.valid).toBe(true);
          expect(typeof result.parsedValue).toBe('boolean');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should reject values not in enum constraint', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        (enumValues, testValue) => {
          // Skip if testValue is in enumValues
          fc.pre(!enumValues.includes(testValue));

          const param: Parameter = {
            name: 'test_param',
            value: enumValues[0],
            type: 'string',
            constraints: { enum: enumValues },
          };

          const result = validateValue(param, testValue);

          // Should be invalid
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Must be one of');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept values in enum constraint', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
        (enumValues) => {
          const param: Parameter = {
            name: 'test_param',
            value: enumValues[0],
            type: 'string',
            constraints: { enum: enumValues },
          };

          // Test with a value from the enum
          const testValue = enumValues[Math.floor(Math.random() * enumValues.length)];
          const result = validateValue(param, testValue);

          // Should be valid
          expect(result.valid).toBe(true);
          expect(result.parsedValue).toBe(testValue);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject invalid JSON arrays', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          try {
            const parsed = JSON.parse(s);
            return !Array.isArray(parsed);
          } catch {
            return true;
          }
        }),
        (invalidArray) => {
          const param: Parameter = {
            name: 'test_param',
            value: [],
            type: 'array',
          };

          const result = validateValue(param, invalidArray);

          // Should be invalid
          expect(result.valid).toBe(false);
          expect(result.error).toContain('valid JSON array');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept valid JSON arrays', () => {
    fc.assert(
      fc.property(
        fc.array(fc.anything()),
        (validArray) => {
          const param: Parameter = {
            name: 'test_param',
            value: [],
            type: 'array',
          };

          const result = validateValue(param, JSON.stringify(validArray));

          // Should be valid
          expect(result.valid).toBe(true);
          expect(Array.isArray(result.parsedValue)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject invalid JSON objects', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          try {
            const parsed = JSON.parse(s);
            return typeof parsed !== 'object' || parsed === null || Array.isArray(parsed);
          } catch {
            return true;
          }
        }),
        (invalidObject) => {
          const param: Parameter = {
            name: 'test_param',
            value: {},
            type: 'object',
          };

          const result = validateValue(param, invalidObject);

          // Should be invalid
          expect(result.valid).toBe(false);
          expect(result.error).toContain('valid JSON object');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should accept valid JSON objects', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string(), fc.anything()),
        (validObject) => {
          const param: Parameter = {
            name: 'test_param',
            value: {},
            type: 'object',
          };

          const result = validateValue(param, JSON.stringify(validObject));

          // Should be valid
          expect(result.valid).toBe(true);
          expect(typeof result.parsedValue).toBe('object');
          expect(result.parsedValue).not.toBeNull();
          expect(Array.isArray(result.parsedValue)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});
