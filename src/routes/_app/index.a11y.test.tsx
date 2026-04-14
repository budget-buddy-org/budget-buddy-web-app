import { render } from '@testing-library/react'
import 'vitest-axe/extend-expect'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: { component: React.ComponentType }) => ({ options }),
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

// Mock recharts to avoid rendering issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: '100%', height: '100%' }}>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}))

vi.mock('@/hooks/useTransactions', () => {
  const mockData = {
    data: {
      items: [
        {
          id: '1',
          description: 'Test income',
          amount: 10000,
          type: 'INCOME',
          currency: 'EUR',
          date: '2024-03-20',
          categoryId: '1',
        },
        {
          id: '2',
          description: 'Test expense',
          amount: 5000,
          type: 'EXPENSE',
          currency: 'EUR',
          date: '2024-03-21',
          categoryId: '2',
        },
      ],
    },
    isLoading: false,
  }
  return {
    useTransactions: () => mockData,
    useAllTransactions: () => mockData,
  }
})

describe('DashboardPage a11y', () => {
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
        <DashboardPage />
      </QueryClientProvider>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
