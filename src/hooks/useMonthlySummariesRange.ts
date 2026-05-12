import type { MonthlySummary } from '@budget-buddy-org/budget-buddy-contracts';
import { getTransactionsSummaryTrend } from '@budget-buddy-org/budget-buddy-contracts';
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { localeCurrency, toLocalYearMonth } from '@/lib/formatters';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export interface MonthlySummariesRangeFilters {
  monthsBack: number;
  endYear: number;
  endMonth: number;
  currency?: string;
}

export const MONTHLY_TREND_KEYS = {
  trend: (from: string, to: string, currency: string) =>
    ['transactions-summary', 'trend', from, to, currency] as const,
};

export const trendQueryOptions = (from: string, to: string, currency: string) =>
  queryOptions({
    queryKey: MONTHLY_TREND_KEYS.trend(from, to, currency),
    queryFn: async () => {
      const { data, error } = await getTransactionsSummaryTrend({
        query: { from, to, currency },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: keepPreviousData,
  });

/**
 * Fetch a contiguous range of monthly summaries (oldest first) ending at
 * (`endYear`, `endMonth`). Issued as a single request via the trend endpoint.
 */
export function useMonthlySummariesRange({
  monthsBack,
  endYear,
  endMonth,
  currency,
}: MonthlySummariesRangeFilters) {
  const preferredCurrency = useUserPreferencesStore((s) => s.currency);
  const resolvedCurrency = currency ?? preferredCurrency ?? localeCurrency();

  const from = toLocalYearMonth(new Date(endYear, endMonth - (monthsBack - 1), 1));
  const to = toLocalYearMonth(new Date(endYear, endMonth, 1));

  const result = useQuery(trendQueryOptions(from, to, resolvedCurrency));

  return {
    data: (result.data ?? []) as (MonthlySummary | undefined)[],
    isLoading: result.isLoading,
    isFetching: result.isFetching,
  };
}
