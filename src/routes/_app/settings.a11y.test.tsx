import 'vitest-axe/extend-expect';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { render } from '@/test/utils';

vi.mock('react-oidc-context', () => ({
  useAuth: () => ({
    user: {
      profile: {
        name: 'Test User',
        email: 'test@example.com',
        preferred_username: 'testuser',
      },
    },
    signoutRedirect: vi.fn(),
  }),
}));

vi.mock('@/hooks/useInstallPrompt', () => ({
  useInstallPrompt: () => ({ canInstall: false, promptInstall: vi.fn() }),
}));

vi.mock('@/lib/config', () => ({
  getConfig: () => ({
    VITE_API_URL: '',
    VITE_OIDC_AUTHORITY: '',
    VITE_OIDC_CLIENT_ID: '',
    VITE_OIDC_USER_MANAGEMENT_URL: 'https://example.com/profile',
  }),
}));

describe('Settings route a11y', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
