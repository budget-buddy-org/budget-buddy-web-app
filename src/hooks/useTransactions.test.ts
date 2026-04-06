import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateTransaction, useDeleteTransaction, useTransactions } from './useTransactions'

vi.mock('@/lib/api', () => ({
  transactionsApi: {
    listTransactions: vi.fn(),
    getTransaction: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}))

const { transactionsApi } = await import('@/lib/api')

const mockPage = {
  items: [
    {
      id: 'tx-1',
      description: 'Coffee',
      amount: 350,
      type: 'EXPENSE',
      currency: 'EUR',
      date: '2024-01-10',
      categoryId: 'cat-1',
      ownerId: 'user-1',
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z',
    },
  ],
  total: 1,
  limit: 20,
  offset: 0,
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns fetched transactions', async () => {
    vi.mocked(transactionsApi.listTransactions).mockResolvedValue({ data: mockPage } as never)

    const { result } = renderHook(() => useTransactions(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(1)
    expect(result.current.data?.items[0]?.description).toBe('Coffee')
  })

  it('passes filters to the API', async () => {
    vi.mocked(transactionsApi.listTransactions).mockResolvedValue({ data: mockPage } as never)

    const { result } = renderHook(
      () => useTransactions({ categoryId: 'cat-1', sort: 'asc', limit: 10 }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(transactionsApi.listTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1', sort: 'asc', limit: 10 }),
    )
  })
})

describe('useCreateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls createTransaction and invalidates queries on success', async () => {
    const created = { ...mockPage.items[0] }
    vi.mocked(transactionsApi.createTransaction).mockResolvedValue({ data: created } as never)
    vi.mocked(transactionsApi.listTransactions).mockResolvedValue({ data: mockPage } as never)

    const { result } = renderHook(() => useCreateTransaction(), { wrapper: makeWrapper() })

    result.current.mutate({
      description: 'Coffee',
      amount: 350,
      type: 'EXPENSE',
      currency: 'EUR',
      date: '2024-01-10',
      categoryId: 'cat-1',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(transactionsApi.createTransaction).toHaveBeenCalledOnce()
  })
})

describe('useDeleteTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls deleteTransaction and invalidates queries on success', async () => {
    vi.mocked(transactionsApi.deleteTransaction).mockResolvedValue({ data: undefined } as never)
    vi.mocked(transactionsApi.listTransactions).mockResolvedValue({ data: mockPage } as never)

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: makeWrapper() })

    result.current.mutate('tx-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(transactionsApi.deleteTransaction).toHaveBeenCalledWith({ transactionId: 'tx-1' })
  })
})
