import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '@/components/auth/LoginPage';

const mockSigninRedirect = vi.fn();

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    signinRedirect: mockSigninRedirect,
  }),
}));

// Stub shadcn/ui primitives used in the login form
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    React.createElement('button', { onClick, type: 'button' }, children),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sign-in button', () => {
    render(React.createElement(LoginPage));
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with zitadel/i })).toBeInTheDocument();
  });

  it('calls signinRedirect when the button is clicked', async () => {
    render(React.createElement(LoginPage));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /sign in with zitadel/i }));

    expect(mockSigninRedirect).toHaveBeenCalled();
  });
});
