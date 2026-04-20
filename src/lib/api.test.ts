import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUserManager = {
  getUser: vi.fn(),
  signinSilent: vi.fn(),
  signinRedirect: vi.fn(),
};

vi.mock('@/lib/oidc', () => ({
  userManager: mockUserManager,
}));

let authCallback: (() => Promise<string | undefined>) | undefined;
let responseInterceptor: ((res: Response, req: Request) => Promise<Response>) | undefined;

vi.mock('@budget-buddy-org/budget-buddy-contracts/client.gen', () => ({
  client: {
    setConfig: vi.fn((config) => {
      if (config.auth) {
        authCallback = config.auth;
      }
    }),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn((fn) => {
          responseInterceptor = fn;
        }),
      },
    },
  },
}));

// Import module to trigger side-effect registration
await import('./api');

function makeResponse(status: number): Response {
  return new Response(null, { status });
}

function makeRequest(url = 'http://localhost/test'): Request {
  return new Request(url);
}

describe('API config & interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth callback', () => {
    it('returns access token when user is logged in and token is fresh', async () => {
      mockUserManager.getUser.mockResolvedValue({
        access_token: 'fresh-token',
        expired: false,
        expires_at: Date.now() / 1000 + 3600,
      });

      const token = await authCallback?.();

      expect(token).toBe('fresh-token');
      expect(mockUserManager.signinSilent).not.toHaveBeenCalled();
    });

    it('attempts silent refresh when token is about to expire', async () => {
      mockUserManager.getUser.mockResolvedValue({
        access_token: 'old-token',
        expired: false,
        expires_at: Date.now() / 1000 + 30, // 30s remaining
      });
      mockUserManager.signinSilent.mockResolvedValue({
        access_token: 'new-token',
      });

      const token = await authCallback?.();

      expect(mockUserManager.signinSilent).toHaveBeenCalled();
      expect(token).toBe('new-token');
    });

    it('returns undefined when user is not logged in', async () => {
      mockUserManager.getUser.mockResolvedValue(null);

      const token = await authCallback?.();

      expect(token).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('triggers signinRedirect on 401', async () => {
      const res = makeResponse(401);
      const req = makeRequest();

      await responseInterceptor?.(res, req);

      expect(mockUserManager.signinRedirect).toHaveBeenCalled();
    });

    it('avoids redirect loop for login/register/callback pages', async () => {
      const res = makeResponse(401);

      await responseInterceptor?.(res, makeRequest('http://localhost/auth/login'));
      await responseInterceptor?.(res, makeRequest('http://localhost/auth/register'));
      await responseInterceptor?.(res, makeRequest('http://localhost/auth/callback'));

      expect(mockUserManager.signinRedirect).not.toHaveBeenCalled();
    });
  });
});
