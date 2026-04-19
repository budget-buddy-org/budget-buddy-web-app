import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSignoutRedirect = vi.fn();
vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    signoutRedirect: mockSignoutRedirect,
  }),
}));

vi.mock('@/lib/query-client', () => ({
  queryClient: {
    clear: vi.fn(),
  },
}));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: { clearAuth: () => void }) => unknown) =>
    selector({ clearAuth: mockClearAuth }),
}));

const mockClearAuth = vi.fn();

const { queryClient } = await import('@/lib/query-client');
const { useLogout } = await import('./useLogout');

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls OIDC signout redirect, clears auth, and clears query cache on success', async () => {
    mockSignoutRedirect.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSignoutRedirect).toHaveBeenCalledOnce();
    expect(mockClearAuth).toHaveBeenCalledOnce();
    expect(queryClient.clear).toHaveBeenCalledOnce();
  });

  it('still clears auth and query cache when signout redirect fails', async () => {
    mockSignoutRedirect.mockRejectedValue(new Error('redirect error'));

    const { result } = renderHook(() => useLogout(), { wrapper: makeWrapper() });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    // onSettled runs regardless of success/failure
    expect(mockClearAuth).toHaveBeenCalledOnce();
    expect(queryClient.clear).toHaveBeenCalledOnce();
  });
});
