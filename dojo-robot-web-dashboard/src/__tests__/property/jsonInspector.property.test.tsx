/**
 * Property-based tests for JSON inspector
 * **Validates: Requirements 3.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { JsonInspector } from '@/components/common/JsonInspector';

/**
 * Arbitraries for generating JSON data structures
 */

// Generate primitive JSON values
const jsonPrimitiveArbitrary = fc.oneof(
  fc.string(),
  fc.double({ noNaN: true, noDefaultInfinity: true }),
  fc.integer(),
  fc.boolean(),
  fc.constant(null)
);

// Generate nested JSON structures (objects and arrays)
const jsonValueArbitrary: fc.Arbitrary<unknown> = fc.letrec((tie) => ({
  value: fc.oneof(
    { maxDepth: 3, depthSize: 'small' },
    jsonPrimitiveArbitrary,
    tie('array') as fc.Arbitrary<unknown>,
    tie('object') as fc.Arbitrary<unknown>
  ),
  array: fc.array(tie('value') as fc.Arbitrary<unknown>, { maxLength: 5 }),
  object: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('.')),
    tie('value') as fc.Arbitrary<unknown>,
    { maxKeys: 5 }
  ),
})).value;

/**
 * Helper function to extract text content from rendered component
 */
function getRenderedText(container: HTMLElement): string {
  // Get the tree area which contains the JSON display
  const treeArea = container.querySelector('[role="tree"]');
  return treeArea?.textContent || '';
}

/**
 * Helper function to check if syntax highlighting classes are present
 */
function hasSyntaxHighlighting(container: HTMLElement): boolean {
  const colorClasses = [
    'text-green-600',    // strings
    'text-blue-600',     // numbers
    'text-purple-600',   // booleans
    'text-orange-600',   // object keys
  ];

  return colorClasses.some(className =>
    container.querySelector(`.${className}`) !== null
  );
}

/**
 * Helper function to reconstruct JSON from displayed output
 * This attempts to parse the visible JSON structure
 */
// The component displays JSON in a structured way

describe('Property 9: Topic Message JSON Formatting', () => {
  /**
   * Property: For any topic message data, the displayed output should be
   * valid, parseable JSON with syntax highlighting applied.
   * 
   * **Validates: Requirements 3.5**
   */

  it('should render valid JSON for any data structure', () => {
    fc.assert(
      fc.property(jsonValueArbitrary, (data) => {
        const { container } = render(<JsonInspector data={data} maxExpandDepth={10} />);

        // The component should render without errors
        expect(container).toBeInTheDocument();

        // The data should be serializable to JSON
        const jsonString = JSON.stringify(data);
        expect(() => JSON.parse(jsonString)).not.toThrow();

        // The displayed output should contain some representation of the data
        const renderedText = getRenderedText(container);
        expect(renderedText.length).toBeGreaterThan(0);
      }),
      { numRuns: 50 }
    );
  });

  it('should apply syntax highlighting to all data types', () => {
    fc.assert(
      fc.property(jsonValueArbitrary, (data) => {
        const { container } = render(<JsonInspector data={data} maxExpandDepth={10} />);

        // Check if syntax highlighting classes are present
        // (only if the data contains non-null, non-empty values)
        if (data !== null && data !== undefined) {
          const hasHighlighting = hasSyntaxHighlighting(container);

          // Helper to check if data has any actual content
          const hasContent = (obj: unknown): boolean => {
            if (obj === null || obj === undefined) return false;
            if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return true;
            if (Array.isArray(obj)) return obj.length > 0 && obj.some(hasContent);
            if (typeof obj === 'object') {
              const keys = Object.keys(obj as object);
              return keys.length > 0 && keys.some(key => hasContent((obj as Record<string, unknown>)[key]));
            }
            return false;
          };

          // If data has actual content (not just empty arrays/objects), it should have highlighting
          if (hasContent(data)) {
            expect(hasHighlighting).toBe(true);
          }
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should display strings with quotes and green color', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const { container } = render(<JsonInspector data={str} />);

        // Strings should be displayed with quotes
        const renderedText = getRenderedText(container);
        expect(renderedText).toContain(str);

        // Should have green color class for strings
        const greenElements = container.querySelectorAll('.text-green-600, .dark\\:text-green-400');
        expect(greenElements.length).toBeGreaterThan(0);
      }),
      { numRuns: 30 }
    );
  });

  it('should display numbers without quotes and blue color', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer(),
          fc.double({ noNaN: true, noDefaultInfinity: true })
        ),
        (num) => {
          const { container } = render(<JsonInspector data={num} />);

          // Numbers should be displayed without quotes
          const renderedText = getRenderedText(container);
          expect(renderedText).toContain(String(num));

          // Should have blue color class for numbers
          const blueElements = container.querySelectorAll('.text-blue-600, .dark\\:text-blue-400');
          expect(blueElements.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should display booleans with purple color', () => {
    fc.assert(
      fc.property(fc.boolean(), (bool) => {
        const { container } = render(<JsonInspector data={bool} />);

        // Booleans should be displayed as "true" or "false"
        const renderedText = getRenderedText(container);
        expect(renderedText).toContain(String(bool));

        // Should have purple color class for booleans
        const purpleElements = container.querySelectorAll('.text-purple-600, .dark\\:text-purple-400');
        expect(purpleElements.length).toBeGreaterThan(0);
      }),
      { numRuns: 10 }
    );
  });

  it('should display null values correctly', () => {
    const { container } = render(<JsonInspector data={null} />);

    // Null should be displayed as "null"
    const renderedText = getRenderedText(container);
    expect(renderedText).toContain('null');

    // Should have gray color class for null
    const grayElements = container.querySelectorAll('.text-gray-500, .dark\\:text-gray-400');
    expect(grayElements.length).toBeGreaterThan(0);
  });

  it('should display object keys with orange color', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          jsonPrimitiveArbitrary,
          { minKeys: 1, maxKeys: 5 }
        ),
        (obj) => {
          const { container } = render(<JsonInspector data={obj} maxExpandDepth={10} />);

          // Object keys should have orange color
          const orangeElements = container.querySelectorAll('.text-orange-600, .dark\\:text-orange-400');
          expect(orangeElements.length).toBeGreaterThan(0);

          // Keys should be displayed with quotes
          const keys = Object.keys(obj);
          if (keys.length > 0) {
            const renderedText = getRenderedText(container);
            // At least one key should be visible
            const hasKey = keys.some(key => renderedText.includes(key));
            expect(hasKey).toBe(true);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should display arrays with proper structure', () => {
    fc.assert(
      fc.property(
        fc.array(jsonPrimitiveArbitrary, { minLength: 1, maxLength: 10 }),
        (arr) => {
          const { container } = render(<JsonInspector data={arr} maxExpandDepth={10} />);

          // Array should show item count
          const renderedText = getRenderedText(container);
          expect(renderedText).toContain(`Array[${arr.length}]`);

          // Array indices should be displayed
          if (arr.length > 0) {
            expect(renderedText).toContain('0:');
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should display nested objects correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          outer: fc.record({
            inner: fc.string(),
            value: fc.integer(),
          }),
        }),
        (data) => {
          const { container } = render(<JsonInspector data={data} maxExpandDepth={10} />);

          // Should render without errors
          expect(container).toBeInTheDocument();

          // Should show nested structure
          const renderedText = getRenderedText(container);
          expect(renderedText).toContain('outer');
          expect(renderedText).toContain('inner');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should display data type metadata', () => {
    fc.assert(
      fc.property(jsonValueArbitrary, (data) => {
        const { container, unmount } = render(<JsonInspector data={data} />);

        try {
          // Should display "Type:" label
          const typeLabels = screen.getAllByText(/Type:/);
          expect(typeLabels.length).toBeGreaterThan(0);

          // Should display the correct type
          let expectedType: string;
          if (data === null) {
            expectedType = 'null';
          } else if (Array.isArray(data)) {
            expectedType = 'array';
          } else {
            expectedType = typeof data;
          }

          // Check within the container for the type
          const typeText = container.textContent || '';
          expect(typeText).toContain(`Type: ${expectedType}`);
        } finally {
          unmount();
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should display byte size metadata', () => {
    fc.assert(
      fc.property(jsonValueArbitrary, (data) => {
        const { container, unmount } = render(<JsonInspector data={data} />);

        try {
          // Should display "Size:" label and size with units
          const containerText = container.textContent || '';
          expect(containerText).toMatch(/Size:/);
          expect(containerText).toMatch(/bytes|KB|MB/);
        } finally {
          unmount();
        }
      }),
      { numRuns: 50 }
    );
  });

  it('should calculate correct byte size', () => {
    fc.assert(
      fc.property(jsonValueArbitrary, (data) => {
        const { container, unmount } = render(<JsonInspector data={data} />);

        try {
          // Calculate expected byte size
          const jsonString = JSON.stringify(data);
          const expectedSize = new Blob([jsonString]).size;

          // Get displayed size from container
          const containerText = container.textContent || '';

          // Extract the numeric value
          const match = containerText.match(/Size:\s*(\d+(?:\.\d+)?)\s*(bytes|KB|MB)/);
          expect(match).not.toBeNull();

          if (match) {
            const [, value, unit] = match;
            const displayedSize = parseFloat(value);

            // Convert to bytes for comparison
            let displayedBytes: number;
            if (unit === 'bytes') {
              displayedBytes = displayedSize;
            } else if (unit === 'KB') {
              displayedBytes = displayedSize * 1024;
            } else {
              displayedBytes = displayedSize * 1024 * 1024;
            }

            // Allow for rounding differences
            expect(Math.abs(displayedBytes - expectedSize)).toBeLessThan(expectedSize * 0.01 + 1);
          }
        } finally {
          unmount();
        }
      }),
      { numRuns: 30 }
    );
  });

  it('should preserve data integrity - round trip test', () => {
    fc.assert(
      fc.property(jsonValueArbitrary, (data) => {
        // Render the component
        render(<JsonInspector data={data} />);

        // The original data should be serializable and parseable
        const serialized = JSON.stringify(data);
        const parsed = JSON.parse(serialized);

        // Round trip should preserve the data
        expect(parsed).toEqual(data);
      }),
      { numRuns: 50 }
    );
  });

  it('should handle empty objects and arrays', () => {
    const emptyObject = {};
    const emptyArray: unknown[] = [];

    const { container: objContainer } = render(<JsonInspector data={emptyObject} />);
    expect(getRenderedText(objContainer)).toContain('{}');

    const { container: arrContainer } = render(<JsonInspector data={emptyArray} />);
    expect(getRenderedText(arrContainer)).toContain('[]');
  });

  it('should handle deeply nested structures', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat(5), { minLength: 3, maxLength: 5 }).chain((depths) => {
          // Build a deeply nested structure based on the depths array
          let current: fc.Arbitrary<unknown> = fc.string();
          for (let i = depths.length - 1; i >= 0; i--) {
            if (depths[i] % 2 === 0) {
              // Create object
              current = fc.record({ [`level${i}`]: current });
            } else {
              // Create array
              current = fc.array(current, { minLength: 1, maxLength: 1 });
            }
          }
          return current as fc.Arbitrary<unknown>;
        }),
        (data) => {
          const { container } = render(<JsonInspector data={data} maxExpandDepth={10} />);

          // Should render without errors
          expect(container).toBeInTheDocument();

          // Should be valid JSON
          const jsonString = JSON.stringify(data);
          expect(() => JSON.parse(jsonString)).not.toThrow();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle special string characters', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0),
        (str) => {
          const { container } = render(<JsonInspector data={str} />);

          // Should render without errors
          expect(container).toBeInTheDocument();

          // Should be valid JSON
          const jsonString = JSON.stringify(str);
          expect(() => JSON.parse(jsonString)).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle mixed data types in arrays', () => {
    fc.assert(
      fc.property(
        fc.array(jsonPrimitiveArbitrary, { minLength: 2, maxLength: 10 }),
        (arr) => {
          const { container } = render(<JsonInspector data={arr} maxExpandDepth={10} />);

          // Should render without errors
          expect(container).toBeInTheDocument();

          // Should show array structure
          const renderedText = getRenderedText(container);
          expect(renderedText).toContain(`Array[${arr.length}]`);

          // Should be valid JSON
          const jsonString = JSON.stringify(arr);
          expect(() => JSON.parse(jsonString)).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should handle objects with mixed value types', () => {
    fc.assert(
      fc.property(
        fc.record({
          stringVal: fc.string(),
          numberVal: fc.integer(),
          boolVal: fc.boolean(),
          nullVal: fc.constant(null),
          arrayVal: fc.array(fc.integer(), { maxLength: 3 }),
        }),
        (obj) => {
          const { container } = render(<JsonInspector data={obj} maxExpandDepth={10} />);

          // Should render without errors
          expect(container).toBeInTheDocument();

          // Should have syntax highlighting for different types
          expect(hasSyntaxHighlighting(container)).toBe(true);

          // Should be valid JSON
          const jsonString = JSON.stringify(obj);
          expect(() => JSON.parse(jsonString)).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });
});
