import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';
import { useFormatters } from './useFormatters';

const DEFAULTS = { currency: null, dateFormat: 'medium' as const, numberLocale: null };

describe('useFormatters', () => {
  beforeEach(() => {
    useUserPreferencesStore.setState(DEFAULTS);
  });

  describe('fmtCurrency', () => {
    it('formats with browser locale when numberLocale is null', () => {
      // Drive the locale explicitly to get a deterministic result
      useUserPreferencesStore.setState({ numberLocale: 'en-US' });
      const { result } = renderHook(() => useFormatters());
      expect(result.current.fmtCurrency(1299, 'EUR')).toBe('€12.99');
    });

    it('uses the stored numberLocale for separators', () => {
      useUserPreferencesStore.setState({ numberLocale: 'de-DE' });
      const { result } = renderHook(() => useFormatters());
      // German: comma decimal, dot thousands, symbol after amount
      expect(result.current.fmtCurrency(1299, 'EUR')).toBe('12,99 €');
    });

    it('large amounts respect thousands separator for the locale', () => {
      useUserPreferencesStore.setState({ numberLocale: 'en-US' });
      const { result } = renderHook(() => useFormatters());
      expect(result.current.fmtCurrency(100000, 'USD')).toBe('$1,000.00');
    });
  });

  describe('fmtDate', () => {
    it('uses medium style by default', () => {
      useUserPreferencesStore.setState({ numberLocale: 'en-US' });
      const { result } = renderHook(() => useFormatters());
      expect(result.current.fmtDate('2024-01-15')).toBe('Jan 15, 2024');
    });

    it('uses short style when dateFormat is short', () => {
      useUserPreferencesStore.setState({ dateFormat: 'short', numberLocale: 'en-US' });
      const { result } = renderHook(() => useFormatters());
      expect(result.current.fmtDate('2024-01-15')).toBe('1/15/24');
    });

    it('uses long style when dateFormat is long', () => {
      useUserPreferencesStore.setState({ dateFormat: 'long', numberLocale: 'en-US' });
      const { result } = renderHook(() => useFormatters());
      expect(result.current.fmtDate('2024-01-15')).toBe('January 15, 2024');
    });

    it('applies numberLocale to date word order and month names', () => {
      useUserPreferencesStore.setState({ dateFormat: 'long', numberLocale: 'de-DE' });
      const { result } = renderHook(() => useFormatters());
      const formatted = result.current.fmtDate('2024-01-15');
      expect(formatted).toContain('Januar');
      expect(formatted).toContain('15');
    });
  });

  describe('referential stability', () => {
    it('returns the same function references across rerenders when preferences are unchanged', () => {
      useUserPreferencesStore.setState({ numberLocale: 'en-US' });
      const { result, rerender } = renderHook(() => useFormatters());
      const { fmtCurrency: c1, fmtDate: d1 } = result.current;

      rerender();

      expect(result.current.fmtCurrency).toBe(c1);
      expect(result.current.fmtDate).toBe(d1);
    });

    it('returns new function references when numberLocale changes', () => {
      useUserPreferencesStore.setState({ numberLocale: 'en-US' });
      const { result } = renderHook(() => useFormatters());
      const c1 = result.current.fmtCurrency;
      const d1 = result.current.fmtDate;

      act(() => {
        useUserPreferencesStore.setState({ numberLocale: 'de-DE' });
      });

      expect(result.current.fmtCurrency).not.toBe(c1);
      expect(result.current.fmtDate).not.toBe(d1);
    });

    it('returns new function references when dateFormat changes', () => {
      useUserPreferencesStore.setState({ numberLocale: 'en-US', dateFormat: 'medium' });
      const { result } = renderHook(() => useFormatters());
      const d1 = result.current.fmtDate;

      act(() => {
        useUserPreferencesStore.setState({ dateFormat: 'short' });
      });

      expect(result.current.fmtDate).not.toBe(d1);
      // fmtCurrency should NOT change — it doesn't depend on dateFormat
      expect(result.current.fmtCurrency).toBe(result.current.fmtCurrency);
    });
  });
});
