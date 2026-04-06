import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth.store'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('starts unauthenticated with null tokens', () => {
    const { accessToken, refreshToken, isAuthenticated } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('setAuth stores both tokens', () => {
    useAuthStore.getState().setAuth('access-123', 'refresh-456')
    const { accessToken, refreshToken, isAuthenticated } = useAuthStore.getState()
    expect(accessToken).toBe('access-123')
    expect(refreshToken).toBe('refresh-456')
    expect(isAuthenticated()).toBe(true)
  })

  it('setAccessToken updates only the access token', () => {
    useAuthStore.getState().setAuth('old-access', 'my-refresh')
    useAuthStore.getState().setAccessToken('new-access')
    const { accessToken, refreshToken } = useAuthStore.getState()
    expect(accessToken).toBe('new-access')
    expect(refreshToken).toBe('my-refresh')
  })

  it('clearAuth resets both tokens to null', () => {
    useAuthStore.getState().setAuth('access-123', 'refresh-456')
    useAuthStore.getState().clearAuth()
    const { accessToken, refreshToken, isAuthenticated } = useAuthStore.getState()
    expect(accessToken).toBeNull()
    expect(refreshToken).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })

  it('isAuthenticated is false when only refresh token is present', () => {
    // Simulate page reload: refresh persisted, access token gone
    useAuthStore.setState({ accessToken: null, refreshToken: 'refresh-456' })
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
  })
})
