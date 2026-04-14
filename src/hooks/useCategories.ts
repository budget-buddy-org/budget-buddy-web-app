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
  list: (size: number, page: number, search?: string) => ['categories', 'list', size, page, search] as const,
  detail: (id: string) => ['categories', id] as const,
}

export function useCategories(size = 200, page = 0, search?: string) {
  return useQuery({
    queryKey: KEYS.list(size, page, search),
    queryFn: async () => {
      const { data, error } = await listCategories({
        query: { size, page },
      })
      if (error) throw error

      // Client-side search if API doesn't support it
      if (search && data?.items) {
        const term = search.toLowerCase()
        data.items = data.items.filter((item) =>
          item.name.toLowerCase().includes(term),
        )
        data.meta.total = data.items.length
      }

      // Sort categories by name ASC
      if (data?.items) {
        data.items.sort((a, b) => a.name.localeCompare(b.name))
      }

      return data
    },
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await getCategory({
        path: { categoryId: id },
      })
      if (error) throw error
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
      const { error } = await deleteCategory({
        path: { categoryId: id },
      })
      if (error) throw error
      return id
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.all })
      const previous = qc.getQueriesData<PaginatedCategories>({ queryKey: KEYS.all })

      // Optimistically update all paginated lists
      qc.setQueriesData<PaginatedCategories>({ queryKey: ['categories', 'list'] }, (old) =>
        old ? { ...old, items: old.items.filter((c) => c.id !== id) } : old,
      )

      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        ctx.previous.forEach(([key, value]) => qc.setQueryData(key, value))
      }
    },
    onSuccess: (_data, id) => {
      // Also remove the specific detail query if it exists
      qc.removeQueries({ queryKey: KEYS.detail(id) })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
