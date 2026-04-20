import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { loadConfig } from './lib/config';
import { logError } from './lib/error-logger';
import { onOidcSigninCallback, userManager } from './lib/oidc';
import { queryClient } from './lib/query-client';
import { router } from './lib/router';
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
    });

    createRoot(rootEl).render(
      <StrictMode>
        <AuthProvider userManager={userManager} onSigninCallback={onOidcSigninCallback}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </AuthProvider>
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
