# Fault Components Usage

This document covers usage examples for the fault-related components: `FaultTimeline`, `FaultDetail`, `FaultMonitor`, and `FaultFilter`.

## FaultTimeline Component

The `FaultTimeline` component provides a timeline visualization of fault events over time with time range selection and severity-based grouping.

### Basic Usage

```tsx
import { FaultTimeline } from '@/components/faults/FaultTimeline';
import { useFaults } from '@/features/api/hooks';

function FaultHistoryPage() {
  const { data: faults = [] } = useFaults();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Fault History</h1>
      <FaultTimeline faults={faults} />
    </div>
  );
}
```

### With Fault Selection

```tsx
import { useState } from 'react';
import { FaultTimeline } from '@/components/faults/FaultTimeline';
import { FaultDetail } from '@/components/faults/FaultDetail';
import { useFaults } from '@/features/api/hooks';
import type { Fault } from '@/types/api';

function FaultAnalysisPage() {
  const { data: faults = [] } = useFaults();
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fault Timeline</h1>
        <p className="text-muted-foreground">
          View fault history and trends over time
        </p>
      </div>
      
      <FaultTimeline 
        faults={faults}
        onFaultSelect={(fault) => setSelectedFault(fault)}
        height={400}
      />
      
      {selectedFault && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Selected Fault</h2>
          <FaultDetail faultCode={selectedFault.code} />
        </div>
      )}
    </div>
  );
}
```

### Custom Height

```tsx
<FaultTimeline 
  faults={faults}
  height={500} // Custom height in pixels
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `faults` | `Fault[]` | Yes | - | Array of fault objects to visualize |
| `onFaultSelect` | `(fault: Fault) => void` | No | - | Callback when a fault is selected by clicking a bar |
| `height` | `number` | No | `300` | Height of the chart in pixels |

### Features

- **Time Range Selection**: Switch between Last Hour, Last 24 Hours, and Last 7 Days
- **Severity Grouping**: Faults are grouped by severity (error, warning, info) with color coding
- **Interactive Timeline**: Click on bars to select faults from that time period
- **Statistics Summary**: Shows total faults and breakdown by severity
- **Responsive Design**: Adapts to different screen sizes
- **Empty States**: Handles no data and no data in selected range gracefully

---

## FaultDetail Component

The `FaultDetail` component displays detailed fault snapshot data including system state and topic data at the time of fault occurrence. It also provides rosbag file download functionality with progress indication.

### Basic Usage

```tsx
import { FaultDetail } from '@/components/faults/FaultDetail';

function FaultPage() {
  const faultCode = 'FAULT_001'; // Get from route params or props
  
  return (
    <div className="container mx-auto p-6">
      <FaultDetail faultCode={faultCode} />
    </div>
  );
}
```

### Integration with FaultMonitor

```tsx
import { useState } from 'react';
import { FaultMonitor } from '@/components/faults/FaultMonitor';
import { FaultDetail } from '@/components/faults/FaultDetail';
import type { Fault } from '@/types/api';

function FaultsPage() {
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Fault List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Faults</h2>
        <FaultMonitor 
          onFaultSelect={(fault) => setSelectedFault(fault)}
          showFilter={true}
        />
      </div>
      
      {/* Fault Detail */}
      <div>
        {selectedFault ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Fault Details</h2>
            <FaultDetail faultCode={selectedFault.code} />
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Select a fault to view details
          </div>
        )}
      </div>
    </div>
  );
}
```

### With React Router

```tsx
import { useParams } from 'react-router-dom';
import { FaultDetail } from '@/components/faults/FaultDetail';
import { Breadcrumb } from '@/components/common/Breadcrumb';

function FaultDetailPage() {
  const { faultCode } = useParams<{ faultCode: string }>();
  
  if (!faultCode) {
    return <div>Fault code not provided</div>;
  }
  
  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Faults', href: '/faults' },
          { label: faultCode, href: `/faults/${faultCode}` },
        ]}
      />
      
      <div>
        <h1 className="text-3xl font-bold">Fault Details</h1>
        <p className="mt-2 text-muted-foreground">
          Detailed snapshot and diagnostic information
        </p>
      </div>
      
      <FaultDetail faultCode={faultCode} />
    </div>
  );
}
```

### Features

#### Fault Snapshot Display
- Shows fault code and timestamp
- Displays system state at fault occurrence using JsonInspector
- Shows topic data captured during fault using JsonInspector

#### Rosbag Download
- Download button with progress indication
- Streams file download with real-time progress bar
- Automatic filename from server or defaults to `{faultCode}_rosbag.bag`
- Error handling with user-friendly messages

#### Loading & Error States
- Loading state while fetching snapshot data
- Error state with detailed error messages
- Empty state when no snapshot data is available

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `faultCode` | `string` | Yes | The fault code to fetch snapshot data for |
| `className` | `string` | No | Additional CSS classes for the container |

### API Requirements

The component requires the following API endpoints:

1. **GET /api/v1/faults/{fault_code}/snapshots**
   - Returns fault snapshot data including system state and topic data
   - Response type: `FaultSnapshot`

2. **GET /api/v1/faults/{fault_code}/snapshots/bag**
   - Returns rosbag file as binary stream
   - Should include `Content-Disposition` header with filename
   - Should include `Content-Length` header for progress tracking

---

## Complete Integration Example

Here's a complete example showing all fault components working together:

```tsx
import { useState } from 'react';
import { FaultMonitor } from '@/components/faults/FaultMonitor';
import { FaultTimeline } from '@/components/faults/FaultTimeline';
import { FaultDetail } from '@/components/faults/FaultDetail';
import { useFaults } from '@/features/api/hooks';
import type { Fault } from '@/types/api';

function CompleteFaultsPage() {
  const { data: faults = [] } = useFaults();
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null);
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Fault Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor, analyze, and diagnose system faults
        </p>
      </div>
      
      {/* Timeline View */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Fault History</h2>
        <FaultTimeline 
          faults={faults}
          onFaultSelect={setSelectedFault}
          height={350}
        />
      </section>
      
      {/* Current Faults and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fault Monitor */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Active Faults</h2>
          <FaultMonitor 
            onFaultSelect={setSelectedFault}
            showFilter={true}
          />
        </section>
        
        {/* Fault Detail */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Fault Details</h2>
          {selectedFault ? (
            <FaultDetail faultCode={selectedFault.code} />
          ) : (
            <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg text-muted-foreground">
              Select a fault to view details
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CompleteFaultsPage;
```

## Styling

All fault components use Tailwind CSS and follow the application's design system:
- Responsive layout
- Dark mode support
- Consistent spacing and typography
- Accessible color contrast

## Accessibility

- Proper ARIA labels on interactive elements
- Progress bars with `role="progressbar"` and aria attributes
- Keyboard navigation support
- Screen reader friendly error messages
- Color-blind friendly severity indicators (icons + colors)
