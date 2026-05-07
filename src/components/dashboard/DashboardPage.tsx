import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { useCallback, useState } from 'react';
import { CategoriesCard } from '@/components/dashboard/CategoriesCard';
import { MonthSelector } from '@/components/dashboard/MonthSelector';
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard';
import {
  SummaryCard,
  SummaryCardDescription,
  SummaryCardSkeleton,
} from '@/components/dashboard/SummaryCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Sparkline } from '@/components/ui/sparkline';
import { useCategoriesSummary } from '@/hooks/useCategoriesSummary';
import { useFormatters } from '@/hooks/useFormatters';
import { useMonthlySummariesRange } from '@/hooks/useMonthlySummariesRange';
import { useMonthlySummary } from '@/hooks/useMonthlySummary';
import { useTransactions } from '@/hooks/useTransactions';
import { forecastSpend, formatForecast, isCurrentMonth, monthProgress } from '@/lib/budgetPacing';
import { cn } from '@/lib/cn';
import { localeCurrency, todayIso, toLocalIsoDate, toLocalYearMonth } from '@/lib/formatters';
import { useThemeStore } from '@/stores/theme.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

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
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const { fmtCurrency } = useFormatters();

  // Recomputed every render so the dashboard rolls over correctly when the app
  // stays open past midnight (especially across a month boundary).
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number }>({
    year: currentYear,
    month: currentMonth,
  });
  const { year: selectedYear, month: selectedMonth } = selectedPeriod;
  const handlePeriodChange = useCallback((year: number, month: number) => {
    setSelectedPeriod({ year, month });
  }, []);

  const firstOfPeriod = new Date(selectedYear, selectedMonth, 1);
  const isCurrent = selectedYear === currentYear && selectedMonth === currentMonth;
  const firstDayOfPeriod = toLocalIsoDate(firstOfPeriod);
  const lastDayOfPeriod = isCurrent
    ? todayIso()
    : toLocalIsoDate(new Date(selectedYear, selectedMonth + 1, 0));
  const periodMonth = toLocalYearMonth(firstOfPeriod);

  const preferredCurrency = useUserPreferencesStore((s) => s.currency) ?? localeCurrency();

  const { data: summaryData, isLoading: summaryLoading } = useCategoriesSummary({
    month: periodMonth,
    currency: preferredCurrency,
  });

  const { data: monthlySummary, isLoading: monthlyLoading } = useMonthlySummary({
    month: periodMonth,
    currency: preferredCurrency,
  });

  const { data: recentData, isLoading: recentLoading } = useTransactions({
    start: firstDayOfPeriod,
    end: lastDayOfPeriod,
    sort: 'desc',
    size: 5,
  });

  const trend = useMonthlySummariesRange({
    monthsBack: 6,
    endYear: selectedYear,
    endMonth: selectedMonth,
    currency: preferredCurrency,
  });

  const income = monthlySummary?.income ?? 0;
  const expense = monthlySummary?.expense ?? 0;
  const balance = monthlySummary?.balance ?? 0;
  const monthlyExcludedCount = monthlySummary?.excludedTransactionCount ?? 0;

  const currency = monthlySummary?.currency ?? summaryData?.currency ?? preferredCurrency;
  const recent = recentData?.items ?? [];

  const periodLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  const showForecast = isCurrent && isCurrentMonth(selectedYear, selectedMonth);
  const progress = showForecast ? monthProgress(now) : 1;
  const projectedExpense = showForecast ? forecastSpend(expense, progress) : expense;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle={
          <MonthSelector
            year={selectedYear}
            month={selectedMonth}
            currentYear={currentYear}
            currentMonth={currentMonth}
            glassEffect={glassEffect}
            onChange={handlePeriodChange}
          />
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {monthlyLoading && !monthlySummary ? (
          <>
            <SummaryCardSkeleton wide />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <Card glass className="col-span-2 md:col-span-1">
              <CardHeader className="pb-2">
                <SummaryCardDescription>
                  <Wallet className="size-4" />
                  Balance
                </SummaryCardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={balance}
                  format={(v) => fmtCurrency(Math.round(v), currency)}
                  className={cn('text-xl font-bold', balance >= 0 ? 'text-income' : 'text-expense')}
                />
                <Sparkline
                  values={trend.data.map((m) => m?.balance ?? 0)}
                  isLoading={trend.isLoading}
                  variant="balance"
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <SummaryCard
              label="Income"
              amount={income}
              currency={currency}
              icon={<ArrowUpRight className="size-4 text-income" />}
              className="text-income"
              linkSearch={{ type: 'INCOME', start: firstDayOfPeriod, end: lastDayOfPeriod }}
            >
              <Sparkline
                values={trend.data.map((m) => m?.income ?? 0)}
                isLoading={trend.isLoading}
                variant="income"
                className="mt-2"
              />
            </SummaryCard>

            <SummaryCard
              label="Expenses"
              amount={expense}
              currency={currency}
              icon={<ArrowDownRight className="size-4 text-expense" />}
              className="text-expense"
              linkSearch={{ type: 'EXPENSE', start: firstDayOfPeriod, end: lastDayOfPeriod }}
            >
              <Sparkline
                values={trend.data.map((m) => m?.expense ?? 0)}
                isLoading={trend.isLoading}
                variant="expense"
                className="mt-2"
              />
              {showForecast && projectedExpense > expense && (
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  {formatForecast(projectedExpense, currency, fmtCurrency)}
                </p>
              )}
            </SummaryCard>
          </>
        )}
      </div>

      {monthlyExcludedCount > 0 && !monthlyLoading && (
        <p className="text-xs text-muted-foreground">
          {monthlyExcludedCount === 1
            ? '1 transaction in another currency not shown'
            : `${monthlyExcludedCount} transactions in other currencies not shown`}
        </p>
      )}

      <CategoriesCard
        summary={summaryData}
        isLoading={summaryLoading}
        periodLabel={periodLabel}
        firstDayOfPeriod={firstDayOfPeriod}
        lastDayOfPeriod={lastDayOfPeriod}
        currency={currency}
        progress={progress}
        showForecast={showForecast}
      />

      <RecentTransactionsCard
        transactions={recent}
        isLoading={recentLoading}
        hasFetched={!!recentData}
        firstDayOfPeriod={firstDayOfPeriod}
        lastDayOfPeriod={lastDayOfPeriod}
      />
    </PageContainer>
  );
}
