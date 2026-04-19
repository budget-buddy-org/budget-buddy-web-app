import { refreshToken as refreshAction } from '@budget-buddy-org/budget-buddy-contracts';
import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
import { router } from '@/lib/router';
import { useAuthStore } from '@/stores/auth.store';

export type InternalOptions = Parameters<typeof client.request>[0] & {
  _retry?: boolean;
  _isRefresh?: boolean;
};

// Queue of requests waiting for a token refresh to complete
let refreshPromise: Promise<string | null> | null = null;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function flushQueue(error: unknown, token: string | null) {
  for (const { resolve, reject } of pendingQueue) {
    if (error) {
      reject(error);
    } else {
      resolve(token ?? '');
    }
  }
  pendingQueue = [];
}

export function refreshAuth() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshTokenValue = useAuthStore.getState().refreshToken;
  if (!refreshTokenValue) {
    useAuthStore.getState().clearAuth();
    return Promise.resolve(null);
  }

  refreshPromise = (async () => {
    try {
      const { data, response } = await refreshAction({
        body: { refresh_token: refreshTokenValue },
        // @ts-expect-error Internal refresh flag
        _isRefresh: true,
      });

      if (!data) {
        // Clear auth unless the server returned a 5xx (transient server error).
        // A 4xx means the token was explicitly rejected; no response at all is an
        // unexpected state — both warrant clearing the session.
        const status = response?.status;
        const isTransientServerError = status !== undefined && status >= 500;
        if (!isTransientServerError) {
          useAuthStore.getState().clearAuth();
        }
        refreshPromise = null;
        flushQueue(new Error('Refresh failed'), null);
        return null;
      }

      useAuthStore.getState().setAuth(data.access_token, data.refresh_token, data.expires_in);
      // Clear the promise before flushing so any 401s that arrive while the queue
      // is draining see refreshPromise = null and queue behind a fresh refresh
      // rather than being silently dropped.
      refreshPromise = null;
      flushQueue(null, data.access_token);
      return data.access_token;
    } catch (refreshError) {
      // Network-level error (no response): do not clear auth, allow retry on next request.
      refreshPromise = null;
      flushQueue(refreshError, null);
      return null;
    }
  })();

  return refreshPromise;
}

// On 401: attempt refresh → retry; on refresh failure → clear auth + return to app root
client.interceptors.response.use(
  async (response: Response, _request: Request, options: unknown) => {
    const opts = options as InternalOptions;
    if (
      response.status !== 401 ||
      opts._retry ||
      opts._isRefresh ||
      opts.url?.includes('/auth/login') ||
      opts.url?.includes('/auth/register') ||
      opts.url?.includes('/auth/logout')
    ) {
      return response;
    }

    if (refreshPromise) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(async (token) => {
        const newHeaders = new Headers(opts.headers as HeadersInit);
        newHeaders.set('Authorization', `Bearer ${token}`);
        const retryOpts: InternalOptions = { ...opts, _retry: true, headers: newHeaders };
        return client
          .request(retryOpts as Parameters<typeof client.request>[0])
          .then((r) => r.response);
      });
    }

    opts._retry = true;
    const token = await refreshAuth();

    if (!token) {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) {
        router.navigate({ to: '/' });
        // Throw so the caller's promise rejects instead of processing the stale 401.
        // The component is about to unmount due to navigation, so this is safe.
        throw new Error('Session expired');
      }
      return response;
    }

    const newHeaders = new Headers(opts.headers as HeadersInit);
    newHeaders.set('Authorization', `Bearer ${token}`);
    return client.request({ ...opts, headers: newHeaders }).then((r) => r.response);
  },
);
