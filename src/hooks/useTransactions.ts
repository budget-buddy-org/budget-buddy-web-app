import type {
  PaginatedTransactions,
  Transaction,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface TransactionFilters {
  page?: number;
  size?: number;
  categoryId?: string;
  start?: string;
  end?: string;
  sort?: 'asc' | 'desc';
  search?: string;
}

const KEYS = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
  detail: (id: string) => ['transactions', id] as const,
};

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: async () => {
      // API doesn't support search yet, so we implement it client-side
      const apiFilters = { ...filters };
      delete apiFilters.search;

      if (filters.search) {
        // Fetch a larger set to perform local search — fetch up to 200 items
        const { data, error } = await listTransactions({
          query: {
            ...apiFilters,
            size: 200,
            page: 0,
          },
        });
        if (error) throw error;

        const term = filters.search.toLowerCase();
        const filtered = data.items.filter((item) =>
          item.description?.toLowerCase().includes(term),
        );

        // Local pagination of filtered results
        const page = filters.page ?? 0;
        const size = filters.size ?? 20;
        const start = page * size;
        const items = filtered.slice(start, start + size);

        return {
          items,
          meta: {
            total: filtered.length,
          },
        };
      }

      const { data, error } = await listTransactions({
        query: {
          ...apiFilters,
          sort: filters.sort ?? 'desc',
        },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...KEYS.list(filters), 'all'],
    queryFn: async () => {
      let allItems: Transaction[] = [];
      let page = 0;
      let total = 0;
      const size = 200;

      do {
        const { data, error } = await listTransactions({
          query: {
            ...filters,
            size,
            page,
          },
        });
        if (error) throw error;
        allItems = [...allItems, ...data.items];
        total = data.meta.total;
        page++;
      } while (allItems.length < total && page < 10);

      return { items: allItems, meta: { total } };
    },
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await getTransaction({
        path: { transactionId: id },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
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
