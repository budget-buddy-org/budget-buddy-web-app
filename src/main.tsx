import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { refreshAuth } from './lib/api';
import { loadConfig } from './lib/config';
import { logError } from './lib/error-logger';
import { queryClient } from './lib/query-client';
import { router } from './lib/router';
import { useAuthStore } from './stores/auth.store';
import './index.css';

// Global error monitoring — guarded for HMR to avoid duplicate listeners
const onError = (event: ErrorEvent) => logError(event.error, { source: 'GlobalError' });
const onRejection = (event: PromiseRejectionEvent) =>
  logError(event.reason, { source: 'UnhandledRejection' });

window.addEventListener('error', onError);
window.addEventListener('unhandledrejection', onRejection);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  });
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

// Bootstrapping: Load runtime config, update the API client, then render the app.
loadConfig()
  .then(async (config) => {
    client.setConfig({
      baseUrl: config.VITE_API_URL,
      auth: () => useAuthStore.getState().accessToken ?? undefined,
    });

    // Try to refresh the token on app load if we have a refresh token but no access token.
    // This avoids unnecessary redirects to the login page on page reload.
    const { accessToken, refreshToken } = useAuthStore.getState();
    if (!accessToken && refreshToken) {
      try {
        await refreshAuth();
      } catch (err) {
        console.error('[BOOTSTRAP] Auth refresh failed:', err);
      }
    }

    createRoot(rootEl).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    );
  })
  .catch((err) => {
    console.error('[BOOTSTRAP] Config loading failed:', err);
    createRoot(rootEl).render(
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-xs">
          <h1 className="text-xl font-semibold">Failed to load configuration</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please check your connection and try again.
          </p>
        </div>
      </div>,
    );
  });
