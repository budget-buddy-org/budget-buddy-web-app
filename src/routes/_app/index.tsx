import { createFileRoute } from '@tanstack/react-router';
import { categoriesQueryOptions } from '@/hooks/useCategories';
import { monthlySummaryQueryOptions } from '@/hooks/useMonthlySummary';
import { localeCurrency, toLocalYearMonth } from '@/lib/formatters';
import { parseYearMonth } from '@/lib/period';
import { queryClient } from '@/lib/query-client';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export interface DashboardSearch {
  period?: string;
}

export const Route = createFileRoute('/_app/')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    period:
      typeof search.period === 'string' && parseYearMonth(search.period) != null
        ? search.period
        : undefined,
  }),
  loaderDeps: ({ search }) => ({ period: search.period }),
  loader: ({ deps }) => {
    const month = deps.period ?? toLocalYearMonth(new Date());
    const currency = useUserPreferencesStore.getState().currency ?? localeCurrency();

    return Promise.all([
      queryClient.ensureQueryData(monthlySummaryQueryOptions(month, currency)),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
});
