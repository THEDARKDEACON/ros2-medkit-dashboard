/**
 * JSON Tree Viewer Component
 *
 * Renders any JSON data as a collapsible tree structure.
 * Used in the Topic Explorer to display ROS message contents.
 */

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

interface JsonTreeProps {
    data: unknown;
    name?: string;
    defaultExpanded?: boolean;
    depth?: number;
    maxDepth?: number;
    className?: string;
}

/**
 * Value type tag with color coding
 */
function TypeTag({ type }: { type: string }) {
    const colors: Record<string, string> = {
        string: 'text-emerald-400',
        number: 'text-blue-400',
        boolean: 'text-amber-400',
        null: 'text-gray-500',
        array: 'text-purple-400',
        object: 'text-cyan-400',
    };

    return (
        <span className={`text-[10px] font-mono ml-1 opacity-60 ${colors[type] || 'text-gray-400'}`}>
            {type}
        </span>
    );
}

/**
 * Renders a single JSON value (leaf node)
 */
function JsonValue({ value }: { value: unknown }) {
    if (value === null) return <span className="text-gray-500 italic">null</span>;
    if (value === undefined) return <span className="text-gray-500 italic">undefined</span>;

    switch (typeof value) {
        case 'string':
            return <span className="text-emerald-400">"{value}"</span>;
        case 'number':
            return <span className="text-blue-400">{value}</span>;
        case 'boolean':
            return <span className="text-amber-400">{value ? 'true' : 'false'}</span>;
        default:
            return <span className="text-gray-400">{String(value)}</span>;
    }
}

/**
 * Recursive JSON tree node
 */
export function JsonTreeNode({
    data,
    name,
    defaultExpanded = false,
    depth = 0,
    maxDepth = 10,
}: JsonTreeProps) {
    const [expanded, setExpanded] = useState(defaultExpanded || depth < 2);

    const isObject = data !== null && typeof data === 'object';
    const isArray = Array.isArray(data);
    const isEmpty = isObject && Object.keys(data as object).length === 0;

    if (!isObject || data === null) {
        // Leaf node
        return (
            <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: depth * 16 }}>
                {name && (
                    <>
                        <span className="text-gray-300 font-medium">{name}</span>
                        <span className="text-gray-600">:</span>
                    </>
                )}
                <JsonValue value={data} />
                <TypeTag type={data === null ? 'null' : typeof data} />
            </div>
        );
    }

    const entries = isArray
        ? (data as unknown[]).map((v, i) => [String(i), v] as const)
        : Object.entries(data as Record<string, unknown>);

    const bracketOpen = isArray ? '[' : '{';
    const bracketClose = isArray ? ']' : '}';
    const summary = isArray ? `Array(${entries.length})` : `Object(${entries.length} keys)`;

    if (depth >= maxDepth) {
        return (
            <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: depth * 16 }}>
                {name && (
                    <>
                        <span className="text-gray-300 font-medium">{name}</span>
                        <span className="text-gray-600">:</span>
                    </>
                )}
                <span className="text-gray-500 italic">{summary}</span>
            </div>
        );
    }

    return (
        <div>
            <div
                className="flex items-center gap-1 py-0.5 cursor-pointer hover:bg-white/5 rounded"
                style={{ paddingLeft: depth * 16 }}
                onClick={() => setExpanded(!expanded)}
            >
                {isEmpty ? (
                    <span className="w-4" />
                ) : expanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                )}
                {name && (
                    <>
                        <span className="text-gray-300 font-medium">{name}</span>
                        <span className="text-gray-600">:</span>
                    </>
                )}
                <span className="text-gray-500">{bracketOpen}</span>
                {!expanded && (
                    <>
                        <span className="text-gray-600 text-xs">{summary}</span>
                        <span className="text-gray-500">{bracketClose}</span>
                    </>
                )}
                <TypeTag type={isArray ? 'array' : 'object'} />
            </div>

            {expanded && !isEmpty && (
                <>
                    {entries.map(([key, value]) => (
                        <JsonTreeNode
                            key={key}
                            data={value}
                            name={key}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                        />
                    ))}
                    <div style={{ paddingLeft: depth * 16 }}>
                        <span className="text-gray-500">{bracketClose}</span>
                    </div>
                </>
            )}

            {expanded && isEmpty && (
                <div style={{ paddingLeft: (depth + 1) * 16 }}>
                    <span className="text-gray-600 italic text-xs">empty</span>
                </div>
            )}
        </div>
    );
}

/**
 * Top-level JSON Tree Viewer with copy button
 */
export function JsonTreeViewer({ data, className = '' }: { data: unknown; className?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [data]);

    return (
        <div className={`relative font-mono text-xs ${className}`}>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                title="Copy JSON"
            >
                {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                )}
            </button>
            <div className="overflow-auto max-h-[600px] p-3">
                <JsonTreeNode data={data} defaultExpanded={true} />
            </div>
        </div>
    );
}
