import { createFileRoute } from '@tanstack/react-router';
import { TransactionsSkeleton } from '@/components/transactions/TransactionsSkeleton';
import { categoriesQueryOptions } from '@/hooks/useCategories';
import { TRANSACTIONS_PAGE_SIZE, transactionsQueryOptions } from '@/hooks/useTransactions';
import { queryClient } from '@/lib/query-client';

export interface TransactionSearch {
  page?: number;
  categoryId?: string;
  start?: string;
  end?: string;
  sort?: 'asc' | 'desc';
  type?: 'EXPENSE' | 'INCOME' | '';
}

export const Route = createFileRoute('/_app/transactions/')({
  pendingComponent: TransactionsSkeleton,
  validateSearch: (search: Record<string, unknown>): TransactionSearch => ({
    page: typeof search.page === 'number' ? search.page : undefined,
    categoryId: typeof search.categoryId === 'string' ? search.categoryId : undefined,
    start: typeof search.start === 'string' ? search.start : undefined,
    end: typeof search.end === 'string' ? search.end : undefined,
    sort: search.sort === 'asc' ? 'asc' : search.sort === 'desc' ? 'desc' : undefined,
    type:
      search.type === 'EXPENSE' || search.type === 'INCOME'
        ? search.type
        : search.type === ''
          ? ''
          : undefined,
  }),
  loader: ({ location }) => {
    const search = location.search as TransactionSearch;
    return Promise.all([
      queryClient.ensureQueryData(
        transactionsQueryOptions({
          page: search.page ?? 0,
          size: TRANSACTIONS_PAGE_SIZE,
          sort: search.sort ?? 'desc',
          categoryId: search.categoryId || undefined,
          start: search.start || undefined,
          end: search.end || undefined,
          type: search.type || undefined,
        }),
      ),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
});
