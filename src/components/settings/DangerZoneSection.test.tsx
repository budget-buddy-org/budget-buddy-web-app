import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@/test/utils';
import { DangerZoneSection } from './DangerZoneSection';

vi.mock('@/hooks/useUserAccount', () => ({
  useClearUserData: vi.fn(),
  useDeleteAccount: vi.fn(),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: vi.fn() }));
vi.mock('react-oidc-context', () => ({ useAuth: vi.fn() }));

const { useClearUserData, useDeleteAccount } = await import('@/hooks/useUserAccount');
const { useToast } = await import('@/hooks/use-toast');
const { useAuth } = await import('react-oidc-context');

type MutateOpts = { onSuccess?: () => unknown; onError?: () => unknown };

const toast = vi.fn();
const removeUser = vi.fn().mockResolvedValue(undefined);
const signoutRedirect = vi.fn().mockResolvedValue(undefined);

// A mutate stub that synchronously invokes the success or error callback the
// component passes, mimicking a resolved/rejected mutation.
function settledMutate(outcome: 'success' | 'error') {
  return vi.fn((_vars: unknown, opts?: MutateOpts) => {
    if (outcome === 'success') return opts?.onSuccess?.();
    return opts?.onError?.();
  });
}

function setup({
  clearMutate = settledMutate('success'),
  deleteMutate = settledMutate('success'),
}: {
  clearMutate?: ReturnType<typeof settledMutate>;
  deleteMutate?: ReturnType<typeof settledMutate>;
} = {}) {
  vi.mocked(useClearUserData).mockReturnValue({
    mutate: clearMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useClearUserData>);
  vi.mocked(useDeleteAccount).mockReturnValue({
    mutate: deleteMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteAccount>);

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const clearCacheSpy = vi.spyOn(queryClient, 'clear');
  render(<DangerZoneSection />, { queryClient });
  return { clearMutate, deleteMutate, clearCacheSpy };
}

// Open one of the two confirmation dialogs by clicking its section trigger,
// then return the dialog element so queries can be scoped inside it (the
// "Delete account" label appears on both the trigger and the confirm button).
async function openDialog(triggerName: RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: triggerName }));
  const dialog = await screen.findByRole('dialog');
  return { user, dialog };
}

const originalLocation = globalThis.location;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({ toast } as unknown as ReturnType<typeof useToast>);
  vi.mocked(useAuth).mockReturnValue({
    removeUser,
    signoutRedirect,
  } as unknown as ReturnType<typeof useAuth>);
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { href: '/', pathname: '/', search: '' },
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, 'location', { configurable: true, value: originalLocation });
});

describe('DangerZoneSection — clear data', () => {
  it('clears data and shows a success toast on confirm', async () => {
    const { clearMutate } = setup();
    const { user, dialog } = await openDialog(/clear all data/i);

    await user.click(within(dialog).getByRole('button', { name: /clear data/i }));

    expect(clearMutate).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
  });

  it('shows a destructive toast and keeps the dialog open on failure', async () => {
    const { clearMutate } = setup({ clearMutate: settledMutate('error') });
    const { user, dialog } = await openDialog(/clear all data/i);

    await user.click(within(dialog).getByRole('button', { name: /clear data/i }));

    expect(clearMutate).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    // Dialog stays mounted so the user can retry.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('DangerZoneSection — delete account', () => {
  it('clears the cache and signs the user out on success', async () => {
    const { clearCacheSpy } = setup();
    const { user, dialog } = await openDialog(/delete account/i);

    await user.click(within(dialog).getByRole('button', { name: /delete account/i }));

    await waitFor(() => expect(signoutRedirect).toHaveBeenCalledTimes(1));
    expect(clearCacheSpy).toHaveBeenCalledTimes(1);
    // The normal sign-out path does not hit the local-credential fallback.
    expect(removeUser).not.toHaveBeenCalled();
  });

  it('falls back to clearing local credentials when sign-out is rejected', async () => {
    signoutRedirect.mockRejectedValueOnce(new Error('account gone'));
    setup();
    const { user, dialog } = await openDialog(/delete account/i);

    await user.click(within(dialog).getByRole('button', { name: /delete account/i }));

    await waitFor(() => expect(removeUser).toHaveBeenCalledTimes(1));
    expect(globalThis.location.href).toBe('/');
  });

  it('shows a destructive toast and keeps the dialog open on failure', async () => {
    setup({ deleteMutate: settledMutate('error') });
    const { user, dialog } = await openDialog(/delete account/i);

    await user.click(within(dialog).getByRole('button', { name: /delete account/i }));

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(signoutRedirect).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
