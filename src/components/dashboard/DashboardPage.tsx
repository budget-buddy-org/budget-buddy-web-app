import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowDownRight, ArrowUpRight, ChevronDown, PlusCircle, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { CardDescription, SummaryCard } from '@/components/dashboard/SummaryCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { useAllTransactions } from '@/hooks/useTransactions';
import { getCategoryColor } from '@/lib/categoryColor';
import { formatCurrency, formatDate, todayIso, toLocalIsoDate } from '@/lib/formatters';

const VISIBLE_COUNT = 5;

// Stable for the session — month boundaries don't shift while the app is open.
const firstDayOfMonth = toLocalIsoDate(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
);
const today = todayIso();

export function DashboardPage() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const { data: txData, isLoading: txLoading } = useAllTransactions({
    start: firstDayOfMonth,
    end: today,
    sort: 'desc',
  });
  const { data: catData, isLoading: catLoading } = useCategories();

  const { totals, balance, categoryRows, recent, currency } = useMemo(() => {
    const transactions = txData?.items ?? [];
    const categoryMap = new Map((catData?.items ?? []).map((c) => [c.id, c.name]));

    let income = 0;
    let expense = 0;
    const expenseByCategory: Record<string, number> = {};

    for (const t of transactions) {
      if (t.type === 'INCOME') {
        income += t.amount;
      } else {
        expense += t.amount;
        const name = (t.categoryId && categoryMap.get(t.categoryId)) || 'No Category';
        expenseByCategory[name] = (expenseByCategory[name] ?? 0) + t.amount;
      }
    }

    const sorted = Object.entries(expenseByCategory).sort(([, a], [, b]) => b - a);
    const maxAmount = sorted[0]?.[1] ?? 1; // top bar always fills 100%

    return {
      totals: { income, expense },
      balance: income - expense,
      categoryRows: sorted.map(([name, amount]) => ({
        name,
        amount,
        pct: Math.round((amount / maxAmount) * 100),
      })),
      recent: transactions.slice(0, 8),
      currency: transactions[0]?.currency ?? 'EUR',
    };
  }, [txData, catData]);

  if (txLoading || catLoading) return <DashboardSkeleton />;

  const visibleRows = showAll ? categoryRows : categoryRows.slice(0, VISIBLE_COUNT);
  const hiddenCount = categoryRows.length - VISIBLE_COUNT;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Current month summary" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Wallet className="h-4 w-4" />
              Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>

        <SummaryCard
          label="Income"
          amount={totals.income}
          icon={<ArrowUpRight className="h-4 w-4 text-income" />}
          className="text-income"
        />
        <SummaryCard
          label="Expenses"
          amount={totals.expense}
          icon={<ArrowDownRight className="h-4 w-4 text-expense" />}
          className="text-expense"
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
            <p className="py-4 text-center text-sm text-muted-foreground">No expenses this month</p>
          ) : (
            <>
              <ul className="space-y-3">
                {visibleRows.map((row) => {
                  const color = getCategoryColor(row.name);
                  return (
                    <li key={row.name}>
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
                    className={`mr-1 h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
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
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
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
                    className="flex w-full cursor-pointer items-center justify-between px-6 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none"
                    onClick={() => navigate({ to: '/transactions' })}
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
