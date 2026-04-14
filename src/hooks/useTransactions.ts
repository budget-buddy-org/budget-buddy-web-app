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
  search?: string
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
      let allItems: any[] = []
      const page = filters.page ?? 0
      const size = filters.size ?? 20
      let total = 0
      let fetchCount = 0

      while (fetchCount < 10) {
        const { data, error } = await listTransactions({
          query: {
            size,
            sort: 'desc',
            ...filters,
            page: page + fetchCount,
          },
        })
        if (error) throw error

        if (fetchCount === 0) {
          total = data.meta.total
        }

        const newItems = data.items
        if (newItems.length === 0) break

        // Always add the first two pages (initial requested + one more)
        // OR if the day is split (last item of current batch has same date as first item of next page)
        const isSplit = allItems.length > 0 && allItems[allItems.length - 1].date === newItems[0].date

        if (fetchCount < 2 || isSplit) {
          allItems = [...allItems, ...newItems]
          fetchCount++
          if (allItems.length >= total) break
        } else {
          break
        }
      }

      return { items: allItems, meta: { total } }
    },
  })
}

export function useAllTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [...KEYS.list(filters), 'all'],
    queryFn: async () => {
      let allItems: any[] = []
      let page = 0
      let total = 0
      const size = 200

      do {
        const { data, error } = await listTransactions({
          query: {
            ...filters,
            size,
            page,
          },
        })
        if (error) throw error
        allItems = [...allItems, ...data.items]
        total = data.meta.total
        page++
      } while (allItems.length < total && page < 10)

      return { items: allItems, meta: { total } }
    },
  })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await getTransaction({
        path: { transactionId: id },
      })
      if (error) throw error
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
      const { error } = await deleteTransaction({
        path: { transactionId: id },
      })
      if (error) throw error
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
