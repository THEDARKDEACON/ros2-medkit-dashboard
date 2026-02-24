import { ChevronRight, ChevronDown, Circle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { BehaviorTreeState, BehaviorTreeNode } from '@/features/api/hooks';

/**
 * BehaviorTreeView Component
 * 
 * Displays the behavior tree structure with node status visualization.
 * Shows the hierarchical tree structure with expandable/collapsible nodes.
 * 
 * Requirements: 18.1, 18.2
 */
interface BehaviorTreeViewProps {
  behaviorTree: BehaviorTreeState;
}

export function BehaviorTreeView({ behaviorTree }: BehaviorTreeViewProps) {
  if (!behaviorTree.rootNode) {
    return (
      <div className="text-sm text-muted-foreground">
        No behavior tree data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-3">
        Last updated: {new Date(behaviorTree.lastUpdate).toLocaleString()}
      </div>
      <TreeNode node={behaviorTree.rootNode} level={0} />
    </div>
  );
}

/**
 * TreeNode Component
 * Renders a single node in the behavior tree
 */
interface TreeNodeProps {
  node: BehaviorTreeNode;
  level: number;
}

function TreeNode({ node, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = node.children && node.children.length > 0;

  // Node type configuration
  const typeConfig = {
    sequence: {
      label: 'Sequence',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    selector: {
      label: 'Selector',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    action: {
      label: 'Action',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    condition: {
      label: 'Condition',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    decorator: {
      label: 'Decorator',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  };

  // Status configuration
  const statusConfig = {
    running: {
      icon: Loader2,
      color: 'text-blue-500',
      label: 'Running',
      animate: true,
    },
    success: {
      icon: CheckCircle,
      color: 'text-green-500',
      label: 'Success',
      animate: false,
    },
    failure: {
      icon: XCircle,
      color: 'text-red-500',
      label: 'Failure',
      animate: false,
    },
    idle: {
      icon: Circle,
      color: 'text-gray-400',
      label: 'Idle',
      animate: false,
    },
  };

  const typeInfo = typeConfig[node.type] || typeConfig.action;
  const statusInfo = statusConfig[node.status] || statusConfig.idle;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="select-none">
      {/* Node Header */}
      <div
        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${typeInfo.bgColor}`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ marginLeft: `${level * 24}px` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )
        ) : (
          <div className="w-4" />
        )}

        {/* Status Icon */}
        <StatusIcon
          className={`h-4 w-4 ${statusInfo.color} flex-shrink-0 ${
            statusInfo.animate ? 'animate-spin' : ''
          }`}
          aria-label={statusInfo.label}
        />

        {/* Node Name */}
        <span className="font-medium text-sm flex-1">{node.name}</span>

        {/* Node Type Badge */}
        <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color} ${typeInfo.bgColor}`}>
          {typeInfo.label}
        </span>

        {/* Children Count */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground">
            {node.children!.length} {node.children!.length === 1 ? 'child' : 'children'}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
