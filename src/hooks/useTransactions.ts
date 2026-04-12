import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@budget-buddy-org/budget-buddy-contracts'
import type {
  PaginatedTransactions,
  TransactionUpdate,
  TransactionWrite,
} from '@budget-buddy-org/budget-buddy-contracts'

export interface TransactionFilters {
  page?: number
  size?: number
  categoryId?: string
  start?: string
  end?: string
  sort?: 'asc' | 'desc'
}

const KEYS = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
  detail: (id: string) => ['transactions', id] as const,
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: async () => {
      const { data } = await listTransactions({
        query: {
          size: 20,
          sort: 'desc',
          ...filters,
        },
      })
      return data
    },
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await getTransaction({
        path: { transactionId: id },
      })
      return data
    },
    enabled: Boolean(id),
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: TransactionWrite) => {
      const { data, error } = await createTransaction({
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: TransactionUpdate) => {
      const { data, error } = await updateTransaction({
        path: { transactionId: id },
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteTransaction({
        path: { transactionId: id },
      })
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.all })
      const previous = qc.getQueriesData<PaginatedTransactions>({ queryKey: KEYS.all })
      qc.setQueriesData<PaginatedTransactions>({ queryKey: KEYS.all }, (old) =>
        old ? { ...old, items: old.items.filter((t) => t.id !== id) } : old,
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        ctx.previous.forEach(([key, value]) => qc.setQueryData(key, value))
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
