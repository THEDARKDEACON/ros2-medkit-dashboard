import { useState, useMemo } from 'react';
import { Play, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import { useExecuteOperation } from '@/features/api/hooks';
import type { Operation } from '@/types/api';

interface OperationExecutorProps {
  /**
   * The ID of the component to execute the operation on
   */
  componentId: string;
  /**
   * The operation to execute
   */
  operation: Operation;
  /**
   * Callback when execution is initiated
   */
  onExecutionStarted?: (executionId: string) => void;
}

/**
 * Validate parameter value against its type
 * Note: This function assumes value is non-empty (caller should check for required fields separately)
 */
function validateParameterValue(value: string, type: string): { isValid: boolean; error?: string } {
  const trimmedValue = value.trim();
  
  // Empty values are considered valid here (required check is done separately)
  if (!trimmedValue) {
    return { isValid: true };
  }

  try {
    switch (type) {
      case 'number':
      case 'int':
      case 'float':
      case 'double':
        const num = Number(trimmedValue);
        if (isNaN(num)) {
          return { isValid: false, error: 'Must be a valid number' };
        }
        return { isValid: true };

      case 'boolean':
      case 'bool':
        const lower = trimmedValue.toLowerCase();
        if (lower !== 'true' && lower !== 'false') {
          return { isValid: false, error: 'Must be true or false' };
        }
        return { isValid: true };

      case 'string':
        return { isValid: true };

      case 'array':
      case 'object':
      case 'json':
        JSON.parse(trimmedValue);
        return { isValid: true };

      default:
        // For unknown types, try to parse as JSON
        JSON.parse(trimmedValue);
        return { isValid: true };
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid value format',
    };
  }
}

/**
 * Normalize default value to a valid string representation for the parameter type
 * Returns empty string if the default value is invalid for the type
 */
function normalizeDefaultValue(defaultValue: unknown, type: string): string {
  if (defaultValue === undefined || defaultValue === null) {
    return '';
  }

  try {
    switch (type.toLowerCase()) {
      case 'boolean':
      case 'bool':
        // Only accept actual boolean values or valid string representations
        if (typeof defaultValue === 'boolean') {
          return String(defaultValue);
        }
        if (typeof defaultValue === 'string') {
          const lower = defaultValue.toLowerCase();
          if (lower === 'true' || lower === 'false') {
            return lower;
          }
        }
        // Invalid boolean default (including numbers like 0 or 1)
        return '';

      case 'number':
      case 'int':
      case 'float':
      case 'double':
        // Only accept numbers or numeric strings
        if (typeof defaultValue === 'number') {
          if (isNaN(defaultValue)) {
            return '';
          }
          return String(defaultValue);
        }
        if (typeof defaultValue === 'string') {
          const num = Number(defaultValue);
          if (isNaN(num)) {
            return '';
          }
          return String(num);
        }
        // Invalid numeric default
        return '';

      case 'string':
        // For strings, only accept string or number types (not objects/arrays/booleans)
        if (typeof defaultValue === 'string') {
          return defaultValue;
        }
        if (typeof defaultValue === 'number') {
          return String(defaultValue);
        }
        // Invalid string default (reject booleans, objects, arrays)
        return '';

      case 'array':
      case 'object':
      case 'json':
        if (typeof defaultValue === 'string') {
          // Validate it's valid JSON
          JSON.parse(defaultValue);
          return defaultValue;
        } else if (typeof defaultValue === 'object') {
          return JSON.stringify(defaultValue);
        }
        // Invalid JSON default
        return '';

      default:
        // For unknown types, try to convert to string
        if (typeof defaultValue === 'object') {
          return JSON.stringify(defaultValue);
        }
        return String(defaultValue);
    }
  } catch (error) {
    // If normalization fails, return empty string
    return '';
  }
}

/**
 * Convert string value to appropriate type
 */
function convertParameterValue(value: string, type: string): unknown {
  switch (type) {
    case 'number':
    case 'int':
    case 'float':
    case 'double':
      return Number(value);

    case 'boolean':
    case 'bool':
      return value.toLowerCase() === 'true';

    case 'string':
      return value;

    case 'array':
    case 'object':
    case 'json':
      return JSON.parse(value);

    default:
      // For unknown types, try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
  }
}

/**
 * OperationExecutor - Interface for executing ROS2 services and actions
 * 
 * Features:
 * - Dynamic parameter form generation from operation definition
 * - Parameter validation (types, required fields)
 * - Execute button with validation state
 * - Success/error notifications
 * - Execution result display
 */
export function OperationExecutor({
  componentId,
  operation,
  onExecutionStarted,
}: OperationExecutorProps) {
  const [parameters, setParameters] = useState<Record<string, string>>(() => {
    // Initialize with default values, normalizing and validating them
    const initial: Record<string, string> = {};
    operation.parameters.forEach((param) => {
      if (param.default !== undefined && param.default !== null) {
        // Normalize default value to valid string representation
        const normalizedValue = normalizeDefaultValue(param.default, param.type);
        initial[param.name] = normalizedValue;
      } else {
        initial[param.name] = '';
      }
    });
    return initial;
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [executionResult, setExecutionResult] = useState<unknown>(null);

  const executeOperation = useExecuteOperation();

  // Validate all parameters
  const validationResults = useMemo(() => {
    const results: Record<string, { isValid: boolean; error?: string }> = {};
    
    operation.parameters.forEach((param) => {
      const value = parameters[param.name] || '';
      
      // Check if required parameter is missing
      if (param.required && !value.trim()) {
        results[param.name] = { isValid: false, error: 'This field is required' };
        return;
      }

      // Skip validation for optional empty parameters
      if (!param.required && !value.trim()) {
        results[param.name] = { isValid: true };
        return;
      }

      // Validate parameter value
      results[param.name] = validateParameterValue(value, param.type);
    });

    return results;
  }, [parameters, operation.parameters]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return Object.values(validationResults).every((result) => result.isValid);
  }, [validationResults]);

  // Handle parameter change
  const handleParameterChange = (name: string, value: string) => {
    setParameters((prev) => ({ ...prev, [name]: value }));
    setShowSuccess(false);
    setShowError(false);
    setExecutionResult(null);
  };

  // Handle execute
  const handleExecute = async () => {
    if (!isFormValid) {
      return;
    }

    try {
      // Convert parameter values to appropriate types
      const convertedParams: Record<string, unknown> = {};
      operation.parameters.forEach((param) => {
        const value = parameters[param.name];
        if (value && value.trim()) {
          convertedParams[param.name] = convertParameterValue(value, param.type);
        }
      });

      const result = await executeOperation.mutateAsync({
        componentId,
        operationId: operation.id,
        parameters: convertedParams,
      });

      // Show success notification
      setShowSuccess(true);
      setShowError(false);
      setExecutionResult(result);
      setTimeout(() => setShowSuccess(false), 3000);

      // Notify parent if this is an action (has execution ID)
      if (result.id && operation.type === 'action') {
        onExecutionStarted?.(result.id);
      }
    } catch (error) {
      // Show error notification
      setShowError(true);
      setShowSuccess(false);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to execute operation'
      );
      setTimeout(() => setShowError(false), 5000);
    }
  };

  // Handle key press (Ctrl+Enter to execute)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (isFormValid) {
        handleExecute();
      }
    }
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileJson className="h-5 w-5" aria-hidden="true" />
              Execute {operation.type === 'service' ? 'Service' : 'Action'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {operation.name}
            </p>
            {operation.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {operation.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Parameter Form */}
      <div className="p-4 space-y-4">
        {operation.parameters.length === 0 ? (
          <div className="p-3 bg-muted/50 border border-border rounded-md">
            <p className="text-sm text-muted-foreground">
              This operation has no parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {operation.parameters.map((param) => {
              const validation = validationResults[param.name];
              const value = parameters[param.name] || '';
              const hasError = value && !validation.isValid;

              // Determine input type based on parameter type
              const isMultiline = ['array', 'object', 'json'].includes(param.type.toLowerCase());

              return (
                <div key={param.name} className="space-y-2">
                  <label
                    htmlFor={`param-${param.name}`}
                    className="block text-sm font-medium text-foreground"
                  >
                    {param.name}
                    {param.required && (
                      <span className="text-destructive ml-1" aria-label="required">
                        *
                      </span>
                    )}
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      ({param.type})
                    </span>
                  </label>

                  {param.description && (
                    <p className="text-xs text-muted-foreground">
                      {param.description}
                    </p>
                  )}

                  {isMultiline ? (
                    <textarea
                      id={`param-${param.name}`}
                      value={value}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        param.type === 'array'
                          ? '["item1", "item2"]'
                          : '{"key": "value"}'
                      }
                      className={`w-full h-24 px-3 py-2 font-mono text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y ${
                        hasError
                          ? 'border-destructive focus:ring-destructive'
                          : 'border-input'
                      }`}
                      aria-invalid={hasError}
                      aria-describedby={hasError ? `error-${param.name}` : undefined}
                      aria-required={param.required}
                    />
                  ) : (
                    <input
                      id={`param-${param.name}`}
                      type={param.type === 'number' || param.type === 'int' || param.type === 'float' || param.type === 'double' ? 'number' : 'text'}
                      value={value}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        param.type === 'boolean' || param.type === 'bool'
                          ? 'true or false'
                          : `Enter ${param.type}`
                      }
                      className={`w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        hasError
                          ? 'border-destructive focus:ring-destructive'
                          : 'border-input'
                      }`}
                      aria-invalid={hasError}
                      aria-describedby={hasError ? `error-${param.name}` : undefined}
                      aria-required={param.required}
                    />
                  )}

                  {hasError && (
                    <p
                      id={`error-${param.name}`}
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {validation.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Success Notification */}
        {showSuccess && (
          <div
            className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md"
            role="status"
          >
            <CheckCircle
              className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Operation executed successfully
              </p>
              {operation.type === 'service' && executionResult && (
                <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                  Service completed with result
                </p>
              )}
              {operation.type === 'action' && (
                <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                  Action started - monitor progress below
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {showError && (
          <div
            className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
            role="alert"
          >
            <AlertCircle
              className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                Failed to execute operation
              </p>
              <p className="text-sm text-destructive/80 mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Execution Result (for services) */}
        {executionResult && operation.type === 'service' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Result
            </label>
            <pre className="p-3 bg-muted border border-border rounded-md text-xs font-mono overflow-auto max-h-64">
              {JSON.stringify(executionResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Execute Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleExecute}
            disabled={!isFormValid || executeOperation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
            aria-label="Execute operation"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {executeOperation.isPending ? 'Executing...' : 'Execute'}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Tip: Press Ctrl+Enter to execute
        </p>
      </div>
    </div>
  );
}
