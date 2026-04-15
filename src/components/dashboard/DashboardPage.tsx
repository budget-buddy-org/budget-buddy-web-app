import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowDownRight, ArrowUpRight, PlusCircle, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { CardDescription, SummaryCard } from '@/components/dashboard/SummaryCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAllTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useThemeStore } from '@/stores/theme.store';

export function DashboardPage() {
  const navigate = useNavigate();

  // Subscribe to theme so chart colors update when theme changes
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme());

  // Calculate date range for the last 6 months to support the chart
  const { startDate, currentMonth } = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return {
      currentMonth: now.toISOString().slice(0, 7),
      startDate: sixMonthsAgo.toISOString().split('T')[0] ?? '',
    };
  }, []);

  const { data, isLoading } = useAllTransactions({
    start: startDate,
    sort: 'desc',
  });

  const { totals, balance, chartData, recent, currency } = useMemo(() => {
    const transactions = data?.items ?? [];
    const currentMonthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));

    const totals = currentMonthTransactions.reduce(
      (acc, t) => {
        if (t.type === 'INCOME') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );

    const chartData = Object.entries(
      transactions.reduce<Record<string, { income: number; expense: number }>>((acc, t) => {
        const month = t.date.slice(0, 7); // YYYY-MM
        if (!acc[month]) acc[month] = { income: 0, expense: 0 };
        if (t.type === 'INCOME') acc[month].income += t.amount / 100;
        else acc[month].expense += t.amount / 100;
        return acc;
      }, {}),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, values]) => ({ month, ...values }));

    return {
      totals,
      balance: totals.income - totals.expense,
      chartData,
      recent: transactions.slice(0, 8),
      currency: transactions[0]?.currency ?? 'EUR',
    };
  }, [data, currentMonth]);

  // Read chart colors from CSS variables so they respond to theme/dark-mode changes
  const incomeColor =
    getComputedStyle(document.documentElement).getPropertyValue('--color-income').trim() ||
    'hsl(142 71% 45%)';
  const expenseColor =
    getComputedStyle(document.documentElement).getPropertyValue('--color-expense').trim() ||
    (resolvedTheme === 'dark' ? 'hsl(0 62% 50%)' : 'hsl(0 84% 60%)');

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="text-lg font-semibold" as="h2">
              Monthly overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  formatter={(v, name) => [
                    typeof v === 'number'
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v)
                      : v,
                    name,
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="income" name="Income" fill={incomeColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill={expenseColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold" as="h2">
            Recent transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
              <div className="rounded-full bg-muted p-3">
                <PlusCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="text-xs text-muted-foreground max-w-[200px]">
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
                    className="flex w-full items-center justify-between px-6 py-3 transition-colors hover:bg-muted/30 cursor-pointer text-left focus-visible:outline-none"
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
