# MetricsPanel Component Usage

The `MetricsPanel` component displays key system metrics including performance data, robot position, exploration progress, and semantic object detection.

## Features

- **Performance Metrics**: CPU usage, memory usage, and network activity with progress bars
- **Robot Position & Orientation**: Real-time position (x, y, z) and orientation (roll, pitch, yaw)
- **Exploration Progress**: Overall progress percentage, area covered, and active frontiers
- **Semantic Object Detection**: Total detected objects and breakdown by type
- **Auto-refresh**: Updates every 2 seconds via the `useSystemHealth` hook
- **Responsive Design**: Adapts to different screen sizes with grid layout

## Basic Usage

```tsx
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';

function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">System Metrics</h1>
      <MetricsPanel />
    </div>
  );
}
```

## Displayed Sections

### 1. Performance Metrics (Requirement 8.5)

Displays system resource utilization:

- **CPU Usage**: Percentage of CPU utilization with color-coded progress bar
  - Green: < 60%
  - Yellow: 60-80%
  - Red: > 80%
- **Memory Usage**: Percentage of memory utilization with color-coded progress bar
- **Network Activity**: Current network throughput in MB/s

### 2. Robot Position & Orientation (Requirement 8.6)

Shows the robot's current pose in 3D space:

- **Position**: X, Y, Z coordinates in meters
- **Orientation**: Roll, pitch, yaw in radians

This data is typically sourced from navigation topics like `/odom` or `/pose`.

### 3. Exploration Progress (Requirement 8.7)

Displays autonomous exploration statistics:

- **Overall Progress**: Percentage of exploration completion with progress bar
- **Area Covered**: Total area mapped in square meters
- **Active Frontiers**: Number of exploration frontiers currently being evaluated

### 4. Semantic Object Detection (Requirement 8.8)

Shows detected objects from YOLO or similar detection systems:

- **Total Objects Detected**: Count of all detected objects
- **Objects by Type**: Breakdown showing counts for each object class
  - Person
  - Chair
  - Table
  - Door
  - Other

## Data Source

The component uses the `useSystemHealth` hook which:
- Fetches data from multiple API endpoints
- Auto-refreshes every 2 seconds
- Handles loading and error states

**Note**: In the current implementation, metrics data is mocked. In a production environment, this data would be fetched from specific ROS2 topics:
- Performance: `/diagnostics`, `/system_monitor`
- Position: `/odom`, `/pose`, `/tf`
- Exploration: `/exploration_progress`, `/frontiers`
- Objects: `/detected_objects`, `/semantic_map`

## Accessibility

The component includes proper ARIA attributes:
- `role="progressbar"` for progress indicators
- `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for progress values
- `aria-label` for screen reader descriptions
- `aria-hidden="true"` for decorative icons

## Styling

The component uses:
- Tailwind CSS utility classes
- shadcn/ui design tokens
- Responsive grid layouts
- Color-coded progress bars for quick status assessment
- Dark mode support via CSS variables

## Requirements Satisfied

- **8.5**: Display CPU usage, memory usage, and network activity
- **8.6**: Show robot position and orientation if available
- **8.7**: Display exploration progress and mapping statistics
- **8.8**: Show semantic object detection counts

## Integration Example

```tsx
import { SystemHealthOverview } from '@/components/dashboard/SystemHealthOverview';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';

function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* System Health Overview */}
      <section>
        <SystemHealthOverview />
      </section>

      {/* Detailed Metrics */}
      <section>
        <MetricsPanel />
      </section>
    </div>
  );
}
```

## Customization

To integrate real topic data instead of mocked values, modify the component to use specific topic hooks:

```tsx
// Example: Fetch real performance data
const { data: cpuData } = useTopicData('system_monitor', '/cpu_usage');
const { data: memoryData } = useTopicData('system_monitor', '/memory_usage');
const { data: networkData } = useTopicData('system_monitor', '/network_stats');

// Example: Fetch real robot pose
const { data: poseData } = useTopicData('navigation', '/odom');

// Example: Fetch exploration progress
const { data: explorationData } = useTopicData('exploration', '/progress');

// Example: Fetch detected objects
const { data: objectsData } = useTopicData('perception', '/detected_objects');
```

## Testing

The component includes comprehensive unit tests covering:
- Loading states
- Error handling
- All four metric sections display
- Correct metric values
- Progress bar functionality
- Accessibility attributes

Run tests with:
```bash
npm test -- MetricsPanel.test.tsx
```

## Visual Design

The component uses a card-based layout with:
- Clear section headers with icons
- Organized metric displays
- Progress bars for percentage values
- Monospace font for numeric values
- Consistent spacing and padding
- Hover effects for interactivity
