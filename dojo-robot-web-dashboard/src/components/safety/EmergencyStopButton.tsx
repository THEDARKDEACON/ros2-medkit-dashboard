import { useState } from 'react';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { useTriggerEmergencyStop } from '@/features/api/hooks';

/**
 * EmergencyStopButton Component
 * 
 * Displays a prominent emergency stop button that triggers the safety system.
 * Shows a confirmation dialog before activating the emergency stop.
 * Displays the current emergency stop status.
 * 
 * Requirements: 18.3, 18.6
 */
interface EmergencyStopButtonProps {
  componentId: string;
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EmergencyStopButton({
  componentId,
  isActive,
  size = 'lg',
}: EmergencyStopButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const triggerEmergencyStop = useTriggerEmergencyStop();

  const handleEmergencyStop = async () => {
    try {
      await triggerEmergencyStop.mutateAsync({ componentId });
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to activate emergency stop:', error);
    }
  };

  const sizeConfig = {
    sm: {
      button: 'h-10 w-10',
      icon: 'h-5 w-5',
      text: 'text-xs',
    },
    md: {
      button: 'h-16 w-16',
      icon: 'h-8 w-8',
      text: 'text-sm',
    },
    lg: {
      button: 'h-20 w-20',
      icon: 'h-10 w-10',
      text: 'text-base',
    },
  };

  const config = sizeConfig[size];

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => setShowConfirmDialog(true)}
          disabled={isActive || triggerEmergencyStop.isPending}
          className={`${config.button} rounded-full ${isActive
              ? 'bg-red-500 hover:bg-red-600 cursor-not-allowed opacity-50'
              : 'bg-red-500 hover:bg-red-600 active:scale-95'
            } transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center`}
          aria-label="Emergency Stop"
          title={isActive ? 'Emergency stop is active' : 'Activate emergency stop'}
        >
          {triggerEmergencyStop.isPending ? (
            <Loader2 className={`${config.icon} animate-spin text-white`} />
          ) : (
            <AlertOctagon className={`${config.icon} text-white`} />
          )}
        </button>

        {isActive && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className={`${config.text} font-semibold text-red-500`}>
              ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-2 text-red-500 mb-4">
              <AlertOctagon className="h-6 w-6" />
              <h2 className="text-xl font-bold">Activate Emergency Stop?</h2>
            </div>
            <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300">
              <p>
                This will immediately stop all robot motion and activate the safety system.
              </p>
              <p className="font-semibold">
                Are you sure you want to proceed?
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyStop}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Activate Emergency Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
