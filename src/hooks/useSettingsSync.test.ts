import {
  getCurrentUserClientSettings,
  upsertCurrentUserClientSettings,
} from '@budget-buddy-org/budget-buddy-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectWebSettings } from '@/lib/clientSettings';
import { useThemeStore } from '@/stores/theme.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';
import { useSettingsSync } from './useSettingsSync';
import { useUserSettings } from './useUserSettings';

type GetResult = Awaited<ReturnType<typeof getCurrentUserClientSettings>>;
type UpsertResult = Awaited<ReturnType<typeof upsertCurrentUserClientSettings>>;

vi.mock('@budget-buddy-org/budget-buddy-contracts', () => ({
  getCurrentUserClientSettings: vi.fn(),
  upsertCurrentUserClientSettings: vi.fn(),
  deleteCurrentUserClientSettings: vi.fn(),
}));

const themeDefaults = {
  theme: 'system' as const,
  primaryHue: 240,
  fontSize: 16,
  showNavLabels: true,
  glassEffect: true,
  showDescriptions: true,
};
const prefDefaults = {
  currency: null,
  dateFormat: 'medium' as const,
  numberLocale: null,
  isBalanceHidden: false,
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

// Render the sync hook alongside the query so tests can await hydration.
function useHarness() {
  useSettingsSync();
  return useUserSettings();
}

beforeEach(() => {
  vi.clearAllMocks();
  useThemeStore.setState(themeDefaults);
  useUserPreferencesStore.setState(prefDefaults);
});

describe('useSettingsSync', () => {
  it('pulls server settings into the stores and does not echo them back', async () => {
    vi.mocked(getCurrentUserClientSettings).mockResolvedValue({
      data: { clientId: 'web', settings: { theme: 'dark', primaryHue: 120 } },
      error: undefined,
      response: { status: 200 },
    } as unknown as GetResult);

    const { result } = renderHook(useHarness, { wrapper: makeWrapper() });

    await waitFor(() => expect(useThemeStore.getState().theme).toBe('dark'));
    expect(useThemeStore.getState().primaryHue).toBe(120);
    expect(result.current.isSuccess).toBe(true);
    // The pull-induced store update must not be pushed back to the server.
    expect(upsertCurrentUserClientSettings).not.toHaveBeenCalled();
  });

  it('seeds the server when no settings row exists yet', async () => {
    vi.mocked(getCurrentUserClientSettings).mockResolvedValue({
      data: undefined,
      error: { title: 'Not Found' },
      response: { status: 404 },
    } as unknown as GetResult);
    vi.mocked(upsertCurrentUserClientSettings).mockResolvedValue({
      data: { clientId: 'web', settings: {} },
      error: undefined,
    } as unknown as UpsertResult);

    renderHook(useHarness, { wrapper: makeWrapper() });

    await waitFor(() => expect(upsertCurrentUserClientSettings).toHaveBeenCalledTimes(1));
    expect(upsertCurrentUserClientSettings).toHaveBeenCalledWith({
      path: { clientId: 'web' },
      body: { settings: expect.objectContaining({ theme: 'system', primaryHue: 240 }) },
    });
  });

  it('pushes local changes to the server after hydration (debounced)', async () => {
    // Server row already matches local defaults, so no seed/echo fires.
    vi.mocked(getCurrentUserClientSettings).mockResolvedValue({
      data: { clientId: 'web', settings: collectWebSettings() },
      error: undefined,
      response: { status: 200 },
    } as unknown as GetResult);
    vi.mocked(upsertCurrentUserClientSettings).mockResolvedValue({
      data: { clientId: 'web', settings: {} },
      error: undefined,
    } as unknown as UpsertResult);

    const { result } = renderHook(useHarness, { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {});

    act(() => {
      useThemeStore.getState().setTheme('dark');
    });

    // Wait out the 1s debounce.
    await waitFor(() => expect(upsertCurrentUserClientSettings).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
    expect(upsertCurrentUserClientSettings).toHaveBeenCalledWith({
      path: { clientId: 'web' },
      body: { settings: expect.objectContaining({ theme: 'dark' }) },
    });
  });
});
