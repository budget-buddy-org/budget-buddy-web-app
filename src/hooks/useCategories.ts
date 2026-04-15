import type {
  CategoryUpdate,
  CategoryWrite,
  PaginatedCategories,
} from '@budget-buddy-org/budget-buddy-contracts';
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from '@budget-buddy-org/budget-buddy-contracts';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const KEYS = {
  all: ['categories'] as const,
  list: (size: number, page: number, search?: string) =>
    ['categories', 'list', size, page, search] as const,
  detail: (id: string) => ['categories', id] as const,
};

export const categoriesQueryOptions = (size = 200, page = 0, search?: string) =>
  queryOptions({
    queryKey: KEYS.list(size, page, search),
    queryFn: async () => {
      const { data, error } = await listCategories({
        query: { size, page },
      });
      if (error) throw error;
      if (!data) return data;

      let items = [...data.items].sort((a, b) => a.name.localeCompare(b.name));
      let total = data.meta.total;

      if (search) {
        const term = search.toLowerCase();
        items = items.filter((item) => item.name.toLowerCase().includes(term));
        total = items.length;
      }

      return { ...data, items, meta: { ...data.meta, total } };
    },
  });

export function useCategories(size = 200, page = 0, search?: string) {
  return useQuery(categoriesQueryOptions(size, page, search));
}

export const categoryDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await getCategory({
        path: { categoryId: id },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });

export function useCategory(id: string) {
  return useQuery(categoryDetailQueryOptions(id));
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CategoryWrite) => {
      const { data, error } = await createCategory({
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CategoryUpdate) => {
      const { data, error } = await updateCategory({
        path: { categoryId: id },
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

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteCategory({
        path: { categoryId: id },
      });
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: KEYS.all });
      const previous = qc.getQueriesData<PaginatedCategories>({ queryKey: KEYS.all });

      // Optimistically update all paginated lists
      qc.setQueriesData<PaginatedCategories>({ queryKey: ['categories', 'list'] }, (old) =>
        old ? { ...old, items: old.items.filter((c) => c.id !== id) } : old,
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
