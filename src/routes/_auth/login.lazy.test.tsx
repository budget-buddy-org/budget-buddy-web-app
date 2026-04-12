import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()
const mockSetAuth = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (opts: any) => ({ options: opts }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement('a', { href: to }, children),
}))

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  loginUser: vi.fn(),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { setAuth: typeof mockSetAuth }) => unknown) =>
    selector({ setAuth: mockSetAuth }),
}))

// Stub shadcn/ui primitives used in the login form
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, type }: any) =>
    React.createElement('button', { disabled, type }, children),
}))
vi.mock('@/components/ui/input', () => ({
  Input: ({ id, type, value, onChange, ...rest }: any) =>
    React.createElement('input', { id, type, value, onChange, ...rest }),
}))

const { loginUser } = await import('@budget-buddy-org/budget-buddy-contracts')
const { Route } = await import('./login.lazy')
const LoginPage = Route.options.component as React.ComponentType

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    React.createElement(QueryClientProvider, { client: qc },
      React.createElement(LoginPage),
    ),
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the sign-in form', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls loginUser with credentials and stores tokens on success', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      data: { access_token: 'at-abc', refresh_token: 'rt-xyz' },
    } as any)

    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'secret')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(loginUser).toHaveBeenCalledWith({
      body: { username: 'alice', password: 'secret' },
    }))
    await waitFor(() => expect(mockSetAuth).toHaveBeenCalledWith('at-abc', 'rt-xyz'))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: '/' }))
  })

  it('shows an error message when login fails', async () => {
    vi.mocked(loginUser).mockRejectedValue(new Error('unauthorized'))

    renderLogin()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/username/i), 'alice')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument(),
    )
    expect(mockSetAuth).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
