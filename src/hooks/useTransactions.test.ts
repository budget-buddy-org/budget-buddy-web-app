import {
  createTransaction,
  deleteTransaction,
  listTransactions,
} from '@budget-buddy-org/budget-buddy-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useAllTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
} from './useTransactions';

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

  it('performs client-side search when search filter is present', async () => {
    const items = [
      {
        id: '1',
        description: 'Apple',
        categoryId: 'c1',
        amount: 10,
        currency: 'EUR',
        type: 'EXPENSE' as const,
        date: '2024-01-01',
      },
      {
        id: '2',
        description: 'Banana',
        categoryId: 'c1',
        amount: 10,
        currency: 'EUR',
        type: 'EXPENSE' as const,
        date: '2024-01-01',
      },
      {
        id: '3',
        description: 'Apricot',
        categoryId: 'c1',
        amount: 10,
        currency: 'EUR',
        type: 'EXPENSE' as const,
        date: '2024-01-01',
      },
    ];
    vi.mocked(listTransactions).mockResolvedValue({
      data: {
        items,
        meta: { total: 3, size: 20, page: 0 },
      },
      error: undefined,
    } as unknown as ListTransactionsResult);

    const { result } = renderHook(() => useTransactions({ search: 'ap' }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should find Apple and Apricot
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.items[0].description).toBe('Apple');
    expect(result.current.data?.items[1].description).toBe('Apricot');
    expect(result.current.data?.meta.total).toBe(2);

    // Should have called API with large size
    expect(listTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({
          size: 200,
        }),
      }),
    );
  });
});

describe('useAllTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches multiple pages until total is reached', async () => {
    vi.mocked(listTransactions)
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: '1',
              categoryId: 'c1',
              amount: 10,
              currency: 'EUR',
              type: 'EXPENSE',
              date: '2024-01-01',
            },
          ],
          meta: { total: 2, size: 1, page: 0 },
        },
        error: undefined,
      } as unknown as ListTransactionsResult)
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: '2',
              categoryId: 'c1',
              amount: 10,
              currency: 'EUR',
              type: 'EXPENSE',
              date: '2024-01-01',
            },
          ],
          meta: { total: 2, size: 1, page: 1 },
        },
        error: undefined,
      } as unknown as ListTransactionsResult);

    const { result } = renderHook(() => useAllTransactions(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(listTransactions).toHaveBeenCalledTimes(2);
    expect(listTransactions).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ query: expect.objectContaining({ page: 0, size: 200 }) }),
    );
  });

  it('limits to 10 page fetches', async () => {
    vi.mocked(listTransactions).mockResolvedValue({
      data: {
        items: [
          {
            id: '1',
            categoryId: 'c1',
            amount: 10,
            currency: 'EUR',
            type: 'EXPENSE',
            date: '2024-01-01',
          },
        ],
        meta: { total: 100, size: 1, page: 0 },
      },
      error: undefined,
    } as unknown as ListTransactionsResult);

    const { result } = renderHook(() => useAllTransactions(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listTransactions).toHaveBeenCalledTimes(10);
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
