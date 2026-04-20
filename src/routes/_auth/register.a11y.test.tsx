import { render } from '@testing-library/react';
import 'vitest-axe/extend-expect';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { RegisterPage } from '@/components/auth/RegisterPage';

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({ signinRedirect: vi.fn() }),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('RegisterPage a11y', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<RegisterPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
