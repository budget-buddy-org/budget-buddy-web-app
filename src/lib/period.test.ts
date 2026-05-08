import { describe, expect, it } from 'vitest';
import { parseYearMonth } from './period';

describe('parseYearMonth', () => {
  it('parses a valid YYYY-MM string into 0-indexed month', () => {
    expect(parseYearMonth('2026-01')).toEqual({ year: 2026, month: 0 });
    expect(parseYearMonth('2026-12')).toEqual({ year: 2026, month: 11 });
    expect(parseYearMonth('1999-07')).toEqual({ year: 1999, month: 6 });
  });

  it('returns null for malformed input', () => {
    expect(parseYearMonth('2026-13')).toBeNull();
    expect(parseYearMonth('2026-00')).toBeNull();
    expect(parseYearMonth('2026-1')).toBeNull();
    expect(parseYearMonth('26-01')).toBeNull();
    expect(parseYearMonth('2026/01')).toBeNull();
    expect(parseYearMonth('not-a-date')).toBeNull();
    expect(parseYearMonth('')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseYearMonth(undefined)).toBeNull();
    expect(parseYearMonth(null)).toBeNull();
  });
});
