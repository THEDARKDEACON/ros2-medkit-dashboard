import React from 'react';
import { LayoutGrid, User, Code, FlaskConical, RotateCcw } from 'lucide-react';
import { useLayoutStore } from '../../features/stores/layoutStore';
import { getAllPresets } from '../../config/presetLayouts';

interface LayoutPresetsProps {
  onClose?: () => void;
}

export const LayoutPresets: React.FC<LayoutPresetsProps> = ({ onClose }) => {
  const { loadPreset, resetToDefault } = useLayoutStore();
  
  const presets = getAllPresets();
  
  const getPresetIcon = (presetName: string) => {
    switch (presetName) {
      case 'Operator Layout':
        return <User className="h-8 w-8" />;
      case 'Developer Layout':
        return <Code className="h-8 w-8" />;
      case 'Researcher Layout':
        return <FlaskConical className="h-8 w-8" />;
      default:
        return <LayoutGrid className="h-8 w-8" />;
    }
  };
  
  const getPresetDescription = (presetName: string) => {
    switch (presetName) {
      case 'Operator Layout':
        return 'Optimized for robot operation with map, safety, and navigation panels';
      case 'Developer Layout':
        return 'Focused on debugging with metrics, logs, and component status';
      case 'Researcher Layout':
        return 'Visualization-heavy layout with 2D/3D views and data monitoring';
      default:
        return 'Custom layout preset';
    }
  };
  
  const handleLoadPreset = (presetId: string) => {
    const presetName = presetId.replace('preset-', '');
    loadPreset(presetName);
    onClose?.();
  };
  
  const handleResetToDefault = () => {
    resetToDefault();
    onClose?.();
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Preset Layouts</h3>
        <p className="text-sm text-gray-600">
          Choose a preset layout optimized for your role
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleLoadPreset(preset.id)}
            className="flex flex-col items-start rounded-lg border-2 border-gray-200 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="mb-3 rounded-lg bg-blue-100 p-3 text-blue-600">
              {getPresetIcon(preset.name)}
            </div>
            <h4 className="mb-2 font-semibold">{preset.name}</h4>
            <p className="mb-3 text-sm text-gray-600">
              {getPresetDescription(preset.name)}
            </p>
            <div className="text-xs text-gray-500">
              {preset.panels.length} panels
            </div>
          </button>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <button
          onClick={handleResetToDefault}
          className="flex items-center gap-2 rounded-lg border-2 border-gray-200 px-4 py-2 text-gray-700 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default Layout
        </button>
      </div>
    </div>
  );
};
