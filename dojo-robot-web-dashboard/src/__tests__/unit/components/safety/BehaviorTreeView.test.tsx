import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BehaviorTreeView } from '@/components/safety/BehaviorTreeView';
import type { BehaviorTreeState } from '@/features/api/hooks';

describe('BehaviorTreeView', () => {
  const createMockBehaviorTree = (overrides?: Partial<BehaviorTreeState>): BehaviorTreeState => ({
    rootNode: {
      id: 'root',
      name: 'Root',
      type: 'sequence',
      status: 'running',
      children: [
        {
          id: 'child1',
          name: 'Safety Check',
          type: 'condition',
          status: 'success',
        },
        {
          id: 'child2',
          name: 'Navigation',
          type: 'action',
          status: 'running',
        },
      ],
    },
    activeBehaviors: [],
    lastUpdate: new Date().toISOString(),
    ...overrides,
  });

  it('should render behavior tree with root node', () => {
    const behaviorTree = createMockBehaviorTree();
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('Sequence')).toBeInTheDocument();
  });

  it('should render last update timestamp', () => {
    const behaviorTree = createMockBehaviorTree();
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
  });

  it('should render child nodes', () => {
    const behaviorTree = createMockBehaviorTree();
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText('Safety Check')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('should show node type badges', () => {
    const behaviorTree = createMockBehaviorTree();
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText('Sequence')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should show children count for parent nodes', () => {
    const behaviorTree = createMockBehaviorTree();
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText('2 children')).toBeInTheDocument();
  });

  it('should expand and collapse nodes', () => {
    const behaviorTree = createMockBehaviorTree();
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    // Initially expanded (first 2 levels auto-expand)
    expect(screen.getByText('Safety Check')).toBeVisible();
    
    // Click to collapse
    const rootNode = screen.getByText('Root').closest('div');
    if (rootNode) {
      fireEvent.click(rootNode);
    }
    
    // After clicking, children should be hidden
    expect(screen.queryByText('Safety Check')).not.toBeInTheDocument();
  });

  it('should render different node statuses', () => {
    const behaviorTree = createMockBehaviorTree({
      rootNode: {
        id: 'root',
        name: 'Root',
        type: 'sequence',
        status: 'running',
        children: [
          {
            id: 'child1',
            name: 'Success Node',
            type: 'action',
            status: 'success',
          },
          {
            id: 'child2',
            name: 'Failure Node',
            type: 'action',
            status: 'failure',
          },
          {
            id: 'child3',
            name: 'Idle Node',
            type: 'action',
            status: 'idle',
          },
        ],
      },
    });
    
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText('Success Node')).toBeInTheDocument();
    expect(screen.getByText('Failure Node')).toBeInTheDocument();
    expect(screen.getByText('Idle Node')).toBeInTheDocument();
  });

  it('should render different node types', () => {
    const behaviorTree = createMockBehaviorTree({
      rootNode: {
        id: 'root',
        name: 'Root',
        type: 'sequence',
        status: 'running',
        children: [
          {
            id: 'child1',
            name: 'Selector Node',
            type: 'selector',
            status: 'running',
          },
          {
            id: 'child2',
            name: 'Decorator Node',
            type: 'decorator',
            status: 'running',
          },
        ],
      },
    });
    
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText('Selector')).toBeInTheDocument();
    expect(screen.getByText('Decorator')).toBeInTheDocument();
  });

  it('should render nested children', () => {
    const behaviorTree = createMockBehaviorTree({
      rootNode: {
        id: 'root',
        name: 'Root',
        type: 'sequence',
        status: 'running',
        children: [
          {
            id: 'child1',
            name: 'Parent',
            type: 'sequence',
            status: 'running',
            children: [
              {
                id: 'grandchild1',
                name: 'Grandchild',
                type: 'action',
                status: 'success',
              },
            ],
          },
        ],
      },
    });
    
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByText('Grandchild')).toBeInTheDocument();
  });

  it('should show message when no behavior tree data', () => {
    const behaviorTree: BehaviorTreeState = {
      rootNode: null as any,
      activeBehaviors: [],
      lastUpdate: new Date().toISOString(),
    };
    
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText(/no behavior tree data available/i)).toBeInTheDocument();
  });

  it('should render leaf nodes without expand icon', () => {
    const behaviorTree = createMockBehaviorTree({
      rootNode: {
        id: 'root',
        name: 'Root',
        type: 'action',
        status: 'running',
      },
    });
    
    render(<BehaviorTreeView behaviorTree={behaviorTree} />);
    
    expect(screen.getByText('Root')).toBeInTheDocument();
    // Leaf nodes should not have children count
    expect(screen.queryByText(/children/i)).not.toBeInTheDocument();
  });
});
