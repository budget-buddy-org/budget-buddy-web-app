import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as onlineStatusHook from '@/hooks/useOnlineStatus';
import { useApiHealth } from './useApiHealth';

const API_URL = 'http://localhost:8080';
const HEALTH_URL = `${API_URL}/actuator/health`;

vi.mock('@/lib/config', () => ({
  getConfig: () => ({ VITE_API_URL: API_URL }),
}));

vi.mock('@/hooks/useOnlineStatus');

function makeWrapper(): { wrapper: React.FC<{ children: React.ReactNode }>; qc: QueryClient } {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

describe('useApiHealth', () => {
  const mockFetch = vi.fn();
  const setOnlineSpy = vi.spyOn(onlineManager, 'setOnline');

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    vi.mocked(onlineStatusHook.useOnlineStatus).mockReturnValue(true);
    // Reset onlineManager to a clean state before each test
    onlineManager.setOnline(true);
    setOnlineSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Always restore so a failing test doesn't poison the onlineManager for others
    onlineManager.setOnline(true);
  });

  // ─── Return value ─────────────────────────────────────────────────────────

  describe('return value', () => {
    it('is optimistically true before the first fetch resolves', () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useApiHealth(), { wrapper });
      expect(result.current).toBe(true);
    });

    it('is true when the API responds with ok: true', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(result.current).toBe(true));
    });

    it('is false when the API responds with a non-ok status (e.g. 503)', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(result.current).toBe(false));
    });

    it('stays true when fetch throws — network errors are treated as transient', async () => {
      // A TypeError("Failed to fetch") means the server is unreachable.
      // We don't flip to false on a single network error to avoid false positives
      // from packet loss. The banner requires an explicit HTTP error response.
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
      const { wrapper } = makeWrapper();
      const { result } = renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      expect(result.current).toBe(true);
    });
  });

  // ─── Fetch behavior ───────────────────────────────────────────────────────

  describe('fetch behavior', () => {
    it('polls the correct health endpoint with cache: no-store', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const { wrapper } = makeWrapper();
      renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      expect(mockFetch).toHaveBeenCalledWith(
        HEALTH_URL,
        expect.objectContaining({ cache: 'no-store' }),
      );
    });

    it('does not fetch when the browser is offline', async () => {
      vi.mocked(onlineStatusHook.useOnlineStatus).mockReturnValue(false);
      mockFetch.mockResolvedValue({ ok: true });
      const { wrapper } = makeWrapper();
      renderHook(() => useApiHealth(), { wrapper });
      // Flush microtasks — fetch must never be called
      await new Promise((r) => setTimeout(r, 50));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('resumes fetching when the browser comes back online', async () => {
      const mockUseOnlineStatus = vi.mocked(onlineStatusHook.useOnlineStatus);
      mockUseOnlineStatus.mockReturnValue(false); // start offline
      mockFetch.mockResolvedValue({ ok: true });
      const { wrapper } = makeWrapper();
      const { rerender } = renderHook(() => useApiHealth(), { wrapper });
      await new Promise((r) => setTimeout(r, 50));
      expect(mockFetch).not.toHaveBeenCalled();

      // Simulate going online — rerender so the hook picks up the new enabled:true state
      mockUseOnlineStatus.mockReturnValue(true);
      rerender();
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    });

    it('refetches when the query is invalidated', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const { wrapper, qc } = makeWrapper();
      renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      await qc.invalidateQueries({ queryKey: ['api-health'] });
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    });

    it('keeps fetching after API goes down — networkMode:always prevents deadlock', async () => {
      // Critical: if the health query were paused by its own onlineManager.setOnline(false)
      // side-effect, it could never detect recovery. networkMode:'always' prevents this.
      mockFetch
        .mockResolvedValueOnce({ ok: false }) // 1st poll: API down
        .mockResolvedValue({ ok: true }); // 2nd poll: API recovered
      const { wrapper, qc } = makeWrapper();
      const { result } = renderHook(() => useApiHealth(), { wrapper });

      await waitFor(() => expect(result.current).toBe(false));
      // onlineManager is now false. Invalidate to simulate the next poll interval.
      await qc.invalidateQueries({ queryKey: ['api-health'] });
      // If networkMode were 'online', this second fetch would never fire.
      await waitFor(() => expect(result.current).toBe(true));
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ─── onlineManager synchronization ───────────────────────────────────────

  describe('onlineManager synchronization', () => {
    it('calls setOnline(true) when browser is online and API is healthy', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const { wrapper } = makeWrapper();
      renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(setOnlineSpy).toHaveBeenCalledWith(true));
    });

    it('calls setOnline(false) when API returns a non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const { wrapper } = makeWrapper();
      renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(setOnlineSpy).toHaveBeenCalledWith(false));
    });

    it('calls setOnline(false) when browser is offline, regardless of API state', async () => {
      vi.mocked(onlineStatusHook.useOnlineStatus).mockReturnValue(false);
      // fetch is disabled when offline, but the effect still fires with isOnline=false
      mockFetch.mockResolvedValue({ ok: true });
      const { wrapper } = makeWrapper();
      renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(setOnlineSpy).toHaveBeenCalledWith(false));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('restores setOnline(true) when the API recovers', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true });
      const { wrapper, qc } = makeWrapper();
      const { result } = renderHook(() => useApiHealth(), { wrapper });

      await waitFor(() => expect(result.current).toBe(false));
      expect(setOnlineSpy).toHaveBeenCalledWith(false);

      await qc.invalidateQueries({ queryKey: ['api-health'] });

      await waitFor(() => expect(result.current).toBe(true));
      expect(setOnlineSpy).toHaveBeenCalledWith(true);
    });

    it('pauses all other TanStack Query queries when API is down', async () => {
      // Verify onlineManager is actually set to false — other queries (useTransactions
      // etc.) use the default networkMode:'online' and will pause when this is false.
      mockFetch.mockResolvedValue({ ok: false });
      const { wrapper } = makeWrapper();
      renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(onlineManager.isOnline()).toBe(false));
    });

    it('unpauses all other queries when API recovers', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true });
      const { wrapper, qc } = makeWrapper();
      renderHook(() => useApiHealth(), { wrapper });
      await waitFor(() => expect(onlineManager.isOnline()).toBe(false));
      await qc.invalidateQueries({ queryKey: ['api-health'] });
      await waitFor(() => expect(onlineManager.isOnline()).toBe(true));
    });
  });
});
