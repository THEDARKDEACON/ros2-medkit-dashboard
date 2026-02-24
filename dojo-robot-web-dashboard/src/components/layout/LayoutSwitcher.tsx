import React, { useState } from 'react';
import { LayoutGrid, Check, Plus, Trash2, Copy, Settings } from 'lucide-react';
import { useLayoutStore } from '../../features/stores/layoutStore';

interface LayoutSwitcherProps {
  onCustomize?: () => void;
  onManagePresets?: () => void;
}

export const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({
  onCustomize,
  onManagePresets,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNewLayoutDialog, setShowNewLayoutDialog] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  
  const {
    layouts,
    currentLayoutId,
    setCurrentLayout,
    createLayout,
    deleteLayout,
    duplicateLayout,
    getCurrentLayout,
  } = useLayoutStore();
  
  const currentLayout = getCurrentLayout();
  
  const handleSwitchLayout = (layoutId: string) => {
    setCurrentLayout(layoutId);
    setIsOpen(false);
  };
  
  const handleCreateLayout = () => {
    if (newLayoutName.trim()) {
      createLayout(newLayoutName.trim());
      setNewLayoutName('');
      setShowNewLayoutDialog(false);
      setIsOpen(false);
    }
  };
  
  const handleDuplicateLayout = (layoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const layout = layouts.find((l) => l.id === layoutId);
    if (layout) {
      duplicateLayout(layoutId, `${layout.name} (Copy)`);
    }
  };
  
  const handleDeleteLayout = (layoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this layout?')) {
      deleteLayout(layoutId);
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="font-medium">{currentLayout?.name || 'Select Layout'}</span>
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="border-b p-3">
              <h3 className="font-semibold">Dashboard Layouts</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto p-2">
              {layouts.map((layout) => (
                <div
                  key={layout.id}
                  className={`group flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 ${
                    layout.id === currentLayoutId ? 'bg-blue-50' : ''
                  }`}
                >
                  <button
                    onClick={() => handleSwitchLayout(layout.id)}
                    className="flex flex-1 items-center gap-3"
                  >
                    {layout.id === currentLayoutId && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{layout.name}</div>
                      <div className="text-xs text-gray-500">
                        {layout.panels.length} panels
                        {layout.isDefault && ' • Default'}
                      </div>
                    </div>
                  </button>
                  
                  {!layout.isDefault && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => handleDuplicateLayout(layout.id, e)}
                        className="rounded p-1 hover:bg-gray-200"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteLayout(layout.id, e)}
                        className="rounded p-1 hover:bg-red-100"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="border-t p-2">
              {showNewLayoutDialog ? (
                <div className="space-y-2 p-2">
                  <input
                    type="text"
                    value={newLayoutName}
                    onChange={(e) => setNewLayoutName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateLayout();
                      if (e.key === 'Escape') setShowNewLayoutDialog(false);
                    }}
                    placeholder="Layout name..."
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateLayout}
                      className="flex-1 rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewLayoutDialog(false);
                        setNewLayoutName('');
                      }}
                      className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={() => setShowNewLayoutDialog(true)}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-sm hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                    New Layout
                  </button>
                  {onManagePresets && (
                    <button
                      onClick={() => {
                        onManagePresets();
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-sm hover:bg-gray-50"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Load Preset
                    </button>
                  )}
                  {onCustomize && (
                    <button
                      onClick={() => {
                        onCustomize();
                        setIsOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-sm hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4" />
                      Customize Layout
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
