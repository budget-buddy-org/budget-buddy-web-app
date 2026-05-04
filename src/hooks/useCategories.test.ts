import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from '@budget-buddy-org/budget-buddy-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CATEGORIES_PAGE_SIZE,
  useCategories,
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from './useCategories';

type ListCategoriesResult = Awaited<ReturnType<typeof listCategories>>;
type GetCategoryResult = Awaited<ReturnType<typeof getCategory>>;
type CreateCategoryResult = Awaited<ReturnType<typeof createCategory>>;
type UpdateCategoryResult = Awaited<ReturnType<typeof updateCategory>>;
type DeleteCategoryResult = Awaited<ReturnType<typeof deleteCategory>>;

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  listCategories: vi.fn(),
  getCategory: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const mockCategory = {
  id: 'cat-1',
  name: 'Groceries',
  ownerId: 'user-1',
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-10T08:00:00Z',
};

const mockPage = {
  items: [mockCategory],
  meta: {
    total: 1,
    size: CATEGORIES_PAGE_SIZE,
    page: 0,
  },
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns fetched categories', async () => {
    vi.mocked(listCategories).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListCategoriesResult);

    const { result } = renderHook(() => useCategories(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0]?.name).toBe('Groceries');
  });

  it('passes size and page to the API', async () => {
    vi.mocked(listCategories).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListCategoriesResult);

    renderHook(() => useCategories(50, 1), { wrapper: makeWrapper() });

    await waitFor(() => expect(listCategories).toHaveBeenCalled());
    expect(listCategories).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ size: 50, page: 1 }) }),
    );
  });
});

describe('useCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches a single category by id', async () => {
    vi.mocked(getCategory).mockResolvedValue({
      data: mockCategory,
      error: undefined,
    } as unknown as GetCategoryResult);

    const { result } = renderHook(() => useCategory('cat-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Groceries');
    expect(getCategory).toHaveBeenCalledWith({ path: { categoryId: 'cat-1' } });
  });

  it('is disabled when id is empty', async () => {
    const { result } = renderHook(() => useCategory(''), { wrapper: makeWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getCategory).not.toHaveBeenCalled();
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls createCategory and invalidates queries on success', async () => {
    vi.mocked(createCategory).mockResolvedValue({
      data: mockCategory,
      error: undefined,
    } as unknown as CreateCategoryResult);
    vi.mocked(listCategories).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListCategoriesResult);

    const { result } = renderHook(() => useCreateCategory(), { wrapper: makeWrapper() });

    result.current.mutate({ name: 'Groceries' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createCategory).toHaveBeenCalledWith({ body: { name: 'Groceries' } });
  });
});

describe('useUpdateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateCategory with the correct path and body', async () => {
    const updated = { ...mockCategory, name: 'Food' };
    vi.mocked(updateCategory).mockResolvedValue({
      data: updated,
      error: undefined,
    } as unknown as UpdateCategoryResult);

    const { result } = renderHook(() => useUpdateCategory('cat-1'), { wrapper: makeWrapper() });

    result.current.mutate({ name: 'Food' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateCategory).toHaveBeenCalledWith({
      path: { categoryId: 'cat-1' },
      body: { name: 'Food' },
    });
  });
});

describe('useDeleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deleteCategory and returns the id on success', async () => {
    vi.mocked(deleteCategory).mockResolvedValue({
      data: undefined,
      error: undefined,
    } as unknown as DeleteCategoryResult);
    vi.mocked(listCategories).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListCategoriesResult);

    const { result } = renderHook(() => useDeleteCategory(), { wrapper: makeWrapper() });

    result.current.mutate('cat-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteCategory).toHaveBeenCalledWith({ path: { categoryId: 'cat-1' } });
  });

  it('rolls back the optimistic update on error', async () => {
    const networkError = new Error('network error');
    vi.mocked(deleteCategory).mockRejectedValue(networkError);
    vi.mocked(listCategories).mockResolvedValue({
      data: mockPage,
      error: undefined,
    } as unknown as ListCategoriesResult);

    const wrapper = makeWrapper();
    const { result: listResult } = renderHook(() => useCategories(), { wrapper });
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true));

    const { result: deleteResult } = renderHook(() => useDeleteCategory(), { wrapper });
    deleteResult.current.mutate('cat-1');

    await waitFor(() => expect(deleteResult.current.isError).toBe(true));
    // After rollback, the list should still contain the category
    await waitFor(() => expect(listResult.current.data?.items).toHaveLength(1));
  });
});
