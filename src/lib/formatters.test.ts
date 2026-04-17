import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatCurrency,
  formatDate,
  todayIso,
  toLocalIsoDate,
  toLocalYearMonth,
  toMinorUnits,
} from './formatters';

describe('formatCurrency', () => {
  it('converts minor units to formatted EUR string', () => {
    expect(formatCurrency(1299, 'EUR', 'en-US')).toBe('€12.99');
    expect(formatCurrency(100, 'EUR', 'en-US')).toBe('€1.00');
    expect(formatCurrency(0, 'EUR', 'en-US')).toBe('€0.00');
  });

  it('supports different currencies', () => {
    expect(formatCurrency(1000, 'USD', 'en-US')).toBe('$10.00');
    expect(formatCurrency(500, 'GBP', 'en-US')).toBe('£5.00');
  });

  it('handles large amounts', () => {
    expect(formatCurrency(100000, 'EUR', 'en-US')).toBe('€1,000.00');
  });

  it('respects locale conventions', () => {
    // German locale: symbol after amount, comma as decimal separator
    expect(formatCurrency(1299, 'EUR', 'de-DE')).toBe('12,99\u00a0€');
    // Japanese yen: no decimal places (jsdom renders fullwidth ¥ U+FFE5)
    expect(formatCurrency(1299, 'JPY', 'ja-JP')).toMatch(/13/);
  });
});

describe('toMinorUnits', () => {
  it('converts decimal to minor units', () => {
    expect(toMinorUnits(12.99)).toBe(1299);
    expect(toMinorUnits(10)).toBe(1000);
    expect(toMinorUnits(0)).toBe(0);
    expect(toMinorUnits(0.01)).toBe(1);
  });

  it('rounds floating point correctly', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS — Math.round must handle this
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
  });
});

describe('formatDate', () => {
  it('formats ISO date string for display', () => {
    expect(formatDate('2024-01-15', 'en-US')).toBe('Jan 15, 2024');
    expect(formatDate('2023-12-01', 'en-US')).toBe('Dec 1, 2023');
  });
});

describe('local date helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats dates as local YYYY-MM-DD', () => {
    vi.setSystemTime(new Date(2026, 3, 15, 23, 45, 0));
    expect(toLocalIsoDate(new Date())).toBe('2026-04-15');
  });

  it('formats dates as local YYYY-MM', () => {
    vi.setSystemTime(new Date(2026, 0, 5, 9, 30, 0));
    expect(toLocalYearMonth(new Date())).toBe('2026-01');
  });
});

describe('todayIso', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a string in YYYY-MM-DD format', () => {
    const result = todayIso();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's date", () => {
    vi.setSystemTime(new Date(2026, 3, 15, 10, 0, 0));
    const result = todayIso();
    expect(result).toBe('2026-04-15');
  });
});
