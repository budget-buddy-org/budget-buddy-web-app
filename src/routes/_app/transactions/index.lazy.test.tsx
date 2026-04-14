import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Route } from './index.lazy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type React from 'react'

const mockNavigate = vi.fn()
const mockUseSearch = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => (options: any) => ({ options }),
  useNavigate: () => mockNavigate,
  useSearch: () => mockUseSearch(),
}))

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: vi.fn(),
  useTransaction: vi.fn(),
}))

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}))

vi.mock('@/components/transactions/TransactionForm', () => ({
  TransactionForm: ({ transaction, onSuccess }: any) => (
    <div data-testid="transaction-form">
      {transaction ? `Editing ${transaction.id}` : 'Adding'}
      <button onClick={onSuccess}>Success</button>
    </div>
  ),
}))

import { useTransactions, useTransaction } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'

describe('TransactionsPage', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useCategories as any).mockReturnValue({ data: { items: [] }, isLoading: false })
    ;(useTransactions as any).mockReturnValue({ data: { items: [], meta: { total: 0 } }, isLoading: false })
    ;(useTransaction as any).mockReturnValue({ data: null, isLoading: false })
  })

  it('opens edit dialog when edit search param is present', async () => {
    mockUseSearch.mockReturnValue({ edit: '123' })
    ;(useTransaction as any).mockReturnValue({ 
      data: { id: '123', description: 'Test', amount: 1000, date: '2024-01-01' }, 
      isLoading: false 
    })

    const TransactionsPage = (Route as any).options.component as React.ElementType

    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>
    )

    expect(screen.getByText('Edit Transaction')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-form')).toHaveTextContent('Editing 123')
  })

  it('opens add dialog when add search param is present', async () => {
    mockUseSearch.mockReturnValue({ add: 'true' })
    
    const TransactionsPage = (Route as any).options.component as React.ElementType

    render(
      <QueryClientProvider client={queryClient}>
        <TransactionsPage />
      </QueryClientProvider>
    )

    expect(screen.getByText('Add Transaction')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-form')).toHaveTextContent('Adding')
  })
})
