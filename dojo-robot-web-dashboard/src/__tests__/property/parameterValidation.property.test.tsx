/**
 * Property-based tests for operation parameter validation
 * 
 * **Validates: Requirements 5.4, 5.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OperationExecutor } from '@/components/operations/OperationExecutor';
import type { Operation, ParameterDefinition } from '@/types/api';

// Test wrapper with React Query provider
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Arbitraries for generating test data
const parameterTypeArb = fc.constantFrom(
  'string',
  'number',
  'int',
  'float',
  'double',
  'boolean',
  'bool',
  'array',
  'object',
  'json'
);

const parameterDefinitionArb = fc.record({
  name: fc.stringMatching(/^[a-z_][a-z0-9_]*$/),
  type: parameterTypeArb,
  required: fc.boolean(),
  description: fc.option(fc.string(), { nil: undefined }),
  default: fc.option(fc.oneof(
    fc.string(),
    fc.integer(),
    fc.double(),
    fc.boolean(),
    fc.constant(null)
  ), { nil: undefined }),
}) as fc.Arbitrary<ParameterDefinition>;

const operationArb = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[a-z_][a-z0-9_]*$/),
  type: fc.constantFrom('service', 'action'),
  parameters: fc.array(parameterDefinitionArb, { minLength: 0, maxLength: 5 }),
  description: fc.option(fc.string(), { nil: undefined }),
}) as fc.Arbitrary<Operation>;

describe('Operation Parameter Validation - Property Tests', () => {
  describe('Property 19: Operation Parameter Form Display', () => {
    /**
     * **Property 19: Operation parameter form display**
     * 
     * For any operation selected, the dashboard should display a form containing
     * input fields for all of the operation's parameters.
     * 
     * **Validates: Requirements 5.4**
     */
    it('should display input fields for all operation parameters', () => {
      fc.assert(
        fc.property(operationArb, (operation) => {
          // Skip operations with no parameters
          if (operation.parameters.length === 0) {
            return true;
          }

          const { container } = render(
            <TestWrapper>
              <OperationExecutor
                componentId="test-component"
                operation={operation}
              />
            </TestWrapper>
          );

          // Check that each parameter has an input field
          operation.parameters.forEach((param) => {
            const input = container.querySelector(`#param-${param.name}`);
            expect(input).toBeTruthy();
            
            // Verify input type matches parameter type
            if (['array', 'object', 'json'].includes(param.type.toLowerCase())) {
              expect(input?.tagName).toBe('TEXTAREA');
            } else {
              expect(input?.tagName).toBe('INPUT');
            }
          });

          return true;
        }),
        { numRuns: 50 }
      );
    });

    it('should display parameter metadata (name, type, required, description)', () => {
      fc.assert(
        fc.property(operationArb, (operation) => {
          // Skip operations with no parameters
          if (operation.parameters.length === 0) {
            return true;
          }

          const { container } = render(
            <TestWrapper>
              <OperationExecutor
                componentId="test-component"
                operation={operation}
              />
            </TestWrapper>
          );

          // Check that each parameter displays its metadata
          operation.parameters.forEach((param) => {
            // Parameter name should be in a label
            const label = container.querySelector(`label[for="param-${param.name}"]`);
            expect(label).toBeTruthy();
            expect(label?.textContent).toContain(param.name);

            // Type should be displayed in the label
            expect(label?.textContent).toContain(`(${param.type})`);

            // Required indicator should be present if required
            if (param.required) {
              const requiredSpan = label?.querySelector('span[aria-label="required"]');
              expect(requiredSpan).toBeTruthy();
            }

            // Description should be displayed if present
            if (param.description) {
              const descElement = container.querySelector(`label[for="param-${param.name}"] + p`);
              expect(descElement?.textContent).toBe(param.description);
            }
          });

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 20: Operation Parameter Validation', () => {
    /**
     * **Property 20: Operation parameter validation**
     * 
     * For any operation with required parameters, if any required parameter is
     * missing or has an invalid type, the execution button should be disabled
     * or submission should be prevented.
     * 
     * **Validates: Requirements 5.5**
     */
    it('should disable execute button when required parameters are missing', () => {
      fc.assert(
        fc.property(
          operationArb.filter((op) => op.parameters.some((p) => p.required)),
          (operation) => {
            const { container } = render(
              <TestWrapper>
                <OperationExecutor
                  componentId="test-component"
                  operation={operation}
                />
              </TestWrapper>
            );

            // Find the execute button
            const executeButton = container.querySelector('button[aria-label="Execute operation"]');
            
            // Button should be disabled when required parameters are empty
            expect(executeButton).toHaveAttribute('disabled');

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate parameter types and show errors for invalid values', () => {
      fc.assert(
        fc.property(
          fc.record({
            operation: operationArb.filter((op) => op.parameters.length > 0),
            invalidValue: fc.string(),
          }),
          ({ operation, invalidValue }) => {
            const { container } = render(
              <TestWrapper>
                <OperationExecutor
                  componentId="test-component"
                  operation={operation}
                />
              </TestWrapper>
            );

            // Find a number parameter to test type validation
            const numberParam = operation.parameters.find((p) =>
              ['number', 'int', 'float', 'double'].includes(p.type)
            );

            if (!numberParam) {
              return true; // Skip if no number parameter
            }

            // Enter an invalid value (non-numeric string)
            const input = container.querySelector(`#param-${numberParam.name}`) as HTMLInputElement;
            if (!input) return true;

            // Simulate entering invalid text for a number field
            const invalidText = invalidValue.replace(/[0-9.]/g, 'x');
            if (invalidText && invalidText !== invalidValue) {
              input.value = invalidText;
              input.dispatchEvent(new Event('change', { bubbles: true }));

              // Execute button should be disabled due to validation error
              const executeButton = container.querySelector('button[aria-label="Execute operation"]');
              expect(executeButton).toHaveAttribute('disabled');
            }

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should enable execute button when all required parameters are valid', () => {
      fc.assert(
        fc.property(
          fc.record({
            operation: operationArb.filter((op) => 
              op.parameters.length > 0 && op.parameters.every((p) => !p.required)
            ),
          }),
          ({ operation }) => {
            const { container } = render(
              <TestWrapper>
                <OperationExecutor
                  componentId="test-component"
                  operation={operation}
                />
              </TestWrapper>
            );

            // Find the execute button
            const executeButton = container.querySelector('button[aria-label="Execute operation"]');
            
            // Button should be enabled when no required parameters or all are filled
            expect(executeButton).not.toHaveAttribute('disabled');

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate JSON format for array/object parameters', () => {
      fc.assert(
        fc.property(
          operationArb.filter((op) =>
            op.parameters.some((p) => ['array', 'object', 'json'].includes(p.type))
          ),
          (operation) => {
            const { container } = render(
              <TestWrapper>
                <OperationExecutor
                  componentId="test-component"
                  operation={operation}
                />
              </TestWrapper>
            );

            // Find an array/object parameter
            const jsonParam = operation.parameters.find((p) =>
              ['array', 'object', 'json'].includes(p.type)
            );

            if (!jsonParam) return true;

            // Enter invalid JSON
            const textarea = container.querySelector(`#param-${jsonParam.name}`) as HTMLTextAreaElement;
            if (!textarea) return true;

            textarea.value = '{invalid json}';
            textarea.dispatchEvent(new Event('change', { bubbles: true }));

            // Execute button should be disabled due to invalid JSON
            const executeButton = container.querySelector('button[aria-label="Execute operation"]');
            expect(executeButton).toHaveAttribute('disabled');

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should validate boolean parameters accept only true/false', () => {
      fc.assert(
        fc.property(
          operationArb.filter((op) =>
            op.parameters.some((p) => ['boolean', 'bool'].includes(p.type))
          ),
          (operation) => {
            const { container } = render(
              <TestWrapper>
                <OperationExecutor
                  componentId="test-component"
                  operation={operation}
                />
              </TestWrapper>
            );

            // Find a boolean parameter
            const boolParam = operation.parameters.find((p) =>
              ['boolean', 'bool'].includes(p.type)
            );

            if (!boolParam) return true;

            // Enter invalid boolean value
            const input = container.querySelector(`#param-${boolParam.name}`) as HTMLInputElement;
            if (!input) return true;

            input.value = 'maybe';
            input.dispatchEvent(new Event('change', { bubbles: true }));

            // Execute button should be disabled due to invalid boolean
            const executeButton = container.querySelector('button[aria-label="Execute operation"]');
            expect(executeButton).toHaveAttribute('disabled');

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
