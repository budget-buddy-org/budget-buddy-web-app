import { act, renderHook } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReactiveSearchMock } from '@/test/reactive-search';
import { useDashboardPeriod } from './useDashboardPeriod';

const mockSearch = createReactiveSearchMock<{ period?: string }>();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockSearch.navigate,
  useSearch: () => mockSearch.useSearch(),
}));

// Pin "now" so test expectations don't drift with the clock.
const FROZEN_NOW = new Date(2026, 4, 19); // 2026-05-19, month 4 (May, 0-indexed)

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  mockSearch.reset();
});

afterEach(() => {
  mockSearch.reset();
});

describe('useDashboardPeriod', () => {
  it('defaults to the current month when no period param is set', () => {
    const { result } = renderHook(() => useDashboardPeriod());

    expect(result.current.year).toBe(2026);
    expect(result.current.month).toBe(4);
    expect(result.current.currentYear).toBe(2026);
    expect(result.current.currentMonth).toBe(4);
    expect(result.current.isCurrent).toBe(true);
  });

  it('parses a YYYY-MM period param', () => {
    mockSearch.setSearch({ period: '2025-11' });

    const { result } = renderHook(() => useDashboardPeriod());

    expect(result.current.year).toBe(2025);
    expect(result.current.month).toBe(10); // 0-indexed
    expect(result.current.isCurrent).toBe(false);
  });

  it('falls back to the current month when the param is malformed', () => {
    mockSearch.setSearch({ period: 'not-a-month' });

    const { result } = renderHook(() => useDashboardPeriod());

    expect(result.current.year).toBe(2026);
    expect(result.current.month).toBe(4);
    expect(result.current.isCurrent).toBe(true);
  });

  it('setPeriod omits `period` when selecting the current month', () => {
    mockSearch.setSearch({ period: '2025-11' });
    const { result } = renderHook(() => useDashboardPeriod());

    act(() => result.current.setPeriod(2026, 4));

    expect(mockSearch.navigate).toHaveBeenCalled();
    expect(mockSearch.getSearch().period).toBeUndefined();
  });

  it('setPeriod writes the YYYY-MM string when selecting a non-current month', () => {
    const { result } = renderHook(() => useDashboardPeriod());

    act(() => result.current.setPeriod(2025, 0)); // Jan 2025

    expect(mockSearch.getSearch().period).toBe('2025-01');
  });
});
