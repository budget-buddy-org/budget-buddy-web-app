import { toMinorUnits } from '@/lib/formatters';

export function minorUnitsToInput(value: number | null | undefined): string {
  if (value == null) return '';
  return (value / 100).toFixed(2);
}

export function inputToMinorUnits(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return toMinorUnits(parsed);
}
