import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUserManager = {
  getUser: vi.fn(),
  signinRedirect: vi.fn(),
};

vi.mock('@/lib/oidc', () => ({
  userManager: mockUserManager,
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

function makeResponse(status: number): Response {
  return new Response(null, { status });
}

function makeRequest(url = 'http://localhost/test'): Request {
  return new Request(url);
}

describe('API interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('request interceptor', () => {
    it('injects Authorization header when user is logged in', async () => {
      mockUserManager.getUser.mockResolvedValue({ access_token: 'test-token' });
      const req = makeRequest();

      await requestInterceptor?.(req);

      expect(req.headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('does not inject Authorization header when user is not logged in', async () => {
      mockUserManager.getUser.mockResolvedValue(null);
      const req = makeRequest();

      await requestInterceptor?.(req);

      expect(req.headers.has('Authorization')).toBe(false);
    });
  });

  describe('response interceptor', () => {
    it('triggers signinRedirect on 401', async () => {
      const res = makeResponse(401);
      const req = makeRequest();

      await responseInterceptor?.(res, req);

      expect(mockUserManager.signinRedirect).toHaveBeenCalled();
    });

    it('does not trigger signinRedirect on 200', async () => {
      const res = makeResponse(200);
      const req = makeRequest();

      await responseInterceptor?.(res, req);

      expect(mockUserManager.signinRedirect).not.toHaveBeenCalled();
    });

    it('avoids redirect loop for login page', async () => {
      const res = makeResponse(401);
      const req = makeRequest('http://localhost/auth/login');

      await responseInterceptor?.(res, req);

      expect(mockUserManager.signinRedirect).not.toHaveBeenCalled();
    });
  });
});
