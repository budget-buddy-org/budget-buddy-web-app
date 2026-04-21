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

// Import module to trigger side-effect interceptor registration
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

  it('proactively refreshes when the token expires within 60 seconds', async () => {
    mockUserManager.getUser.mockResolvedValue({
      access_token: 'old-token',
      expires_at: Date.now() / 1000 + 30, // 30s remaining — under the 60s threshold
    });
    mockUserManager.signinSilent.mockResolvedValue({ access_token: 'new-token' });

    const token = await getAuthToken();

    expect(mockUserManager.signinSilent).toHaveBeenCalled();
    expect(token).toBe('new-token');
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
      expires_at: Date.now() / 1000 + 10,
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

  it('triggers signinRedirect on 401', async () => {
    const res = makeResponse(401);

    await responseInterceptor?.(res, makeRequest());

    expect(mockUserManager.signinRedirect).toHaveBeenCalled();
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

    expect(mockUserManager.signinRedirect).not.toHaveBeenCalled();
  });
});
