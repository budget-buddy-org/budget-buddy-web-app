import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from 'react-oidc-context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedAppLayout } from './ProtectedAppLayout';

vi.mock('react-oidc-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: () => <div data-testid="app-layout">app</div>,
}));

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  const auth = {
    isLoading: false,
    isAuthenticated: false,
    activeNavigator: undefined,
    user: undefined,
    signinSilent: vi.fn().mockResolvedValue({}),
    signinRedirect: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>;
  vi.mocked(useAuth).mockReturnValue(auth);
  return auth;
}

describe('ProtectedAppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app when authenticated', () => {
    mockAuth({ isAuthenticated: true });
    render(<ProtectedAppLayout />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('does nothing while auth is still loading', () => {
    const auth = mockAuth({ isLoading: true });
    render(<ProtectedAppLayout />);
    expect(auth.signinSilent).not.toHaveBeenCalled();
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('shows a session-restoring message during a silent renew', () => {
    mockAuth({ activeNavigator: 'signinSilent' });
    render(<ProtectedAppLayout />);
    expect(screen.getByText('Restoring your session…')).toBeInTheDocument();
  });

  it('shows a redirecting message during an interactive sign-in', () => {
    mockAuth({ activeNavigator: 'signinRedirect' });
    render(<ProtectedAppLayout />);
    expect(screen.getByText('Redirecting to sign-in…')).toBeInTheDocument();
  });

  it('tries a silent refresh-token renewal before redirecting on cold start', async () => {
    const auth = mockAuth({ user: { refresh_token: 'rt' } as never });
    render(<ProtectedAppLayout />);

    await waitFor(() => expect(auth.signinSilent).toHaveBeenCalledTimes(1));
    expect(auth.signinRedirect).not.toHaveBeenCalled();
  });

  it('falls back to an interactive redirect when the refresh token is rejected', async () => {
    const auth = mockAuth({ user: { refresh_token: 'rt' } as never });
    vi.mocked(auth.signinSilent).mockRejectedValueOnce(new Error('expired'));

    render(<ProtectedAppLayout />);

    await waitFor(() => expect(auth.signinRedirect).toHaveBeenCalledTimes(1));
    expect(auth.signinSilent).toHaveBeenCalledTimes(1);
    expect(auth.signinRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ url_state: expect.any(String) }),
    );
  });

  it('redirects immediately when there is no refresh token to redeem', async () => {
    const auth = mockAuth({ user: undefined });
    render(<ProtectedAppLayout />);

    await waitFor(() => expect(auth.signinRedirect).toHaveBeenCalledTimes(1));
    expect(auth.signinSilent).not.toHaveBeenCalled();
  });
});
