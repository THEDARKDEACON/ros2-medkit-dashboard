import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface AnimatedStatusProps {
  /**
   * Type of status to display
   */
  status: StatusType;
  /**
   * Optional message to display next to the status icon
   */
  message?: string;
  /**
   * Size of the status indicator
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show the status icon
   */
  showIcon?: boolean;
  /**
   * Whether to animate the status change
   */
  animate?: boolean;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Success',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Error',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Information',
  },
  loading: {
    icon: Loader2,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Loading',
  },
};

const sizeClasses = {
  sm: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
  },
  md: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
  },
  lg: {
    icon: 'h-6 w-6',
    text: 'text-lg',
    padding: 'px-4 py-2',
  },
};

export function AnimatedStatus({
  status,
  message,
  size = 'md',
  showIcon = true,
  animate = true,
}: AnimatedStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClass = sizeClasses[size];

  const animationClass = animate ? 'transition-all duration-300 ease-in-out' : '';
  const iconAnimationClass = status === 'loading' ? 'animate-spin' : animate ? 'animate-in fade-in zoom-in duration-300' : '';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md ${config.bgColor} ${sizeClass.padding} ${animationClass}`}
      role="status"
      aria-label={`${config.label}${message ? `: ${message}` : ''}`}
    >
      {showIcon && (
        <Icon
          className={`${sizeClass.icon} ${config.color} ${iconAnimationClass} flex-shrink-0`}
          aria-hidden="true"
        />
      )}
      {message && (
        <span className={`${sizeClass.text} ${config.color} font-medium`}>
          {message}
        </span>
      )}
    </div>
  );
}

/**
 * Pulse indicator for real-time status
 */
interface StatusPulseProps {
  /**
   * Whether the status is active/connected
   */
  active: boolean;
  /**
   * Optional label to display
   */
  label?: string;
  /**
   * Size of the pulse indicator
   */
  size?: 'sm' | 'md' | 'lg';
}

const pulseSize = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function StatusPulse({ active, label, size = 'md' }: StatusPulseProps) {
  return (
    <div className="inline-flex items-center gap-2" role="status" aria-label={label || (active ? 'Connected' : 'Disconnected')}>
      <div className="relative">
        <div
          className={`${pulseSize[size]} rounded-full ${
            active ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        {active && (
          <div
            className={`absolute inset-0 ${pulseSize[size]} rounded-full bg-green-500 animate-ping opacity-75`}
            aria-hidden="true"
          />
        )}
      </div>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
