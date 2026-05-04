import { createFileRoute } from '@tanstack/react-router';
import { CategoriesSkeleton } from '@/components/categories/CategoriesSkeleton';
import { CATEGORIES_PAGE_SIZE, categoriesQueryOptions } from '@/hooks/useCategories';
import { queryClient } from '@/lib/query-client';

export const Route = createFileRoute('/_app/categories/')({
  pendingComponent: CategoriesSkeleton,
  loader: () => {
    return queryClient.ensureQueryData(categoriesQueryOptions(CATEGORIES_PAGE_SIZE, 0));
  },
});
