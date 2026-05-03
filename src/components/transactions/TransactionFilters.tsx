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
  // Edits are staged locally and committed on Done — the dialog covers the list, so live refetching is wasted work.
  const [prevFilters, setPrevFilters] = useState(filters);
  const [draft, setDraft] = useState<TransactionPageFilters>(filters);
  const [minStr, setMinStr] = useState(minorToDecimalString(filters.amountMin));
  const [maxStr, setMaxStr] = useState(minorToDecimalString(filters.amountMax));
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setDraft(filters);
    setMinStr(minorToDecimalString(filters.amountMin));
    setMaxStr(minorToDecimalString(filters.amountMax));
  }

  const glassEffect = useThemeStore((s) => s.glassEffect);

  const minMinor = minStr ? toMinorUnits(Number.parseFloat(minStr)) : undefined;
  const maxMinor = maxStr ? toMinorUnits(Number.parseFloat(maxStr)) : undefined;
  const rangeError = minMinor !== undefined && maxMinor !== undefined && minMinor > maxMinor;

  const handleApply = () => {
    onFilterChange(draft);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const draftHasFilters =
    !!draft.categoryId ||
    !!draft.start ||
    !!draft.end ||
    draft.sort !== 'desc' ||
    !!draft.type ||
    !!draft.query ||
    draft.amountMin !== undefined ||
    draft.amountMax !== undefined;
  const committedHasFilters =
    !!filters.categoryId ||
    !!filters.start ||
    !!filters.end ||
    filters.sort !== 'desc' ||
    !!filters.type ||
    !!filters.query ||
    filters.amountMin !== undefined ||
    filters.amountMax !== undefined;
  const hasActiveFilters = draftHasFilters || committedHasFilters;

  return (
    <div className="space-y-4 pt-2">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Type</legend>
        <TransactionTypeToggle
          nullable
          value={draft.type}
          onChange={(type) => setDraft({ ...draft, type })}
        />
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="category-filter" className="text-sm font-medium">
          Category
        </label>
        <Select
          id="category-filter"
          value={draft.categoryId}
          onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
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
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="end-date-filter" className="text-sm font-medium">
            To
          </label>
          <DatePicker
            id="end-date-filter"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
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
                const next = v ? toMinorUnits(Number.parseFloat(v)) : undefined;
                setDraft({ ...draft, amountMin: next });
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
                const next = v ? toMinorUnits(Number.parseFloat(v)) : undefined;
                setDraft({ ...draft, amountMax: next });
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
            aria-selected={draft.sort === 'desc'}
            onClick={() => setDraft({ ...draft, sort: 'desc' })}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              draft.sort === 'desc'
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
            aria-selected={draft.sort === 'asc'}
            onClick={() => setDraft({ ...draft, sort: 'asc' })}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              draft.sort === 'asc'
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
          onClick={handleReset}
          disabled={!hasActiveFilters}
          className="flex-1"
        >
          <RotateCcw className="mr-2 size-4" />
          Reset
        </Button>
        <Button onClick={handleApply} className="flex-1" disabled={rangeError}>
          Done
        </Button>
      </div>
    </div>
  );
}
