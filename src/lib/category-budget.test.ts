import { describe, expect, it } from 'vitest';
import { inputToMinorUnits, minorUnitsToInput } from './category-budget';

describe('minorUnitsToInput', () => {
  it('formats minor units as decimal string with two fraction digits', () => {
    expect(minorUnitsToInput(1299)).toBe('12.99');
    expect(minorUnitsToInput(0)).toBe('0.00');
    expect(minorUnitsToInput(100)).toBe('1.00');
  });

  it('returns empty string for null or undefined', () => {
    expect(minorUnitsToInput(null)).toBe('');
    expect(minorUnitsToInput(undefined)).toBe('');
  });
});

describe('inputToMinorUnits', () => {
  it('converts decimal input to minor units', () => {
    expect(inputToMinorUnits('12.99')).toBe(1299);
    expect(inputToMinorUnits('1')).toBe(100);
    expect(inputToMinorUnits('0.05')).toBe(5);
  });

  it('trims whitespace before parsing', () => {
    expect(inputToMinorUnits('  12.50  ')).toBe(1250);
  });

  it('returns null for empty or whitespace-only input', () => {
    expect(inputToMinorUnits('')).toBe(null);
    expect(inputToMinorUnits('   ')).toBe(null);
  });

  it('returns null for non-numeric input', () => {
    expect(inputToMinorUnits('abc')).toBe(null);
    expect(inputToMinorUnits('1.2.3')).toBe(null);
  });

  it('returns null for negative numbers (budgets cannot be negative)', () => {
    expect(inputToMinorUnits('-1')).toBe(null);
    expect(inputToMinorUnits('-0.01')).toBe(null);
  });

  it('round-trips minorUnitsToInput ↔ inputToMinorUnits', () => {
    expect(inputToMinorUnits(minorUnitsToInput(1299))).toBe(1299);
    expect(inputToMinorUnits(minorUnitsToInput(0))).toBe(0);
  });
});
