import { useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, Save, X } from 'lucide-react';
import { useParameterDetail, useUpdateParameter, useResetParameter } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyErrorState } from '@/components/common/EmptyState';
import type { Parameter } from '@/types/api';

interface ParameterEditorProps {
  /**
   * The ID of the component
   */
  componentId: string;
  /**
   * The name of the parameter to edit
   */
  parameterName: string;
  /**
   * Callback when editing is complete
   */
  onClose?: () => void;
}

/**
 * ParameterEditor - Detailed parameter editing form
 * 
 * Features:
 * - Detailed parameter editing form
 * - Constraint validation (min, max, enum values)
 * - Display validation errors clearly
 * - Reset to default button
 * - Show success/error notifications
 * 
 * **Validates: Requirements 6.6, 6.8, 6.9, 6.10**
 */
export function ParameterEditor({
  componentId,
  parameterName,
  onClose,
}: ParameterEditorProps) {
  const [editValue, setEditValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch parameter details
  const {
    data: parameter,
    isLoading,
    error,
    refetch,
  } = useParameterDetail(componentId, parameterName);

  // Update parameter mutation
  const updateParameter = useUpdateParameter();

  // Reset parameter mutation
  const resetParameter = useResetParameter();

  // Initialize edit value when parameter loads
  useEffect(() => {
    if (parameter) {
      setEditValue(String(parameter.value ?? ''));
    }
  }, [parameter]);

  // Validate parameter value
  const validateValue = (param: Parameter, value: string): { valid: boolean; error?: string; parsedValue?: unknown } => {
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
  };

  // Save parameter value
  const handleSave = async () => {
    if (!parameter) return;

    const validation = validateValue(parameter, editValue);
    
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid value');
      setSuccessMessage(null);
      return;
    }

    try {
      await updateParameter.mutateAsync({
        componentId,
        paramName: parameterName,
        value: validation.parsedValue,
      });
      setValidationError(null);
      setSuccessMessage('Parameter updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setValidationError('Failed to update parameter');
      setSuccessMessage(null);
    }
  };

  // Reset parameter to default
  const handleReset = async () => {
    try {
      await resetParameter.mutateAsync({
        componentId,
        paramName: parameterName,
      });
      setValidationError(null);
      setSuccessMessage('Parameter reset to default');
      setTimeout(() => setSuccessMessage(null), 3000);
      // Refetch to get the default value
      refetch();
    } catch (err) {
      setValidationError('Failed to reset parameter');
      setSuccessMessage(null);
    }
  };

  // Handle retry
  const handleRetry = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading parameter details..." />;
  }

  // Error state
  if (error || !parameter) {
    return (
      <EmptyErrorState
        title="Failed to load parameter"
        description="Unable to fetch parameter details. Please try again."
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{parameter.name}</h3>
          {parameter.description && (
            <p className="text-sm text-muted-foreground mt-1">{parameter.description}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Parameter Info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <p className="text-sm font-medium text-foreground mt-1">{parameter.type}</p>
        </div>
        {parameter.namespace && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Namespace</span>
            <p className="text-sm font-medium text-foreground mt-1">{parameter.namespace}</p>
          </div>
        )}
        {parameter.constraints?.min !== undefined && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Minimum</span>
            <p className="text-sm font-medium text-foreground mt-1">{parameter.constraints.min}</p>
          </div>
        )}
        {parameter.constraints?.max !== undefined && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Maximum</span>
            <p className="text-sm font-medium text-foreground mt-1">{parameter.constraints.max}</p>
          </div>
        )}
      </div>

      {/* Edit Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="param-value" className="block text-sm font-medium text-foreground mb-2">
            Value
          </label>
          
          {/* Enum dropdown */}
          {parameter.constraints?.enum ? (
            <select
              id="param-value"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {parameter.constraints.enum.map((option) => (
                <option key={String(option)} value={String(option)}>
                  {String(option)}
                </option>
              ))}
            </select>
          ) : parameter.type === 'boolean' ? (
            /* Boolean select */
            <select
              id="param-value"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : parameter.type === 'array' || parameter.type === 'object' ? (
            /* Textarea for complex types */
            <textarea
              id="param-value"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-input rounded-md bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={parameter.type === 'array' ? '["value1", "value2"]' : '{"key": "value"}'}
            />
          ) : (
            /* Regular input */
            <input
              id="param-value"
              type={parameter.type === 'number' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}

          {/* Constraints hint */}
          {parameter.constraints && (
            <p className="text-xs text-muted-foreground mt-2">
              {parameter.constraints.min !== undefined && parameter.constraints.max !== undefined && (
                <>Range: {parameter.constraints.min} - {parameter.constraints.max}</>
              )}
              {parameter.constraints.pattern && (
                <>Pattern: {parameter.constraints.pattern}</>
              )}
            </p>
          )}
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{validationError}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <span className="text-sm text-green-700 dark:text-green-400">{successMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={updateParameter.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
          <button
            onClick={handleReset}
            disabled={resetParameter.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
