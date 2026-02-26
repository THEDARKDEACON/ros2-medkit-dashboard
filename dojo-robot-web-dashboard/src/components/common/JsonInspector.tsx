import { useState, useMemo, useCallback } from 'react';
import { Copy, Search, ChevronRight, ChevronDown, Check } from 'lucide-react';

interface JsonInspectorProps {
  /**
   * The JSON data to display
   */
  data: unknown;
  /**
   * Whether to expand all nodes by default
   */
  defaultExpanded?: boolean;
  /**
   * Whether to show the search functionality
   */
  searchable?: boolean;
  /**
   * Whether to show the copy to clipboard button
   */
  copyable?: boolean;
  /**
   * Maximum depth to auto-expand (0 = collapsed, Infinity = all expanded)
   */
  maxExpandDepth?: number;
}

interface JsonNodeProps {
  data: unknown;
  path: string;
  depth: number;
  searchTerm: string;
  expandedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  maxExpandDepth: number;
}

/**
 * Get the data type of a value
 */
function getDataType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Get the color class for a data type
 */
function getTypeColor(type: string): string {
  switch (type) {
    case 'string':
      return 'text-green-600 dark:text-green-400';
    case 'number':
      return 'text-blue-600 dark:text-blue-400';
    case 'boolean':
      return 'text-purple-600 dark:text-purple-400';
    case 'null':
      return 'text-gray-500 dark:text-gray-400';
    case 'undefined':
      return 'text-gray-500 dark:text-gray-400';
    default:
      return 'text-foreground';
  }
}

/**
 * Calculate the byte size of JSON data
 */
function calculateByteSize(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size;
}

/**
 * Check if a value or its children contain the search term
 */


/**
 * Render a JSON node (recursive component)
 */
function JsonNode({
  data,
  path,
  depth,
  searchTerm,
  expandedPaths,
  onTogglePath,
  maxExpandDepth
}: JsonNodeProps) {
  const type = getDataType(data);
  const isExpanded = expandedPaths.has(path) || (depth < maxExpandDepth);

  // Primitive values
  if (type === 'string') {
    const stringValue = data as string;
    const highlighted = searchTerm && stringValue.toLowerCase().includes(searchTerm.toLowerCase());
    return (
      <span className={getTypeColor(type)}>
        "{highlighted ? (
          <mark className="bg-yellow-200 dark:bg-yellow-900">{stringValue}</mark>
        ) : (
          stringValue
        )}"
      </span>
    );
  }

  if (type === 'number' || type === 'boolean') {
    return <span className={getTypeColor(type)}>{String(data)}</span>;
  }

  if (type === 'null') {
    return <span className={getTypeColor(type)}>null</span>;
  }

  if (data === undefined) {
    return <span className={getTypeColor('undefined')}>undefined</span>;
  }

  // Arrays
  if (Array.isArray(data)) {
    const arrayData = data as unknown[];

    if (arrayData.length === 0) {
      return <span className="text-muted-foreground">[]</span>;
    }

    return (
      <div className="inline-block">
        <button
          onClick={() => onTogglePath(path)}
          className="inline-flex items-center gap-1 hover:bg-muted/50 rounded px-1 -ml-1 transition-colors"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} array with ${arrayData.length} items`}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="text-muted-foreground">
            Array[{arrayData.length}]
          </span>
        </button>
        {isExpanded && (
          <div className="ml-4 border-l-2 border-muted pl-2 mt-1">
            {arrayData.map((item, index) => (
              <div key={index} className="py-0.5">
                <span className="text-muted-foreground mr-2">{index}:</span>
                <JsonNode
                  data={item}
                  path={`${path}[${index}]`}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                  expandedPaths={expandedPaths}
                  onTogglePath={onTogglePath}
                  maxExpandDepth={maxExpandDepth}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Objects
  if (typeof data === 'object' && data !== null) {
    const objectData = data as Record<string, unknown>;
    const keys = Object.keys(objectData);

    if (keys.length === 0) {
      return <span className="text-muted-foreground">{'{}'}</span>;
    }

    return (
      <div className="inline-block">
        <button
          onClick={() => onTogglePath(path)}
          className="inline-flex items-center gap-1 hover:bg-muted/50 rounded px-1 -ml-1 transition-colors"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} object with ${keys.length} properties`}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="text-muted-foreground">
            Object{'{'}{keys.length}{'}'}
          </span>
        </button>
        {isExpanded && (
          <div className="ml-4 border-l-2 border-muted pl-2 mt-1">
            {keys.map((key) => {
              const keyMatches = searchTerm && key.toLowerCase().includes(searchTerm.toLowerCase());
              return (
                <div key={key} className="py-0.5">
                  <span className="text-orange-600 dark:text-orange-400">
                    {keyMatches ? (
                      <mark className="bg-yellow-200 dark:bg-yellow-900">"{key}"</mark>
                    ) : (
                      `"${key}"`
                    )}
                  </span>
                  <span className="text-muted-foreground">: </span>
                  <JsonNode
                    data={objectData[key]}
                    path={`${path}.${key}`}
                    depth={depth + 1}
                    searchTerm={searchTerm}
                    expandedPaths={expandedPaths}
                    onTogglePath={onTogglePath}
                    maxExpandDepth={maxExpandDepth}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return <span className="text-muted-foreground">{String(data)}</span>;
}

/**
 * JsonInspector - A sophisticated JSON viewer with syntax highlighting,
 * expand/collapse, search, and copy functionality
 */
export function JsonInspector({
  data,
  defaultExpanded = false,
  searchable = true,
  copyable = true,
  maxExpandDepth = 1,
}: JsonInspectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(defaultExpanded ? ['root'] : [])
  );
  const [copied, setCopied] = useState(false);

  // Calculate byte size
  const byteSize = useMemo(() => calculateByteSize(data), [data]);

  // Format byte size for display
  const formattedSize = useMemo(() => {
    if (byteSize < 1024) return `${byteSize} bytes`;
    if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(2)} KB`;
    return `${(byteSize / (1024 * 1024)).toFixed(2)} MB`;
  }, [byteSize]);

  // Get data type
  const dataType = useMemo(() => getDataType(data), [data]);

  // Toggle path expansion
  const handleTogglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [data]);

  // Expand all
  const handleExpandAll = useCallback(() => {
    const allPaths = new Set<string>();

    const collectPaths = (obj: unknown, currentPath: string) => {
      if (obj === null || obj === undefined) return;

      if (Array.isArray(obj)) {
        allPaths.add(currentPath);
        obj.forEach((item, index) => {
          collectPaths(item, `${currentPath}[${index}]`);
        });
      } else if (typeof obj === 'object') {
        allPaths.add(currentPath);
        Object.entries(obj).forEach(([key, value]) => {
          collectPaths(value, currentPath === 'root' ? `root.${key}` : `${currentPath}.${key}`);
        });
      }
    };

    collectPaths(data, 'root');
    setExpandedPaths(allPaths);
  }, [data]);

  // Collapse all
  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  return (
    <div className="space-y-3" role="region" aria-label="JSON Inspector">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search in JSON..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Search within JSON data"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="px-2 py-1 text-xs border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Expand all nodes"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-2 py-1 text-xs border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Collapse all nodes"
          >
            Collapse All
          </button>
          {copyable && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs border border-input rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Copy JSON to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* JSON Display */}
      <div
        className="bg-muted/30 dark:bg-muted/10 p-4 rounded-lg overflow-auto font-mono text-sm border border-border"
        role="tree"
        aria-label="JSON data tree"
      >
        <JsonNode
          data={data}
          path="root"
          depth={0}
          searchTerm={searchTerm}
          expandedPaths={expandedPaths}
          onTogglePath={handleTogglePath}
          maxExpandDepth={maxExpandDepth}
        />
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Type: <span className="font-medium text-foreground">{dataType}</span></span>
        <span>Size: <span className="font-medium text-foreground">{formattedSize}</span></span>
      </div>
    </div>
  );
}
