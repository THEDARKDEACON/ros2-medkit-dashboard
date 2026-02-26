import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App.tsx';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './components/ThemeProvider';
import { setQueryClientRef, useRobotStore } from './features/stores/robotStore';
import { updateApiBaseUrl } from './features/api/client';

// Wire up QueryClient for multi-robot cache invalidation
setQueryClientRef(queryClient);

// Restore active robot's API URL from persisted state on startup
const activeRobot = useRobotStore.getState().getActiveRobot();
if (activeRobot) {
  updateApiBaseUrl(activeRobot.apiUrl);
  console.log(`[Startup] Restored API URL for robot "${activeRobot.name}": ${activeRobot.apiUrl}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
