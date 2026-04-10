import axios from 'axios'
import { AuthApi, CategoriesApi, Configuration, TransactionsApi } from '@budget-buddy-org/budget-buddy-contracts'
import { useAuthStore } from '@/stores/auth.store'
import type { AuthToken } from '@budget-buddy-org/budget-buddy-contracts'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Queue of requests waiting for a token refresh to complete
let isRefreshing = false
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
  pendingQueue = []
}

// On 401: attempt refresh → retry; on refresh failure → clear auth + redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        if (originalRequest) {
          originalRequest.headers = originalRequest.headers ?? {}
          originalRequest.headers['Authorization'] = `Bearer ${token}`
        }
        return apiClient(originalRequest!)
      })
    }

    originalRequest!._retry = true
    isRefreshing = true

    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await apiClient.post<AuthToken>('/v1/auth/refresh', {
        refresh_token: refreshToken,
      })
      useAuthStore.getState().setAuth(data.access_token, data.refresh_token)
      flushQueue(null, data.access_token)
      originalRequest!.headers = originalRequest!.headers ?? {}
      originalRequest!.headers['Authorization'] = `Bearer ${data.access_token}`
      return apiClient(originalRequest!)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

const config = new Configuration({ basePath: BASE_URL })
export const authApi = new AuthApi(config, BASE_URL, apiClient)
export const categoriesApi = new CategoriesApi(config, BASE_URL, apiClient)
export const transactionsApi = new TransactionsApi(config, BASE_URL, apiClient)
