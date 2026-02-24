/**
 * Property-based tests for message validation
 * **Validates: Requirements 4.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Validation function to test (matches the logic in TopicPublisher)
function validateJSON(input: string): { isValid: boolean; error: string | null } {
  if (!input.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  try {
    JSON.parse(input);
    return { isValid: true, error: null };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

// Generate invalid JSON strings
const invalidJsonArbitrary = fc.oneof(
  // Unclosed braces
  fc.constant('{'),
  fc.constant('{key: value'),
  fc.constant('{"key": "value"'),
  // Invalid syntax
  fc.constant('{key: value}'), // Missing quotes
  fc.constant("{'key': 'value'}"), // Single quotes
  fc.constant('{"key": undefined}'), // undefined is not valid JSON
  fc.constant('{"key": NaN}'), // NaN is not valid JSON
  fc.constant('{"key": Infinity}'), // Infinity is not valid JSON
  // Trailing commas
  fc.constant('{"key": "value",}'),
  fc.constant('[1, 2, 3,]'),
  // Random strings that are not JSON
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => {
    try {
      JSON.parse(s);
      return false; // Filter out valid JSON
    } catch {
      return true; // Keep invalid JSON
    }
  })
);

// Generate valid JSON strings
const validJsonArbitrary = fc.oneof(
  // Simple values
  fc.constant('null'),
  fc.constant('true'),
  fc.constant('false'),
  fc.integer().map((n) => JSON.stringify(n)),
  fc.double().map((n) => JSON.stringify(n)),
  fc.string().map((s) => JSON.stringify(s)),
  // Objects
  fc
    .record({
      key: fc.string(),
      value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
    })
    .map((obj) => JSON.stringify(obj)),
  // Arrays
  fc.array(fc.integer(), { maxLength: 10 }).map((arr) => JSON.stringify(arr)),
  // Nested structures
  fc
    .record({
      data: fc.record({
        x: fc.double(),
        y: fc.double(),
        z: fc.double(),
      }),
      timestamp: fc.integer(),
    })
    .map((obj) => JSON.stringify(obj))
);

describe('Property 14: JSON Validation Before Publication', () => {
  /**
   * Property: For any string input to the message publisher, if the string
   * is not valid JSON, validation should return false and publication
   * should be prevented.
   */
  it('Feature: dojo-robot-web-dashboard, Property 14: should return invalid for non-JSON strings', () => {
    fc.assert(
      fc.property(invalidJsonArbitrary, (invalidJson) => {
        const result = validateJSON(invalidJson);

        // Validation should return false for invalid JSON
        expect(result.isValid).toBe(false);
        expect(result.error).toBeTruthy();

        // Verify that JSON.parse would actually throw
        expect(() => JSON.parse(invalidJson)).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any valid JSON string, validation should return true
   */
  it('should return valid for valid JSON strings', () => {
    fc.assert(
      fc.property(validJsonArbitrary, (validJson) => {
        const result = validateJSON(validJson);

        // Validation should return true for valid JSON
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();

        // Verify that JSON.parse would not throw
        expect(() => JSON.parse(validJson)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty string should be invalid
   */
  it('should return invalid for empty message', () => {
    const result = validateJSON('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Message cannot be empty');
  });

  /**
   * Property: Whitespace-only strings should be invalid
   */
  it('should return invalid for whitespace-only message', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s+$/), // Only whitespace
        (whitespace) => {
          const result = validateJSON(whitespace);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Message cannot be empty');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Validation is consistent - same input always gives same result
   */
  it('should return consistent results for the same input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result1 = validateJSON(input);
        const result2 = validateJSON(input);

        expect(result1.isValid).toBe(result2.isValid);
        expect(result1.error).toBe(result2.error);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: If validation says it's valid, JSON.parse should not throw
   */
  it('should ensure JSON.parse succeeds for valid inputs', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = validateJSON(input);

        if (result.isValid) {
          // If validation says it's valid, parsing should not throw
          expect(() => JSON.parse(input)).not.toThrow();
        } else {
          // If validation says it's invalid, parsing should throw or input is empty
          if (input.trim()) {
            expect(() => JSON.parse(input)).toThrow();
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Complex nested JSON should be validated correctly
   */
  it('should validate complex nested JSON structures', () => {
    fc.assert(
      fc.property(
        fc.record({
          header: fc.record({
            seq: fc.integer(),
            stamp: fc.record({
              sec: fc.integer(),
              nsec: fc.integer(),
            }),
            frame_id: fc.string(),
          }),
          data: fc.oneof(
            fc.string(),
            fc.integer(),
            fc.double(),
            fc.boolean(),
            fc.array(fc.integer())
          ),
        }),
        (complexObject) => {
          const jsonString = JSON.stringify(complexObject);
          const result = validateJSON(jsonString);

          expect(result.isValid).toBe(true);
          expect(result.error).toBeNull();

          // Verify parsing succeeds
          const parsed = JSON.parse(jsonString);
          expect(parsed).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });
});
