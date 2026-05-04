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

export const CATEGORIES_PAGE_SIZE = 200;

const KEYS = {
  all: ['categories'] as const,
  list: (size: number, page: number) => ['categories', 'list', size, page] as const,
  detail: (id: string) => ['categories', id] as const,
};

export const categoriesQueryOptions = (size = CATEGORIES_PAGE_SIZE, page = 0) =>
  queryOptions({
    queryKey: KEYS.list(size, page),
    queryFn: async () => {
      const { data, error } = await listCategories({
        query: { size, page },
      });
      if (error) throw error;
      return data;
    },
  });

export function useCategories(size = CATEGORIES_PAGE_SIZE, page = 0) {
  return useQuery(categoriesQueryOptions(size, page));
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
