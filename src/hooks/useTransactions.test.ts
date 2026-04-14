import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateTransaction, useDeleteTransaction, useTransactions, useAllTransactions } from './useTransactions'
import {
  listTransactions,
  createTransaction,
  deleteTransaction,
} from '@budget-buddy-org/budget-buddy-contracts'

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  listTransactions: vi.fn(),
  getTransaction: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}))

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
  meta: {
    total: 1,
    size: 20,
    page: 0,
  },
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

  it('returns fetched transactions and requests one more page', async () => {
    vi.mocked(listTransactions)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 'tx-1', date: '2024-01-10' }],
          meta: { total: 100, size: 20, page: 0 }
        }
      } as any)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 'tx-2', date: '2024-01-09' }],
          meta: { total: 100, size: 20, page: 1 }
        }
      } as any)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: 'tx-3', date: '2024-01-08' }],
          meta: { total: 100, size: 20, page: 2 }
        }
      } as any)

    const { result } = renderHook(() => useTransactions(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // It should have called listTransactions 3 times (page 0, page 1 (min 2 pages), page 2 (to check split))
    // But only items from page 0 and 1 should be included as page 1 and 2 are not split.
    expect(result.current.data?.items).toHaveLength(2)
    expect(listTransactions).toHaveBeenCalledTimes(3)
  })

  it('continues fetching if day is split', async () => {
    vi.mocked(listTransactions)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: '1', date: '2024-01-10' }],
          meta: { total: 100, size: 1, page: 0 }
        }
      } as any)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: '2', date: '2024-01-10' }],
          meta: { total: 100, size: 1, page: 1 }
        }
      } as any)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: '3', date: '2024-01-10' }], // Split with page 1
          meta: { total: 100, size: 1, page: 2 }
        }
      } as any)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: '4', date: '2024-01-09' }], // Not split with page 2
          meta: { total: 100, size: 1, page: 3 }
        }
      } as any)

    const { result } = renderHook(() => useTransactions(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // Calls:
    // 1. Page 0 (Added, fetchCount=1)
    // 2. Page 1 (Added, fetchCount=2)
    // 3. Page 2 (Split with 1, Added, fetchCount=3)
    // 4. Page 3 (Not split with 2, Broken)
    expect(listTransactions).toHaveBeenCalledTimes(4)
    expect(result.current.data?.items).toHaveLength(3)
  })

  it('stops at 10 page fetches', async () => {
    vi.mocked(listTransactions).mockResolvedValue({
      data: {
        items: [{ id: 'x', date: '2024-01-10' }],
        meta: { total: 100, size: 1, page: 0 }
      }
    } as any)

    const { result } = renderHook(() => useTransactions(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listTransactions).toHaveBeenCalledTimes(10)
    expect(result.current.data?.items).toHaveLength(10)
  })

  it('passes filters to the API', async () => {
    vi.mocked(listTransactions).mockResolvedValue({ data: mockPage } as any)

    renderHook(
      () => useTransactions({ categoryId: 'cat-1', sort: 'asc', size: 10 }),
      { wrapper: makeWrapper() },
    )

    await waitFor(() => expect(listTransactions).toHaveBeenCalled())
    expect(listTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ categoryId: 'cat-1', sort: 'asc', size: 10 }) }),
    )
  })
})

describe('useAllTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches multiple pages until total is reached', async () => {
    vi.mocked(listTransactions)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: '1' }],
          meta: { total: 2, size: 1, page: 0 }
        }
      } as any)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: '2' }],
          meta: { total: 2, size: 1, page: 1 }
        }
      } as any)

    const { result } = renderHook(() => useAllTransactions(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(2)
    expect(listTransactions).toHaveBeenCalledTimes(2)
    expect(listTransactions).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ query: expect.objectContaining({ page: 0, size: 200 }) }),
    )
  })

  it('limits to 10 page fetches', async () => {
    vi.mocked(listTransactions).mockResolvedValue({
      data: {
        items: [{ id: '1' }],
        meta: { total: 100, size: 1, page: 0 }
      }
    } as any)

    const { result } = renderHook(() => useAllTransactions(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listTransactions).toHaveBeenCalledTimes(10)
  })
})

describe('useCreateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls createTransaction and invalidates queries on success', async () => {
    const created = { ...mockPage.items[0] }
    vi.mocked(createTransaction).mockResolvedValue({ data: created } as any)
    vi.mocked(listTransactions).mockResolvedValue({ data: mockPage } as any)

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
    expect(createTransaction).toHaveBeenCalledOnce()
  })
})

describe('useDeleteTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls deleteTransaction and invalidates queries on success', async () => {
    vi.mocked(deleteTransaction).mockResolvedValue({ data: undefined } as any)
    vi.mocked(listTransactions).mockResolvedValue({ data: mockPage } as any)

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: makeWrapper() })

    result.current.mutate('tx-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(deleteTransaction).toHaveBeenCalledWith({ path: { transactionId: 'tx-1' } })
  })
})
