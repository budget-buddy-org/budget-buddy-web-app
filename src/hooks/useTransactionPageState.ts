import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { Route } from '@/routes/_app/transactions/index';

export interface TransactionPageFilters {
  categoryId: string;
  start: string;
  end: string;
  sort: 'asc' | 'desc';
  type: 'EXPENSE' | 'INCOME' | '';
  query: string;
  amountMin?: number;
  amountMax?: number;
}

const DEFAULT_FILTERS: TransactionPageFilters = {
  categoryId: '',
  start: '',
  end: '',
  sort: 'desc',
  type: '',
  query: '',
  amountMin: undefined,
  amountMax: undefined,
};

export function useTransactionPageState() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filters: TransactionPageFilters = {
    categoryId: search.categoryId ?? DEFAULT_FILTERS.categoryId,
    start: search.start ?? DEFAULT_FILTERS.start,
    end: search.end ?? DEFAULT_FILTERS.end,
    sort: search.sort ?? DEFAULT_FILTERS.sort,
    type: search.type ?? DEFAULT_FILTERS.type,
    query: search.query ?? DEFAULT_FILTERS.query,
    amountMin: search.amountMin,
    amountMax: search.amountMax,
  };

  const page = search.page ?? 0;

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
  }, []);

  const resetFilters = useCallback(() => {
    navigate({
      search: {
        page: undefined,
        categoryId: undefined,
        start: undefined,
        end: undefined,
        sort: undefined,
        type: undefined,
        query: undefined,
        amountMin: undefined,
        amountMax: undefined,
      },
      replace: true,
    });
  }, [navigate]);

  const handleFilterChange = useCallback(
    (newFilters: TransactionPageFilters) => {
      navigate({
        search: {
          page: undefined,
          categoryId: newFilters.categoryId || undefined,
          start: newFilters.start || undefined,
          end: newFilters.end || undefined,
          sort: newFilters.sort !== 'desc' ? newFilters.sort : undefined,
          type: newFilters.type || undefined,
          query: newFilters.query || undefined,
          amountMin: newFilters.amountMin,
          amountMax: newFilters.amountMax,
        },
        replace: true,
      });
    },
    [navigate],
  );

  const handleQueryChange = useCallback(
    (next: string | undefined) => {
      navigate({
        search: (prev) => ({
          ...prev,
          page: undefined,
          query: next && next.length > 0 ? next : undefined,
        }),
        replace: true,
      });
    },
    [navigate],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      navigate({
        search: (prev) => ({ ...prev, page: newPage || undefined }),
        replace: true,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate],
  );

  const isFiltered = !!(
    filters.categoryId ||
    filters.start ||
    filters.end ||
    filters.type ||
    filters.query ||
    filters.amountMin !== undefined ||
    filters.amountMax !== undefined
  );
  const hasActiveFilters = isFiltered || filters.sort !== 'desc';

  return {
    showForm,
    setShowForm,
    showFilters,
    setShowFilters,
    editingId,
    setEditingId,
    filters,
    page,
    isFiltered,
    hasActiveFilters,
    closeForm,
    resetFilters,
    handleFilterChange,
    handleQueryChange,
    handlePageChange,
  };
}
