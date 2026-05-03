import { CalendarArrowDown, CalendarArrowUp, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { AmountInput } from '@/components/ui/amount-input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Select } from '@/components/ui/select';
import { TransactionTypeToggle } from '@/components/ui/transaction-type-toggle';
import type { TransactionPageFilters } from '@/hooks/useTransactionPageState';
import { cn } from '@/lib/cn';
import { toMinorUnits } from '@/lib/formatters';
import { useThemeStore } from '@/stores/theme.store';

interface TransactionFiltersProps {
  categories: { id: string; name: string }[];
  filters: TransactionPageFilters;
  onFilterChange: (filters: TransactionPageFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

const minorToDecimalString = (minor: number | undefined): string =>
  minor === undefined ? '' : (minor / 100).toFixed(2);

export function TransactionFilters({
  categories,
  filters,
  onFilterChange,
  onReset,
  onClose,
}: TransactionFiltersProps) {
  const [minStr, setMinStr] = useState(minorToDecimalString(filters.amountMin));
  const [maxStr, setMaxStr] = useState(minorToDecimalString(filters.amountMax));
  const [prevMin, setPrevMin] = useState(filters.amountMin);
  const [prevMax, setPrevMax] = useState(filters.amountMax);
  // Sync local input strings when the external filters change (e.g. on Reset).
  if (prevMin !== filters.amountMin) {
    setPrevMin(filters.amountMin);
    setMinStr(minorToDecimalString(filters.amountMin));
  }
  if (prevMax !== filters.amountMax) {
    setPrevMax(filters.amountMax);
    setMaxStr(minorToDecimalString(filters.amountMax));
  }

  const glassEffect = useThemeStore((s) => s.glassEffect);

  const minMinor = minStr ? toMinorUnits(Number.parseFloat(minStr)) : undefined;
  const maxMinor = maxStr ? toMinorUnits(Number.parseFloat(maxStr)) : undefined;
  const rangeError = minMinor !== undefined && maxMinor !== undefined && minMinor > maxMinor;

  const commitAmounts = (next: { amountMin?: number; amountMax?: number }) => {
    onFilterChange({ ...filters, ...next });
  };

  const hasActiveFilters =
    filters.categoryId ||
    filters.start ||
    filters.end ||
    filters.sort !== 'desc' ||
    filters.type ||
    filters.query ||
    filters.amountMin !== undefined ||
    filters.amountMax !== undefined;

  return (
    <div className="space-y-4 pt-2">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Type</legend>
        <TransactionTypeToggle
          nullable
          value={filters.type}
          onChange={(type) => onFilterChange({ ...filters, type })}
        />
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="category-filter" className="text-sm font-medium">
          Category
        </label>
        <Select
          id="category-filter"
          value={filters.categoryId}
          onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="start-date-filter" className="text-sm font-medium">
            From
          </label>
          <DatePicker
            id="start-date-filter"
            value={filters.start}
            onChange={(e) => onFilterChange({ ...filters, start: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="end-date-filter" className="text-sm font-medium">
            To
          </label>
          <DatePicker
            id="end-date-filter"
            value={filters.end}
            onChange={(e) => onFilterChange({ ...filters, end: e.target.value })}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Amount range</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="amount-min-filter" className="text-xs text-muted-foreground">
              Min
            </label>
            <AmountInput
              id="amount-min-filter"
              value={minStr}
              error={rangeError}
              onChange={(v) => {
                setMinStr(v);
                if (rangeError) return;
                const next = v ? toMinorUnits(Number.parseFloat(v)) : undefined;
                if (maxMinor !== undefined && next !== undefined && next > maxMinor) return;
                commitAmounts({ amountMin: next, amountMax: filters.amountMax });
              }}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="amount-max-filter" className="text-xs text-muted-foreground">
              Max
            </label>
            <AmountInput
              id="amount-max-filter"
              value={maxStr}
              error={rangeError}
              onChange={(v) => {
                setMaxStr(v);
                if (rangeError) return;
                const next = v ? toMinorUnits(Number.parseFloat(v)) : undefined;
                if (minMinor !== undefined && next !== undefined && next < minMinor) return;
                commitAmounts({ amountMin: filters.amountMin, amountMax: next });
              }}
            />
          </div>
        </div>
        {rangeError && (
          <p role="alert" className="text-xs text-destructive">
            Min amount cannot be greater than max amount.
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Sort</legend>
        <div
          role="tablist"
          aria-label="Sort"
          className={cn(
            'flex h-10 p-1 bg-muted rounded-lg transition-colors',
            glassEffect && 'bg-muted/50 backdrop-blur-md',
          )}
        >
          <button
            type="button"
            role="tab"
            aria-selected={filters.sort === 'desc'}
            onClick={() => onFilterChange({ ...filters, sort: 'desc' })}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              filters.sort === 'desc'
                ? cn(
                    'bg-background text-foreground shadow-sm',
                    glassEffect && 'bg-background/80 backdrop-blur-sm',
                  )
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            )}
          >
            <CalendarArrowDown className="size-4" />
            Newest
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.sort === 'asc'}
            onClick={() => onFilterChange({ ...filters, sort: 'asc' })}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              filters.sort === 'asc'
                ? cn(
                    'bg-background text-foreground shadow-sm',
                    glassEffect && 'bg-background/80 backdrop-blur-sm',
                  )
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
            )}
          >
            <CalendarArrowUp className="size-4" />
            Oldest
          </button>
        </div>
      </fieldset>

      <div className="pt-4 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="flex-1"
        >
          <RotateCcw className="mr-2 size-4" />
          Reset
        </Button>
        <Button onClick={onClose} className="flex-1" disabled={rangeError}>
          Done
        </Button>
      </div>
    </div>
  );
}
