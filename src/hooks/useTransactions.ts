import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { transactionsApi } from '@/lib/api'
import type { PaginatedTransactions, TransactionUpdate, TransactionWrite } from '@glebremniov/budget-buddy-contracts'

export interface TransactionFilters {
  limit?: number
  offset?: number
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
      const { data } = await transactionsApi.listTransactions({ limit: 20, sort: 'desc', ...filters })
      return data
    },
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await transactionsApi.getTransaction({ transactionId: id })
      return data
    },
    enabled: Boolean(id),
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: TransactionWrite) => {
      const { data } = await transactionsApi.createTransaction({ transactionWrite: body })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: TransactionUpdate) => {
      const { data } = await transactionsApi.updateTransaction({ transactionId: id, transactionUpdate: body })
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
      await transactionsApi.deleteTransaction({ transactionId: id })
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
