import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import './App.css';

// Lazy load page components for code splitting
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard }))
);
const Components = lazy(() =>
  import('./pages/Components').then((module) => ({ default: module.Components }))
);
const ComponentDetail = lazy(() =>
  import('./components/components/ComponentDetail').then((module) => ({
    default: module.ComponentDetail,
  }))
);
const Topics = lazy(() =>
  import('./pages/Topics').then((module) => ({ default: module.Topics }))
);
const Operations = lazy(() =>
  import('./pages/Operations').then((module) => ({ default: module.Operations }))
);
const Parameters = lazy(() =>
  import('./pages/Parameters').then((module) => ({ default: module.Parameters }))
);
const Faults = lazy(() =>
  import('./pages/Faults').then((module) => ({ default: module.Faults }))
);
const Visualizations = lazy(() =>
  import('./pages/Visualizations').then((module) => ({
    default: module.Visualizations,
  }))
);
const Performance = lazy(() =>
  import('./pages/Performance').then((module) => ({ default: module.Performance }))
);
const Settings = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.Settings }))
);

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Root layout component
function RootLayout() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

// Router configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'components',
        children: [
          {
            index: true,
            element: <Components />,
          },
          {
            path: ':componentId/:tab',
            element: <ComponentDetail />,
          },
        ],
      },
      {
        path: 'topics',
        element: <Topics />,
      },
      {
        path: 'operations',
        element: <Operations />,
      },
      {
        path: 'parameters',
        element: <Parameters />,
      },
      {
        path: 'faults',
        element: <Faults />,
      },
      {
        path: 'visualizations',
        element: <Visualizations />,
      },
      {
        path: 'performance',
        element: <Performance />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
