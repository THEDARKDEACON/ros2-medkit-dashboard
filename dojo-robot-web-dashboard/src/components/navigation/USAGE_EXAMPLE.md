# Navigation Components Usage Examples

This directory contains components for monitoring robot navigation, exploration, velocity, and battery status.

## Components

### NavigationMonitor

Displays navigation and exploration status with real-time updates.

```tsx
import { NavigationMonitor } from '@/components/navigation';

function NavigationPage() {
  return (
    <div className="p-6">
      <NavigationMonitor 
        componentId="navigation_component"
        refreshInterval={1000}
      />
    </div>
  );
}
```

**Features:**
- Exploration status indicator (exploring, planning, idle, error)
- Exploration progress bar with statistics
- Current goal coordinates display
- Planned path information
- Frontier clusters visualization

### NavigationControls

Provides controls for navigation operations and displays navigation state.

```tsx
import { NavigationControls } from '@/components/navigation';

function NavigationControlPanel() {
  const handlePause = async () => {
    // Call API to pause exploration
    console.log('Pausing exploration...');
  };

  const handleResume = async () => {
    // Call API to resume exploration
    console.log('Resuming exploration...');
  };

  const handleCancel = async () => {
    // Call API to cancel exploration
    console.log('Canceling exploration...');
  };

  return (
    <NavigationControls
      componentId="navigation_component"
      onPause={handlePause}
      onResume={handleResume}
      onCancel={handleCancel}
      refreshInterval={1000}
    />
  );
}
```

**Features:**
- Pause/Resume/Cancel exploration buttons
- Localization quality indicator with visual bar
- Path planning state display
- Obstacle detection status

### VelocityDisplay

Shows current robot velocity in real-time.

```tsx
import { VelocityDisplay } from '@/components/navigation';

function VelocityPanel() {
  return (
    <div className="p-6">
      <VelocityDisplay 
        componentId="navigation_component"
        refreshInterval={500}
      />
    </div>
  );
}
```

**Features:**
- Linear velocity (x, y, z) with magnitude
- Angular velocity (x, y, z) with magnitude
- Visual velocity bars
- Speed gauges for quick reference

### BatteryDisplay

Displays battery status and time estimates.

```tsx
import { BatteryDisplay } from '@/components/navigation';

function BatteryPanel() {
  return (
    <div className="p-6">
      <BatteryDisplay 
        componentId="power_component"
        refreshInterval={5000}
      />
    </div>
  );
}
```

**Features:**
- Battery level percentage with visual indicator
- Voltage, current, and power readings
- Charging status
- Estimated battery runtime
- Estimated exploration time remaining
- Battery health indicator

## Complete Dashboard Example

Combine all navigation components in a comprehensive dashboard:

```tsx
import { 
  NavigationMonitor, 
  NavigationControls, 
  VelocityDisplay, 
  BatteryDisplay 
} from '@/components/navigation';

function NavigationDashboard() {
  const navComponentId = 'navigation_component';
  const powerComponentId = 'power_component';

  const handlePause = async () => {
    // Implement pause logic
  };

  const handleResume = async () => {
    // Implement resume logic
  };

  const handleCancel = async () => {
    // Implement cancel logic
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Navigation Dashboard</h1>
      
      {/* Main navigation monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NavigationMonitor componentId={navComponentId} />
        </div>
        
        <div className="space-y-6">
          <VelocityDisplay componentId={navComponentId} />
          <BatteryDisplay componentId={powerComponentId} />
        </div>
      </div>

      {/* Navigation controls */}
      <NavigationControls
        componentId={navComponentId}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
      />
    </div>
  );
}
```

## Customization

### Refresh Intervals

All components accept a `refreshInterval` prop to control update frequency:

```tsx
// High-frequency updates for velocity (500ms)
<VelocityDisplay componentId="nav" refreshInterval={500} />

// Standard updates for navigation (1s)
<NavigationMonitor componentId="nav" refreshInterval={1000} />

// Low-frequency updates for battery (5s)
<BatteryDisplay componentId="power" refreshInterval={5000} />
```

### Styling

Components use Tailwind CSS and shadcn/ui design tokens. Customize by:

1. Modifying the component's className props
2. Wrapping in a container with custom styles
3. Using CSS variables for theme customization

```tsx
<div className="custom-navigation-panel">
  <NavigationMonitor componentId="nav" />
</div>
```

## Data Requirements

### API Endpoints

Components expect the following data structure from the API:

**Navigation Status** (`/components/{id}/data`):
```json
{
  "exploration_status": "exploring",
  "current_goal": { "x": 5.0, "y": 3.0, "theta": 1.57 },
  "planned_path": [
    { "x": 0.0, "y": 0.0, "theta": 0.0 },
    { "x": 1.0, "y": 1.0, "theta": 0.78 }
  ],
  "localization_quality": 0.95,
  "path_planning_state": "computing",
  "obstacle_detected": false
}
```

**Exploration Stats** (`/components/{id}/data`):
```json
{
  "explored_area": 45.5,
  "total_area": 100.0,
  "exploration_progress": 45.5,
  "frontier_clusters": [
    { "id": "1", "centroid": { "x": 10.0, "y": 5.0 }, "size": 25 }
  ],
  "estimated_time_remaining": 300
}
```

**Velocity** (`/components/{id}/data`):
```json
{
  "velocity_linear": { "x": 0.5, "y": 0.0, "z": 0.0 },
  "velocity_angular": { "x": 0.0, "y": 0.0, "z": 0.2 }
}
```

**Battery** (`/components/{id}/data`):
```json
{
  "battery_level": 75.5,
  "battery_voltage": 12.6,
  "battery_current": 2.5,
  "battery_charging": false
}
```

## Accessibility

All components include:
- ARIA labels for screen readers
- Semantic HTML structure
- Keyboard navigation support
- Color-blind friendly indicators
- Progress bars with proper ARIA attributes

## Performance

Components are optimized for real-time updates:
- React Query caching prevents unnecessary re-renders
- Configurable refresh intervals
- Memoized calculations
- Efficient DOM updates with CSS transitions
