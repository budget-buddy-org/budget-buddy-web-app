import 'vitest-axe/extend-expect';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render } from '@/test/utils';
import { ApiUnavailableBanner } from './ApiUnavailableBanner';

// Force the banner to be visible so axe can inspect it
vi.mock('@/hooks/useApiHealth', () => ({ useApiHealth: () => false }));
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => true }));

describe('ApiUnavailableBanner a11y', () => {
  it('has no accessibility violations when visible', async () => {
    const { container } = render(<ApiUnavailableBanner />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
