import { getTransactionsSummary } from '@budget-buddy-org/budget-buddy-contracts';
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { localeCurrency, toLocalYearMonth } from '@/lib/formatters';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export interface MonthlySummaryFilters {
  month?: string;
  currency?: string;
}

const KEYS = {
  all: ['transactions-summary'] as const,
  summary: (month: string, currency: string) => ['transactions-summary', month, currency] as const,
};

export const monthlySummaryQueryOptions = (month: string, currency: string) =>
  queryOptions({
    queryKey: KEYS.summary(month, currency),
    queryFn: async () => {
      const { data, error } = await getTransactionsSummary({
        query: { month, currency },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: keepPreviousData,
  });

export function useMonthlySummary(filters: MonthlySummaryFilters = {}) {
  const preferredCurrency = useUserPreferencesStore((s) => s.currency);
  const month = filters.month ?? toLocalYearMonth(new Date());
  const currency = filters.currency ?? preferredCurrency ?? localeCurrency();
  return useQuery(monthlySummaryQueryOptions(month, currency));
}
