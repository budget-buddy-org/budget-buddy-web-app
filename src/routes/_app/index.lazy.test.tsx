import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { Route } from './index.lazy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type React from 'react'
import { useNavigate } from '@tanstack/react-router'

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: any) => ({ options }),
  useNavigate: vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}))

const mockTransactions = [
  {
    id: '1',
    description: 'Income this month',
    amount: 10000,
    type: 'INCOME',
    currency: 'EUR',
    date: '2026-04-10',
    categoryId: '1',
  },
  {
    id: '2',
    description: 'Expense this month',
    amount: 5000,
    type: 'EXPENSE',
    currency: 'EUR',
    date: '2026-04-11',
    categoryId: '2',
  },
  {
    id: '3',
    description: 'Income last month',
    amount: 20000,
    type: 'INCOME',
    currency: 'EUR',
    date: '2026-03-20',
    categoryId: '1',
  },
]

vi.mock('@/hooks/useTransactions', () => ({
  useAllTransactions: vi.fn(),
}))

import { useAllTransactions } from '@/hooks/useTransactions'

describe('DashboardPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-14'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates totals based on current month only', async () => {
    ;(useAllTransactions as any).mockReturnValue({
      data: {
        items: mockTransactions,
      },
      isLoading: false,
    })

    const DashboardPage = (Route as any).options.component as React.ElementType

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    )

    // Current month: 2026-04
    // Items: 10000 income, 5000 expense. Balance = 50.00

    // Income card
    const incomeCard = screen.getByText('Income').closest('.rounded-lg')
    expect(incomeCard).toHaveTextContent(/100/)

    // Expense card
    const expenseCard = screen.getByText('Expenses').closest('.rounded-lg')
    expect(expenseCard).toHaveTextContent(/50/)

    // Balance card
    const balanceCard = screen.getByText('Balance').closest('.rounded-lg')
    expect(balanceCard).toHaveTextContent(/50/)
  })

  it('navigates to edit transaction on click', async () => {
    const mockNavigate = vi.fn()
    ;(useNavigate as any).mockReturnValue(mockNavigate)
    ;(useAllTransactions as any).mockReturnValue({
      data: {
        items: mockTransactions,
      },
      isLoading: false,
    })

    const DashboardPage = (Route as any).options.component as React.ElementType

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    )

    const transactionItem = screen.getByText('Income this month')
    fireEvent.click(transactionItem)

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/transactions',
      search: expect.objectContaining({ edit: '1' }),
    })
  })
})
