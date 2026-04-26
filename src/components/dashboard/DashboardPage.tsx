import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowDownRight, ArrowUpRight, ChevronDown, PlusCircle, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { SummaryCard, SummaryCardDescription } from '@/components/dashboard/SummaryCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { useAllTransactions } from '@/hooks/useTransactions';
import { getCategoryColor } from '@/lib/categoryColor';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate, todayIso, toLocalIsoDate } from '@/lib/formatters';
import { useThemeStore } from '@/stores/theme.store';

const VISIBLE_COUNT = 5;
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

export function DashboardPage() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const glassEffect = useThemeStore((s) => s.glassEffect);

  // Recomputed every render so the dashboard rolls over correctly when the app
  // stays open past midnight (especially across a month boundary).
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { firstDayOfPeriod, lastDayOfPeriod } = useMemo(
    () => ({
      firstDayOfPeriod: toLocalIsoDate(new Date(currentYear, selectedMonth, 1)),
      // For past months use the last day of that month; for the current month use today.
      lastDayOfPeriod:
        selectedMonth === currentMonth
          ? todayIso()
          : toLocalIsoDate(new Date(currentYear, selectedMonth + 1, 0)),
    }),
    [currentYear, currentMonth, selectedMonth],
  );

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setShowAll(false);
  };

  const { data: txData, isLoading: txLoading } = useAllTransactions({
    start: firstDayOfPeriod,
    end: lastDayOfPeriod,
    sort: 'desc',
  });
  const { data: catData, isLoading: catLoading } = useCategories();

  const { totals, balance, categoryRows, recent, currency } = useMemo(() => {
    const transactions = txData?.items ?? [];
    const categoryMap = new Map((catData?.items ?? []).map((c) => [c.id, c.name]));

    let income = 0;
    let expense = 0;
    // Key by categoryId (empty string = no category) to preserve the id for linking.
    const expenseByCategory: Record<string, { name: string; amount: number }> = {};

    for (const t of transactions) {
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
        const catId = t.categoryId ?? '';
        const name = (t.categoryId && categoryMap.get(t.categoryId)) || 'No Category';
        const entry = expenseByCategory[catId];
        if (entry) {
          entry.amount += t.amount;
        } else {
          expenseByCategory[catId] = { name, amount: t.amount };
        }
      }
    }

    const sorted = Object.entries(expenseByCategory).sort(([, a], [, b]) => b.amount - a.amount);
    const maxAmount = sorted[0]?.[1].amount ?? 1; // top bar always fills 100%

    return {
      totals: { income, expense },
      balance: income - expense,
      categoryRows: sorted.map(([catId, { name, amount }]) => ({
        name,
        amount,
        categoryId: catId || undefined,
        pct: Math.round((amount / maxAmount) * 100),
      })),
      recent: transactions.slice(0, 8),
      currency: transactions[0]?.currency ?? 'EUR',
    };
  }, [txData, catData]);

  if (txLoading || catLoading) return <DashboardSkeleton />;

  const visibleRows = showAll ? categoryRows : categoryRows.slice(0, VISIBLE_COUNT);
  const hiddenCount = categoryRows.length - VISIBLE_COUNT;

  const periodLabel = `${MONTH_NAMES[selectedMonth]} ${currentYear}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={periodLabel} />

      {/* Month selector — Jan through current month, wraps on small screens */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: currentMonth + 1 }, (_, i) => i).map((month) => {
          const isActive = selectedMonth === month;
          return (
            <button
              key={month}
              type="button"
              onClick={() => handleMonthSelect(month)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:transition-none',
                isActive
                  ? cn(
                      'bg-primary text-primary-foreground shadow-sm',
                      glassEffect && 'bg-primary/80 backdrop-blur-sm',
                    )
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )}
            >
              {MONTH_NAMES[month]}
            </button>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <SummaryCardDescription>
              <Wallet className="size-4" />
              Balance
            </SummaryCardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(balance, currency)}
            </p>
          </CardContent>
        </Card>

        <SummaryCard
          label="Income"
          amount={totals.income}
          currency={currency}
          icon={<ArrowUpRight className="size-4 text-income" />}
          className="text-income"
          linkSearch={{ type: 'INCOME', start: firstDayOfPeriod, end: lastDayOfPeriod }}
        />
        <SummaryCard
          label="Expenses"
          amount={totals.expense}
          currency={currency}
          icon={<ArrowDownRight className="size-4 text-expense" />}
          className="text-expense"
          linkSearch={{ type: 'EXPENSE', start: firstDayOfPeriod, end: lastDayOfPeriod }}
        />
      </div>

      {/* Expenses by category */}
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
                  return (
                    <li key={row.name}>
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
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate text-sm font-medium">{row.name}</span>
                          </div>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {formatCurrency(row.amount, currency)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${row.pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

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

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold" as="h2">
            Recent transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <PlusCircle className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="max-w-[200px] text-xs text-muted-foreground">
                  Start tracking your budget by adding your first transaction.
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/transactions">Add transaction</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {recent.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between px-6 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:bg-muted/50"
                    onClick={() =>
                      navigate({
                        to: '/transactions',
                        search: { start: firstDayOfPeriod, end: lastDayOfPeriod },
                      })
                    }
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.description ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Badge variant={t.type === 'INCOME' ? 'income' : 'expense'}>
                        {t.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(t.amount, t.currency)}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
