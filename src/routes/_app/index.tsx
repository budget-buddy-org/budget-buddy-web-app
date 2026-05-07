import { createFileRoute } from '@tanstack/react-router';
import { categoriesQueryOptions } from '@/hooks/useCategories';
import { monthlySummaryQueryOptions } from '@/hooks/useMonthlySummary';
import { localeCurrency, toLocalYearMonth } from '@/lib/formatters';
import { queryClient } from '@/lib/query-client';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export const Route = createFileRoute('/_app/')({
  loader: () => {
    const month = toLocalYearMonth(new Date());
    const currency = useUserPreferencesStore.getState().currency ?? localeCurrency();

    return Promise.all([
      queryClient.ensureQueryData(monthlySummaryQueryOptions(month, currency)),
      queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
});
