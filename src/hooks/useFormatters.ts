import { useCallback } from 'react';
import { browserLocale, formatCurrency, formatDate, formatRelativeOrDate } from '@/lib/formatters';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export function useFormatters() {
  const numberLocale = useUserPreferencesStore((s) => s.numberLocale ?? browserLocale());
  const dateFormat = useUserPreferencesStore((s) => s.dateFormat);

  const fmtCurrency = useCallback(
    (minorUnits: number, currency?: string) => formatCurrency(minorUnits, currency, numberLocale),
    [numberLocale],
  );

  const fmtDate = useCallback(
    (dateString: string) => formatDate(dateString, numberLocale, dateFormat),
    [numberLocale, dateFormat],
  );

  const fmtRelativeDate = useCallback(
    (dateString: string) => formatRelativeOrDate(dateString, numberLocale, dateFormat),
    [numberLocale, dateFormat],
  );

  return { fmtCurrency, fmtDate, fmtRelativeDate };
}
