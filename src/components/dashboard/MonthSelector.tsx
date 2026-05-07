import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { categoriesSummaryQueryOptions } from '@/hooks/useCategoriesSummary';
import { monthlySummaryQueryOptions } from '@/hooks/useMonthlySummary';
import { cn } from '@/lib/cn';
import { localeCurrency, toLocalYearMonth } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

const VISIBLE_YEARS = 3;

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function clampToCurrent(
  year: number,
  month: number,
  currentYear: number,
  currentMonth: number,
): { year: number; month: number } {
  if (year > currentYear) return { year: currentYear, month: currentMonth };
  if (year === currentYear && month > currentMonth) {
    return { year: currentYear, month: currentMonth };
  }
  return { year, month };
}

export function MonthSelector({
  year,
  month,
  currentYear,
  currentMonth,
  glassEffect,
  onChange,
}: {
  year: number;
  month: number;
  currentYear: number;
  currentMonth: number;
  glassEffect: boolean;
  onChange: (year: number, month: number) => void;
}) {
  const qc = useQueryClient();
  const preferredCurrency = useUserPreferencesStore((s) => s.currency);
  const currency = preferredCurrency ?? localeCurrency();

  const minVisibleYear = Math.min(currentYear - (VISIBLE_YEARS - 1), year);
  const yearsCount = currentYear - minVisibleYear + 1;
  const years = Array.from({ length: yearsCount }, (_, i) => minVisibleYear + i);

  const move = useCallback(
    (yearDelta: number, monthDelta: number) => {
      let nextMonth = month + monthDelta;
      let nextYear = year + yearDelta;
      while (nextMonth > 11) {
        nextMonth -= 12;
        nextYear += 1;
      }
      while (nextMonth < 0) {
        nextMonth += 12;
        nextYear -= 1;
      }
      const clamped = clampToCurrent(nextYear, nextMonth, currentYear, currentMonth);
      if (clamped.year === year && clamped.month === month) return;
      haptic('tap');
      onChange(clamped.year, clamped.month);
    },
    [year, month, currentYear, currentMonth, onChange],
  );

  // Keyboard navigation: arrow keys move month/year. Skip when typing in inputs.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.matches('input, textarea, [contenteditable="true"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          move(0, -1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(0, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(1, 0);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [move]);

  const prefetchPeriod = useCallback(
    (y: number, m: number) => {
      const periodMonth = toLocalYearMonth(new Date(y, m, 1));
      qc.prefetchQuery(monthlySummaryQueryOptions(periodMonth, currency));
      qc.prefetchQuery(categoriesSummaryQueryOptions(periodMonth, currency));
    },
    [qc, currency],
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Period: ${MONTH_NAMES[month]} ${year}. Tap to change.`}
          className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition outline-none hover:bg-muted/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted data-[state=open]:text-foreground cursor-pointer"
        >
          {MONTH_NAMES[month]} {year}
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 w-64 rounded-md border border-border/60 bg-popover p-2 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-1"
        >
          <div className="mb-2 flex gap-1">
            {years.map((y) => {
              const selected = y === year;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    if (y === year) return;
                    haptic('tap');
                    const clamped = clampToCurrent(y, month, currentYear, currentMonth);
                    onChange(clamped.year, clamped.month);
                  }}
                  onMouseEnter={() =>
                    prefetchPeriod(y, Math.min(month, y === currentYear ? currentMonth : 11))
                  }
                  className={cn(
                    'flex-1 rounded-pill px-2 py-1 text-xs font-medium tabular-nums transition outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:transition-none cursor-pointer',
                    selected
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  {y}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-1">
            {MONTH_NAMES.map((name, m) => {
              const isFuture = year === currentYear && m > currentMonth;
              const selected = m === month;
              const isToday = m === currentMonth && year === currentYear;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={isFuture}
                  onClick={() => {
                    if (m === month) return;
                    haptic('tap');
                    onChange(year, m);
                  }}
                  onMouseEnter={() => !isFuture && prefetchPeriod(year, m)}
                  className={cn(
                    'rounded-pill px-2 py-1.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:transition-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-30',
                    selected
                      ? cn(
                          'bg-primary text-primary-foreground shadow-sm',
                          glassEffect && 'bg-primary/85 backdrop-blur-sm',
                        )
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    isToday && !selected && 'ring-1 ring-primary/40',
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
