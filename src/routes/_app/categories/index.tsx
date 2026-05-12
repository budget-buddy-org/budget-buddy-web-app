import { createFileRoute } from '@tanstack/react-router';
import { CategoriesSkeleton } from '@/components/categories/CategoriesSkeleton';
import { CATEGORIES_PAGE_SIZE, categoriesQueryOptions } from '@/hooks/useCategories';
import { queryClient } from '@/lib/query-client';

export interface CategoriesSearch {
  edit?: string;
}

export const Route = createFileRoute('/_app/categories/')({
  pendingComponent: CategoriesSkeleton,
  validateSearch: (search: Record<string, unknown>): CategoriesSearch => ({
    edit: typeof search.edit === 'string' && search.edit.length > 0 ? search.edit : undefined,
  }),
  loaderDeps: () => ({}),
  loader: () => {
    return queryClient.ensureQueryData(categoriesQueryOptions(CATEGORIES_PAGE_SIZE, 0));
  },
});
