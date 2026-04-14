import { refreshToken as refreshAction } from '@budget-buddy-org/budget-buddy-contracts';
import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen';
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
      const { data } = await refreshAction({
        body: { refresh_token: refreshTokenValue },
        // @ts-expect-error Internal refresh flag
        _isRefresh: true,
      });

      if (!data) {
        throw new Error('Refresh failed');
      }

      useAuthStore.getState().setAuth(data.access_token, data.refresh_token, data.expires_in);
      flushQueue(null, data.access_token);
      return data.access_token;
    } catch (refreshError) {
      flushQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// On 401: attempt refresh → retry; on refresh failure → clear auth + redirect to login
client.interceptors.response.use(
  async (response: Response, _request: Request, options: unknown) => {
    const opts = options as InternalOptions;
    if (
      response.status !== 401 ||
      opts._retry ||
      opts._isRefresh ||
      opts.url?.includes('/auth/login') ||
      opts.url?.includes('/auth/register')
    ) {
      return response;
    }

    if (refreshPromise) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(async (token) => {
        const newHeaders = new Headers(opts.headers as HeadersInit);
        newHeaders.set('Authorization', `Bearer ${token}`);
        return client.request({ ...opts, headers: newHeaders }).then((r) => r.response);
      });
    }

    opts._retry = true;
    const token = await refreshAuth();

    if (!token) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
      return response;
    }

    const newHeaders = new Headers(opts.headers as HeadersInit);
    newHeaders.set('Authorization', `Bearer ${token}`);
    return client.request({ ...opts, headers: newHeaders }).then((r) => r.response);
  },
);
