import { useParams, Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Box, Settings, Zap } from 'lucide-react';
import { useComponents, useAreas } from '../../features/api/hooks';
import { LoadingState } from '../common/LoadingState';
import { EmptyState, EmptyErrorState } from '../common/EmptyState';
import { Breadcrumb } from '../common/Breadcrumb';
import { useMemo } from 'react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

/**
 * ComponentDetail displays detailed information about a specific component
 * with tabbed navigation for Topics, Operations, and Parameters
 */
export function ComponentDetail() {
  const { componentId } = useParams<{ componentId: string }>();
  const navigate = useNavigate();
  const { data: components, isLoading: componentsLoading, error: componentsError } = useComponents();
  const { data: areas, isLoading: areasLoading } = useAreas();

  // Find the current component
  const component = useMemo(() => {
    return components?.find((c) => c.id === componentId);
  }, [components, componentId]);

  // Find the component's area
  const area = useMemo(() => {
    if (!component || !areas) return null;
    return areas.find((a) => a.id === component.areaId);
  }, [component, areas]);

  // Define tabs
  const tabs: TabItem[] = [
    {
      id: 'topics',
      label: 'Topics',
      icon: Activity,
      path: `/components/${componentId}/topics`,
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Zap,
      path: `/components/${componentId}/operations`,
    },
    {
      id: 'parameters',
      label: 'Parameters',
      icon: Settings,
      path: `/components/${componentId}/parameters`,
    },
  ];

  // Determine active tab based on current path
  const currentPath = window.location.pathname;
  const activeTab = tabs.find((tab) => currentPath.startsWith(tab.path))?.id || 'topics';

  // Loading state
  if (componentsLoading || areasLoading) {
    return <LoadingState type="skeleton" lines={8} message="Loading component details..." />;
  }

  // Error state
  if (componentsError) {
    return (
      <EmptyErrorState
        title="Failed to load component"
        description="Unable to fetch component details. Please check your connection."
      />
    );
  }

  // Component not found
  if (!component) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Box}
          title="Component not found"
          description={`No component found with ID: ${componentId}`}
          size="md"
        />
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/components')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Components
          </button>
        </div>
      </div>
    );
  }

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Components', path: '/components' },
    { label: component.name, path: `/components/${componentId}` },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Back button */}
      <button
        onClick={() => navigate('/components')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Components
      </button>

      {/* Component header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          {/* Component icon with status */}
          <div className="relative flex-shrink-0 p-3 rounded-lg bg-primary/10">
            <Activity className="h-6 w-6 text-primary" aria-hidden="true" />
            {/* Status indicator */}
            <div
              className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${
                component.status === 'active'
                  ? 'bg-green-500'
                  : component.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
              aria-label={`Status: ${component.status}`}
            />
          </div>

          {/* Component info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold truncate">{component.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* Identifier */}
              <div className="flex items-center gap-1">
                <span className="font-medium">ID:</span>
                <code className="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-xs">
                  {component.identifier}
                </code>
              </div>

              {/* Area */}
              {area && (
                <div className="flex items-center gap-1">
                  <Box className="h-4 w-4" aria-hidden="true" />
                  <span>{area.name}</span>
                </div>
              )}

              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    component.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : component.status === 'error'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  {component.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Component sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab content placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          {activeTab === 'topics' && 'Topic monitoring will be implemented in future tasks'}
          {activeTab === 'operations' && 'Operations execution will be implemented in future tasks'}
          {activeTab === 'parameters' && 'Parameter configuration will be implemented in future tasks'}
        </p>
      </div>
    </div>
  );
}
