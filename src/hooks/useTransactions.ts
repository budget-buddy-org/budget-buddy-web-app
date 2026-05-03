import type {
  PaginatedTransactions,
  Transaction,
  TransactionType,
  TransactionUpdate,
  TransactionWrite,
} from '@budget-buddy-org/budget-buddy-contracts';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from '@budget-buddy-org/budget-buddy-contracts';
import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export interface TransactionFilters {
  page?: number;
  size?: number;
  categoryId?: string;
  start?: string;
  end?: string;
  sort?: 'asc' | 'desc';
  type?: TransactionType;
  query?: string;
  amountMin?: number;
  amountMax?: number;
}

// Dashboard aggregation pulls every transaction across multiple pages because the API
// has no aggregation endpoint. MAX_PAGES_ALL caps the fan-out at 2000 rows.
const PAGE_SIZE_ALL = 200;
const MAX_PAGES_ALL = 10;

export const TRANSACTIONS_PAGE_SIZE = 20;

const KEYS = {
  all: ['transactions'] as const,
  lists: ['transactions', 'list'] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
  infinite: (filters: TransactionFilters) => ['transactions', 'infinite', filters] as const,
  detail: (id: string) => ['transactions', id] as const,
};

export const transactionsQueryOptions = (filters: TransactionFilters = {}) =>
  queryOptions({
    queryKey: KEYS.list(filters),
    queryFn: async () => {
      const { data, error } = await listTransactions({
        query: {
          ...filters,
          sort: filters.sort ?? 'desc',
        },
      });
      if (error) throw error;
      return data;
    },
  });

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery(transactionsQueryOptions(filters));
}

export const infiniteTransactionsQueryOptions = (filters: TransactionFilters = {}) => {
  return infiniteQueryOptions({
    queryKey: KEYS.infinite(filters),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await listTransactions({
        query: {
          ...filters,
          page: pageParam,
          size: filters.size ?? 20,
          sort: filters.sort ?? 'desc',
        },
      });
      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage) => {
      const { page, size, total } = lastPage.meta;
      if ((page + 1) * size >= total) return undefined;
      return page + 1;
    },
  });
};

export function useInfiniteTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery(infiniteTransactionsQueryOptions(filters));
}

export function usePrefetchTransactions() {
  const qc = useQueryClient();
  return (filters: TransactionFilters = {}) => {
    qc.prefetchQuery(transactionsQueryOptions(filters));
  };
}

export const allTransactionsQueryOptions = (filters: TransactionFilters = {}) =>
  queryOptions({
    queryKey: [...KEYS.list(filters), 'all'],
    queryFn: async () => {
      const fetchPage = async (page: number) => {
        const { data, error } = await listTransactions({
          query: { ...filters, size: PAGE_SIZE_ALL, page },
        });
        if (error) throw error;
        return data;
      };

      const first = await fetchPage(0);
      const total = first.meta.total;
      const totalPages = Math.min(Math.ceil(total / PAGE_SIZE_ALL), MAX_PAGES_ALL);

      if (totalPages <= 1) return { items: first.items, meta: { total } };

      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 1)),
      );

      const items: Transaction[] = first.items;
      for (const page of rest) items.push(...page.items);
      return { items, meta: { total } };
    },
  });

export function useAllTransactions(filters: TransactionFilters = {}) {
  return useQuery(allTransactionsQueryOptions(filters));
}

export const transactionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await getTransaction({
        path: { transactionId: id },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
    // Always fetch fresh data when the edit modal opens so the form
    // is never pre-populated with stale values from a previous edit.
    staleTime: 0,
  });

export function useTransaction(id: string) {
  return useQuery(transactionDetailQueryOptions(id));
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: TransactionWrite) => {
      const { data, error } = await createTransaction({
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: TransactionUpdate) => {
      const { data, error } = await updateTransaction({
        path: { transactionId: id },
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteTransaction({
        path: { transactionId: id },
      });
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.all });
      const previous = qc.getQueriesData<PaginatedTransactions>({ queryKey: KEYS.lists });

      // Optimistically update every cached list view — removing the tx by id
      // is safe regardless of the filters each list was fetched with.
      qc.setQueriesData<PaginatedTransactions>({ queryKey: KEYS.lists }, (old) => {
        if (!old) return old;
        const nextItems = old.items.filter((t) => t.id !== id);
        if (nextItems.length === old.items.length) return old;
        return {
          ...old,
          items: nextItems,
          meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
        };
      });

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        ctx.previous.forEach(([key, value]) => {
          qc.setQueryData(key, value);
        });
      }
    },
    onSuccess: (_data, id) => {
      // Also remove the specific detail query if it exists
      qc.removeQueries({ queryKey: KEYS.detail(id) });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
