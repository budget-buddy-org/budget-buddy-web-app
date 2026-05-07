import type { CategorySpendingSummary } from '@budget-buddy-org/budget-buddy-contracts';
import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormatters } from '@/hooks/useFormatters';
import { forecastSpend, pacingStatus } from '@/lib/budgetPacing';
import { getCategoryColor } from '@/lib/categoryColor';
import { cn } from '@/lib/cn';

const VISIBLE_COUNT = 5;

export function CategoriesCard({
  summary,
  isLoading,
  periodLabel,
  firstDayOfPeriod,
  lastDayOfPeriod,
  currency,
  progress,
  showForecast,
}: {
  summary: CategorySpendingSummary | undefined;
  isLoading: boolean;
  periodLabel: string;
  firstDayOfPeriod: string;
  lastDayOfPeriod: string;
  currency: string;
  progress: number;
  showForecast: boolean;
}) {
  const { fmtCurrency } = useFormatters();
  const [showAll, setShowAll] = useState(false);

  const { categoryRows, excludedCount } = useMemo(() => {
    const items = summary?.items ?? [];
    const rows = items
      .filter((row) => row.spent > 0 || (row.monthlyBudget ?? 0) > 0)
      .map((row) => ({
        categoryId: row.categoryId,
        name: row.categoryName,
        spent: row.spent,
        monthlyBudget: row.monthlyBudget ?? null,
      }))
      .sort((a, b) => b.spent - a.spent);
    const excluded = items.reduce((sum, row) => sum + row.excludedTransactionCount, 0);
    return { categoryRows: rows, excludedCount: excluded };
  }, [summary]);

  if (isLoading && !summary) return <CategoriesCardSkeleton />;

  const visibleRows = showAll ? categoryRows : categoryRows.slice(0, VISIBLE_COUNT);
  const hiddenCount = categoryRows.length - VISIBLE_COUNT;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold" as="h2">
          Expenses by category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categoryRows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No expenses in {periodLabel}
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {visibleRows.map((row) => {
                const color = getCategoryColor(row.name);
                const hasBudget = row.monthlyBudget != null;
                const budget = row.monthlyBudget ?? 0;
                const pct =
                  budget > 0
                    ? Math.min(100, Math.round((row.spent / budget) * 100))
                    : row.spent > 0
                      ? 100
                      : 0;
                const overBudget = hasBudget && row.spent > budget;
                return (
                  <li key={row.categoryId}>
                    <Link
                      to="/transactions"
                      search={{
                        type: 'EXPENSE',
                        start: firstDayOfPeriod,
                        end: lastDayOfPeriod,
                        categoryId: row.categoryId,
                      }}
                      className="block -mx-1 rounded-md p-1 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="mr-2 flex min-w-0 items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-pill"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate text-sm font-medium">{row.name}</span>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 text-sm tabular-nums',
                            overBudget ? 'text-expense font-medium' : 'text-muted-foreground',
                          )}
                        >
                          {hasBudget
                            ? `${fmtCurrency(row.spent, currency)} / ${fmtCurrency(row.monthlyBudget as number, currency)}`
                            : fmtCurrency(row.spent, currency)}
                        </span>
                      </div>
                      {hasBudget ? (
                        <>
                          <div className="relative h-1.5 w-full overflow-hidden rounded-pill bg-muted">
                            <div
                              className="h-full rounded-pill"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: overBudget ? 'var(--color-expense)' : color,
                              }}
                            />
                            {showForecast && !overBudget && (
                              <span
                                aria-hidden
                                className="absolute top-0 h-full w-px bg-foreground/40"
                                style={{ left: `${Math.min(100, progress * 100)}%` }}
                              />
                            )}
                          </div>
                          {showForecast && !overBudget && (
                            <PacingNote
                              spent={row.spent}
                              budget={budget}
                              progress={progress}
                              currency={currency}
                            />
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No budget</p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {excludedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {excludedCount === 1
                  ? '1 transaction in another currency not shown'
                  : `${excludedCount} transactions in other currencies not shown`}
              </p>
            )}

            {hiddenCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setShowAll((v) => !v)}
              >
                <ChevronDown
                  className={cn('mr-1 size-4 transition-transform', showAll && 'rotate-180')}
                />
                {showAll ? 'Show less' : `Show ${hiddenCount} more`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PacingNote({
  spent,
  budget,
  progress,
  currency,
}: {
  spent: number;
  budget: number;
  progress: number;
  currency: string;
}) {
  const { fmtCurrency } = useFormatters();
  const status = pacingStatus({ spent, budget, progress });
  if (status === 'noBudget' || status === 'over') return null;
  if (status === 'under') {
    return <p className="mt-1 text-xs text-muted-foreground">On track · under pace</p>;
  }
  if (status === 'projectedOver') {
    const projected = forecastSpend(spent, progress);
    return (
      <p className="mt-1 text-xs text-expense tabular-nums">
        Projected {fmtCurrency(projected, currency)} · over budget
      </p>
    );
  }
  return <p className="mt-1 text-xs text-muted-foreground">On track</p>;
}

export function CategoriesCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5'].map((key) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-pill" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-pill" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
