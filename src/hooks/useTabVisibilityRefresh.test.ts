import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { refreshToken as refreshAction } from '@budget-buddy-org/budget-buddy-contracts'

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  refreshToken: vi.fn(),
}))

const mockSetAuth = vi.fn()

let mockStoreState = {
  refreshToken: null as string | null,
  refreshTokenObtainedAt: null as number | null,
  accessTokenExpiresAt: null as number | null,
  setAuth: mockSetAuth,
}

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: () => mockStoreState,
  },
}))

const { useTabVisibilityRefresh } = await import('./useTabVisibilityRefresh')

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000
const STALE_TIMESTAMP = Date.now() - SIX_DAYS_MS - 1000

function setVisibilityState(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })
}

function fireVisibilityChange(state: 'visible' | 'hidden') {
  setVisibilityState(state)
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useTabVisibilityRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState = {
      refreshToken: null,
      refreshTokenObtainedAt: null,
      accessTokenExpiresAt: null,
      setAuth: mockSetAuth,
    }
    setVisibilityState('visible')
  })

  it('does nothing if there is no refresh token', async () => {
    mockStoreState.refreshToken = null
    mockStoreState.refreshTokenObtainedAt = STALE_TIMESTAMP

    renderHook(() => useTabVisibilityRefresh())
    fireVisibilityChange('visible')

    await Promise.resolve()
    expect(refreshAction).not.toHaveBeenCalled()
  })

  it('refreshes and updates auth when tab becomes visible and token is stale (≥ 6 days old)', async () => {
    mockStoreState.refreshToken = 'rt_old'
    mockStoreState.refreshTokenObtainedAt = STALE_TIMESTAMP

    type RefreshResult = Awaited<ReturnType<typeof refreshAction>>
    vi.mocked(refreshAction).mockResolvedValue({
      data: { access_token: 'at_new', refresh_token: 'rt_new', expires_in: 3600, token_type: 'Bearer' },
      error: undefined,
    } as unknown as RefreshResult)

    renderHook(() => useTabVisibilityRefresh())
    fireVisibilityChange('visible')

    await vi.waitFor(() => expect(refreshAction).toHaveBeenCalledOnce())
    expect(refreshAction).toHaveBeenCalledWith({
      body: { refresh_token: 'rt_old' },
      _isRefresh: true,
    })
    expect(mockSetAuth).toHaveBeenCalledWith('at_new', 'rt_new', 3600)
  })
})
