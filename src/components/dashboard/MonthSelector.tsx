import * as DialogPrimitives from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogOverlay } from '@/components/ui/dialog';
import { categoriesSummaryQueryOptions } from '@/hooks/useCategoriesSummary';
import { monthlySummaryQueryOptions } from '@/hooks/useMonthlySummary';
import { cn } from '@/lib/cn';
import { MONTH_NAMES_LONG, MONTH_NAMES_SHORT } from '@/lib/constants';
import { localeCurrency, toLocalYearMonth } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

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
}: Readonly<{
  year: number;
  month: number;
  currentYear: number;
  currentMonth: number;
  glassEffect: boolean;
  onChange: (year: number, month: number) => void;
}>) {
  const qc = useQueryClient();
  const preferredCurrency = useUserPreferencesStore((s) => s.currency);
  const currency = preferredCurrency ?? localeCurrency();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) setViewYear(year);
      setOpen(next);
    },
    [year],
  );

  const select = useCallback(
    (y: number, m: number) => {
      haptic('tap');
      onChange(y, m);
      setOpen(false);
    },
    [onChange],
  );

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

  // Keyboard navigation: arrow keys move month/year. Skip when typing in inputs or when picker is open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (open) return;
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
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [move, open]);

  const prefetchPeriod = useCallback(
    (y: number, m: number) => {
      const periodMonth = toLocalYearMonth(new Date(y, m, 1));
      qc.prefetchQuery(monthlySummaryQueryOptions(periodMonth, currency));
      qc.prefetchQuery(categoriesSummaryQueryOptions(periodMonth, currency));
    },
    [qc, currency],
  );

  const canGoNextYear = viewYear < currentYear;
  const isCurrentSelected = year === currentYear && month === currentMonth;

  return (
    <DialogPrimitives.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitives.Trigger asChild>
        <button
          type="button"
          aria-label={`Period: ${MONTH_NAMES_LONG[month]} ${year}. Tap to change.`}
          className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-foreground active:bg-muted/70 active:scale-[0.97] motion-reduce:transition-none focus-visible:focus-ring data-[state=open]:bg-muted data-[state=open]:text-foreground cursor-pointer"
        >
          {MONTH_NAMES_SHORT[month]} {year}
          <ChevronDown className="size-3.5 opacity-60" />
        </button>
      </DialogPrimitives.Trigger>
      <DialogPrimitives.Portal>
        <DialogOverlay />
        <DialogPrimitives.Content
          className={cn(
            'fixed z-overlay flex flex-col bg-background outline-none',
            // Mobile: bottom sheet, full width, safe-area aware
            'bottom-0 left-0 right-0 rounded-t-[28px] border-t border-border/60 pb-[max(1rem,env(safe-area-inset-bottom))]',
            'data-[state=open]:animate-in-bottom-sheet data-[state=closed]:animate-out-bottom-sheet',
            // Desktop: anchored-feel popover, centered, compact, with shadow
            'sm:bottom-auto sm:right-auto sm:left-1/2 sm:top-[20%] sm:w-[22rem] sm:-translate-x-1/2 sm:rounded-lg sm:border sm:pb-3 sm:shadow-2xl',
            'sm:data-[state=open]:animate-fade-in sm:data-[state=closed]:animate-fade-out',
          )}
        >
          <DialogPrimitives.Title className="sr-only">Select month</DialogPrimitives.Title>
          <DialogPrimitives.Description className="sr-only">
            Choose a month and year to view your budget data.
          </DialogPrimitives.Description>

          {/* Year header with chevrons */}
          <div className="flex items-center justify-between px-4 pt-3 pb-3 sm:px-3">
            <button
              type="button"
              onClick={() => {
                haptic('tap');
                setViewYear((y) => y - 1);
              }}
              aria-label="Previous year"
              className="flex size-9 items-center justify-center rounded-pill text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-[0.97] motion-reduce:transition-none cursor-pointer focus-visible:focus-ring focus-visible:focus-ring-offset"
            >
              <ChevronLeft className="size-5" />
            </button>
            <div className="text-base font-semibold tabular-nums">{viewYear}</div>
            <button
              type="button"
              onClick={() => {
                if (!canGoNextYear) return;
                haptic('tap');
                setViewYear((y) => y + 1);
              }}
              disabled={!canGoNextYear}
              aria-label="Next year"
              className="flex size-9 items-center justify-center rounded-pill text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-[0.97] motion-reduce:transition-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground focus-visible:focus-ring focus-visible:focus-ring-offset"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2 px-4 sm:gap-1.5 sm:px-3">
            {MONTH_NAMES_SHORT.map((name, m) => {
              const isFuture = viewYear === currentYear && m > currentMonth;
              const selected = m === month && viewYear === year;
              const isToday = m === currentMonth && viewYear === currentYear;
              return (
                <button
                  key={name}
                  type="button"
                  disabled={isFuture}
                  onClick={() => select(viewYear, m)}
                  onMouseEnter={() => !isFuture && prefetchPeriod(viewYear, m)}
                  className={cn(
                    'h-12 rounded-pill text-sm font-medium tabular-nums transition outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 sm:h-10',
                    selected
                      ? cn(
                          'bg-primary text-primary-foreground shadow-card',
                          glassEffect && 'bg-primary/90 backdrop-blur-sm',
                        )
                      : 'text-foreground hover:bg-muted active:bg-muted/80',
                    isToday && !selected && 'ring-1 ring-primary/50',
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {/* Footer: Today shortcut */}
          {!isCurrentSelected && (
            <div className="px-4 pt-4 sm:px-3 sm:pt-3">
              <Button
                variant="secondary"
                size="default"
                onClick={() => select(currentYear, currentMonth)}
                className="w-full"
              >
                Jump to current month
              </Button>
            </div>
          )}
        </DialogPrimitives.Content>
      </DialogPrimitives.Portal>
    </DialogPrimitives.Root>
  );
}
