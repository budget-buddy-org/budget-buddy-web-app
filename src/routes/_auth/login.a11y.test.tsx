import { render } from '@testing-library/react'
import 'vitest-axe/extend-expect'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '@/components/auth/LoginPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: { component: React.ComponentType }) => ({ options }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

describe('LoginPage a11y', () => {
  it('should have no accessibility violations', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
