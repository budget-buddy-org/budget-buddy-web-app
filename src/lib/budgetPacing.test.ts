import { describe, expect, it } from 'vitest';
import { isCurrentMonth, monthProgress, pacingStatus } from './budgetPacing';

describe('isCurrentMonth', () => {
  it('matches the reference date year and month', () => {
    const ref = new Date(2026, 4, 15);
    expect(isCurrentMonth(2026, 4, ref)).toBe(true);
    expect(isCurrentMonth(2026, 3, ref)).toBe(false);
    expect(isCurrentMonth(2025, 4, ref)).toBe(false);
  });
});

describe('monthProgress', () => {
  it('is near 0 at the start of the month', () => {
    const start = new Date(2026, 4, 1, 0, 0);
    expect(monthProgress(start)).toBeLessThan(0.05);
  });

  it('is 1 on the last day of the month', () => {
    const end = new Date(2026, 4, 31, 23, 59);
    expect(monthProgress(end)).toBeCloseTo(1, 2);
  });
});

describe('pacingStatus', () => {
  it('returns noBudget when budget is null or zero', () => {
    expect(pacingStatus({ spent: 100, budget: null, progress: 0.5 })).toBe('noBudget');
    expect(pacingStatus({ spent: 100, budget: 0, progress: 0.5 })).toBe('noBudget');
  });

  it('returns over when spent exceeds budget', () => {
    expect(pacingStatus({ spent: 1100, budget: 1000, progress: 0.5 })).toBe('over');
  });

  it('returns under when spending is meaningfully below pace', () => {
    // 30% through month, spent 10% of budget → well under pace
    expect(pacingStatus({ spent: 100, budget: 1000, progress: 0.3 })).toBe('under');
  });

  it('returns onTrack within ±10% of expected pace', () => {
    // 50% through month, spent ~50% of budget
    expect(pacingStatus({ spent: 500, budget: 1000, progress: 0.5 })).toBe('onTrack');
    expect(pacingStatus({ spent: 480, budget: 1000, progress: 0.5 })).toBe('onTrack');
    expect(pacingStatus({ spent: 540, budget: 1000, progress: 0.5 })).toBe('onTrack');
  });

  it('does not flip to over when a lump-sum lands early in the month', () => {
    // Day 2 of a 30-day month, rent of 800 against a 1000 budget.
    // Old algorithm projected 800 / 0.05 ≈ 16000 → "over". New algorithm
    // never extrapolates: while spent ≤ budget, status is at worst onTrack.
    const status = pacingStatus({ spent: 800, budget: 1000, progress: 0.05 });
    expect(status).not.toBe('over');
    expect(['onTrack', 'under']).toContain(status);
  });
});
