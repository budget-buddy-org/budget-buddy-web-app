import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

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
    render(<Header />);
    expect(screen.getByText(/Budget Buddy/)).toBeInTheDocument();
    expect(screen.getByText(/v1.0.0/)).toBeInTheDocument();
  });

  it('shows active state for settings icon when isActive is true', () => {
    mockIsActive = true;
    render(<Header />);

    // The settings button should have text-primary class when active
    const settingsButton = screen.getByLabelText('Settings');
    expect(settingsButton).toHaveClass('text-primary');
    expect(settingsButton).toHaveClass('bg-primary/10');
    mockIsActive = false; // Reset
  });
});
