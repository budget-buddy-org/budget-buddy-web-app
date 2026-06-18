import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

const clear = vi.fn();

vi.mock('react-oidc-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({ clear })),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      signoutRedirect: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('renders the primary navigation and the sign-out action', () => {
    render(<Sidebar />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('clears cached queries before redirecting on sign out', () => {
    const signoutRedirect = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      signoutRedirect,
    } as unknown as ReturnType<typeof useAuth>);

    render(<Sidebar />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(clear).toHaveBeenCalledTimes(1);
    expect(signoutRedirect).toHaveBeenCalledTimes(1);
  });
});
