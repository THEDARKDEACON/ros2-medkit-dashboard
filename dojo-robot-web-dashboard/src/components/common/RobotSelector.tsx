import { useState, useRef, useEffect } from 'react';
import { useRobotStore } from '@/features/stores/robotStore';
import { ChevronDown, Plus, Trash2, Check } from 'lucide-react';

export function RobotSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [robotName, setRobotName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const robots = useRobotStore((state) => state.robots);
  const activeRobotId = useRobotStore((state) => state.activeRobotId);
  const addRobot = useRobotStore((state) => state.addRobot);
  const removeRobot = useRobotStore((state) => state.removeRobot);
  const switchRobot = useRobotStore((state) => state.switchRobot);
  const getActiveRobot = useRobotStore((state) => state.getActiveRobot);

  const activeRobot = getActiveRobot();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddRobot = () => {
    if (!robotName.trim()) {
      setUrlError('Robot name is required');
      return;
    }

    if (!validateUrl(apiUrl)) {
      setUrlError('Invalid URL. Must be a valid HTTP or HTTPS URL');
      return;
    }

    const id = addRobot(robotName.trim(), apiUrl.trim());
    switchRobot(id);
    setRobotName('');
    setApiUrl('');
    setUrlError('');
    setShowAddForm(false);
    setIsOpen(false);
  };

  const handleRemoveRobot = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeRobot(id);
  };

  const handleSwitchRobot = (id: string) => {
    switchRobot(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Select robot"
      >
        <span className="text-muted-foreground">Robot:</span>
        <span>{activeRobot ? activeRobot.name : 'No robot selected'}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border bg-card shadow-lg z-50">
          <div className="p-2">
            {/* Robot List */}
            {robots.length > 0 ? (
              <div className="space-y-1 mb-2">
                {robots.map((robot) => (
                  <div
                    key={robot.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent cursor-pointer group"
                    onClick={() => handleSwitchRobot(robot.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{robot.name}</span>
                        {robot.id === activeRobotId && (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground truncate block">
                        {robot.apiUrl}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleRemoveRobot(robot.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
                      aria-label={`Remove ${robot.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No robots configured
              </div>
            )}

            {/* Add Robot Form */}
            {showAddForm ? (
              <div className="border-t pt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Robot name"
                  value={robotName}
                  onChange={(e) => {
                    setRobotName(e.target.value);
                    setUrlError('');
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="API URL (e.g., http://localhost:8080)"
                  value={apiUrl}
                  onChange={(e) => {
                    setApiUrl(e.target.value);
                    setUrlError('');
                  }}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
                {urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRobot}
                    className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Robot
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setRobotName('');
                      setApiUrl('');
                      setUrlError('');
                    }}
                    className="flex-1 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border-t hover:bg-accent transition-colors rounded-b-md"
              >
                <Plus className="h-4 w-4" />
                Add Robot
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
