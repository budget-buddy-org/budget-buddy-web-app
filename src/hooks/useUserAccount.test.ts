import {
  clearCurrentUserData,
  deleteCurrentUser,
  getCurrentUser,
} from '@budget-buddy-org/budget-buddy-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClearUserData, useCurrentUser, useDeleteAccount } from './useUserAccount';

type GetUserResult = Awaited<ReturnType<typeof getCurrentUser>>;
type ClearResult = Awaited<ReturnType<typeof clearCurrentUserData>>;
type DeleteResult = Awaited<ReturnType<typeof deleteCurrentUser>>;

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  getCurrentUser: vi.fn(),
  clearCurrentUserData: vi.fn(),
  deleteCurrentUser: vi.fn(),
}));

function makeWrapper(qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

describe('useCurrentUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the bootstrap user record', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      data: { id: 'user-1', preferences: { language: 'en', currency: 'EUR', timezone: 'UTC' } },
      error: undefined,
    } as unknown as GetUserResult);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('user-1');
  });
});

describe('useClearUserData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clears data and invalidates the financial caches', async () => {
    vi.mocked(clearCurrentUserData).mockResolvedValue({
      data: undefined,
      error: undefined,
    } as unknown as ClearResult);

    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useClearUserData(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(clearCurrentUserData).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['transactions'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories-summary'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['transactions-summary'] });
  });

  it('surfaces an error and skips invalidation on failure', async () => {
    vi.mocked(clearCurrentUserData).mockResolvedValue({
      data: undefined,
      error: { title: 'Server Error' },
    } as unknown as ClearResult);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useClearUserData(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useDeleteAccount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls deleteCurrentUser', async () => {
    vi.mocked(deleteCurrentUser).mockResolvedValue({
      data: undefined,
      error: undefined,
    } as unknown as DeleteResult);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteCurrentUser).toHaveBeenCalled();
  });

  it('errors when the delete fails', async () => {
    vi.mocked(deleteCurrentUser).mockResolvedValue({
      data: undefined,
      error: { title: 'Provider unavailable' },
    } as unknown as DeleteResult);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
