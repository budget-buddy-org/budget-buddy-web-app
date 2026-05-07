import { getCategoriesSummary } from '@budget-buddy-org/budget-buddy-contracts';
import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { localeCurrency, toLocalYearMonth } from '@/lib/formatters';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export interface CategoriesSummaryFilters {
  month?: string;
  currency?: string;
}

export const CATEGORIES_SUMMARY_KEYS = {
  all: ['categories-summary'] as const,
  summary: (month: string, currency: string) => ['categories-summary', month, currency] as const,
};

export const categoriesSummaryQueryOptions = (month: string, currency: string) =>
  queryOptions({
    queryKey: CATEGORIES_SUMMARY_KEYS.summary(month, currency),
    queryFn: async () => {
      const { data, error } = await getCategoriesSummary({
        query: { month, currency },
      });
      if (error) throw error;
      return data;
    },
    placeholderData: keepPreviousData,
  });

export function useCategoriesSummary(filters: CategoriesSummaryFilters = {}) {
  const preferredCurrency = useUserPreferencesStore((s) => s.currency);
  const month = filters.month ?? toLocalYearMonth(new Date());
  const currency = filters.currency ?? preferredCurrency ?? localeCurrency();
  return useQuery(categoriesSummaryQueryOptions(month, currency));
}
