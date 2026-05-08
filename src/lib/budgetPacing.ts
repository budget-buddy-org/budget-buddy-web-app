export function isCurrentMonth(year: number, month: number, ref: Date = new Date()): boolean {
  return year === ref.getFullYear() && month === ref.getMonth();
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function monthProgress(date: Date = new Date()): number {
  const total = daysInMonth(date.getFullYear(), date.getMonth());
  const elapsed = date.getDate() - 1 + (date.getHours() * 3600 + date.getMinutes() * 60) / 86400;
  return Math.min(1, Math.max(0, (elapsed + 1) / total));
}

export type PacingStatus = 'noBudget' | 'under' | 'onTrack' | 'over';

export function pacingStatus({
  spent,
  budget,
  progress,
}: {
  spent: number;
  budget: number | null;
  progress: number;
}): PacingStatus {
  if (budget == null || budget <= 0) return 'noBudget';
  if (spent > budget) return 'over';
  const expectedSpent = budget * progress;
  // Tolerance: ±10% of expected pace.
  const tolerance = expectedSpent * 0.1;
  if (spent < expectedSpent - tolerance) return 'under';
  return 'onTrack';
}
