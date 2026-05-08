const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Parse a YYYY-MM string into { year, month } (month is 0-indexed). Returns null if malformed. */
export function parseYearMonth(value: string | undefined | null): {
  year: number;
  month: number;
} | null {
  if (typeof value !== 'string') return null;
  const match = YEAR_MONTH_PATTERN.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) - 1 };
}
