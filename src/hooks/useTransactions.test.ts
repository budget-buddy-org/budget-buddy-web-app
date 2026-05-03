import {
  createTransaction,
  deleteTransaction,
  listTransactions,
} from '@budget-buddy-org/budget-buddy-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateTransaction, useDeleteTransaction, useTransactions } from './useTransactions';

type ListTransactionsResult = Awaited<ReturnType<typeof listTransactions>>;
type CreateTransactionResult = Awaited<ReturnType<typeof createTransaction>>;
type DeleteTransactionResult = Awaited<ReturnType<typeof deleteTransaction>>;

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  listTransactions: vi.fn(),
  getTransaction: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

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
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns fetched transactions', async () => {
    vi.mocked(listTransactions).mockResolvedValue({
      data: {
        items: [
          {
            id: 'tx-1',
            date: '2024-01-10',
            categoryId: 'cat-1',
            amount: 100,
            currency: 'EUR',
            type: 'EXPENSE',
          },
        ],
        meta: { total: 1, size: 20, page: 0 },
      },
      error: undefined,
    } as unknown as ListTransactionsResult);

    const { result } = renderHook(() => useTransactions(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(listTransactions).toHaveBeenCalledTimes(1);
  });

  it('passes filters to the API', async () => {
    vi.mocked(listTransactions).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListTransactionsResult);

    renderHook(() => useTransactions({ categoryId: 'cat-1', sort: 'asc', size: 10 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(listTransactions).toHaveBeenCalled());
    expect(listTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ categoryId: 'cat-1', sort: 'asc', size: 10 }),
      }),
    );
  });

  it('forwards search and amount-range filters to the API', async () => {
    vi.mocked(listTransactions).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListTransactionsResult);

    renderHook(() => useTransactions({ query: 'coffee', amountMin: 100, amountMax: 5000 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(listTransactions).toHaveBeenCalled());
    expect(listTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          query: 'coffee',
          amountMin: 100,
          amountMax: 5000,
        }),
      }),
    );
  });
});

describe('useCreateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createTransaction and invalidates queries on success', async () => {
    const created = { ...mockPage.items[0] };
    vi.mocked(createTransaction).mockResolvedValue({
      data: created,
      error: undefined,
    } as unknown as CreateTransactionResult);
    vi.mocked(listTransactions).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListTransactionsResult);

    const { result } = renderHook(() => useCreateTransaction(), { wrapper: makeWrapper() });

    result.current.mutate({
      description: 'Coffee',
      amount: 350,
      type: 'EXPENSE',
      currency: 'EUR',
      date: '2024-01-10',
      categoryId: 'cat-1',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createTransaction).toHaveBeenCalledOnce();
  });
});

describe('useDeleteTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteTransaction and invalidates queries on success', async () => {
    vi.mocked(deleteTransaction).mockResolvedValue({
      data: undefined,
      error: undefined,
    } as unknown as DeleteTransactionResult);
    vi.mocked(listTransactions).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListTransactionsResult);

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: makeWrapper() });

    result.current.mutate('tx-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteTransaction).toHaveBeenCalledWith({ path: { transactionId: 'tx-1' } });
  });
});
