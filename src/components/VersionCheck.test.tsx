import { QueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as toastHook from '@/hooks/use-toast';
import { render } from '@/test/utils';
import { VersionCheck } from './VersionCheck';

// Mock __APP_VERSION__
const APP_VERSION = '2.8.0';
vi.stubGlobal('__APP_VERSION__', APP_VERSION);

describe('VersionCheck', () => {
  const mockToast = vi.fn();
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.spyOn(toastHook, 'useToast').mockReturnValue({
      toast: mockToast,
      toasts: [],
      dismiss: vi.fn(),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should not show toast if version is the same', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ version: APP_VERSION }),
    });

    render(<VersionCheck />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('should show toast if version is different', async () => {
    const newVersion = '2.9.0';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ version: newVersion }),
    });

    render(<VersionCheck />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Update Available',
          description: expect.stringContaining(newVersion),
        }),
      );
    });
  });

  it('should periodically check for updates', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ version: APP_VERSION }),
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<VersionCheck />, { queryClient: qc });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

    // Invalidate the version query to force a refetch
    await qc.invalidateQueries({ queryKey: ['app-version'] });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
