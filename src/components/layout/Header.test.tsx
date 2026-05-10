import { render, screen } from '@testing-library/react';
import { useAuth } from 'react-oidc-context';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

vi.mock('react-oidc-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    clear: vi.fn(),
  })),
}));

let mockIsActive = false;

vi.mock('@tanstack/react-router', () => ({
  Link: vi.fn(({ children, to, ...props }) => {
    if (typeof children === 'function') {
      return children({ isActive: mockIsActive });
    }
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  }),
}));

// Mock version constant
vi.stubGlobal('__APP_VERSION__', '1.0.0');

describe('Header', () => {
  it('renders correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      signoutRedirect: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    render(<Header />);
    expect(screen.getByText(/Budget Buddy/)).toBeInTheDocument();
    expect(screen.getByText(/v1.0.0/)).toBeInTheDocument();
  });

  it('shows active state for settings icon when isActive is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      signoutRedirect: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    mockIsActive = true;
    render(<Header />);

    // The settings button should have text-primary class when active
    const settingsButton = screen.getByLabelText('Settings');
    expect(settingsButton).toHaveClass('text-primary');
    expect(settingsButton).toHaveClass('bg-primary/10');
    mockIsActive = false; // Reset
  });
});
