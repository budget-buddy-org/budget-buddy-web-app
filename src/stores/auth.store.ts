import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  /** In-memory only — not persisted. Re-obtained via refresh on page load. */
  accessToken: string | null
  /** Persisted to localStorage — required since the API expects it in the request body. */
  refreshToken: string | null
  setAuth: (accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      setAuth: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => set({ accessToken: null, refreshToken: null }),
      isAuthenticated: () => get().accessToken !== null,
    }),
    {
      name: 'budget-buddy-auth',
      // Only persist the refresh token — access token lives in memory
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    },
  ),
)
