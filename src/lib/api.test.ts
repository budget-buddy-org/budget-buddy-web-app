import { beforeEach, describe, expect, it, vi } from 'vitest'

// Capture interceptors registered during module init
let requestInterceptor: ((req: Request) => Request) | undefined
let responseInterceptor:
  | ((res: Response, req: Request, opts: any) => Promise<Response>)
  | undefined

const mockClientRequest = vi.fn()

vi.mock('@budget-buddy-org/budget-buddy-contracts/client.gen', () => ({
  client: {
    setConfig: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((fn: (req: Request) => Request) => {
          requestInterceptor = fn
        }),
      },
      response: {
        use: vi.fn((fn: (res: Response, req: Request, opts: any) => Promise<Response>) => {
          responseInterceptor = fn
        }),
      },
    },
    request: mockClientRequest,
  },
}))

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  refreshToken: vi.fn(),
}))

let mockAuthState = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
}

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: () => mockAuthState,
  },
}))

// Import the module to trigger side-effect interceptor registration
await import('./api')
const { refreshToken } = await import('@budget-buddy-org/budget-buddy-contracts')

function makeResponse(status: number): Response {
  return new Response(null, { status })
}

function makeRequest(url = 'http://localhost/test'): Request {
  return new Request(url)
}

describe('API request interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      accessToken: null,
      refreshToken: null,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    }
  })

  it('attaches a Bearer token when the user is authenticated', () => {
    mockAuthState.accessToken = 'my-access-token'

    const req = makeRequest()
    const result = requestInterceptor!(req)

    expect(result.headers.get('Authorization')).toBe('Bearer my-access-token')
  })

  it('does not set Authorization header when no access token', () => {
    mockAuthState.accessToken = null

    const req = makeRequest()
    const result = requestInterceptor!(req)

    expect(result.headers.get('Authorization')).toBeNull()
  })
})

describe('API response interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      accessToken: null,
      refreshToken: 'rt-current',
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    }
  })

  it('passes through non-401 responses unchanged', async () => {
    const res = makeResponse(200)
    const result = await responseInterceptor!(res, makeRequest(), {})
    expect(result).toBe(res)
  })

  it('passes through 401 on already-retried requests', async () => {
    const res = makeResponse(401)
    const opts = { _retry: true }
    const result = await responseInterceptor!(res, makeRequest(), opts)
    expect(result).toBe(res)
    expect(refreshToken).not.toHaveBeenCalled()
  })

  it('attempts token refresh on 401 and retries the original request', async () => {
    vi.mocked(refreshToken).mockResolvedValue({
      data: { access_token: 'at-new', refresh_token: 'rt-new' },
    } as any)
    mockClientRequest.mockResolvedValue({ response: makeResponse(200) })

    const res = makeResponse(401)
    const opts = { headers: new Headers() }

    await responseInterceptor!(res, makeRequest(), opts)

    expect(refreshToken).toHaveBeenCalledWith({ body: { refresh_token: 'rt-current' } })
    expect(mockAuthState.setAuth).toHaveBeenCalledWith('at-new', 'rt-new')
    expect(mockClientRequest).toHaveBeenCalled()
  })

  it('clears auth and redirects when refresh call fails', async () => {
    vi.mocked(refreshToken).mockRejectedValue(new Error('network error'))

    const hrefSetter = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, set href(v: string) { hrefSetter(v) } },
    })

    const res = makeResponse(401)
    await responseInterceptor!(res, makeRequest(), {})

    expect(mockAuthState.clearAuth).toHaveBeenCalled()
    expect(hrefSetter).toHaveBeenCalledWith('/login')
  })

  it('clears auth and redirects to /login when there is no refresh token', async () => {
    mockAuthState.refreshToken = null

    const hrefSetter = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, set href(v: string) { hrefSetter(v) } },
    })

    const res = makeResponse(401)
    await responseInterceptor!(res, makeRequest(), {})

    expect(mockAuthState.clearAuth).toHaveBeenCalled()
    expect(hrefSetter).toHaveBeenCalledWith('/login')
  })

  it('does not leave isRefreshing=true after the no-refresh-token path (regression)', async () => {
    // First 401 with no refresh token — previously left isRefreshing=true
    mockAuthState.refreshToken = null
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, set href(_v: string) {} },
    })
    await responseInterceptor!(makeResponse(401), makeRequest(), {})

    // Second 401 — now has a refresh token; must attempt refresh, not hang
    mockAuthState.refreshToken = 'rt-valid'
    vi.mocked(refreshToken).mockResolvedValue({
      data: { access_token: 'at-new', refresh_token: 'rt-new' },
    } as any)
    mockClientRequest.mockResolvedValue({ response: makeResponse(200) })

    await responseInterceptor!(makeResponse(401), makeRequest(), { headers: new Headers() })

    expect(refreshToken).toHaveBeenCalledOnce()
  })
})
