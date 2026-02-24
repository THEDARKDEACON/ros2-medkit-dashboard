# SystemHealthOverview Component Usage

The `SystemHealthOverview` component provides a comprehensive, real-time view of the robot system's health status.

## Features

- **Overall System Status**: Visual indicator showing healthy, degraded, or critical status
- **System Metrics**: Displays counts of areas, components (active/total), and topics
- **Fault Summary**: Shows fault counts by severity (error, warning, info)
- **Auto-refresh**: Updates every 2 seconds via the `useSystemHealth` hook
- **Responsive Design**: Adapts to different screen sizes with grid layout

## Basic Usage

```tsx
import { SystemHealthOverview } from '@/components/dashboard/SystemHealthOverview';

function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">System Dashboard</h1>
      <SystemHealthOverview />
    </div>
  );
}
```

## System Status Indicators

The component displays three possible system states:

### Healthy
- **Condition**: No errors, all components active
- **Visual**: Green checkmark icon with green background
- **Message**: "All systems operational"

### Degraded
- **Condition**: Warnings present OR some components inactive
- **Visual**: Yellow warning icon with yellow background
- **Message**: "Some issues detected"

### Critical
- **Condition**: One or more error-level faults
- **Visual**: Red X icon with red background
- **Message**: "Critical errors present"

## Displayed Metrics

### Areas
Shows the total number of logical component groupings in the system.

### Components
Displays active vs total components (e.g., "8 / 10" means 8 active out of 10 total).

### Topics
Shows the total number of ROS2 topics available across all components.

### System Activity
Indicates whether the system is "Active" or "Idle" based on running components.

## Fault Summary

The component displays fault counts in three categories:

- **Errors**: Critical faults requiring immediate attention (red)
- **Warnings**: Non-critical issues that should be addressed (yellow)
- **Info**: Informational messages (blue)

## Data Source

The component uses the `useSystemHealth` hook which:
- Fetches data from multiple API endpoints (areas, components, faults)
- Aggregates the data into a unified health view
- Auto-refreshes every 2 seconds
- Handles loading and error states

## Accessibility

The component includes proper ARIA attributes:
- `role="status"` for status indicators
- `aria-label` for screen reader descriptions
- `aria-hidden="true"` for decorative icons
- Semantic HTML structure

## Styling

The component uses:
- Tailwind CSS utility classes
- shadcn/ui design tokens
- Responsive grid layouts
- Smooth transitions and animations
- Dark mode support via CSS variables

## Requirements Satisfied

- **8.1**: Display system health overview as default landing view
- **8.2**: Show overall system status with visual indicator
- **8.3**: Display counts of active components, areas, and topics
- **8.4**: Show fault counts by severity level

## Integration Example

```tsx
import { SystemHealthOverview } from '@/components/dashboard/SystemHealthOverview';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';
import { QuickAccessCards } from '@/components/dashboard/QuickAccessCards';

function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* System Health Overview */}
      <section>
        <SystemHealthOverview />
      </section>

      {/* Additional Dashboard Sections */}
      <section>
        <MetricsPanel />
      </section>

      <section>
        <QuickAccessCards />
      </section>
    </div>
  );
}
```

## Testing

The component includes comprehensive unit tests covering:
- Loading states
- Error handling
- All three system status states (healthy, degraded, critical)
- Metric display accuracy
- Fault count display
- Accessibility attributes

Run tests with:
```bash
npm test -- SystemHealthOverview.test.tsx
```
