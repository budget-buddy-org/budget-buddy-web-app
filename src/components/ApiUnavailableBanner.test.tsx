import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as useApiHealthModule from '@/hooks/useApiHealth';
import * as useOnlineStatusModule from '@/hooks/useOnlineStatus';
import { ApiUnavailableBanner } from './ApiUnavailableBanner';

vi.mock('@/hooks/useApiHealth');
vi.mock('@/hooks/useOnlineStatus');

function setup(isOnline: boolean, isApiHealthy: boolean) {
  vi.mocked(useOnlineStatusModule.useOnlineStatus).mockReturnValue(isOnline);
  vi.mocked(useApiHealthModule.useApiHealth).mockReturnValue(isApiHealthy);
}

describe('ApiUnavailableBanner', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── Visibility truth table ───────────────────────────────────────────────

  describe('visibility', () => {
    it.each([
      {
        label: 'online + API healthy',
        isOnline: true,
        isApiHealthy: true,
        visible: false,
      },
      {
        label: 'offline + API healthy — OfflineBanner handles it',
        isOnline: false,
        isApiHealthy: true,
        visible: false,
      },
      {
        label: 'offline + API unhealthy — offline takes precedence, avoid stacking banners',
        isOnline: false,
        isApiHealthy: false,
        visible: false,
      },
      {
        label: 'online + API unhealthy — the only case where this banner should appear',
        isOnline: true,
        isApiHealthy: false,
        visible: true,
      },
    ])('is hidden when $label', ({ isOnline, isApiHealthy, visible }) => {
      setup(isOnline, isApiHealthy);
      render(<ApiUnavailableBanner />);
      const banner = screen.queryByRole('status');
      if (visible) {
        expect(banner).toBeInTheDocument();
      } else {
        expect(banner).not.toBeInTheDocument();
      }
    });
  });

  // ─── Content when visible ─────────────────────────────────────────────────

  describe('when visible (browser online, API unhealthy)', () => {
    beforeEach(() => setup(true, false));

    it('renders the user-facing message', () => {
      render(<ApiUnavailableBanner />);
      expect(screen.getByText(/API unavailable\. Data may be stale\./i)).toBeInTheDocument();
    });

    it('has role="status"', () => {
      render(<ApiUnavailableBanner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('uses aria-live="polite" — less urgent than OfflineBanner which uses assertive', () => {
      render(<ApiUnavailableBanner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('hides the decorative icon from screen readers', () => {
      render(<ApiUnavailableBanner />);
      // The SVG icon is presentational — aria-hidden prevents double-announcement
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
