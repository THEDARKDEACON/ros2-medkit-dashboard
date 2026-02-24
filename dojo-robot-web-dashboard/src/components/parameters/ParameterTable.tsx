import { useState, useMemo } from 'react';
import { Settings, Search, Check, X, RotateCcw, AlertCircle } from 'lucide-react';
import { useParameters, useUpdateParameter } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState, EmptyErrorState } from '@/components/common/EmptyState';
import type { Parameter } from '@/types/api';

interface ParameterTableProps {
  /**
   * The ID of the component to view parameters for
   */
  componentId: string;
  /**
   * Callback when a parameter is selected for detailed editing
   */
  onSelectParameter?: (parameter: Parameter) => void;
}

/**
 * ParameterTable - Display and edit component parameters
 * 
 * Features:
 * - Display parameters in table with name, value, type, description
 * - Group parameters by namespace/category
 * - Inline editing with type-appropriate inputs
 * - Validation errors display
 * - Search and filter functionality
 * - Error handling with retry logic
 * 
 * **Validates: Requirements 6.2, 6.3, 6.5**
 */
export function ParameterTable({
  componentId,
  onSelectParameter,
}: ParameterTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch parameters
  const {
    data: parameters,
    isLoading,
    error,
    refetch,
  } = useParameters(componentId);

  // Update parameter mutation
  const updateParameter = useUpdateParameter();

  // Filter parameters based on search
  const filteredParameters = useMemo(() => {
    if (!parameters) return [];

    if (!searchTerm) return parameters;

    const searchLower = searchTerm.toLowerCase();
    return parameters.filter(
      (param) =>
        param.name.toLowerCase().includes(searchLower) ||
        param.description?.toLowerCase().includes(searchLower) ||
        param.namespace?.toLowerCase().includes(searchLower)
    );
  }, [parameters, searchTerm]);

  // Group parameters by namespace
  const groupedParameters = useMemo(() => {
    const groups: Record<string, Parameter[]> = {};

    filteredParameters.forEach((param) => {
      const namespace = param.namespace || 'General';
      if (!Array.isArray(groups[namespace])) {
        groups[namespace] = [];
      }
      groups[namespace].push(param);
    });

    return groups;
  }, [filteredParameters]);

  // Start editing a parameter
  const handleStartEdit = (param: Parameter) => {
    setEditingParam(param.name);
    // Handle objects and arrays with JSON.stringify
    const valueStr = param.value === null || param.value === undefined
      ? ''
      : typeof param.value === 'object'
      ? JSON.stringify(param.value)
      : String(param.value);
    setEditValue(valueStr);
    setValidationError(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingParam(null);
    setEditValue('');
    setValidationError(null);
  };

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
  const handleSaveEdit = async (param: Parameter) => {
    const validation = validateValue(param, editValue);
    
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid value');
      return;
    }

    try {
      await updateParameter.mutateAsync({
        componentId,
        paramName: param.name,
        value: validation.parsedValue,
      });
      setEditingParam(null);
      setEditValue('');
      setValidationError(null);
    } catch (err) {
      setValidationError('Failed to update parameter');
    }
  };

  // Get input type for parameter
  const getInputType = (param: Parameter): string => {
    switch (param.type) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'text';
      default:
        return 'text';
    }
  };

  // Render parameter value
  const renderValue = (param: Parameter) => {
    // Handle null/undefined first
    if (param.value === null || param.value === undefined) {
      return <span className="text-sm text-muted-foreground italic">null</span>;
    }

    // Check actual value type, not just the param.type field
    const actualType = typeof param.value;
    const isArray = Array.isArray(param.value);
    const isObject = actualType === 'object' && !isArray;

    // Handle boolean type explicitly
    if (actualType === 'boolean') {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
            param.value
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
          }`}
        >
          {param.value ? 'true' : 'false'}
        </span>
      );
    }

    // Handle arrays and objects
    if (isArray || isObject) {
      try {
        return (
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {JSON.stringify(param.value)}
          </code>
        );
      } catch {
        return (
          <code className="text-xs bg-muted px-2 py-1 rounded">
            [Complex Object]
          </code>
        );
      }
    }

    // For primitive types (string, number), safely convert to string
    if (actualType === 'string' || actualType === 'number') {
      return <span className="text-sm">{String(param.value)}</span>;
    }

    // Fallback for any other type
    return <span className="text-sm text-muted-foreground italic">[Unknown type]</span>;
  };

  // Handle retry
  const handleRetry = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading parameters..." />;
  }

  // Error state
  if (error) {
    return (
      <EmptyErrorState
        title="Failed to load parameters"
        description="Unable to fetch the parameters list. Please try again."
        onRetry={handleRetry}
      />
    );
  }

  // Empty state - no parameters
  if (!parameters || parameters.length === 0) {
    return (
      <EmptyState
        title="No parameters available"
        description="This component has no configurable parameters."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-foreground">Parameters</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {parameters.length} parameter{parameters.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search parameters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Search parameters"
          data-testid="search-parameters-input"
        />
      </div>

      {/* Parameters Table */}
      {filteredParameters.length === 0 ? (
        <EmptyState
          title="No matching parameters"
          description="Try adjusting your search criteria."
          size="sm"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedParameters).map(([namespace, params]) => (
            <div key={namespace} className="space-y-2">
              {/* Namespace Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h4 className="font-medium text-sm text-foreground">{namespace}</h4>
                <span className="text-xs text-muted-foreground">
                  ({params.length})
                </span>
              </div>

              {/* Parameters in this namespace */}
              <div className="space-y-2">
                {params.map((param) => (
                  <div
                    key={param.name}
                    className="p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Parameter Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-medium text-sm text-foreground">
                            {param.name}
                          </h5>
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-muted text-muted-foreground">
                            {param.type}
                          </span>
                        </div>

                        {param.description && (
                          <p className="text-xs text-muted-foreground">
                            {param.description}
                          </p>
                        )}

                        {/* Value Display or Edit */}
                        {editingParam === param.name ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type={getInputType(param)}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                autoFocus
                                data-testid={`param-input-${param.name}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveEdit(param);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleSaveEdit(param)}
                                disabled={updateParameter.isPending}
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                                aria-label="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={updateParameter.isPending}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                                aria-label="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {validationError && (
                              <div className="flex items-center gap-2 text-xs text-destructive">
                                <AlertCircle className="h-3 w-3" />
                                <span>{validationError}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Value:</span>
                            {renderValue(param)}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {editingParam !== param.name && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(param)}
                            className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                            data-testid={`edit-param-${param.name}`}
                            aria-label={`Edit ${param.name}`}
                          >
                            Edit
                          </button>
                          {onSelectParameter && (
                            <button
                              onClick={() => onSelectParameter(param)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                              aria-label={`View details for ${param.name}`}
                              data-testid={`view-details-${param.name}`}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
