import { refreshToken as refreshAction } from '@budget-buddy-org/budget-buddy-contracts'
import { client } from '@budget-buddy-org/budget-buddy-contracts/client.gen'
import { useAuthStore } from '@/stores/auth.store'

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

export async function refreshAuth() {
  const refreshTokenValue = useAuthStore.getState().refreshToken
  if (!refreshTokenValue) {
    useAuthStore.getState().clearAuth()
    return null
  }

  isRefreshing = true
  try {
    const { data } = await refreshAction({
      body: { refresh_token: refreshTokenValue },
      _isRefresh: true,
    } as any)

    if (!data) {
      throw new Error('Refresh failed')
    }

    useAuthStore.getState().setAuth(data.access_token, data.refresh_token)
    flushQueue(null, data.access_token)
    return data.access_token
  } catch (refreshError) {
    flushQueue(refreshError, null)
    useAuthStore.getState().clearAuth()
    return null
  } finally {
    isRefreshing = false
  }
}

// On 401: attempt refresh → retry; on refresh failure → clear auth + redirect to login
client.interceptors.response.use(async (response: Response, _request: Request, options: any) => {
  if (response.status !== 401 || options._retry || options._isRefresh) {
    return response
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject })
    }).then(async (token) => {
      const newHeaders = new Headers(options.headers)
      newHeaders.set('Authorization', `Bearer ${token}`)
      return client.request({ ...options, headers: newHeaders } as any).then((r: any) => r.response)
    })
  }

  options._retry = true
  const token = await refreshAuth()

  if (!token) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return response
  }

  const newHeaders = new Headers(options.headers)
  newHeaders.set('Authorization', `Bearer ${token}`)
  return client.request({ ...options, headers: newHeaders } as any).then((r: any) => r.response)
})
