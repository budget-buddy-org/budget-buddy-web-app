import { createFileRoute } from '@tanstack/react-router';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { categoriesQueryOptions } from '@/hooks/useCategories';
import { categoriesSummaryQueryOptions } from '@/hooks/useCategoriesSummary';
import { trendQueryOptions } from '@/hooks/useMonthlySummariesRange';
import { monthlySummaryQueryOptions } from '@/hooks/useMonthlySummary';
import { transactionsQueryOptions } from '@/hooks/useTransactions';
import { localeCurrency, todayIso, toLocalIsoDate, toLocalYearMonth } from '@/lib/formatters';
import { parseYearMonth } from '@/lib/period';
import { queryClient } from '@/lib/query-client';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export interface DashboardSearch {
  period?: string;
}

export const Route = createFileRoute('/_app/')({
  pendingComponent: DashboardSkeleton,
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    period:
      typeof search.period === 'string' && parseYearMonth(search.period) != null
        ? search.period
        : undefined,
  }),
  loaderDeps: ({ search }) => ({ period: search.period }),
  loader: ({ deps }) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const parsed = parseYearMonth(deps.period);
    const year = parsed?.year ?? currentYear;
    const month = parsed?.month ?? currentMonth;
    const isCurrent = year === currentYear && month === currentMonth;

    const firstOfPeriod = new Date(year, month, 1);
    const firstDayOfPeriod = toLocalIsoDate(firstOfPeriod);
    const lastDayOfPeriod = isCurrent ? todayIso() : toLocalIsoDate(new Date(year, month + 1, 0));
    const periodMonth = toLocalYearMonth(firstOfPeriod);

    const currency = useUserPreferencesStore.getState().currency ?? localeCurrency();

    // Trend dates: 6 months back
    const trendFrom = toLocalYearMonth(new Date(year, month - 5, 1));
    const trendTo = toLocalYearMonth(new Date(year, month, 1));

    return Promise.all([
      queryClient.ensureQueryData(monthlySummaryQueryOptions(periodMonth, currency)),
      queryClient.ensureQueryData(categoriesSummaryQueryOptions(periodMonth, currency)),
      queryClient.ensureQueryData(
        transactionsQueryOptions({
          start: firstDayOfPeriod,
          end: lastDayOfPeriod,
          sort: 'desc',
          size: 5,
        }),
      ),
      queryClient.ensureQueryData(trendQueryOptions(trendFrom, trendTo, currency)),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
});
