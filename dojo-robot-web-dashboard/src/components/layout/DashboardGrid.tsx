import React from 'react';
import { ReactGridLayout } from 'react-grid-layout';
// Cast to any - ReactGridLayout v2 accepts legacy v1 props at runtime 
// but the TypeScript types don't declare them
const GridLayoutComponent = ReactGridLayout as any;
import { useLayoutStore } from '../../features/stores/layoutStore';
import { PANEL_LIBRARY } from '../../config/panelLibrary';
import type { PanelConfig } from '../../types/layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import panel components
import { SystemHealthOverview } from '../dashboard/SystemHealthOverview';
import { MetricsPanel } from '../dashboard/MetricsPanel';
import { QuickAccessCards } from '../dashboard/QuickAccessCards';

export const DashboardGrid: React.FC = () => {
  const { getCurrentLayout } = useLayoutStore();
  const currentLayout = getCurrentLayout();

  if (!currentLayout) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No layout selected</p>
      </div>
    );
  }

  const layoutItems = currentLayout.panels.map((panel) => ({
    i: panel.id,
    x: panel.position.x,
    y: panel.position.y,
    w: panel.size.width,
    h: panel.size.height,
    minW: PANEL_LIBRARY.find((p) => p.type === panel.type)?.minSize.width || 2,
    minH: PANEL_LIBRARY.find((p) => p.type === panel.type)?.minSize.height || 2,
  }));

  const renderPanel = (panel: PanelConfig) => {
    switch (panel.type) {
      case 'system-health':
        return <SystemHealthOverview />;
      case 'metrics':
        return <MetricsPanel />;
      case 'quick-access':
        return <QuickAccessCards />;
      case 'fault-summary':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Fault Summary Panel</p>
          </div>
        );
      case 'performance':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Performance Panel</p>
          </div>
        );
      case 'safety-monitor':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Safety Monitor Panel</p>
          </div>
        );
      case 'navigation-monitor':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Navigation Monitor Panel</p>
          </div>
        );
      case 'map-2d':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">2D Map Panel</p>
          </div>
        );
      case 'point-cloud':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Point Cloud Panel</p>
          </div>
        );
      case 'logs':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Logs Panel</p>
          </div>
        );
      case 'component-status':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Component Status Panel</p>
          </div>
        );
      case 'topic-monitor':
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Topic Monitor Panel</p>
          </div>
        );
      default:
        return (
          <div className="flex h-full items-center justify-center rounded-lg border bg-white p-4">
            <p className="text-gray-500">Unknown Panel Type</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full overflow-auto p-4">
      <GridLayoutComponent
        className="layout"
        layout={layoutItems}
        rowHeight={100}
        width={1200}
        isDraggable={false}
        isResizable={false}
        compactType="vertical"
      >
        {currentLayout.panels.map((panel) => (
          <div key={panel.id} className="overflow-hidden">
            {renderPanel(panel)}
          </div>
        ))}
      </GridLayoutComponent>
    </div>
  );
};
