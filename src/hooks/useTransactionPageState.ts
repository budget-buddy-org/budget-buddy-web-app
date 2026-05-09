import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { Route } from '@/routes/_app/transactions';

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

type SearchShape = Partial<TransactionPageFilters> & { edit?: string };

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

  // Merges a partial patch into the current search, leaving other params intact.
  const patchSearch = useCallback(
    (patch: SearchShape, replace = true) => {
      navigate({
        search: (prev: SearchShape) => ({ ...prev, ...patch }),
        replace,
      });
    },
    [navigate],
  );

  // Replaces all filter params, but keeps `edit` so an open dialog isn't dismissed.
  const replaceFilters = useCallback(
    (next: Partial<TransactionPageFilters>) => {
      navigate({
        search: (prev: SearchShape) => ({ edit: prev.edit, ...next }),
        replace: true,
      });
    },
    [navigate],
  );

  const editingId = search.edit ?? null;
  const setEditingId = useCallback(
    (id: string | null) => patchSearch({ edit: id ?? undefined }, false),
    [patchSearch],
  );

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

  const closeForm = useCallback(() => {
    setShowForm(false);
    if (search.edit) patchSearch({ edit: undefined });
  }, [patchSearch, search.edit]);

  const resetFilters = useCallback(() => {
    replaceFilters({
      categoryId: undefined,
      start: undefined,
      end: undefined,
      sort: undefined,
      type: undefined,
      query: undefined,
      amountMin: undefined,
      amountMax: undefined,
    });
  }, [replaceFilters]);

  const handleFilterChange = useCallback(
    (newFilters: TransactionPageFilters) => {
      replaceFilters({
        categoryId: newFilters.categoryId || undefined,
        start: newFilters.start || undefined,
        end: newFilters.end || undefined,
        sort: newFilters.sort !== 'desc' ? newFilters.sort : undefined,
        type: newFilters.type || undefined,
        query: newFilters.query || undefined,
        amountMin: newFilters.amountMin,
        amountMax: newFilters.amountMax,
      });
    },
    [replaceFilters],
  );

  const handleQueryChange = useCallback(
    (next: string | undefined) => {
      patchSearch({ query: next && next.length > 0 ? next : undefined });
    },
    [patchSearch],
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
    isFiltered,
    hasActiveFilters,
    closeForm,
    resetFilters,
    handleFilterChange,
    handleQueryChange,
  };
}
