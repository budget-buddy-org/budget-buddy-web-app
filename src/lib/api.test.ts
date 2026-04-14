import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InternalOptions } from './api';

// Capture interceptors registered during module init
let responseInterceptor:
  | ((res: Response, req: Request, opts: Partial<InternalOptions>) => Promise<Response>)
  | undefined;

type RefreshTokenResult = Awaited<ReturnType<typeof refreshToken>>;

const mockClientRequest = vi.fn();

vi.mock('@budget-buddy-org/budget-buddy-contracts/client.gen', () => ({
  client: {
    setConfig: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(
          (
            fn: (res: Response, req: Request, opts: Partial<InternalOptions>) => Promise<Response>,
          ) => {
            responseInterceptor = fn;
          },
        ),
      },
    },
    request: mockClientRequest,
  },
}));

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  refreshToken: vi.fn(),
}));

let mockAuthState = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
};

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: () => mockAuthState,
  },
}));

// Import the module to trigger side-effect interceptor registration
await import('./api');
const { refreshToken } = await import('@budget-buddy-org/budget-buddy-contracts');

function makeResponse(status: number): Response {
  return new Response(null, { status });
}

function makeRequest(url = 'http://localhost/test'): Request {
  return new Request(url);
}

describe('API response interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      accessToken: null,
      refreshToken: 'rt-current',
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    };
  });

  it('passes through non-401 responses unchanged', async () => {
    const res = makeResponse(200);
    const result = await responseInterceptor?.(res, makeRequest(), {});
    expect(result).toBe(res);
  });

  it('passes through 401 on already-retried requests', async () => {
    const res = makeResponse(401);
    const opts = { _retry: true };
    const result = await responseInterceptor?.(res, makeRequest(), opts);
    expect(result).toBe(res);
    expect(refreshToken).not.toHaveBeenCalled();
  });

  it('attempts token refresh on 401 and retries the original request', async () => {
    vi.mocked(refreshToken).mockResolvedValue({
      data: {
        access_token: 'at-new',
        refresh_token: 'rt-new',
        expires_in: 3600,
        token_type: 'Bearer',
      },
      error: undefined,
    } as unknown as RefreshTokenResult);
    mockClientRequest.mockResolvedValue({ response: makeResponse(200) });

    const res = makeResponse(401);
    const opts = { headers: new Headers() };

    await responseInterceptor?.(res, makeRequest(), opts);

    expect(refreshToken).toHaveBeenCalledWith({
      body: { refresh_token: 'rt-current' },
      _isRefresh: true,
    });
    expect(mockAuthState.setAuth).toHaveBeenCalledWith('at-new', 'rt-new', 3600);
    expect(mockClientRequest).toHaveBeenCalled();
  });

  it('clears auth and redirects when refresh call fails', async () => {
    vi.mocked(refreshToken).mockRejectedValue(new Error('network error'));

    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        set href(v: string) {
          hrefSetter(v);
        },
      },
    });

    const res = makeResponse(401);
    await responseInterceptor?.(res, makeRequest(), {});

    expect(mockAuthState.clearAuth).toHaveBeenCalled();
    expect(hrefSetter).toHaveBeenCalledWith('/login');
  });

  it('clears auth and redirects to /login when there is no refresh token', async () => {
    mockAuthState.refreshToken = null;

    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        set href(v: string) {
          hrefSetter(v);
        },
      },
    });

    const res = makeResponse(401);
    await responseInterceptor?.(res, makeRequest(), {});

    expect(mockAuthState.clearAuth).toHaveBeenCalled();
    expect(hrefSetter).toHaveBeenCalledWith('/login');
  });

  it('queues concurrent 401s and replays them once the refresh resolves', async () => {
    // Hold the refresh response until we choose to release it
    let resolveRefresh!: (v: RefreshTokenResult) => void;
    vi.mocked(refreshToken).mockReturnValue(
      new Promise((res) => {
        resolveRefresh = res;
      }) as unknown as ReturnType<typeof refreshToken>,
    );
    mockClientRequest.mockResolvedValue({ response: makeResponse(200) });

    // Fire first 401 — sets isRefreshing=true, then suspends at await refreshAction(...)
    const first = responseInterceptor?.(makeResponse(401), makeRequest(), {
      headers: new Headers(),
    });

    // Fire second 401 while refresh is still in-flight — must be queued, not start a new refresh
    const second = responseInterceptor?.(makeResponse(401), makeRequest(), {
      headers: new Headers(),
    });

    // Now let the refresh complete
    resolveRefresh({
      data: {
        access_token: 'at-new',
        refresh_token: 'rt-new',
        expires_in: 3600,
        token_type: 'Bearer',
      },
      error: undefined,
    } as unknown as RefreshTokenResult);

    await Promise.all([first, second]);

    // Refresh called exactly once; both original requests retried
    expect(refreshToken).toHaveBeenCalledOnce();
    expect(mockClientRequest).toHaveBeenCalledTimes(2);
  });

  it('treats a refresh response with no data as a failure and clears auth', async () => {
    vi.mocked(refreshToken).mockResolvedValue({
      data: undefined,
      error: undefined,
    } as unknown as RefreshTokenResult);

    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        set href(v: string) {
          hrefSetter(v);
        },
      },
    });

    await responseInterceptor?.(makeResponse(401), makeRequest(), {});

    expect(mockAuthState.clearAuth).toHaveBeenCalled();
    expect(hrefSetter).toHaveBeenCalledWith('/login');
  });

  it('does not leave isRefreshing=true after the no-refresh-token path (regression)', async () => {
    // First 401 with no refresh token — previously left isRefreshing=true
    mockAuthState.refreshToken = null;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, set href(_v: string) {} },
    });
    await responseInterceptor?.(makeResponse(401), makeRequest(), {});

    // Second 401 — now has a refresh token; must attempt refresh, not hang
    mockAuthState.refreshToken = 'rt-valid';
    vi.mocked(refreshToken).mockResolvedValue({
      data: {
        access_token: 'at-new',
        refresh_token: 'rt-new',
        expires_in: 3600,
        token_type: 'Bearer',
      },
      error: undefined,
    } as unknown as RefreshTokenResult);
    mockClientRequest.mockResolvedValue({ response: makeResponse(200) });

    await responseInterceptor?.(makeResponse(401), makeRequest(), { headers: new Headers() });

    expect(refreshToken).toHaveBeenCalledOnce();
  });
});
