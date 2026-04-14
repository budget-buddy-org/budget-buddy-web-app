import { describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './stores/auth.store'

// Mocking the router redirect
vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((obj) => obj),
  createFileRoute: vi.fn(() => ({
    beforeLoad: vi.fn(),
  })),
}))

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  refreshToken: vi.fn(),
}))

describe('Auth rehydration on page reload', () => {
  it('should be unauthenticated if only refreshToken is present after reload', () => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: 'valid-refresh-token',
      refreshTokenObtainedAt: Date.now(),
    })

    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })

  it('should be authenticated after refreshAuth is called', async () => {
    const { refreshToken: refreshAction } = await import('@budget-buddy-org/budget-buddy-contracts')
    type RefreshTokenResult = Awaited<ReturnType<typeof refreshAction>>
    vi.mocked(refreshAction).mockResolvedValue({
      data: { access_token: 'at-new', refresh_token: 'rt-new', expires_in: 3600, token_type: 'Bearer' },
      error: undefined,
    } as unknown as RefreshTokenResult)

    useAuthStore.setState({
      accessToken: null,
      refreshToken: 'rt-old',
      refreshTokenObtainedAt: Date.now(),
    })

    const { refreshAuth } = await import('./lib/api')
    await refreshAuth()

    expect(useAuthStore.getState().accessToken).toBe('at-new')
    expect(useAuthStore.getState().refreshToken).toBe('rt-new')
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
  })
})
