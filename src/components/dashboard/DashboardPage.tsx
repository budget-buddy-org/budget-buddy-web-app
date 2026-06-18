import { ArrowDownRight, ArrowUpRight, EyeOff, Wallet } from 'lucide-react';
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
import { useDashboardPeriod } from '@/hooks/useDashboardPeriod';
import { useFormatters } from '@/hooks/useFormatters';
import { useMonthlySummariesRange } from '@/hooks/useMonthlySummariesRange';
import { useMonthlySummary } from '@/hooks/useMonthlySummary';
import { useTransactions } from '@/hooks/useTransactions';
import { cn } from '@/lib/cn';
import { MONTH_NAMES_SHORT } from '@/lib/constants';
import { localeCurrency, todayIso, toLocalIsoDate, toLocalYearMonth } from '@/lib/formatters';
import { haptic } from '@/lib/haptics';
import { useThemeStore } from '@/stores/theme.store';
import { useUserPreferencesStore } from '@/stores/user-preferences.store';

export function DashboardPage() {
  const glassEffect = useThemeStore((s) => s.glassEffect);
  const isBalanceHidden = useUserPreferencesStore((s) => s.isBalanceHidden);
  const toggleBalanceHidden = useUserPreferencesStore((s) => s.toggleBalanceHidden);
  const { fmtCurrency } = useFormatters();

  const handleTogglePrivacy = () => {
    haptic('tap');
    toggleBalanceHidden();
  };

  const {
    year: selectedYear,
    month: selectedMonth,
    currentYear,
    currentMonth,
    isCurrent,
    setPeriod,
  } = useDashboardPeriod();

  const firstOfPeriod = new Date(selectedYear, selectedMonth, 1);
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

  const periodLabel = `${MONTH_NAMES_SHORT[selectedMonth]} ${selectedYear}`;

  return (
    <PageContainer size="wide">
      <PageHeader
        title="Dashboard"
        isSubtitleEssential
        subtitle={
          <MonthSelector
            year={selectedYear}
            month={selectedMonth}
            currentYear={currentYear}
            currentMonth={currentMonth}
            glassEffect={glassEffect}
            onChange={setPeriod}
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
            <Card
              glass
              onClick={handleTogglePrivacy}
              className={cn(
                'col-span-2 md:col-span-1 cursor-pointer transition-colors hover:bg-muted/30 active:bg-muted/60 active:scale-[0.99] motion-reduce:transition-none',
              )}
            >
              <CardHeader className="pb-2">
                <SummaryCardDescription>
                  <Wallet className="size-4" />
                  Balance
                  {isBalanceHidden && <EyeOff className="ml-auto size-4 opacity-50" />}
                </SummaryCardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedNumber
                  value={balance}
                  format={(v) => fmtCurrency(Math.round(v), currency)}
                  className={cn(
                    'text-xl font-bold',
                    balance >= 0 ? 'text-income' : 'text-expense',
                    isBalanceHidden && 'privacy-blur',
                  )}
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

      {/* On large screens the two insight cards sit side-by-side (3:2) instead
          of stacking, filling the wider canvas. Collapses to the single-column
          stack at md and below — mobile spacing is unchanged. */}
      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-3">
          <CategoriesCard
            summary={summaryData}
            isLoading={summaryLoading}
            periodLabel={periodLabel}
            firstDayOfPeriod={firstDayOfPeriod}
            lastDayOfPeriod={lastDayOfPeriod}
            currency={currency}
          />
        </div>

        <div className="lg:col-span-2">
          <RecentTransactionsCard
            transactions={recent}
            isLoading={recentLoading}
            hasFetched={!!recentData}
          />
        </div>
      </div>
    </PageContainer>
  );
}
