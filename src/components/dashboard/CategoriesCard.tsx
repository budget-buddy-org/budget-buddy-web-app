import type { CategorySpendingSummary } from '@budget-buddy-org/budget-buddy-contracts';
import { Link } from '@tanstack/react-router';
import { ChevronDown, PieChart } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormatters } from '@/hooks/useFormatters';
import { isCurrentMonth, monthProgress, pacingStatus } from '@/lib/budgetPacing';
import { getCategoryColor } from '@/lib/categoryColor';
import { cn } from '@/lib/cn';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

const VISIBLE_COUNT = 5;

export function CategoriesCard({
  summary,
  isLoading,
  periodLabel,
  firstDayOfPeriod,
  lastDayOfPeriod,
  currency,
}: {
  summary: CategorySpendingSummary | undefined;
  isLoading: boolean;
  periodLabel: string;
  firstDayOfPeriod: string;
  lastDayOfPeriod: string;
  currency: string;
}) {
  const { fmtCurrency } = useFormatters();
  const [showAll, setShowAll] = useState(false);
  const isBalanceHidden = useUserPreferencesStore((s) => s.isBalanceHidden);

  const periodDate = new Date(firstDayOfPeriod);
  const isCurrent = isCurrentMonth(periodDate.getFullYear(), periodDate.getMonth());

  const { categoryRows, excludedCount, budgetedTotal, spentOfBudgeted } = useMemo(() => {
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
    let budgetSum = 0;
    let spentSum = 0;
    for (const row of items) {
      if ((row.monthlyBudget ?? 0) > 0) {
        budgetSum += row.monthlyBudget as number;
        spentSum += row.spent;
      }
    }
    return {
      categoryRows: rows,
      excludedCount: excluded,
      budgetedTotal: budgetSum,
      spentOfBudgeted: spentSum,
    };
  }, [summary]);

  if (isLoading && !summary) return <CategoriesCardSkeleton />;

  const visibleRows = showAll ? categoryRows : categoryRows.slice(0, VISIBLE_COUNT);
  const hiddenCount = categoryRows.length - VISIBLE_COUNT;

  return (
    <section className="space-y-3">
      <SectionHeader title="Expenses by category" icon={PieChart} />
      <Card>
        <CardContent className="space-y-3 pt-4">
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
                    <li key={row.categoryId} className="-mx-1 rounded-md p-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <Link
                          to="/categories"
                          search={{ edit: row.categoryId }}
                          aria-label={`Edit category ${row.name}`}
                          className="-mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-0.5 transition-colors hover:bg-muted/30 active:bg-muted/60 motion-reduce:transition-none focus-visible:focus-ring"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-pill"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate text-sm font-medium">{row.name}</span>
                        </Link>
                        <Link
                          to="/transactions"
                          search={{
                            type: 'EXPENSE',
                            start: firstDayOfPeriod,
                            end: lastDayOfPeriod,
                            categoryId: row.categoryId,
                          }}
                          aria-label={`View ${row.name} transactions`}
                          className={cn(
                            '-mx-1 shrink-0 rounded-sm px-1 py-0.5 text-sm tabular-nums transition-colors hover:bg-muted/30 active:bg-muted/60 motion-reduce:transition-none focus-visible:focus-ring',
                            overBudget ? 'text-expense font-medium' : 'text-muted-foreground',
                            isBalanceHidden && 'privacy-blur',
                          )}
                        >
                          {hasBudget
                            ? `${fmtCurrency(row.spent, currency)} / ${fmtCurrency(row.monthlyBudget as number, currency)}`
                            : fmtCurrency(row.spent, currency)}
                        </Link>
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
                          </div>
                          {isCurrent && !overBudget && (
                            <PacingNote spent={row.spent} budget={budget} />
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">No budget</p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {budgetedTotal > 0 && (
                <div className="border-t pt-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Total budget</span>
                    <span
                      className={cn(
                        'text-sm tabular-nums',
                        spentOfBudgeted > budgetedTotal
                          ? 'text-expense font-medium'
                          : 'text-muted-foreground',
                        isBalanceHidden && 'privacy-blur',
                      )}
                    >
                      {fmtCurrency(spentOfBudgeted, currency)} /{' '}
                      {fmtCurrency(budgetedTotal, currency)}
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-pill bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-pill',
                        spentOfBudgeted > budgetedTotal ? 'bg-expense' : 'bg-foreground/70',
                      )}
                      style={{
                        width: `${Math.min(100, Math.round((spentOfBudgeted / budgetedTotal) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

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
    </section>
  );
}

function PacingNote({ spent, budget }: { spent: number; budget: number }) {
  const status = pacingStatus({ spent, budget, progress: monthProgress() });
  if (status === 'noBudget' || status === 'over') return null;
  if (status === 'under') {
    return <p className="mt-1 text-xs text-muted-foreground">On track · under pace</p>;
  }
  return <p className="mt-1 text-xs text-muted-foreground">On track</p>;
}

export function CategoriesCardSkeleton() {
  return (
    <section className="space-y-3">
      <SectionHeader title="Expenses by category" icon={PieChart} />
      <Card>
        <CardContent className="space-y-4 pt-4">
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
    </section>
  );
}
