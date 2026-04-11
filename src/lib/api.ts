import { refreshToken as refreshAction } from '@budget-buddy-org/budget-buddy-contracts'
import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen'
import { useAuthStore } from '@/stores/auth.store'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

client.setConfig({
  baseUrl: BASE_URL,
})

// Attach access token to every outgoing request
client.interceptors.request.use((request: Request) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
  return request
})

// Queue of requests waiting for a token refresh to complete
let isRefreshing = false
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
  pendingQueue = []
}

// On 401: attempt refresh → retry; on refresh failure → clear auth + redirect to login
client.interceptors.response.use(async (response: Response, _request: Request, options: any) => {
  if (response.status !== 401 || options._retry) {
    return response
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject })
    }).then(async (token) => {
      const newHeaders = new Headers(options.headers)
      newHeaders.set('Authorization', `Bearer ${token}`)
      return client.request({ ...options, headers: newHeaders } as any)
    })
  }

  options._retry = true
  isRefreshing = true

  const refreshTokenValue = useAuthStore.getState().refreshToken
  if (!refreshTokenValue) {
    useAuthStore.getState().clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return response
  }

  try {
    const { data } = await refreshAction({
      body: { refresh_token: refreshTokenValue },
    })

    if (!data) {
      throw new Error('Refresh failed')
    }

    useAuthStore.getState().setAuth(data.access_token, data.refresh_token)
    flushQueue(null, data.access_token)

    const newHeaders = new Headers(options.headers)
    newHeaders.set('Authorization', `Bearer ${data.access_token}`)
    return client.request({ ...options, headers: newHeaders } as any)
  } catch (refreshError) {
    flushQueue(refreshError, null)
    useAuthStore.getState().clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return response
  } finally {
    isRefreshing = false
  }
})
