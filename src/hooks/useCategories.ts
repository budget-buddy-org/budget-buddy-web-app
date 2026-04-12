import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@budget-buddy-org/budget-buddy-contracts'
import type {
  CategoryUpdate,
  CategoryWrite,
  PaginatedCategories,
} from '@budget-buddy-org/budget-buddy-contracts'

const KEYS = {
  all: ['categories'] as const,
  list: (size: number, page: number) => ['categories', 'list', size, page] as const,
  detail: (id: string) => ['categories', id] as const,
}

export function useCategories(size = 200, page = 0) {
  return useQuery({
    queryKey: KEYS.list(size, page),
    queryFn: async () => {
      const { data } = await listCategories({
        query: { size, page },
      })
      return data
    },
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await getCategory({
        path: { categoryId: id },
      })
      return data
    },
    enabled: Boolean(id),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CategoryWrite) => {
      const { data, error } = await createCategory({
        body,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CategoryUpdate) => {
      const { data, error } = await updateCategory({
        path: { categoryId: id },
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

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteCategory({
        path: { categoryId: id },
      })
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
