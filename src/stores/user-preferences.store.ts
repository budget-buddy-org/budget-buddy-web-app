import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DateFormatStyle } from '@/lib/formatters';

export type { DateFormatStyle };

interface UserPreferencesState {
  /** ISO 4217 override. null = derive from browser locale. */
  currency: string | null;
  /** Date display style. 'medium' preserves the existing app default. */
  dateFormat: DateFormatStyle;
  /** BCP 47 locale tag for number/currency separator style. null = use browser locale. */
  numberLocale: string | null;
  setCurrency: (code: string | null) => void;
  setDateFormat: (style: DateFormatStyle) => void;
  setNumberLocale: (locale: string | null) => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      currency: null,
      dateFormat: 'medium',
      numberLocale: null,
      setCurrency: (currency) => set({ currency }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setNumberLocale: (numberLocale) => set({ numberLocale }),
    }),
    { name: 'budget-buddy-preferences' },
  ),
);
