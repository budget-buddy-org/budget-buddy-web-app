import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback } from 'react';
import { toLocalYearMonth } from '@/lib/formatters';
import { parseYearMonth } from '@/lib/period';
import type { DashboardSearch } from '@/routes/_app/index';

export interface DashboardPeriod {
  year: number;
  month: number;
  currentYear: number;
  currentMonth: number;
  isCurrent: boolean;
  setPeriod: (year: number, month: number) => void;
}

/**
 * Binds the dashboard's selected period to the URL `period` search param
 * (YYYY-MM). When the user is on the current month, `period` is omitted from
 * the URL so the canonical entry point stays clean. Recomputes "current" on
 * every render so the dashboard rolls over correctly across midnight.
 */
export function useDashboardPeriod(): DashboardPeriod {
  const search = useSearch({ from: '/_app/' });
  const navigate = useNavigate({ from: '/_app/' });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const parsed = parseYearMonth(search.period);
  const year = parsed?.year ?? currentYear;
  const month = parsed?.month ?? currentMonth;
  const isCurrent = year === currentYear && month === currentMonth;

  const setPeriod = useCallback(
    (nextYear: number, nextMonth: number) => {
      const isNextCurrent = nextYear === currentYear && nextMonth === currentMonth;
      navigate({
        search: (prev: DashboardSearch) => ({
          ...prev,
          period: isNextCurrent ? undefined : toLocalYearMonth(new Date(nextYear, nextMonth, 1)),
        }),
      });
    },
    [navigate, currentYear, currentMonth],
  );

  return { year, month, currentYear, currentMonth, isCurrent, setPeriod };
}
