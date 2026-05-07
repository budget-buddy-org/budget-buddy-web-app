import type { MonthlySummary } from '@budget-buddy-org/budget-buddy-contracts';
import { useQueries } from '@tanstack/react-query';
import { localeCurrency, toLocalYearMonth } from '@/lib/formatters';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';
import { monthlySummaryQueryOptions } from './useMonthlySummary';

export interface MonthlySummariesRangeFilters {
  monthsBack: number;
  endYear: number;
  endMonth: number;
  currency?: string;
}

/**
 * Fan out N parallel monthly-summary queries and return the results in
 * chronological order (oldest first). Reuses the same query keys as
 * `useMonthlySummary`, so the cache is shared across the dashboard.
 */
export function useMonthlySummariesRange({
  monthsBack,
  endYear,
  endMonth,
  currency,
}: MonthlySummariesRangeFilters) {
  const preferredCurrency = useUserPreferencesStore((s) => s.currency);
  const resolvedCurrency = currency ?? preferredCurrency ?? localeCurrency();

  const months = Array.from({ length: monthsBack }, (_, i) => {
    const offset = monthsBack - 1 - i;
    return toLocalYearMonth(new Date(endYear, endMonth - offset, 1));
  });

  const results = useQueries({
    queries: months.map((month) => monthlySummaryQueryOptions(month, resolvedCurrency)),
  });

  return {
    data: results.map((r) => r.data) as (MonthlySummary | undefined)[],
    isLoading: results.some((r) => r.isLoading),
    isFetching: results.some((r) => r.isFetching),
  };
}
