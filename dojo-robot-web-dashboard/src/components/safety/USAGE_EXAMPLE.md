# Safety System Components Usage

This directory contains components for monitoring and controlling the robot's safety systems.

## Components

### SafetyMonitor

Main component for displaying comprehensive safety system status and monitoring.

**Features:**
- Emergency stop status with prominent visual indicator
- Collision detection status
- Safety zone violations
- Proximity warnings
- Behavior tree state visualization
- Active safety behaviors
- Safety event log with timestamps
- Safety system health metrics

**Usage:**

```tsx
import { SafetyMonitor } from '@/components/safety';

function SafetyPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Safety System</h1>
      <SafetyMonitor 
        componentId="safety_component" 
        refreshInterval={1000}
      />
    </div>
  );
}
```

**Props:**
- `componentId` (string, required): The ID of the safety component to monitor
- `refreshInterval` (number, optional): Data refresh interval in milliseconds (default: 1000)

### EmergencyStopButton

Prominent emergency stop button with confirmation dialog.

**Features:**
- Large, prominent button design
- Confirmation dialog before activation
- Visual feedback for active state
- Loading state during activation
- Configurable size

**Usage:**

```tsx
import { EmergencyStopButton } from '@/components/safety';

function SafetyControls() {
  const { data: safetyStatus } = useSafetyStatus('safety_component');
  
  return (
    <div className="flex items-center justify-center p-6">
      <EmergencyStopButton
        componentId="safety_component"
        isActive={safetyStatus?.emergencyStopActive || false}
        size="lg"
      />
    </div>
  );
}
```

**Props:**
- `componentId` (string, required): The ID of the safety component
- `isActive` (boolean, required): Whether emergency stop is currently active
- `size` ('sm' | 'md' | 'lg', optional): Button size (default: 'lg')

### BehaviorTreeView

Displays the behavior tree structure with node status visualization.

**Features:**
- Hierarchical tree structure
- Expandable/collapsible nodes
- Node status indicators (running, success, failure, idle)
- Node type badges (sequence, selector, action, condition, decorator)
- Auto-expand first 2 levels

**Usage:**

```tsx
import { BehaviorTreeView } from '@/components/safety';
import { useBehaviorTree } from '@/features/api/hooks';

function BehaviorTreePanel() {
  const { data: behaviorTree } = useBehaviorTree('safety_component');
  
  if (!behaviorTree) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Behavior Tree</h3>
      <BehaviorTreeView behaviorTree={behaviorTree} />
    </div>
  );
}
```

**Props:**
- `behaviorTree` (BehaviorTreeState, required): The behavior tree state data

## API Hooks

### useSafetyStatus

Fetches the current safety system status.

```tsx
import { useSafetyStatus } from '@/features/api/hooks';

const { data, isLoading, error } = useSafetyStatus('safety_component', {
  refetchInterval: 1000,
  enabled: true,
});
```

**Returns:**
```typescript
interface SafetyStatus {
  emergencyStopActive: boolean;
  collisionDetected: boolean;
  safetyZoneViolation: boolean;
  proximityWarnings: Array<{
    direction: string;
    distance: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  lastSafetyCheck: string;
}
```

### useBehaviorTree

Fetches the current behavior tree state.

```tsx
import { useBehaviorTree } from '@/features/api/hooks';

const { data, isLoading, error } = useBehaviorTree('safety_component', {
  refetchInterval: 1000,
  enabled: true,
});
```

**Returns:**
```typescript
interface BehaviorTreeState {
  rootNode: BehaviorTreeNode;
  activeBehaviors: Array<{
    id: string;
    name: string;
    status: 'running' | 'success' | 'failure';
    startTime: string;
  }>;
  lastUpdate: string;
}
```

### useSafetyEvents

Fetches recent safety events.

```tsx
import { useSafetyEvents } from '@/features/api/hooks';

const { data, isLoading, error } = useSafetyEvents('safety_component', {
  refetchInterval: 2000,
  enabled: true,
  limit: 50,
});
```

**Returns:**
```typescript
interface SafetyEvent {
  id: string;
  type: 'emergency_stop' | 'collision' | 'zone_violation' | 'proximity_warning' | 'system_health';
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
```

### useSafetyMetrics

Fetches safety system health metrics.

```tsx
import { useSafetyMetrics } from '@/features/api/hooks';

const { data, isLoading, error } = useSafetyMetrics('safety_component', {
  refetchInterval: 5000,
  enabled: true,
});
```

**Returns:**
```typescript
interface SafetyMetrics {
  totalEvents: number;
  emergencyStops: number;
  collisions: number;
  zoneViolations: number;
  averageResponseTime: number;
  systemUptime: number;
}
```

### useTriggerEmergencyStop

Mutation hook to trigger the emergency stop system.

```tsx
import { useTriggerEmergencyStop } from '@/features/api/hooks';

const triggerEmergencyStop = useTriggerEmergencyStop();

const handleEmergencyStop = async () => {
  try {
    await triggerEmergencyStop.mutateAsync({ componentId: 'safety_component' });
    toast.success('Emergency stop activated');
  } catch (error) {
    toast.error('Failed to activate emergency stop');
  }
};
```

## Complete Example

```tsx
import { SafetyMonitor, EmergencyStopButton } from '@/components/safety';
import { useSafetyStatus } from '@/features/api/hooks';

function SafetyDashboard() {
  const componentId = 'safety_component';
  const { data: safetyStatus } = useSafetyStatus(componentId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Emergency Stop */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Safety System</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and control robot safety systems
          </p>
        </div>
        <EmergencyStopButton
          componentId={componentId}
          isActive={safetyStatus?.emergencyStopActive || false}
        />
      </div>

      {/* Safety Monitor */}
      <SafetyMonitor componentId={componentId} />
    </div>
  );
}

export default SafetyDashboard;
```

## Requirements Mapping

- **Requirement 18.1**: Behavior tree state display (BehaviorTreeView)
- **Requirement 18.2**: Active safety behaviors display (SafetyMonitor)
- **Requirement 18.3**: Emergency stop status (SafetyMonitor, EmergencyStopButton)
- **Requirement 18.4**: Collision detection status (SafetyMonitor)
- **Requirement 18.5**: Safety zone violations (SafetyMonitor)
- **Requirement 18.6**: Emergency stop button (EmergencyStopButton)
- **Requirement 18.7**: Safety system health metrics (SafetyMonitor)
- **Requirement 18.8**: Safety event alerts (SafetyMonitor)
- **Requirement 18.9**: Safety event log (SafetyMonitor)
