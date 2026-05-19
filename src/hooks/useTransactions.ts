import type {
  PaginatedTransactions,
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
  type InfiniteData,
  infiniteQueryOptions,
  keepPreviousData,
  type QueryClient,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { CATEGORIES_SUMMARY_KEYS } from '@/hooks/useCategoriesSummary';
import { TRANSACTIONS_SUMMARY_KEYS } from '@/hooks/useMonthlySummary';

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

export const TRANSACTIONS_PAGE_SIZE = 20;

const KEYS = {
  all: ['transactions'] as const,
  lists: ['transactions', 'list'] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
  infinite: (filters: TransactionFilters) => ['transactions', 'infinite', filters] as const,
  detail: (id: string) => ['transactions', id] as const,
};

// Mutating a transaction also changes the per-month and per-category aggregates
// the dashboard reads from. Invalidate them together so summary cards stay in
// sync after create/update/delete.
function invalidateTransactionCaches(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: KEYS.all });
  qc.invalidateQueries({ queryKey: TRANSACTIONS_SUMMARY_KEYS.all });
  qc.invalidateQueries({ queryKey: CATEGORIES_SUMMARY_KEYS.all });
}

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
    placeholderData: keepPreviousData,
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
    // Keep the previous result rendered while a new filter combination
    // fetches, so changing filters (notably the debounced search query)
    // doesn't flash the list skeleton.
    placeholderData: keepPreviousData,
  });
};

export function useInfiniteTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery(infiniteTransactionsQueryOptions(filters));
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
    onSuccess: () => invalidateTransactionCaches(qc),
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
      invalidateTransactionCaches(qc);
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
      const previous = qc.getQueriesData({ queryKey: KEYS.all });

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

      // Same for infinite caches (different shape: { pages, pageParams }).
      qc.setQueriesData<InfiniteData<PaginatedTransactions>>(
        { queryKey: ['transactions', 'infinite'] },
        (old) => {
          if (!old) return old;
          let removed = false;
          const pages = old.pages.map((p) => {
            const nextItems = p.items.filter((t) => t.id !== id);
            if (nextItems.length === p.items.length) return p;
            removed = true;
            return { ...p, items: nextItems };
          });
          if (!removed) return old;
          return {
            ...old,
            pages: pages.map((p) => ({
              ...p,
              meta: { ...p.meta, total: Math.max(0, p.meta.total - 1) },
            })),
          };
        },
      );

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
    onSettled: () => invalidateTransactionCaches(qc),
  });
}
