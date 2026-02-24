import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  /**
   * Type of loading indicator to display
   * - spinner: Animated spinner icon
   * - skeleton: Skeleton screen placeholder
   */
  type?: 'spinner' | 'skeleton';
  /**
   * Optional message to display below the loading indicator
   */
  message?: string;
  /**
   * Number of skeleton lines to display (only for skeleton type)
   */
  lines?: number;
  /**
   * Size of the spinner (only for spinner type)
   */
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ 
  type = 'spinner', 
  message, 
  lines = 3,
  size = 'md' 
}: LoadingStateProps) {
  if (type === 'skeleton') {
    return (
      <div className="space-y-3 animate-pulse" role="status" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 bg-muted rounded"
            style={{ width: `${100 - (index * 10)}%` }}
          />
        ))}
        {message && (
          <p className="text-sm text-muted-foreground mt-2">{message}</p>
        )}
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div 
      className="flex flex-col items-center justify-center gap-3 p-8"
      role="status"
      aria-label="Loading content"
    >
      <Loader2 
        className={`${sizeClasses[size]} animate-spin text-primary`}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
