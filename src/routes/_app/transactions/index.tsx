import { createFileRoute } from '@tanstack/react-router';
import { TransactionsSkeleton } from '@/components/transactions/TransactionsSkeleton';
import { categoriesQueryOptions } from '@/hooks/useCategories';
import { infiniteTransactionsQueryOptions, TRANSACTIONS_PAGE_SIZE } from '@/hooks/useTransactions';
import { queryClient } from '@/lib/query-client';

export interface TransactionSearch {
  categoryId?: string;
  start?: string;
  end?: string;
  sort?: 'asc' | 'desc';
  type?: 'EXPENSE' | 'INCOME' | '';
  query?: string;
  amountMin?: number;
  amountMax?: number;
  edit?: string;
}

const validAmount = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= 1 ? Math.floor(v) : undefined;

const validSort = (v: unknown): 'asc' | 'desc' | undefined =>
  v === 'asc' || v === 'desc' ? v : undefined;

const validType = (v: unknown): 'EXPENSE' | 'INCOME' | '' | undefined =>
  v === 'EXPENSE' || v === 'INCOME' || v === '' ? v : undefined;

export const Route = createFileRoute('/_app/transactions/')({
  pendingComponent: TransactionsSkeleton,
  validateSearch: (search: Record<string, unknown>): TransactionSearch => ({
    categoryId: typeof search.categoryId === 'string' ? search.categoryId : undefined,
    start: typeof search.start === 'string' ? search.start : undefined,
    end: typeof search.end === 'string' ? search.end : undefined,
    sort: validSort(search.sort),
    type: validType(search.type),
    query: typeof search.query === 'string' && search.query.length > 0 ? search.query : undefined,
    amountMin: validAmount(search.amountMin),
    amountMax: validAmount(search.amountMax),
    edit: typeof search.edit === 'string' && search.edit.length > 0 ? search.edit : undefined,
  }),
  // `query` is intentionally excluded — including it would re-run the loader
  // on every debounced keystroke, swapping in `pendingComponent` and blurring
  // the search input. The in-component query handles the filtered fetch.
  loaderDeps: ({ search }) => ({
    categoryId: search.categoryId,
    start: search.start,
    end: search.end,
    sort: search.sort,
    type: search.type,
    amountMin: search.amountMin,
    amountMax: search.amountMax,
  }),
  loader: ({ deps }) => {
    return Promise.all([
      queryClient.ensureInfiniteQueryData(
        infiniteTransactionsQueryOptions({
          size: TRANSACTIONS_PAGE_SIZE,
          sort: deps.sort ?? 'desc',
          categoryId: deps.categoryId || undefined,
          start: deps.start || undefined,
          end: deps.end || undefined,
          type: deps.type || undefined,
          amountMin: deps.amountMin,
          amountMax: deps.amountMax,
        }),
      ),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
});
