import { Globe } from 'lucide-react';
import { Section } from '@/components/ui/section';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import {
  browserLocale,
  currencyLabel,
  formatCurrency,
  formatDate,
  ISO_CURRENCIES,
  localeCurrency,
} from '@/lib/formatters';
import type { DateFormatStyle } from '@/stores/user-preferences.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

const NUMBER_LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en-US', label: 'English (US) — 1,234.56' },
  { value: 'en-GB', label: 'English (EU) — 1,234.56' },
  { value: 'de-DE', label: 'German — 1.234,56' },
  { value: 'fr-FR', label: 'French — 1 234,56' },
  { value: 'de-CH', label: "Swiss — 1'234.56" },
  { value: 'hi-IN', label: 'Indian — 1,23,456' },
  { value: 'ja-JP', label: 'Japanese — 1,234' },
];

const DATE_STYLES: DateFormatStyle[] = ['short', 'medium', 'long'];

export function PreferencesSection() {
  const prefCurrency = useUserPreferencesStore((s) => s.currency);
  const prefDateFormat = useUserPreferencesStore((s) => s.dateFormat);
  const prefNumberLocale = useUserPreferencesStore((s) => s.numberLocale);
  const setPrefCurrency = useUserPreferencesStore((s) => s.setCurrency);
  const setPrefDateFormat = useUserPreferencesStore((s) => s.setDateFormat);
  const setPrefNumberLocale = useUserPreferencesStore((s) => s.setNumberLocale);

  const resolvedNumberLocale = prefNumberLocale ?? browserLocale();

  return (
    <Section title="Preferences" icon={Globe}>
      <div className="space-y-1.5">
        <label htmlFor="pref-currency" className="text-sm font-medium">
          Default Currency
        </label>
        <p className="text-xs text-muted-foreground">
          Pre-selected currency when creating new transactions.
        </p>
        <Select
          id="pref-currency"
          value={prefCurrency ?? ''}
          onChange={(e) => setPrefCurrency(e.target.value || null)}
        >
          <option value="">Auto — {localeCurrency()} (from browser locale)</option>
          {ISO_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {currencyLabel(c)}
            </option>
          ))}
        </Select>
      </div>

      <div className="border-t pt-4 space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Date Format</p>
            <p className="text-xs text-muted-foreground">
              {formatDate('2024-01-15', resolvedNumberLocale, prefDateFormat)}
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Date format"
            className="flex shrink-0 p-1 bg-muted rounded-pill"
          >
            {DATE_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                role="tab"
                aria-selected={prefDateFormat === style}
                onClick={() => setPrefDateFormat(style)}
                className={cn(
                  'px-3 py-control-inner rounded-pill text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  prefDateFormat === style
                    ? 'bg-background text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50 active:bg-background/70',
                )}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-1.5">
        <label htmlFor="pref-number-locale" className="text-sm font-medium">
          Number Format
        </label>
        <p className="text-xs text-muted-foreground">
          Preview: {formatCurrency(123456, prefCurrency ?? localeCurrency(), resolvedNumberLocale)}
        </p>
        <Select
          id="pref-number-locale"
          value={prefNumberLocale ?? ''}
          onChange={(e) => setPrefNumberLocale(e.target.value || null)}
        >
          <option value="">Auto (from browser locale)</option>
          {NUMBER_LOCALE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </Section>
  );
}
