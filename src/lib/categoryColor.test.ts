import { describe, expect, it } from 'vitest';
import { getCategoryColor } from './categoryColor';

describe('getCategoryColor', () => {
  it('returns a light-dark() string with two HSL values', () => {
    const color = getCategoryColor('Groceries');
    expect(color).toMatch(/^light-dark\(hsl\(\d+ 65% 45%\), hsl\(\d+ 60% 65%\)\)$/);
  });

  it('is deterministic — same name yields the same color', () => {
    expect(getCategoryColor('Rent')).toBe(getCategoryColor('Rent'));
    expect(getCategoryColor('Coffee')).toBe(getCategoryColor('Coffee'));
  });

  it('produces different hues for visibly different category names', () => {
    // Not a strict pigeonhole — but two unrelated names should rarely collide
    // across the 10 curated hues. If this fails, double-check the HUES table.
    expect(getCategoryColor('Groceries')).not.toBe(getCategoryColor('Entertainment'));
  });

  it('handles the empty string without throwing', () => {
    expect(() => getCategoryColor('')).not.toThrow();
    expect(getCategoryColor('')).toMatch(/^light-dark\(/);
  });
});
