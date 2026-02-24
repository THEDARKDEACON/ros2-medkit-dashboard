import { Play, Pause, X, Signal, Route, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigationStatus } from '@/features/api/hooks';
import { LoadingState } from '@/components/common/LoadingState';

/**
 * NavigationControls Component
 * 
 * Provides controls for navigation and exploration including:
 * - Pause, resume, cancel exploration controls
 * - Localization quality display
 * - Path planning state indicator
 * - Obstacle detection information
 * 
 * Requirements: 17.5, 17.6, 17.7
 */
interface NavigationControlsProps {
  componentId: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  refreshInterval?: number;
}

export function NavigationControls({
  componentId,
  onPause,
  onResume,
  onCancel,
  refreshInterval = 1000,
}: NavigationControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: navStatus, isLoading } = useNavigationStatus(componentId, {
    refetchInterval: refreshInterval,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingState message="Loading controls..." />
      </div>
    );
  }

  if (!navStatus) {
    return null;
  }

  const handlePause = async () => {
    setIsProcessing(true);
    try {
      await onPause?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResume = async () => {
    setIsProcessing(true);
    try {
      await onResume?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const isExploring = navStatus.status === 'exploring';
  const canControl = navStatus.status === 'exploring' || navStatus.status === 'planning';

  return (
    <div className="space-y-6">
      {/* Control Buttons */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Exploration Controls</h3>
        <div className="flex flex-wrap gap-3">
          {/* Resume Button */}
          <button
            onClick={handleResume}
            disabled={isProcessing || isExploring || !onResume}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Resume exploration"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Resume
          </button>

          {/* Pause Button */}
          <button
            onClick={handlePause}
            disabled={isProcessing || !isExploring || !onPause}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Pause exploration"
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            Pause
          </button>

          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={isProcessing || !canControl || !onCancel}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Cancel exploration"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>

      {/* Status Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Localization Quality */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Signal className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </div>
            <h4 className="font-semibold">Localization</h4>
          </div>
          {navStatus.localizationQuality !== undefined ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quality</span>
                <span className="font-semibold">
                  {(navStatus.localizationQuality * 100).toFixed(1)}%
                </span>
              </div>
              <LocalizationQualityBar quality={navStatus.localizationQuality} />
              <QualityLabel quality={navStatus.localizationQuality} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </div>

        {/* Path Planning State */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Route className="h-5 w-5 text-purple-500" aria-hidden="true" />
            </div>
            <h4 className="font-semibold">Path Planning</h4>
          </div>
          {navStatus.pathPlanningState ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusDot state={navStatus.pathPlanningState} />
                <span className="text-sm font-medium capitalize">
                  {navStatus.pathPlanningState.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active planning</p>
          )}
        </div>

        {/* Obstacle Detection */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`rounded-lg p-2 ${
                navStatus.obstacleDetected
                  ? 'bg-red-500/10'
                  : 'bg-green-500/10'
              }`}
            >
              <ShieldAlert
                className={`h-5 w-5 ${
                  navStatus.obstacleDetected ? 'text-red-500' : 'text-green-500'
                }`}
                aria-hidden="true"
              />
            </div>
            <h4 className="font-semibold">Obstacles</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  navStatus.obstacleDetected ? 'bg-red-500' : 'bg-green-500'
                }`}
                aria-hidden="true"
              />
              <span className="text-sm font-medium">
                {navStatus.obstacleDetected ? 'Detected' : 'Clear'}
              </span>
            </div>
            {navStatus.obstacleDetected && (
              <p className="text-xs text-muted-foreground">
                Robot is avoiding obstacles
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LocalizationQualityBar Component
 * Visual bar showing localization quality
 */
interface LocalizationQualityBarProps {
  quality: number;
}

function LocalizationQualityBar({ quality }: LocalizationQualityBarProps) {
  const percentage = quality * 100;
  
  // Determine color based on quality
  let barColor = 'bg-red-500';
  if (quality >= 0.8) {
    barColor = 'bg-green-500';
  } else if (quality >= 0.5) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        className={`${barColor} h-full transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Localization quality: ${percentage.toFixed(1)}%`}
      />
    </div>
  );
}

/**
 * QualityLabel Component
 * Text label for localization quality
 */
interface QualityLabelProps {
  quality: number;
}

function QualityLabel({ quality }: QualityLabelProps) {
  let label = 'Poor';
  let color = 'text-red-500';

  if (quality >= 0.8) {
    label = 'Excellent';
    color = 'text-green-500';
  } else if (quality >= 0.6) {
    label = 'Good';
    color = 'text-green-500';
  } else if (quality >= 0.4) {
    label = 'Fair';
    color = 'text-yellow-500';
  }

  return (
    <p className={`text-xs font-medium ${color}`}>
      {label}
    </p>
  );
}

/**
 * StatusDot Component
 * Colored dot indicator for path planning state
 */
interface StatusDotProps {
  state: string;
}

function StatusDot({ state }: StatusDotProps) {
  let color = 'bg-gray-500';

  if (state.includes('success') || state.includes('complete')) {
    color = 'bg-green-500';
  } else if (state.includes('planning') || state.includes('computing')) {
    color = 'bg-blue-500';
  } else if (state.includes('error') || state.includes('failed')) {
    color = 'bg-red-500';
  } else if (state.includes('waiting') || state.includes('pending')) {
    color = 'bg-yellow-500';
  }

  return (
    <div
      className={`h-2 w-2 rounded-full ${color}`}
      aria-hidden="true"
    />
  );
}
