import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUserManager = {
  getUser: vi.fn(),
  signinSilent: vi.fn(),
  signinRedirect: vi.fn(),
};

vi.mock('@/lib/oidc', () => ({
  getUserManager: () => mockUserManager,
}));

let requestInterceptor: ((req: Request) => Promise<Request>) | undefined;
let responseInterceptor: ((res: Response, req: Request) => Promise<Response>) | undefined;

vi.mock('@budget-buddy-org/budget-buddy-contracts/client.gen', () => ({
  client: {
    setConfig: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((fn) => {
          requestInterceptor = fn;
        }),
      },
      response: {
        use: vi.fn((fn) => {
          responseInterceptor = fn;
        }),
      },
    },
  },
}));

// Import module to trigger side effect interceptor registration
await import('./api');
const { getAuthToken } = await import('./api');

function makeResponse(status: number): Response {
  return new Response(null, { status });
}

function makeRequest(url = 'http://localhost/test'): Request {
  return new Request(url);
}

describe('getAuthToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the access token when user is logged in and token is fresh', async () => {
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'fresh-token',
      expires_at: Date.now() / 1000 + 3600,
    });

    const token = await getAuthToken();

    expect(token).toBe('fresh-token');
    expect(mockUserManager.signinSilent).not.toHaveBeenCalled();
  });

  it('does not refresh when the token is more than 10 seconds from expiry', async () => {
    // Trust the SDK's automaticSilentRenew (which fires at ~60s before expiry)
    // for anything above the safety-net threshold.
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'still-fresh',
      expires_at: Date.now() / 1000 + 30,
    });

    const token = await getAuthToken();

    expect(mockUserManager.signinSilent).not.toHaveBeenCalled();
    expect(token).toBe('still-fresh');
  });

  it('proactively refreshes when the token expires within 10 seconds', async () => {
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'old-token',
      expires_at: Date.now() / 1000 + 5, // 5s remaining — under the 10s safety-net threshold
    });
    mockUserManager.signinSilent.mockResolvedValue({ access_token: 'new-token' });

    const token = await getAuthToken();

    expect(mockUserManager.signinSilent).toHaveBeenCalled();
    expect(token).toBe('new-token');
  });

  it('dedupes concurrent refresh calls onto a single signinSilent invocation', async () => {
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'old-token',
      expires_at: Date.now() / 1000 + 5,
    });
    mockUserManager.signinSilent.mockResolvedValue({ access_token: 'new-token' });

    const [t1, t2, t3] = await Promise.all([getAuthToken(), getAuthToken(), getAuthToken()]);

    expect(mockUserManager.signinSilent).toHaveBeenCalledTimes(1);
    expect(t1).toBe('new-token');
    expect(t2).toBe('new-token');
    expect(t3).toBe('new-token');
  });

  it('returns undefined when no user is logged in', async () => {
    mockUserManager.getUser.mockResolvedValue(null);

    const token = await getAuthToken();

    expect(token).toBeUndefined();
    expect(mockUserManager.signinSilent).not.toHaveBeenCalled();
  });

  it('returns undefined when silent refresh fails', async () => {
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'old-token',
      expires_at: Date.now() / 1000 + 5,
    });
    mockUserManager.signinSilent.mockRejectedValue(new Error('network error'));

    const token = await getAuthToken();

    expect(token).toBeUndefined();
  });
});

describe('request interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets Authorization header when a token is available', async () => {
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'test-token',
      expires_at: Date.now() / 1000 + 3600,
    });

    const req = makeRequest();
    const result = await requestInterceptor?.(req);

    expect(result?.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('does not set Authorization header when user is not logged in', async () => {
    mockUserManager.getUser.mockResolvedValue(null);

    const req = makeRequest();
    const result = await requestInterceptor?.(req);

    expect(result?.headers.get('Authorization')).toBeNull();
  });
});

describe('response interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tries silent refresh before redirecting on 401', async () => {
    mockUserManager.signinSilent.mockRejectedValue(new Error('session expired'));
    const res = makeResponse(401);

    await responseInterceptor?.(res, makeRequest());

    expect(mockUserManager.signinSilent).toHaveBeenCalled();
    expect(mockUserManager.signinRedirect).toHaveBeenCalled();
  });

  it('does not redirect on 401 when silent refresh succeeds', async () => {
    mockUserManager.signinSilent.mockResolvedValue({ access_token: 'new-token' });
    const res = makeResponse(401);

    const result = await responseInterceptor?.(res, makeRequest());

    expect(mockUserManager.signinSilent).toHaveBeenCalled();
    expect(mockUserManager.signinRedirect).not.toHaveBeenCalled();
    expect(result?.status).toBe(401);
  });

  it('passes through non-401 responses unchanged', async () => {
    const res = makeResponse(200);

    const result = await responseInterceptor?.(res, makeRequest());

    expect(result).toBe(res);
    expect(mockUserManager.signinRedirect).not.toHaveBeenCalled();
  });

  it('avoids redirect loops for all /auth/ routes', async () => {
    const res = makeResponse(401);

    await responseInterceptor?.(res, makeRequest('http://localhost/auth/callback'));

    expect(mockUserManager.signinSilent).not.toHaveBeenCalled();
    expect(mockUserManager.signinRedirect).not.toHaveBeenCalled();
  });
});

describe('visibilitychange handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls signinSilent when tab becomes visible with an expiring token', async () => {
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'old-token',
      expires_at: Date.now() / 1000 + 30, // within the 60s threshold
    });
    mockUserManager.signinSilent.mockResolvedValue({ access_token: 'new-token' });

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitFor(() => expect(mockUserManager.signinSilent).toHaveBeenCalled());
  });

  it('does not call signinSilent when token has plenty of time remaining', async () => {
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'fresh-token',
      expires_at: Date.now() / 1000 + 3600,
    });

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await new Promise((r) => setTimeout(r, 20));

    expect(mockUserManager.signinSilent).not.toHaveBeenCalled();
  });

  it('does not act when the tab is hidden', async () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await new Promise((r) => setTimeout(r, 20));

    expect(mockUserManager.getUser).not.toHaveBeenCalled();
    expect(mockUserManager.signinSilent).not.toHaveBeenCalled();
  });
});
