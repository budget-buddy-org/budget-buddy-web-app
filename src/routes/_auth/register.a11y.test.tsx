import { render } from '@testing-library/react'
import 'vitest-axe/extend-expect'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { Route } from './register.lazy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type React from 'react'

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: any) => ({ options }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

describe('RegisterPage a11y', () => {
  it('should have no accessibility violations', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    
    const RegisterPage = (Route as any).options.component as React.ElementType
    
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <RegisterPage />
      </QueryClientProvider>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
