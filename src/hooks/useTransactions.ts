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
}

// Client-side "fetch all" limits — the API doesn't support full-text search, so we
// pull transactions in batches and filter locally. PAGE_SIZE_ALL controls the batch
// size; MAX_PAGES_ALL is a safety cap so a misconfigured server can't loop forever.
const PAGE_SIZE_ALL = 200;
const MAX_PAGES_ALL = 10;

const KEYS = {
  all: ['transactions'] as const,
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
      let allItems: Transaction[] = [];
      let page = 0;
      let total = 0;

      do {
        const { data, error } = await listTransactions({
          query: {
            ...filters,
            size: PAGE_SIZE_ALL,
            page,
          },
        });
        if (error) throw error;
        allItems = [...allItems, ...data.items];
        total = data.meta.total;
        page++;
      } while (allItems.length < total && page < MAX_PAGES_ALL);

      return { items: allItems, meta: { total } };
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
      const previous = qc.getQueriesData<PaginatedTransactions>({ queryKey: KEYS.all });

      // Optimistically update all paginated lists
      qc.setQueriesData<PaginatedTransactions>({ queryKey: ['transactions', 'list'] }, (old) =>
        old ? { ...old, items: old.items.filter((t) => t.id !== id) } : old,
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
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
