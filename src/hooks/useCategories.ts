import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi } from '@/lib/api'
import type { CategoryUpdate, CategoryWrite, PaginatedCategories } from '@glebremniov/budget-buddy-contracts'

const KEYS = {
  all: ['categories'] as const,
  list: (limit: number, offset: number) => ['categories', 'list', limit, offset] as const,
  detail: (id: string) => ['categories', id] as const,
}

export function useCategories(limit = 200, offset = 0) {
  return useQuery({
    queryKey: KEYS.list(limit, offset),
    queryFn: async () => {
      const { data } = await categoriesApi.listCategories({ limit, offset })
      return data
    },
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await categoriesApi.getCategory({ categoryId: id })
      return data
    },
    enabled: Boolean(id),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CategoryWrite) => {
      const { data } = await categoriesApi.createCategory({ categoryWrite: body })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CategoryUpdate) => {
      const { data } = await categoriesApi.updateCategory({ categoryId: id, categoryUpdate: body })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all })
      qc.invalidateQueries({ queryKey: KEYS.detail(id) })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await categoriesApi.deleteCategory({ categoryId: id })
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.all })
      const previous = qc.getQueriesData<PaginatedCategories>({ queryKey: KEYS.all })
      qc.setQueriesData<PaginatedCategories>({ queryKey: KEYS.all }, (old) =>
        old ? { ...old, items: old.items.filter((c) => c.id !== id) } : old,
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
