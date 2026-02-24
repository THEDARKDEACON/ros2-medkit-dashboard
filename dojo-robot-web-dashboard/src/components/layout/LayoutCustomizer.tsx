import React, { useState } from 'react';
import { X, Plus, Grid3x3, Save, RotateCcw } from 'lucide-react';
import { useLayoutStore } from '../../features/stores/layoutStore';
import { PANEL_LIBRARY, getPanelsByCategory } from '../../config/panelLibrary';
import type { PanelConfig, PanelType } from '../../types/layout';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface LayoutCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LayoutCustomizer: React.FC<LayoutCustomizerProps> = ({
  isOpen,
  onClose,
}) => {
  const [showPanelLibrary, setShowPanelLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const {
    getCurrentLayout,
    currentLayoutId,
    addPanel,
    removePanel,
    updatePanelPositions,
  } = useLayoutStore();
  
  const currentLayout = getCurrentLayout();
  
  if (!isOpen || !currentLayout || !currentLayoutId) {
    return null;
  }
  
  const handleAddPanel = (type: PanelType) => {
    const panelDef = PANEL_LIBRARY.find((p) => p.type === type);
    if (!panelDef) return;
    
    const newPanel: PanelConfig = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 0, y: Infinity }, // Add to bottom
      size: panelDef.defaultSize,
      config: {},
    };
    
    addPanel(currentLayoutId, newPanel);
    setShowPanelLibrary(false);
  };
  
  const handleRemovePanel = (panelId: string) => {
    removePanel(currentLayoutId, panelId);
  };
  
  const handleLayoutChange = (layout: any[]) => {
    const updatedPanels: PanelConfig[] = currentLayout.panels.map((panel) => {
      const layoutItem = layout.find((item) => item.i === panel.id);
      if (layoutItem) {
        return {
          ...panel,
          position: { x: layoutItem.x, y: layoutItem.y },
          size: { width: layoutItem.w, height: layoutItem.h },
        };
      }
      return panel;
    });
    
    updatePanelPositions(currentLayoutId, updatedPanels);
  };
  
  const filteredPanels =
    selectedCategory === 'all'
      ? PANEL_LIBRARY
      : getPanelsByCategory(selectedCategory as any);
  
  const layoutItems = currentLayout.panels.map((panel) => ({
    i: panel.id,
    x: panel.position.x,
    y: panel.position.y,
    w: panel.size.width,
    h: panel.size.height,
    minW: PANEL_LIBRARY.find((p) => p.type === panel.type)?.minSize.width || 2,
    minH: PANEL_LIBRARY.find((p) => p.type === panel.type)?.minSize.height || 2,
  }));
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex h-full">
        {/* Main customization area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Customize Layout</h2>
              <p className="text-sm text-gray-600">
                Drag panels to rearrange, resize by dragging corners
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPanelLibrary(!showPanelLibrary)}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" />
                Add Panel
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                <Save className="h-4 w-4" />
                Done
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-gray-200 p-2 hover:bg-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Grid layout */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <GridLayout
              className="layout"
              layout={layoutItems}
              cols={12}
              rowHeight={100}
              width={1200}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              compactType="vertical"
            >
              {currentLayout.panels.map((panel) => {
                const panelDef = PANEL_LIBRARY.find((p) => p.type === panel.type);
                return (
                  <div
                    key={panel.id}
                    className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 shadow-sm"
                  >
                    <div className="drag-handle mb-2 flex cursor-move items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Grid3x3 className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{panelDef?.name || panel.type}</span>
                      </div>
                      <button
                        onClick={() => handleRemovePanel(panel.id)}
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {panelDef?.description || 'Panel content'}
                    </div>
                  </div>
                );
              })}
            </GridLayout>
          </div>
        </div>
        
        {/* Panel library sidebar */}
        {showPanelLibrary && (
          <div className="w-80 border-l bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Panel Library</h3>
              <button
                onClick={() => setShowPanelLibrary(false)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Category filter */}
            <div className="mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="all">All Categories</option>
                <option value="monitoring">Monitoring</option>
                <option value="visualization">Visualization</option>
                <option value="control">Control</option>
                <option value="data">Data</option>
              </select>
            </div>
            
            {/* Panel list */}
            <div className="space-y-2">
              {filteredPanels.map((panel) => (
                <button
                  key={panel.type}
                  onClick={() => handleAddPanel(panel.type)}
                  className="w-full rounded-lg border border-gray-200 p-3 text-left hover:border-blue-500 hover:bg-blue-50"
                >
                  <div className="mb-1 font-medium">{panel.name}</div>
                  <div className="text-xs text-gray-500">{panel.description}</div>
                  <div className="mt-2 text-xs text-gray-400">
                    Size: {panel.defaultSize.width}x{panel.defaultSize.height}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
