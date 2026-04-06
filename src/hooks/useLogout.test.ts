import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

vi.mock('@/lib/query-client', () => ({
  queryClient: {
    clear: vi.fn(),
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { clearAuth: () => void }) => unknown) =>
    selector({ clearAuth: mockClearAuth }),
}))

const mockClearAuth = vi.fn()

const { apiClient } = await import('@/lib/api')
const { queryClient } = await import('@/lib/query-client')
const { useLogout } = await import('./useLogout')

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls the logout endpoint, clears auth, clears query cache, and navigates to /login on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined })

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(apiClient.post).toHaveBeenCalledWith('/v1/auth/logout')
    expect(mockClearAuth).toHaveBeenCalledOnce()
    expect(queryClient.clear).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  it('still clears auth, query cache, and navigates even when the backend call fails', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))

    // onSettled runs regardless of success/failure
    expect(mockClearAuth).toHaveBeenCalledOnce()
    expect(queryClient.clear).toHaveBeenCalledOnce()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })
})
