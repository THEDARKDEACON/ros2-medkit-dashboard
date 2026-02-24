import { useState } from 'react';
import { X, Book, Keyboard, AlertCircle, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

// Import documentation content
import quickStartMd from '@/docs/quick-start.md?raw';
import apiReferenceMd from '@/docs/api-reference.md?raw';
import keyboardShortcutsMd from '@/docs/keyboard-shortcuts.md?raw';
import troubleshootingMd from '@/docs/troubleshooting.md?raw';

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpSection = 'quick-start' | 'api-reference' | 'keyboard-shortcuts' | 'troubleshooting' | 'contextual';

export function HelpSystem({ isOpen, onClose }: HelpSystemProps) {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<HelpSection>('quick-start');

  if (!isOpen) return null;

  const getContextualHelp = () => {
    const path = location.pathname;
    
    if (path === '/' || path === '/dashboard') {
      return {
        title: 'Dashboard Help',
        content: `
# Dashboard Overview

The Dashboard provides a high-level view of your robot's status.

## Key Features

- **System Health**: Overall system status indicator
- **Component Count**: Number of active components
- **Fault Summary**: Current faults by severity
- **Quick Access Cards**: Navigate to key subsystems

## Tips

- The health indicator changes color based on system state
- Click on quick access cards to jump to detailed views
- Metrics auto-refresh every 2 seconds
        `
      };
    } else if (path.startsWith('/components')) {
      return {
        title: 'Components Help',
        content: `
# Components Browser

Browse and manage robot components organized by areas.

## Features

- **Component Tree**: Hierarchical view of areas and components
- **Search**: Find components by name or identifier
- **Component Details**: View topics, operations, and parameters

## Tips

- Use the search bar to quickly find components
- Click on a component to view its details
- Component status is indicated by color (green=active, red=error)
        `
      };
    } else if (path.startsWith('/topics')) {
      return {
        title: 'Topics Help',
        content: `
# Topic Monitoring

Monitor real-time ROS2 topic data streams.

## Features

- **Topic List**: All available topics for a component
- **Real-time Data**: Auto-refreshing topic values
- **JSON Inspector**: Explore message structure
- **Topic Publishing**: Publish messages to topics

## Tips

- Adjust refresh rate to balance performance and responsiveness
- Use the JSON inspector to explore nested data
- Click the pause button to stop auto-refresh
- Copy topic data to clipboard with Ctrl+C
        `
      };
    } else if (path.startsWith('/operations')) {
      return {
        title: 'Operations Help',
        content: `
# Operations Execution

Execute ROS2 services and actions.

## Features

- **Service Execution**: Call services with parameters
- **Action Monitoring**: Track action progress
- **Parameter Forms**: Type-safe parameter input
- **Execution History**: View past executions

## Tips

- Services execute immediately and return a result
- Actions run over time and provide progress feedback
- Required parameters are marked with an asterisk
- You can cancel running actions with the Cancel button
        `
      };
    } else if (path.startsWith('/parameters')) {
      return {
        title: 'Parameters Help',
        content: `
# Parameter Configuration

View and modify component configuration parameters.

## Features

- **Parameter Table**: All parameters with current values
- **Inline Editing**: Quick parameter updates
- **Type Validation**: Ensures correct data types
- **Reset to Default**: Restore original values

## Tips

- Double-click a value to edit inline
- Parameters are grouped by namespace
- Validation errors appear in red
- Use the reset button to restore defaults
        `
      };
    } else if (path.startsWith('/faults')) {
      return {
        title: 'Faults Help',
        content: `
# Fault Monitoring

Monitor and diagnose system faults.

## Features

- **Real-time Faults**: Live fault stream via SSE
- **Fault Timeline**: Historical fault view
- **Fault Snapshots**: System state at fault occurrence
- **Rosbag Download**: Download fault data

## Tips

- Faults are sorted by severity (error > warning > info)
- Click on a fault to view detailed snapshot data
- Use filters to focus on specific components or severities
- Download rosbags for offline analysis
        `
      };
    } else if (path.startsWith('/visualizations')) {
      return {
        title: 'Visualizations Help',
        content: `
# Visualizations

View 2D maps and 3D point clouds.

## Features

- **2D Map**: Occupancy grid with robot pose
- **Point Cloud Viewer**: 3D point cloud visualization
- **Gaussian Splats**: 3D reconstruction viewer
- **Interactive Controls**: Pan, zoom, rotate

## Tips

- Use mouse wheel to zoom
- Click and drag to pan (2D) or rotate (3D)
- Press R to reset camera view
- Toggle layers to show/hide elements
        `
      };
    } else if (path.startsWith('/performance')) {
      return {
        title: 'Performance Help',
        content: `
# Performance Monitoring

Monitor system resource usage and performance metrics.

## Features

- **CPU Usage**: Per-component CPU utilization
- **Memory Usage**: Memory consumption tracking
- **Network Bandwidth**: Data transfer rates
- **Message Rates**: Topic publication frequencies

## Tips

- Charts show the last 60 seconds of data
- Hover over charts for detailed values
- Set threshold alerts for proactive monitoring
- Export performance data for analysis
        `
      };
    } else if (path.startsWith('/settings')) {
      return {
        title: 'Settings Help',
        content: `
# Settings

Customize dashboard preferences and layout.

## Features

- **Theme**: Light/dark mode toggle
- **Layout Presets**: Operator, Developer, Researcher
- **Custom Layouts**: Drag and resize panels
- **Robot Management**: Add/remove robot instances

## Tips

- Your preferences are saved automatically
- Try different layout presets for your workflow
- Create custom layouts by dragging panels
- Switch between multiple robots easily
        `
      };
    }

    return {
      title: 'Help',
      content: 'Select a section from the menu to view help documentation.'
    };
  };

  const sections = [
    { id: 'quick-start' as const, label: 'Quick Start', icon: Book, content: quickStartMd },
    { id: 'api-reference' as const, label: 'API Reference', icon: FileText, content: apiReferenceMd },
    { id: 'keyboard-shortcuts' as const, label: 'Keyboard Shortcuts', icon: Keyboard, content: keyboardShortcutsMd },
    { id: 'troubleshooting' as const, label: 'Troubleshooting', icon: AlertCircle, content: troubleshootingMd },
    { id: 'contextual' as const, label: 'Current Page Help', icon: Book, content: getContextualHelp().content },
  ];

  const activeContent = sections.find(s => s.id === activeSection)?.content || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-[90vh] w-[90vw] max-w-6xl overflow-hidden rounded-lg bg-card shadow-xl">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/30 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Help & Documentation</h2>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-xl font-semibold">
              {sections.find(s => s.id === activeSection)?.label}
            </h3>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close help"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{activeContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
