import { useEffect, useRef } from 'react'
import type { AuthToken } from '@budget-buddy-org/budget-buddy-contracts'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000

/**
 * Proactively refreshes the auth token when the tab becomes visible if the
 * refresh token is older than 6 days, catching token expiry before the next
 * user action. Covers both tab-switching and window-focus scenarios.
 *
 * Mount once inside the authenticated layout.
 */
export function useTabVisibilityRefresh() {
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    async function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return

      const { refreshToken, refreshTokenObtainedAt, setAuth } = useAuthStore.getState()

      if (!refreshToken || refreshTokenObtainedAt === null) return
      if (isRefreshingRef.current) return

      const ageMs = Date.now() - refreshTokenObtainedAt
      if (ageMs < SIX_DAYS_MS) return

      isRefreshingRef.current = true
      try {
        const { data } = await apiClient.post<AuthToken>('/v1/auth/refresh', {
          refresh_token: refreshToken,
        })
        setAuth(data.access_token, data.refresh_token)
      } catch {
        // Network/transient errors are silently ignored so the user is not interrupted.
        // If the refresh token is expired (server returns 401), the response interceptor
        // in api.ts takes over: it attempts another refresh, fails, calls clearAuth(),
        // and redirects to /login — which is the correct UX for an expired session.
      } finally {
        isRefreshingRef.current = false
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
}
