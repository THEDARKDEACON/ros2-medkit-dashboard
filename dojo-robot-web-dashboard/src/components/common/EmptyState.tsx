import type { LucideIcon } from 'lucide-react';
import { Inbox, Search, AlertCircle, FileX } from 'lucide-react';

interface EmptyStateProps {
  /**
   * Icon to display (defaults to Inbox)
   */
  icon?: LucideIcon;
  /**
   * Title of the empty state
   */
  title: string;
  /**
   * Description or message to display
   */
  description?: string;
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Size of the empty state
   */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    icon: 'h-8 w-8',
    title: 'text-base',
    description: 'text-sm',
    padding: 'p-4',
  },
  md: {
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-base',
    padding: 'p-8',
  },
  lg: {
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-lg',
    padding: 'p-12',
  },
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${config.padding}`}
      role="status"
      aria-label={title}
    >
      <Icon
        className={`${config.icon} text-muted-foreground/50 mb-4`}
        aria-hidden="true"
      />
      <h3 className={`${config.title} font-semibold text-foreground mb-2`}>
        {title}
      </h3>
      {description && (
        <p className={`${config.description} text-muted-foreground max-w-md mb-4`}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Specialized empty state for search results
 */
interface EmptySearchResultsProps {
  searchTerm: string;
  onClear?: () => void;
}

export function EmptySearchResults({ searchTerm, onClear }: EmptySearchResultsProps) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No results found for "${searchTerm}". Try adjusting your search terms.`}
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

/**
 * Specialized empty state for errors
 */
interface EmptyErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function EmptyErrorState({
  title = 'Unable to load data',
  description = 'An error occurred while loading the data. Please try again.',
  onRetry,
}: EmptyErrorStateProps) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    />
  );
}

/**
 * Specialized empty state for no data
 */
interface EmptyDataStateProps {
  title?: string;
  description?: string;
  onCreate?: () => void;
  createLabel?: string;
}

export function EmptyDataState({
  title = 'No data available',
  description = 'There is no data to display at this time.',
  onCreate,
  createLabel = 'Create new',
}: EmptyDataStateProps) {
  return (
    <EmptyState
      icon={FileX}
      title={title}
      description={description}
      action={onCreate ? { label: createLabel, onClick: onCreate } : undefined}
    />
  );
}
