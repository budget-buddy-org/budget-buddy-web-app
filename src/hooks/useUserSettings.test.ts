import {
  deleteCurrentUserClientSettings,
  getCurrentUserClientSettings,
  upsertCurrentUserClientSettings,
} from '@budget-buddy-org/budget-buddy-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  USER_SETTINGS_KEYS,
  useDeleteUserSettings,
  useUpsertUserSettings,
  useUserSettings,
} from './useUserSettings';

type GetResult = Awaited<ReturnType<typeof getCurrentUserClientSettings>>;
type UpsertResult = Awaited<ReturnType<typeof upsertCurrentUserClientSettings>>;
type DeleteResult = Awaited<ReturnType<typeof deleteCurrentUserClientSettings>>;

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  getCurrentUserClientSettings: vi.fn(),
  upsertCurrentUserClientSettings: vi.fn(),
  deleteCurrentUserClientSettings: vi.fn(),
}));

function makeWrapper(qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

describe('useUserSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the web client settings row', async () => {
    vi.mocked(getCurrentUserClientSettings).mockResolvedValue({
      data: { clientId: 'web', settings: { theme: 'dark' } },
      error: undefined,
      response: { status: 200 },
    } as unknown as GetResult);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.settings).toEqual({ theme: 'dark' });
    expect(getCurrentUserClientSettings).toHaveBeenCalledWith({ path: { clientId: 'web' } });
  });

  it('treats a 404 as null instead of an error', async () => {
    vi.mocked(getCurrentUserClientSettings).mockResolvedValue({
      data: undefined,
      error: { title: 'Not Found' },
      response: { status: 404 },
    } as unknown as GetResult);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('throws on non-404 errors', async () => {
    vi.mocked(getCurrentUserClientSettings).mockResolvedValue({
      data: undefined,
      error: { title: 'Server Error' },
      response: { status: 500 },
    } as unknown as GetResult);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpsertUserSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('puts the payload and primes the cache with the response', async () => {
    const row = { clientId: 'web', settings: { theme: 'light' } };
    vi.mocked(upsertCurrentUserClientSettings).mockResolvedValue({
      data: row,
      error: undefined,
    } as unknown as UpsertResult);

    const { qc, wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpsertUserSettings(), { wrapper });

    result.current.mutate({ theme: 'light' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(upsertCurrentUserClientSettings).toHaveBeenCalledWith({
      path: { clientId: 'web' },
      body: { settings: { theme: 'light' } },
    });
    expect(qc.getQueryData(USER_SETTINGS_KEYS.detail('web'))).toEqual(row);
  });
});

describe('useDeleteUserSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes the row and clears the cache entry', async () => {
    vi.mocked(deleteCurrentUserClientSettings).mockResolvedValue({
      data: undefined,
      error: undefined,
    } as unknown as DeleteResult);

    const { qc, wrapper } = makeWrapper();
    qc.setQueryData(USER_SETTINGS_KEYS.detail('web'), { clientId: 'web', settings: {} });
    const { result } = renderHook(() => useDeleteUserSettings(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteCurrentUserClientSettings).toHaveBeenCalledWith({ path: { clientId: 'web' } });
    expect(qc.getQueryData(USER_SETTINGS_KEYS.detail('web'))).toBeNull();
  });
});
