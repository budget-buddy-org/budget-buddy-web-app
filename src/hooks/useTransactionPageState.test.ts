import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type TransactionPageFilters, useTransactionPageState } from './useTransactionPageState';

const mockNavigate = vi.fn();
const mockSearch: Record<string, unknown> = {};

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/routes/_app/transactions/index', () => ({
  Route: {
    fullPath: '/_app/transactions/',
    useSearch: () => mockSearch,
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
  mockNavigate.mockReset();
  // Reset mock search to empty (all defaults)
  for (const key of Object.keys(mockSearch)) {
    delete mockSearch[key];
  }
});

describe('useTransactionPageState — initial state', () => {
  it('returns correct defaults', () => {
    const { result } = renderHook(() => useTransactionPageState());

    expect(result.current.showForm).toBe(false);
    expect(result.current.showFilters).toBe(false);
    expect(result.current.editingId).toBeNull();
    expect(result.current.page).toBe(0);
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
  it('calls navigate with the new filter params', () => {
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

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.objectContaining({ categoryId: 'cat-1', sort: 'asc', type: 'EXPENSE' }),
        replace: true,
      }),
    );
  });

  it('resets page to undefined when filters change', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.handleFilterChange({ ...DEFAULT_FILTERS, categoryId: 'cat-1' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ search: expect.objectContaining({ page: undefined }) }),
    );
  });
});

describe('useTransactionPageState — resetFilters', () => {
  it('calls navigate with all undefined search params', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.resetFilters());

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: {
          page: undefined,
          categoryId: undefined,
          start: undefined,
          end: undefined,
          sort: undefined,
          type: undefined,
        },
        replace: true,
      }),
    );
  });
});

describe('useTransactionPageState — handlePageChange', () => {
  it('calls navigate with the new page', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.handlePageChange(4));

    expect(mockNavigate).toHaveBeenCalled();
  });

  it('calls window.scrollTo with smooth scroll to top', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.handlePageChange(1));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('calls window.scrollTo on every page change', () => {
    const { result } = renderHook(() => useTransactionPageState());

    act(() => result.current.handlePageChange(1));
    act(() => result.current.handlePageChange(2));

    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });
});

describe('useTransactionPageState — isFiltered', () => {
  it('is false with default (empty) search', () => {
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.isFiltered).toBe(false);
  });

  it('is true when categoryId is in search', () => {
    mockSearch.categoryId = 'cat-1';
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.isFiltered).toBe(true);
  });

  it('is true when start date is in search', () => {
    mockSearch.start = '2024-01-01';
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.isFiltered).toBe(true);
  });

  it('is true when type is in search', () => {
    mockSearch.type = 'INCOME';
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
    mockSearch.sort = 'asc';
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('is true when categoryId is set', () => {
    mockSearch.categoryId = 'cat-1';
    const { result } = renderHook(() => useTransactionPageState());
    expect(result.current.hasActiveFilters).toBe(true);
  });
});
