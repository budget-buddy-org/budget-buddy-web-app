import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReactiveSearchMock } from '@/test/reactive-search';
import { type TransactionPageFilters, useTransactionPageState } from './useTransactionPageState';

const mockSearch = createReactiveSearchMock();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockSearch.navigate,
}));

vi.mock('@/routes/_app/transactions/index', () => ({
  Route: {
    fullPath: '/_app/transactions/',
    useSearch: () => mockSearch.useSearch(),
  },
}));

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

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  mockSearch.reset();
});

describe('useTransactionPageState — initial state', () => {
  it('returns correct defaults', () => {
    const { result } = renderHook(() => useTransactionPageState());

    expect(result.current.showForm).toBe(false);
    expect(result.current.showFilters).toBe(false);
    expect(result.current.editingId).toBeNull();
    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
    expect(result.current.isFiltered).toBe(false);
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

describe('useTransactionPageState — direct setters', () => {
  it('setShowForm toggles showForm', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.setShowForm(true));
    expect(result.current.showForm).toBe(true);

    act(() => result.current.setShowForm(false));
    expect(result.current.showForm).toBe(false);
  });

  it('setShowFilters toggles showFilters', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.setShowFilters(true));
    expect(result.current.showFilters).toBe(true);
  });

  it('setEditingId sets the editing transaction id', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.setEditingId('tx-123'));
    expect(result.current.editingId).toBe('tx-123');
  });
});

describe('useTransactionPageState — closeForm', () => {
  it('resets showForm to false', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.setShowForm(true));
    act(() => result.current.closeForm());

    expect(result.current.showForm).toBe(false);
  });

  it('resets editingId to null', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.setEditingId('tx-abc'));
    act(() => result.current.closeForm());

    expect(result.current.editingId).toBeNull();
  });
});

describe('useTransactionPageState — handleFilterChange', () => {
  it('writes new filter params to the URL search', () => {
    mockSearch.setSearch({ edit: 'tx-keep' });
    const { result } = renderHook(() => useTransactionPageState());
    const newFilters: TransactionPageFilters = {
      categoryId: 'cat-1',
      start: '2024-01-01',
      end: '2024-01-31',
      sort: 'asc',
      type: 'EXPENSE',
      query: '',
      amountMin: undefined,
      amountMax: undefined,
    };

    act(() => result.current.handleFilterChange(newFilters));

    expect(result.current.filters.categoryId).toBe('cat-1');
    expect(result.current.filters.sort).toBe('asc');
    expect(result.current.filters.type).toBe('EXPENSE');
    // edit is preserved across filter changes so an open dialog isn't dismissed
    expect(result.current.editingId).toBe('tx-keep');
    expect(mockSearch.navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true }));
  });
});

describe('useTransactionPageState — resetFilters', () => {
  it('clears all filters in the URL search but preserves edit', () => {
    mockSearch.setSearch({ categoryId: 'cat-1', sort: 'asc', edit: 'tx-keep' });
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.resetFilters());

    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
    expect(result.current.editingId).toBe('tx-keep');
    expect(mockSearch.navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true }));
  });
});

describe('useTransactionPageState — isFiltered', () => {
  it('is false with default (empty) search', () => {
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.isFiltered).toBe(false);
  });

  it('is true when categoryId is in search', () => {
    mockSearch.setSearch({ categoryId: 'cat-1' });
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.isFiltered).toBe(true);
  });

  it('is true when start date is in search', () => {
    mockSearch.setSearch({ start: '2024-01-01' });
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.isFiltered).toBe(true);
  });

  it('is true when type is in search', () => {
    mockSearch.setSearch({ type: 'INCOME' });
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.isFiltered).toBe(true);
  });
});

describe('useTransactionPageState — hasActiveFilters', () => {
  it('is false with default search', () => {
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('is true when sort is asc', () => {
    mockSearch.setSearch({ sort: 'asc' });
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('is true when categoryId is set', () => {
    mockSearch.setSearch({ categoryId: 'cat-1' });
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.hasActiveFilters).toBe(true);
  });
});
